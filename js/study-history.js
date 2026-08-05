window.ONC = window.ONC || {};

ONC.StudyHistory = {
  state: {
    topicEvents: [],
    questionAttempts: [],
    quizResults: [],
    sessions: []
  },

  init() {
    this.load();
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_study_history_${current}`;
  },

  load() {
    this.state = ONC.Storage.get(this.storageKey(), {
      topicEvents: [],
      questionAttempts: [],
      quizResults: [],
      sessions: []
    });
  },

  save() {
    this.state.topicEvents = this.state.topicEvents.slice(-1000);
    this.state.questionAttempts = this.state.questionAttempts.slice(-1500);
    this.state.quizResults = this.state.quizResults.slice(-200);
    this.state.sessions = this.state.sessions.slice(-1000);
    ONC.Storage.set(this.storageKey(), this.state);
  },

  recordTopicEvent(topicId, title, discipline, type, metadata = {}) {
    this.state.topicEvents.push({
      topicId,
      title,
      discipline,
      type,
      metadata,
      timestamp: new Date().toISOString()
    });
    this.save();
  },

  recordAttempt(question, topicId, correct, source = "question-bank") {
    this.state.questionAttempts.push({
      questionId: question?.id || null,
      topicId,
      subject: question?.subject || "",
      topic: question?.topic || "",
      correct: Boolean(correct),
      source,
      timestamp: new Date().toISOString()
    });
    this.save();
  },

  recordQuiz(result) {
    this.state.quizResults.push({
      ...result,
      timestamp: new Date().toISOString()
    });
    this.save();
  },

  recordSession(session) {
    if (!session) return;
    this.state.sessions.push({ ...session });
    this.save();
  },

  topicAttempts(topicId) {
    return this.state.questionAttempts.filter(item => item.topicId === topicId);
  },

  topicSessions(topicId) {
    return this.state.sessions.filter(item => item.topicId === topicId);
  },

  lastTopicEvent(topicId, type = null) {
    return [...this.state.topicEvents]
      .reverse()
      .find(item => item.topicId === topicId && (!type || item.type === type)) || null;
  },

  attemptsSince(timestamp) {
    const time = new Date(timestamp).getTime();
    return this.state.questionAttempts.filter(item => new Date(item.timestamp).getTime() >= time);
  },

  totalStudySeconds() {
    return this.state.sessions.reduce((sum, item) => sum + Number(item.seconds || 0), 0);
  }
};
