window.ONC = window.ONC || {};

ONC.LearningEngine = {
  state: { events: [], profiles: {}, version: 1 },

  init() {
    this.load();
    this.rebuildProfiles();
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_learning_engine_${current}`;
  },

  load() {
    this.state = ONC.Storage.get(this.storageKey(), {
      events: [],
      profiles: {},
      version: 1
    });
  },

  save() {
    this.state.events = this.state.events.slice(-2500);
    ONC.Storage.set(this.storageKey(), this.state);
  },

  recordResponse(question, selected, options = {}) {
    const topic = ONC.Attention?.findStudyTopic?.(question.subject, question.topic);
    if (!topic) return null;

    const correct = Number(selected) === Number(question.answer);
    const event = {
      id: `${Date.now()}-${question.id || topic.id}`,
      topicId: topic.id,
      questionId: question.id || null,
      discipline: topic.discipline,
      topic: topic.title,
      correct,
      selected: Number(selected),
      answer: Number(question.answer),
      responseTimeMs: Math.max(0, Number(options.responseTimeMs || 0)),
      source: options.source || "question-bank",
      difficulty: question.difficulty || "Média",
      hintUsed: Boolean(options.hintUsed),
      reviewMode: Boolean(options.reviewMode),
      simulationMode: Boolean(options.simulationMode),
      confidence: options.confidence || null,
      timestamp: new Date().toISOString()
    };

    event.errorType = correct ? null : this.classifyError(event, topic.id);
    this.state.events.push(event);
    this.rebuildTopic(topic.id);
    this.save();

    ONC.RecommendationEngine?.refresh?.("response", topic.id);
    ONC.AdaptivePlanner?.recalculate?.("response");
    ONC.AdaptiveTutorUI?.render?.();
    ONC.DailyCoachEngine?.refresh?.("response");
    ONC.DailyCoachUI?.render?.();
    ONC.PerformancePredictionEngine?.refresh?.("response");
    ONC.PerformancePredictionUI?.render?.();
    return event;
  },

  classifyError(event, topicId) {
    const previous = this.eventsFor(topicId).slice(-5);
    const priorCorrect = previous.filter(item => item.correct).length;
    const priorErrors = previous.filter(item => !item.correct).length;
    const mastery = ONC.MasteryEngine?.get?.(topicId)?.score || 0;
    const fastThreshold = 9000;

    if (event.responseTimeMs && event.responseTimeMs < fastThreshold && mastery >= 45) {
      return "distraction";
    }
    if (event.reviewMode && priorErrors > 0) {
      return "post-review";
    }
    if (priorErrors >= 2) {
      return "recurring";
    }
    if (mastery >= 70 || priorCorrect >= 3) {
      return "unstable-mastery";
    }
    return "conceptual";
  },

  eventsFor(topicId) {
    return this.state.events.filter(event => event.topicId === topicId);
  },

  profile(topicId) {
    return this.state.profiles[topicId] || this.rebuildTopic(topicId);
  },

  rebuildProfiles() {
    const ids = new Set([
      ...Object.keys(this.state.profiles || {}),
      ...this.state.events.map(event => event.topicId)
    ]);
    ids.forEach(id => this.rebuildTopic(id));
    this.save();
  },

  rebuildTopic(topicId) {
    const events = this.eventsFor(topicId);
    const correct = events.filter(event => event.correct).length;
    const errors = events.length - correct;
    const responseTimes = events
      .map(event => Number(event.responseTimeMs || 0))
      .filter(value => value > 0);
    const averageResponseMs = responseTimes.length
      ? Math.round(responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length)
      : 0;
    const recent = events.slice(-6);
    const recentAccuracy = recent.length
      ? Math.round((recent.filter(event => event.correct).length / recent.length) * 100)
      : 0;
    const streak = this.correctStreak(events);
    const consistency = this.consistency(events);
    const confidence = this.confidence(topicId, events, consistency);
    const trend = this.trend(events);
    const errorTypes = events.reduce((acc, event) => {
      if (event.errorType) acc[event.errorType] = (acc[event.errorType] || 0) + 1;
      return acc;
    }, {});

    const profile = {
      topicId,
      attempts: events.length,
      correct,
      errors,
      accuracy: events.length ? Math.round((correct / events.length) * 100) : 0,
      recentAccuracy,
      averageResponseMs,
      consistency,
      confidence,
      trend,
      correctStreak: streak,
      forgettingCount: errorTypes["post-review"] || 0,
      errorTypes,
      lastAttemptAt: events.at(-1)?.timestamp || null,
      lastDifficulty: events.at(-1)?.difficulty || null
    };

    this.state.profiles[topicId] = profile;
    return profile;
  },

  correctStreak(events) {
    let count = 0;
    for (let index = events.length - 1; index >= 0; index -= 1) {
      if (!events[index].correct) break;
      count += 1;
    }
    return count;
  },

  consistency(events) {
    if (events.length < 2) return events.length ? 55 : 0;
    const windows = [];
    for (let index = 0; index < events.length; index += 3) {
      const group = events.slice(index, index + 3);
      windows.push(group.filter(event => event.correct).length / group.length);
    }
    const average = windows.reduce((sum, value) => sum + value, 0) / windows.length;
    const deviation = windows.reduce((sum, value) => sum + Math.abs(value - average), 0) / windows.length;
    return Math.round(Math.max(0, 100 - deviation * 120));
  },

  confidence(topicId, events, consistency) {
    const sample = Math.min(1, events.length / 8);
    const diversity = Math.min(1, new Set(events.map(event => event.questionId)).size / 5);
    const recency = events.length
      ? Math.max(0, 1 - (Date.now() - new Date(events.at(-1).timestamp).getTime()) / (30 * 86400000))
      : 0;
    return Math.round(Math.min(100,
      sample * 45 + diversity * 25 + recency * 15 + (consistency / 100) * 15
    ));
  },

  trend(events) {
    if (events.length < 4) return "insufficient";
    const split = Math.floor(events.length / 2);
    const first = events.slice(0, split);
    const last = events.slice(split);
    const accuracy = list => list.filter(event => event.correct).length / Math.max(1, list.length);
    const delta = accuracy(last) - accuracy(first);
    if (delta >= 0.18) return "rising";
    if (delta <= -0.18) return "falling";
    return "stable";
  },

  allProfiles() {
    return Object.values(this.state.profiles);
  },

  strongestErrorType(topicId) {
    const types = this.profile(topicId).errorTypes || {};
    return Object.entries(types).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  }
};
