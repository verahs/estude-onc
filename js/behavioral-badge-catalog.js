window.ONC = window.ONC || {};

ONC.BehavioralBadgeCatalog = {
  rules() {
    return [
      {
        id: "persistencia",
        title: "Persistência",
        category: "comportamento",
        subcategory: "consistencia",
        hidden: false,
        icon: "🔥",
        reward: { type: "frame", id: "frame-persistencia-bronze" },
        description: "Manter sete dias consecutivos de atividade válida.",
        evaluate: context => ({
          current: context.streak,
          target: 7,
          complete: context.streak >= 7,
          evidence: `${context.streak}/7 dias consecutivos de atividade válida`,
          metadata: { source: "StudyHabitEngine", streak: context.streak }
        })
      },
      {
        id: "disciplina",
        title: "Disciplina",
        category: "comportamento",
        subcategory: "frequencia",
        hidden: false,
        icon: "📅",
        reward: { type: "theme", id: "theme-disciplina" },
        description: "Registrar trinta dias ativos.",
        evaluate: context => ({
          current: context.activeDays30,
          target: 30,
          complete: context.activeDays30 >= 30,
          evidence: `${context.activeDays30}/30 dias ativos nos últimos 30 dias`,
          metadata: { source: "StudyHabitEngine", activeDays30: context.activeDays30 }
        })
      },
      {
        id: "memoria",
        title: "Memória",
        category: "comportamento",
        subcategory: "revisao",
        hidden: false,
        icon: "🧠",
        reward: { type: "effect", id: "effect-memory" },
        description: "Concluir todas as revisões vencidas do período, com pelo menos cinco revisões válidas.",
        evaluate: context => ({
          current: context.reviewsOnTime,
          target: Math.max(5, context.totalReviewsDue),
          complete:
            context.reviewsOnTime >= 5 &&
            context.overdueReviews === 0 &&
            context.totalReviewsDue > 0,
          evidence:
            `${context.reviewsOnTime} revisões concluídas no período • ` +
            `${context.overdueReviews} revisão${context.overdueReviews === 1 ? "" : "ões"} vencida${context.overdueReviews === 1 ? "" : "s"}`,
          metadata: {
            source: "MemoryEngine + IntelligentXPEngine",
            reviewsOnTime: context.reviewsOnTime,
            overdueReviews: context.overdueReviews
          }
        })
      },
      {
        id: "regularidade",
        title: "Regularidade",
        category: "comportamento",
        subcategory: "metas",
        hidden: false,
        icon: "📊",
        reward: { type: "frame", id: "frame-regularidade" },
        description: "Atingir a meta semanal em quatro semanas registradas.",
        evaluate: context => ({
          current: context.weeksTargetMet,
          target: 4,
          complete: context.weeksTargetMet >= 4,
          evidence: `${context.weeksTargetMet}/4 semanas com meta de consistência atingida`,
          metadata: { source: "ConsistencyCoach", weeksTargetMet: context.weeksTargetMet }
        })
      },
      {
        id: "foco",
        title: "Foco",
        category: "comportamento",
        subcategory: "conclusao",
        hidden: false,
        icon: "🎯",
        reward: { type: "theme", id: "theme-foco" },
        description: "Manter quatorze dias sem índice relevante de adiamento.",
        evaluate: context => ({
          current: context.lowProcrastinationDays,
          target: 14,
          complete: context.lowProcrastinationDays >= 14,
          evidence: `${context.lowProcrastinationDays}/14 dias com índice de adiamento abaixo de 25`,
          metadata: { source: "ProcrastinationDetector", lowProcrastinationDays: context.lowProcrastinationDays }
        })
      },
      {
        id: "equilibrio",
        title: "Equilíbrio",
        category: "comportamento",
        subcategory: "carga",
        hidden: false,
        icon: "⚖️",
        reward: { type: "effect", id: "effect-equilibrio" },
        description: "Manter quatorze dias sem carga cognitiva crítica.",
        evaluate: context => ({
          current: context.lowFatigueDays,
          target: 14,
          complete: context.lowFatigueDays >= 14,
          evidence: `${context.lowFatigueDays}/14 dias sem índice crítico de carga cognitiva`,
          metadata: { source: "CognitiveFatigueCoach", lowFatigueDays: context.lowFatigueDays }
        })
      },
      {
        id: "planejamento",
        title: "Planejamento",
        category: "comportamento",
        subcategory: "missao",
        hidden: false,
        icon: "✅",
        reward: { type: "frame", id: "frame-planejamento" },
        description: "Concluir todas as tarefas da missão em sete dias diferentes.",
        evaluate: context => ({
          current: context.fullMissionDays,
          target: 7,
          complete: context.fullMissionDays >= 7,
          evidence: `${context.fullMissionDays}/7 dias com missão integralmente concluída`,
          metadata: { source: "MissionEngine + IntelligentXPEngine", fullMissionDays: context.fullMissionDays }
        })
      },
      {
        id: "organizacao",
        title: "Organização",
        category: "comportamento",
        subcategory: "ferramentas",
        hidden: false,
        icon: "🗂️",
        reward: { type: "theme", id: "theme-organizacao" },
        description: "Usar favoritos, revisões e plano diário de forma recorrente.",
        evaluate: context => ({
          current: context.organizationToolsUsed,
          target: 3,
          complete:
            context.organizationToolsUsed >= 3 &&
            context.favoriteUses >= 3 &&
            context.reviewUses >= 3 &&
            context.dailyPlanUses >= 3,
          evidence:
            `Favoritos: ${context.favoriteUses} • revisões: ${context.reviewUses} • plano diário: ${context.dailyPlanUses}`,
          metadata: {
            source: "NavigationHistory + XP ledger",
            favoriteUses: context.favoriteUses,
            reviewUses: context.reviewUses,
            dailyPlanUses: context.dailyPlanUses
          }
        })
      },
      {
        id: "cientista-consistente",
        title: "Cientista Consistente",
        category: "comportamento",
        subcategory: "longevidade",
        hidden: false,
        icon: "🔬",
        reward: { type: "avatar", id: "avatar-cientista-consistente" },
        description: "Acumular noventa dias ativos no histórico.",
        evaluate: context => ({
          current: context.lifetimeActiveDays,
          target: 90,
          complete: context.lifetimeActiveDays >= 90,
          evidence: `${context.lifetimeActiveDays}/90 dias ativos acumulados`,
          metadata: { source: "StudyHabitEngine", lifetimeActiveDays: context.lifetimeActiveDays }
        })
      },
      {
        id: "mestre-da-rotina",
        title: "Mestre da Rotina",
        category: "comportamento",
        subcategory: "longevidade",
        hidden: false,
        icon: "🏆",
        reward: { type: "avatar", id: "avatar-mestre-rotina" },
        description: "Acumular cento e oitenta dias ativos no histórico.",
        evaluate: context => ({
          current: context.lifetimeActiveDays,
          target: 180,
          complete: context.lifetimeActiveDays >= 180,
          evidence: `${context.lifetimeActiveDays}/180 dias ativos acumulados`,
          metadata: { source: "StudyHabitEngine", lifetimeActiveDays: context.lifetimeActiveDays }
        })
      }
    ];
  },

  register() {
    ONC.BadgeRuleEngine?.registerMany?.(this.rules());
  }
};
