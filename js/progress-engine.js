window.ONC = window.ONC || {};

ONC.ProgressEngine = {
  topicIndex: [],
  snapshot: {},

  init() {
    this.buildIndex();
    this.refresh();
  },

  buildIndex() {
    this.topicIndex = [...document.querySelectorAll(".topicCard")].map(card => ({
      id: card.dataset.topicId,
      title: card.dataset.topicTitle || "",
      discipline: card.dataset.discipline || "",
      recurrence: Number(card.dataset.recurrence || 0),
      card
    }));
  },

  calculateMastery(topicId) {
    const topic = this.topicIndex.find(item => item.id === topicId);
    if (!topic) return 0;

    const completed = ONC.Study?.progress?.[topicId] === true;
    const visits = ONC.StudyTools?.state?.topicVisits?.[topicId]?.count || 0;
    const attempts = ONC.Attention?.attempts?.[topicId] || {
      attempts: 0, correct: 0, errors: 0, lastAttemptAt: null
    };
    const review = ONC.StudyTools?.state?.reviews?.[topicId] || null;
    const sessions = ONC.StudyHistory?.topicSessions(topicId) || [];
    const studySeconds = sessions.reduce((sum, item) => sum + Number(item.seconds || 0), 0);

    let mastery = 0;

    // Completion and active reading.
    if (completed) mastery += 20;
    mastery += Math.min(12, visits * 4);
    mastery += Math.min(8, Math.floor(studySeconds / 120) * 2);

    // Demonstrated performance carries the greatest weight.
    if (attempts.attempts > 0) {
      const accuracy = attempts.correct / attempts.attempts;
      mastery += Math.round(accuracy * 48);
      mastery += Math.min(7, attempts.attempts * 2);
    }

    // Review quality provides a small reinforcement.
    if (review?.lastQuality === "good") mastery += 5;
    if (review?.lastQuality === "easy") mastery += 9;
    if (review?.lastQuality === "again") mastery -= 8;

    // Knowledge fades gradually when there is evidence of prior study.
    const lastActivity = attempts.lastAttemptAt ||
      ONC.StudyTools?.state?.topicVisits?.[topicId]?.lastOpenedAt ||
      review?.lastReviewedAt;

    if (lastActivity && mastery > 0) {
      const days = Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000);
      if (days >= 30) mastery -= 16;
      else if (days >= 14) mastery -= 10;
      else if (days >= 7) mastery -= 5;
    }

    return Math.max(0, Math.min(100, Math.round(mastery)));
  },

  level(mastery) {
    if (mastery >= 85) return { key: "excellent", label: "Domínio excelente", stars: 5 };
    if (mastery >= 70) return { key: "strong", label: "Bom domínio", stars: 4 };
    if (mastery >= 50) return { key: "developing", label: "Em aprendizado", stars: 3 };
    if (mastery >= 25) return { key: "review", label: "Precisa revisar", stars: 2 };
    return { key: "critical", label: "Domínio inicial", stars: 1 };
  },

  get(topicId) {
    if (!(topicId in this.snapshot)) {
      this.snapshot[topicId] = this.calculateMastery(topicId);
    }
    return this.snapshot[topicId];
  },

  refresh() {
    this.snapshot = {};
    for (const topic of this.topicIndex) {
      this.snapshot[topic.id] = this.calculateMastery(topic.id);
    }
    this.renderTopicBadges();
    this.renderPreparation();
    ONC.StudyTools?.renderDisciplineProgress();
  },

  stars(mastery) {
    const count = mastery <= 0
      ? 0
      : Math.max(1, Math.min(5, Math.ceil(mastery / 20)));
    return "★".repeat(count) + "☆".repeat(5 - count);
  },

  renderTopicBadges() {
    for (const topic of this.topicIndex) {
      const mastery = this.get(topic.id);
      const level = this.level(mastery);
      const old = topic.card.querySelector(".masteryBadge");
      old?.remove();

      const meta = topic.card.querySelector(".topicMeta");
      if (!meta) continue;

      const badge = document.createElement("span");
      badge.className = `masteryBadge masteryBadge--${level.key}`;
      badge.title = `${this.stars(mastery)} • ${level.label}`;
      badge.innerHTML = `<span aria-hidden="true">${this.stars(mastery)}</span> ${mastery}%`;
      meta.appendChild(badge);
      topic.card.dataset.mastery = String(mastery);
    }
  },

  summary() {
    const values = this.topicIndex.map(topic => this.get(topic.id));
    const studied = values.filter(value => value > 0).length;
    const mastered = values.filter(value => value >= 70).length;
    const average = values.length
      ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
      : 0;

    // Preparation combines average mastery with curriculum coverage.
    const coverage = values.length ? studied / values.length : 0;
    const preparation = Math.round((average * 0.72) + (coverage * 100 * 0.28));

    return {
      total: values.length,
      studied,
      mastered,
      average,
      preparation: Math.max(0, Math.min(100, preparation))
    };
  },

  renderPreparation() {
    const summary = this.summary();
    const value = document.getElementById("preparationValue");
    const bar = document.getElementById("preparationBar");
    const studied = document.getElementById("studiedTopicsMetric");
    const mastered = document.getElementById("masteredTopicsMetric");
    const remaining = document.getElementById("remainingTopicsMetric");

    if (value) value.textContent = `${summary.preparation}%`;
    if (bar) bar.style.width = `${summary.preparation}%`;
    if (studied) studied.textContent = summary.studied;
    if (mastered) mastered.textContent = summary.mastered;
    if (remaining) remaining.textContent = Math.max(0, summary.total - summary.studied);
  },

  disciplineSummary(discipline) {
    const topics = this.topicIndex.filter(item => item.discipline === discipline);
    const values = topics.map(item => this.get(item.id));
    const studied = values.filter(value => value > 0).length;
    const mastered = values.filter(value => value >= 70).length;
    const average = values.length
      ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
      : 0;
    return { total: values.length, studied, mastered, average };
  }
};
