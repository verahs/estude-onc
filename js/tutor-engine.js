window.ONC = window.ONC || {};

ONC.TutorEngine = {
  init() {},

  context(topicId) {
    return ONC.LearningAnalyticsEngine.topic(topicId);
  },

  nextBestAction() {
    const adaptive = ONC.RecommendationEngine?.next?.();
    if (adaptive) {
      return {
        id: adaptive.topicId,
        title: adaptive.title,
        discipline: adaptive.discipline,
        score: adaptive.score,
        reasons: adaptive.reasons,
        mastery: adaptive.mastery,
        context: ONC.LearningAnalyticsEngine.topic(adaptive.topicId),
        tutorScore: adaptive.score
      };
    }

    const ranked = ONC.LearningAnalyticsEngine.priorityTopics({ limit: null });

    const items = ranked.map(item => {
      const context = this.context(item.id);
      if (!context) return null;

      return {
        ...item,
        context,
        tutorScore: Math.round(
          (item.score * 0.45) +
          (context.memory.forget * 0.25) +
          ((100 - context.mastery.score) * 0.20) +
          (context.attention ? 25 : 0)
        )
      };
    }).filter(Boolean);

    items.sort((a, b) => b.tutorScore - a.tutorScore);
    return items[0] || null;
  },

  why(topicId) {
    const context = this.context(topicId);
    const reasons = [];
    if (!context) return reasons;

    if (context.attention?.errors) {
      reasons.push(
        `você errou ${context.attention.errors} vez${
          context.attention.errors === 1 ? "" : "es"
        } neste tema`
      );
    }

    if (context.recurrence >= 10) {
      reasons.push("é um conteúdo de recorrência muito alta");
    } else if (context.recurrence >= 8) {
      reasons.push("é um conteúdo de recorrência alta");
    }

    if (context.memory.forget >= 70) {
      reasons.push("a chance de esquecimento está alta");
    } else if (context.memory.forget >= 45) {
      reasons.push("a memória precisa ser consolidada");
    }

    if (context.mastery.quiz < 50) reasons.push("faltam acertos em questões");
    if (context.mastery.reading < 50) reasons.push("a leitura ainda não foi consolidada");

    return reasons.length
      ? reasons
      : ["é a melhor próxima ação calculada pelo tutor"];
  },

  action(topicId) {
    const context = this.context(topicId);
    if (!context) return "Estudar";
    if (context.attention?.errors || context.memory.forget >= 70) return "Revisar";
    if (context.mastery.reading < 60) return "Estudar";
    if (context.mastery.quiz < 70) return "Praticar";
    return "Consolidar";
  },

  threshold(topicId) {
    const context = this.context(topicId);
    const score = context?.mastery?.score || 0;
    const next = [25, 50, 70, 85, 100].find(value => score < value) || 100;

    return {
      next,
      remaining: Math.max(0, next - score)
    };
  }
};
