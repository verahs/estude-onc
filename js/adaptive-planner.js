window.ONC = window.ONC || {};

ONC.AdaptivePlanner = {
  lastRecalculatedAt: null,

  init() {},

  recalculate(trigger = "manual") {
    if (!ONC.MissionEngine) return;
    const current = ONC.MissionEngine.mission;
    const completed = current?.tasks?.filter(task => task.completed) || [];
    const generated = this.generate(trigger);

    generated.tasks = generated.tasks.map(task => {
      const match = completed.find(item =>
        item.topicId && item.topicId === task.topicId && item.type === task.type
      );
      return match ? { ...task, completed: true } : task;
    });

    ONC.MissionEngine.mission = generated;
    ONC.MissionEngine.updateAutomaticCompletion();
    ONC.MissionEngine.save();
    this.lastRecalculatedAt = new Date().toISOString();

    ONC.UIComponents?.Dashboard?.renderAll?.();
    ONC.DashboardEngine?.render?.();
  },

  generate(trigger = "adaptive") {
    const ranked = ONC.RecommendationEngine.rank({ limit: 12 });
    const tasks = [];
    const usedTopics = new Set();
    const usedDisciplines = new Set();

    for (const item of ranked) {
      if (tasks.length >= 2) break;
      if (usedTopics.has(item.topicId)) continue;
      const diversityPenalty = usedDisciplines.has(item.discipline) && tasks.length > 0;
      if (diversityPenalty && ranked.some(candidate =>
        !usedDisciplines.has(candidate.discipline) && !usedTopics.has(candidate.topicId)
      )) continue;

      tasks.push(this.topicTask(item));
      usedTopics.add(item.topicId);
      usedDisciplines.add(item.discipline);
    }

    const questionTarget = ranked.find(item => !usedTopics.has(item.topicId)) || ranked[0];
    if (questionTarget) {
      tasks.push({
        id: `adaptive-questions-${questionTarget.discipline}-${Date.now()}`,
        type: "questions",
        title: `Resolver 5 questões de ${questionTarget.discipline}`,
        discipline: questionTarget.discipline,
        topicId: questionTarget.topicId,
        reason: `Prática direcionada: ${questionTarget.reasons.slice(0, 2).join(" • ")}`,
        explanation: questionTarget.reasons,
        estimatedMinutes: 8,
        xp: 20,
        completed: false,
        generatedAt: new Date().toISOString(),
        adaptiveScore: questionTarget.score
      });
    }

    return {
      date: ONC.MissionEngine.todayKey(),
      generatedAt: new Date().toISOString(),
      trigger,
      adaptive: true,
      tasks: tasks.slice(0, 3),
      xpEarned: 0
    };
  },

  topicTask(item) {
    const labels = {
      review: "Revisar",
      study: "Estudar",
      practice: "Praticar",
      consolidate: "Consolidar"
    };

    return {
      id: `adaptive-${item.action}-${item.topicId}-${Date.now()}`,
      type: item.action === "practice" ? "reinforce" : item.action,
      topicId: item.topicId,
      title: `${labels[item.action]} ${item.title}`,
      discipline: item.discipline,
      reason: item.reasons.slice(0, 2).join(" • "),
      explanation: item.reasons,
      estimatedMinutes: item.action === "practice" ? 6 : 3,
      xp: item.action === "review" ? 20 : 15,
      impact: item.score >= 70 ? "Muito alto" : item.score >= 50 ? "Alto" : "Moderado",
      completed: false,
      generatedAt: new Date().toISOString(),
      adaptiveScore: item.score,
      confidence: item.confidence
    };
  }
};
