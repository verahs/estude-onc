window.ONC = window.ONC || {};

ONC.SecretBadgeCatalog = {
  rules() {
    return [
      {
        id: "curiosidade-cientifica-secreta",
        title: "Curiosidade Científica",
        category: "secreta",
        subcategory: "exploracao",
        hidden: true,
        icon: "🔍",
        rarity: "rara",
        reward: { type: "title", id: "title-curiosidade-cientifica" },
        description: "Explorar diferentes áreas da plataforma e concluir atividades em quatro fontes distintas.",
        evaluate: context => ({
          current: context.meaningfulSources,
          target: 4,
          complete: context.meaningfulSources >= 4,
          evidence: `${context.meaningfulSources}/4 áreas com atividade válida`,
          metadata: { sources: context.meaningfulSourceList }
        })
      },
      {
        id: "observador-do-ceu",
        title: "Observador do Céu",
        category: "secreta",
        subcategory: "astronomia",
        hidden: true,
        icon: "🔭",
        rarity: "rara",
        reward: { type: "theme", id: "theme-observador-do-ceu" },
        description: "Concluir conteúdos de Astronomia em três dias diferentes e obter bom desempenho.",
        evaluate: context => ({
          current: Math.min(3, context.astronomyActiveDays),
          target: 3,
          complete: context.astronomyActiveDays >= 3 && context.astronomyAccuracy >= 80,
          evidence: `${context.astronomyActiveDays}/3 dias em Astronomia • ${context.astronomyAccuracy}% de precisão`,
          metadata: {
            activeDays: context.astronomyActiveDays,
            accuracy: context.astronomyAccuracy
          }
        })
      },
      {
        id: "laboratorio-oculto",
        title: "Laboratório Oculto",
        category: "secreta",
        subcategory: "ferramentas",
        hidden: true,
        icon: "🧪",
        rarity: "muito-rara",
        reward: { type: "frame", id: "frame-laboratorio-oculto" },
        description: "Usar de forma significativa favoritos, revisões, simulados e plano diário.",
        evaluate: context => ({
          current: context.secretToolsUsed,
          target: 4,
          complete: context.secretToolsUsed >= 4,
          evidence: `${context.secretToolsUsed}/4 ferramentas usadas com atividade válida`,
          metadata: { tools: context.secretToolList }
        })
      },
      {
        id: "explorador-total",
        title: "Explorador Total",
        category: "secreta",
        subcategory: "conteudo",
        hidden: true,
        icon: "🗺️",
        rarity: "lendaria",
        reward: { type: "avatar", id: "avatar-explorador-total" },
        description: "Estudar todos os 141 tópicos do mapa.",
        evaluate: context => ({
          current: context.studiedTopics,
          target: context.totalTopics || 141,
          complete: context.totalTopics > 0 && context.studiedTopics >= context.totalTopics,
          evidence: `${context.studiedTopics}/${context.totalTopics || 141} tópicos estudados`,
          metadata: {
            studiedTopics: context.studiedTopics,
            totalTopics: context.totalTopics || 141
          }
        })
      },
      {
        id: "precisao-sustentada",
        title: "Precisão Sustentada",
        category: "secreta",
        subcategory: "desempenho",
        hidden: true,
        icon: "🎯",
        rarity: "lendaria",
        reward: { type: "effect", id: "effect-precisao-sustentada" },
        description: "Acertar cinquenta questões válidas consecutivas, sem respostas excessivamente rápidas.",
        evaluate: context => ({
          current: context.validCorrectStreak,
          target: 50,
          complete: context.validCorrectStreak >= 50,
          evidence: `${context.validCorrectStreak}/50 acertos válidos consecutivos`,
          metadata: { validCorrectStreak: context.validCorrectStreak }
        })
      },
      {
        id: "polimata",
        title: "Polímata",
        category: "secreta",
        subcategory: "dominio",
        hidden: true,
        icon: "🌐",
        rarity: "lendaria",
        reward: { type: "theme", id: "theme-polimata" },
        description: "Alcançar domínio elevado e cobertura completa em todas as disciplinas.",
        evaluate: context => ({
          current: context.masteredSubjects,
          target: Math.max(1, context.totalSubjects),
          complete:
            context.totalSubjects > 0 &&
            context.masteredSubjects === context.totalSubjects,
          evidence: `${context.masteredSubjects}/${context.totalSubjects} disciplinas com 90%+ de domínio e cobertura completa`,
          metadata: {
            masteredSubjects: context.masteredSubjects,
            totalSubjects: context.totalSubjects
          }
        })
      },
      {
        id: "imparavel-saudavel",
        title: "Imparável",
        category: "secreta",
        subcategory: "consistencia",
        hidden: true,
        icon: "🔥",
        rarity: "muito-rara",
        reward: { type: "frame", id: "frame-imparavel" },
        description: "Manter trinta dias consecutivos com atividade válida, sem concentração excessiva de carga.",
        evaluate: context => ({
          current: Math.min(30, context.healthyStreak),
          target: 30,
          complete: context.healthyStreak >= 30 && !context.overloadConcentrated,
          evidence: `${context.healthyStreak}/30 dias consecutivos • carga ${context.overloadConcentrated ? "concentrada" : "equilibrada"}`,
          metadata: {
            healthyStreak: context.healthyStreak,
            overloadConcentrated: context.overloadConcentrated
          }
        })
      },
      {
        id: "cientista-lendario",
        title: "Cientista Lendário",
        category: "secreta",
        subcategory: "colecao",
        hidden: true,
        icon: "💎",
        rarity: "mitica",
        reward: { type: "avatar", id: "avatar-cientista-lendario" },
        description: "Conquistar todas as medalhas visíveis de aprendizagem, comportamento e recuperação.",
        evaluate: context => ({
          current: context.visibleCoreBadgesUnlocked,
          target: Math.max(1, context.visibleCoreBadgesTotal),
          complete:
            context.visibleCoreBadgesTotal > 0 &&
            context.visibleCoreBadgesUnlocked >= context.visibleCoreBadgesTotal,
          evidence: `${context.visibleCoreBadgesUnlocked}/${context.visibleCoreBadgesTotal} medalhas principais conquistadas`,
          metadata: {
            unlocked: context.visibleCoreBadgesUnlocked,
            total: context.visibleCoreBadgesTotal
          }
        })
      },
      {
        id: "cientista-supremo",
        title: "Cientista Supremo",
        category: "secreta",
        subcategory: "colecao",
        hidden: true,
        icon: "👑",
        rarity: "mitica",
        reward: { type: "title", id: "title-cientista-supremo" },
        description: "Conquistar todas as medalhas disponíveis, exceto esta própria conquista.",
        evaluate: context => ({
          current: context.allOtherBadgesUnlocked,
          target: Math.max(1, context.allOtherBadgesTotal),
          complete:
            context.allOtherBadgesTotal > 0 &&
            context.allOtherBadgesUnlocked >= context.allOtherBadgesTotal,
          evidence: `${context.allOtherBadgesUnlocked}/${context.allOtherBadgesTotal} medalhas conquistadas`,
          metadata: {
            unlocked: context.allOtherBadgesUnlocked,
            total: context.allOtherBadgesTotal
          }
        })
      }
    ];
  },

  register() {
    ONC.BadgeRuleEngine?.registerMany?.(this.rules());
  }
};
