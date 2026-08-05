window.ONC = window.ONC || {};

ONC.PriorityEngine = {
  topicIndex: [],

  init() {
    this.buildIndex();
  },

  buildIndex() {
    this.topicIndex = [...document.querySelectorAll(".topicCard")].map(card => ({
      id: card.dataset.topicId,
      title: card.dataset.topicTitle || "",
      discipline: card.dataset.discipline || "",
      recurrence: Number(card.dataset.recurrence || 0)
    }));
  },

  daysSince(dateString) {
    if (!dateString) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 86400000));
  },

  calculate(topicId) {
    const topic = this.topicIndex.find(item => item.id === topicId);
    if (!topic) return null;

    const attempt = ONC.Attention?.attempts?.[topicId] || {
      attempts: 0, errors: 0, correct: 0, lastErrorAt: null, lastAttemptAt: null
    };
    const visit = ONC.StudyTools?.state?.topicVisits?.[topicId] || null;
    const review = ONC.StudyTools?.state?.reviews?.[topicId] || null;
    const mastery = ONC.ProgressEngine?.get(topicId) || 0;
    const sessions = ONC.StudyHistory?.topicSessions(topicId) || [];
    const studySeconds = sessions.reduce((sum, item) => sum + Number(item.seconds || 0), 0);

    const errorRate = attempt.attempts
      ? attempt.errors / attempt.attempts
      : 0;

    const lastActivity = attempt.lastAttemptAt ||
      review?.lastReviewedAt ||
      visit?.lastOpenedAt;

    const daysInactive = this.daysSince(lastActivity);
    const recurrenceWeight = Math.min(20, topic.recurrence * 1.65);
    const errorWeight = Math.min(34, (attempt.errors * 8) + (errorRate * 14));
    const inactivityWeight = lastActivity
      ? Math.min(18, daysInactive * 0.8)
      : 10;
    const lowMasteryWeight = Math.min(26, (100 - mastery) * 0.26);
    const lowStudyWeight = studySeconds < 180 ? 5 : 0;

    const score = Math.max(0, Math.min(100, Math.round(
      recurrenceWeight +
      errorWeight +
      inactivityWeight +
      lowMasteryWeight +
      lowStudyWeight
    )));

    const reasons = [];
    if (attempt.errors > 0) reasons.push(`${attempt.errors} erro${attempt.errors === 1 ? "" : "s"}`);
    if (topic.recurrence >= 10) reasons.push("recorrência muito alta");
    else if (topic.recurrence >= 8) reasons.push("recorrência alta");
    else if (topic.recurrence >= 5) reasons.push("recorrência média");
    if (mastery < 25) reasons.push("domínio inicial");
    else if (mastery < 50) reasons.push("domínio em desenvolvimento");
    if (daysInactive >= 7) reasons.push(`${daysInactive} dias sem atividade`);
    if (!lastActivity) reasons.push("ainda não estudado");

    let impact = "Moderado";
    if (score >= 75) impact = "Muito alto";
    else if (score >= 55) impact = "Alto";

    return {
      ...topic,
      score,
      mastery,
      impact,
      reasons,
      attempts: attempt.attempts,
      errors: attempt.errors,
      studySeconds,
      daysInactive
    };
  },

  rank(options = {}) {
    const { discipline = null, limit = null, excludeMastered = false } = options;
    let items = this.topicIndex
      .filter(item => !discipline || item.discipline === discipline)
      .map(item => this.calculate(item.id))
      .filter(Boolean);

    if (excludeMastered) {
      items = items.filter(item => item.mastery < 70);
    }

    items.sort((a, b) =>
      b.score - a.score ||
      b.errors - a.errors ||
      b.recurrence - a.recurrence
    );

    return limit ? items.slice(0, limit) : items;
  },

  nextBestAction() {
    return this.rank({ limit: 1, excludeMastered: true })[0] || null;
  }
};
