window.ONC = window.ONC || {};

ONC.LearningAnalyticsEngine = {
  initialized: false,

  init() {
    this.assertDependencies();
    this.initialized = true;
  },

  assertDependencies() {
    const required = [
      ["MasteryEngine", "get"],
      ["MasteryEngine", "average"],
      ["MemoryEngine", "status"],
      ["MemoryEngine", "averageMemory"],
      ["PriorityEngine", "rank"]
    ];

    const missing = required.filter(([moduleName, methodName]) => {
      const module = ONC[moduleName];
      return !module || typeof module[methodName] !== "function";
    });

    if (missing.length) {
      throw new Error(
        `LearningAnalyticsEngine: dependências ausentes: ${
          missing.map(item => item.join(".")).join(", ")
        }`
      );
    }
  },

  topics() {
    return ONC.MasteryEngine.topicIndex || [];
  },

  topic(topicId) {
    const item = this.topics().find(topic => topic.id === topicId);
    if (!item) return null;

    const mastery = ONC.MasteryEngine.get(topicId);
    const memory = ONC.MemoryEngine.status(topicId);
    const attention = ONC.Attention?.evaluate?.(topicId) || null;
    const priority = ONC.PriorityEngine?.calculate?.(topicId) || null;

    return {
      id: item.id,
      title: item.title,
      discipline: item.discipline,
      recurrence: Number(item.recurrence || 0),
      mastery,
      memory,
      attention,
      priority
    };
  },

  subjectSummary(discipline) {
    const topics = this.topics().filter(topic => topic.discipline === discipline);
    const masteryValues = topics.map(topic => ONC.MasteryEngine.get(topic.id).score);
    const memoryValues = topics
      .map(topic => ONC.MemoryEngine.memoryScore(topic.id))
      .filter(value => value > 0);

    const studied = masteryValues.filter(value => value > 0).length;
    const mastered = masteryValues.filter(value => value >= 70).length;
    const average = masteryValues.length
      ? Math.round(masteryValues.reduce((sum, value) => sum + value, 0) / masteryValues.length)
      : 0;
    const memoryAverage = memoryValues.length
      ? Math.round(memoryValues.reduce((sum, value) => sum + value, 0) / memoryValues.length)
      : 0;

    const completed = topics.filter(topic => ONC.Study?.progress?.[topic.id] === true).length;

    return {
      discipline,
      total: topics.length,
      studied,
      mastered,
      completed,
      pending: Math.max(0, topics.length - completed),
      average,
      memoryAverage,
      coverage: topics.length ? Math.round((studied / topics.length) * 100) : 0
    };
  },

  subjects() {
    const definitions = Array.isArray(window.ONC_DATA?.subjects)
      ? window.ONC_DATA.subjects
      : [];

    return definitions.map(subject => ({
      name: subject.name,
      icon: subject.icon || "",
      ...this.subjectSummary(subject.name)
    }));
  },

  overview() {
    const topics = this.topics();
    const masteryValues = topics.map(topic => ONC.MasteryEngine.get(topic.id).score);
    const studied = masteryValues.filter(value => value > 0).length;
    const mastered = masteryValues.filter(value => value >= 70).length;
    const averageMastery = masteryValues.length
      ? Math.round(masteryValues.reduce((sum, value) => sum + value, 0) / masteryValues.length)
      : 0;
    const averageMemory = ONC.MemoryEngine.averageMemory();

    const coverage = topics.length ? studied / topics.length : 0;
    const preparation = Math.max(0, Math.min(100, Math.round(
      (averageMastery * 0.72) +
      (coverage * 100 * 0.28)
    )));

    return {
      total: topics.length,
      studied,
      mastered,
      remaining: Math.max(0, topics.length - studied),
      averageMastery,
      averageMemory,
      coverage: Math.round(coverage * 100),
      preparation
    };
  },

  performanceEstimate() {
    const history = ONC.Storage.get("onc_quiz_history", []);
    const overview = this.overview();

    if (!history.length) {
      return {
        index: Math.round(
          (overview.averageMastery * 0.65) +
          (overview.averageMemory * 0.35)
        ),
        confidence: "Baixa",
        sample: 0,
        label: "Estimativa inicial",
        note: "Faça simulados para tornar o indicador mais representativo."
      };
    }

    const recent = history.slice(0, 5);
    const average = recent.reduce((sum, item) => sum + Number(item.pct || 0), 0) / recent.length;
    const consistency = Math.max(0, 100 - (
      recent.reduce((sum, item) => sum + Math.abs(Number(item.pct || 0) - average), 0) /
      recent.length
    ));

    const index = Math.round(
      (average * 0.55) +
      (overview.averageMastery * 0.25) +
      (overview.averageMemory * 0.10) +
      (consistency * 0.10)
    );

    return {
      index: Math.max(0, Math.min(100, index)),
      confidence: recent.length >= 5 ? "Média" : "Baixa",
      sample: recent.length,
      label: index >= 75
        ? "Preparação consistente"
        : index >= 50
          ? "Em evolução"
          : "Base em construção",
      note: "Indicador interno de preparação; não é previsão de nota, classificação ou medalha."
    };
  },

  heatmap() {
    return this.subjects().map(subject => {
      let level = "empty";
      if (subject.average >= 70) level = "strong";
      else if (subject.average >= 45) level = "developing";
      else if (subject.average > 0) level = "attention";

      return {
        discipline: subject.name,
        icon: subject.icon,
        mastery: subject.average,
        memory: subject.memoryAverage,
        studied: subject.studied,
        mastered: subject.mastered,
        total: subject.total,
        coverage: subject.coverage,
        level
      };
    });
  },

  priorityTopics({ limit = 3, discipline = null } = {}) {
    return ONC.PriorityEngine.rank({
      limit,
      discipline,
      excludeMastered: true
    });
  },

  nextReview() {
    const topics = this.topics()
      .map(item => ({ ...item, memory: ONC.MemoryEngine.status(item.id) }))
      .filter(item => item.memory.nextReview)
      .sort((a, b) => a.memory.nextReview - b.memory.nextReview);

    return topics[0] || null;
  },

  health() {
    return {
      initialized: this.initialized,
      topicCount: this.topics().length,
      subjectCount: this.subjects().length,
      masteryAvailable: typeof ONC.MasteryEngine?.get === "function",
      memoryAvailable: typeof ONC.MemoryEngine?.status === "function",
      priorityAvailable: typeof ONC.PriorityEngine?.rank === "function"
    };
  }
};
