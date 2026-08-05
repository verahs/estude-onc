window.ONC = window.ONC || {};

ONC.MasteryEngine = {
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

  data(topicId) {
    return {
      visits: ONC.StudyTools?.state?.topicVisits?.[topicId] || {},
      attempts: ONC.Attention?.attempts?.[topicId] || {
        attempts: 0,
        correct: 0,
        errors: 0
      },
      review: ONC.StudyTools?.state?.reviews?.[topicId] || {},
      sessions: ONC.StudyHistory?.topicSessions?.(topicId) || [],
      completed: ONC.Study?.progress?.[topicId] === true
    };
  },

  reading(topicId) {
    const data = this.data(topicId);
    const seconds = data.sessions.reduce(
      (sum, item) => sum + Number(item.seconds || 0),
      0
    );

    return Math.min(100, Math.round(
      (data.visits.count ? Math.min(45, data.visits.count * 15) : 0) +
      Math.min(35, (seconds / 180) * 35) +
      (data.completed ? 20 : 0)
    ));
  },

  quiz(topicId) {
    const attempts = this.data(topicId).attempts;
    if (!attempts.attempts) return 0;

    return Math.round(
      (attempts.correct / attempts.attempts) * 85 +
      Math.min(1, attempts.attempts / 5) * 15
    );
  },

  review(topicId) {
    const values = {
      again: 20,
      hard: 50,
      good: 80,
      easy: 100
    };

    return values[this.data(topicId).review.lastQuality] || 0;
  },

  calculate(topicId) {
    const reading = this.reading(topicId);
    const quiz = this.quiz(topicId);
    const review = this.review(topicId);
    const memory = ONC.MemoryEngine?.memoryScore?.(topicId) || 0;

    return {
      topicId,
      reading,
      quiz,
      review,
      memory,
      score: Math.max(0, Math.min(100, Math.round(
        (reading * 0.35) +
        (quiz * 0.40) +
        (review * 0.15) +
        (memory * 0.10)
      )))
    };
  },

  get(topicId) {
    return this.snapshot[topicId] ||
      (this.snapshot[topicId] = this.calculate(topicId));
  },

  stars(score) {
    const count = score <= 0
      ? 0
      : Math.max(1, Math.min(5, Math.ceil(score / 20)));

    return "★".repeat(count) + "☆".repeat(5 - count);
  },

  label(score) {
    if (score >= 85) return "Domínio excelente";
    if (score >= 70) return "Bom domínio";
    if (score >= 50) return "Em consolidação";
    if (score >= 25) return "Em aprendizado";
    return "Domínio inicial";
  },

  explanation(score) {
    if (score >= 85) return "Você domina o assunto e precisa apenas manter a revisão.";
    if (score >= 70) return "Você já compreende o assunto. Falta consolidar a memória.";
    if (score >= 50) return "Seu desempenho está evoluindo, mas ainda precisa de prática.";
    if (score >= 25) return "Você iniciou o conteúdo. Leia, pratique e revise.";
    return "Comece pela leitura guiada e depois resolva questões.";
  },

  average() {
    const values = this.topicIndex.map(topic => this.get(topic.id).score);
    return values.length
      ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
      : 0;
  },

  // Compatibility method. New consumers should use LearningAnalyticsEngine.subjectSummary().
  disciplineSummary(discipline) {
    if (typeof ONC.LearningAnalyticsEngine?.subjectSummary === "function") {
      return ONC.LearningAnalyticsEngine.subjectSummary(discipline);
    }

    const topics = this.topicIndex.filter(topic => topic.discipline === discipline);
    const values = topics.map(topic => this.get(topic.id).score);

    return {
      discipline,
      total: topics.length,
      studied: values.filter(value => value > 0).length,
      mastered: values.filter(value => value >= 70).length,
      average: values.length
        ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
        : 0
    };
  },

  refresh() {
    this.snapshot = {};
    this.topicIndex.forEach(topic => {
      this.snapshot[topic.id] = this.calculate(topic.id);
    });
    this.renderBadges();
  },

  renderBadges() {
    this.topicIndex.forEach(topic => {
      if (!topic.card) return;
      topic.card.querySelector(".masteryBadge")?.remove();
      const meta = topic.card.querySelector(".topicMeta");
      if (!meta) return;

      const mastery = this.get(topic.id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "masteryBadge";
      button.title = "Ver composição do domínio";
      button.innerHTML = `<span>${this.stars(mastery.score)}</span> ${mastery.score}%`;
      button.addEventListener("click", event => {
        event.stopPropagation();
        ONC.MasteryUI?.open?.(topic.id);
      });

      meta.appendChild(button);
      topic.card.dataset.mastery = String(mastery.score);
    });
  }
};
