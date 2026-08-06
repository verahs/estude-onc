window.ONC = window.ONC || {};

ONC.LearningBadgeCatalog = {
  subject(context, name) {
    return context.subjects?.find(item =>
      String(item.name || "").toLocaleLowerCase("pt-BR") ===
      String(name).toLocaleLowerCase("pt-BR")
    ) || {
      name,
      average: 0,
      coverage: 0,
      studied: 0,
      total: 0,
      completed: 0
    };
  },

  subjectMasteryRule({
    id,
    title,
    subject,
    description,
    reward,
    requiredMastery = 100,
    requiredCoverage = 100
  }) {
    return {
      id,
      title,
      category: "aprendizagem",
      subcategory: subject.toLocaleLowerCase("pt-BR"),
      hidden: false,
      icon: {
        "Física": "⚙️",
        "Biologia": "🌿",
        "Química": "⚗️",
        "Astronomia": "🔭"
      }[subject] || "🔬",
      reward,
      description,
      evaluate: context => {
        const result = this.subject(context, subject);
        const masteryProgress = Math.min(100, result.average / requiredMastery * 100);
        const coverageProgress = Math.min(100, result.coverage / requiredCoverage * 100);
        const progress = Math.round(Math.min(masteryProgress, coverageProgress));

        return {
          current: progress,
          target: 100,
          complete:
            result.average >= requiredMastery &&
            result.coverage >= requiredCoverage,
          evidence:
            `${subject}: ${result.average}% de domínio médio, ` +
            `${result.coverage}% de cobertura e ` +
            `${result.completed || 0}/${result.total || 0} tópicos concluídos`,
          metadata: {
            subject,
            mastery: result.average,
            coverage: result.coverage,
            completed: result.completed || 0,
            total: result.total || 0
          }
        };
      }
    };
  },

  rules() {
    return [
      this.subjectMasteryRule({
        id: "newton",
        title: "Newton",
        subject: "Física",
        description: "Alcançar 100% de domínio e cobertura completa em Física.",
        reward: { type: "frame", id: "frame-newton" }
      }),
      this.subjectMasteryRule({
        id: "darwin",
        title: "Darwin",
        subject: "Biologia",
        description: "Alcançar 100% de domínio e cobertura completa em Biologia.",
        reward: { type: "frame", id: "frame-darwin" }
      }),
      this.subjectMasteryRule({
        id: "lavoisier",
        title: "Lavoisier",
        subject: "Química",
        description: "Alcançar 100% de domínio e cobertura completa em Química.",
        reward: { type: "frame", id: "frame-lavoisier" }
      }),
      this.subjectMasteryRule({
        id: "galileu",
        title: "Galileu",
        subject: "Astronomia",
        description: "Concluir Astronomia com cobertura total e domínio médio de pelo menos 85%.",
        reward: { type: "theme", id: "theme-galileu" },
        requiredMastery: 85,
        requiredCoverage: 100
      }),
      {
        id: "marie-curie",
        title: "Marie Curie",
        category: "aprendizagem",
        subcategory: "evolucao",
        hidden: false,
        icon: "☢️",
        reward: { type: "effect", id: "effect-marie-curie" },
        description: "Elevar em pelo menos 30 pontos o domínio estimado de um tópico.",
        evaluate: context => {
          const best = context.topicEvolution?.[0] || null;
          const gain = Number(best?.gain || 0);
          return {
            current: Math.min(30, gain),
            target: 30,
            complete: gain >= 30,
            evidence: best
              ? `${best.title}: evolução de ${best.start}% para ${best.current}% (+${gain} pontos)`
              : "Ainda não há histórico suficiente de evolução por tópico",
            metadata: best || {}
          };
        }
      },
      {
        id: "einstein",
        title: "Einstein",
        category: "aprendizagem",
        subcategory: "dificuldade",
        hidden: false,
        icon: "🧠",
        reward: { type: "avatar", id: "avatar-einstein" },
        description: "Resolver corretamente dez questões difíceis, em pelo menos três tópicos.",
        evaluate: context => ({
          current: Math.min(
            context.hardCorrect,
            context.hardCorrectTopics >= 3 ? 10 : Math.min(9, context.hardCorrect)
          ),
          target: 10,
          complete:
            context.hardCorrect >= 10 &&
            context.hardCorrectTopics >= 3,
          evidence:
            `${context.hardCorrect} questões difíceis corretas ` +
            `em ${context.hardCorrectTopics} tópico${context.hardCorrectTopics === 1 ? "" : "s"}`,
          metadata: {
            hardCorrect: context.hardCorrect,
            hardCorrectTopics: context.hardCorrectTopics
          }
        })
      },
      {
        id: "metodo-cientifico",
        title: "Método Científico",
        category: "aprendizagem",
        subcategory: "amplitude",
        hidden: false,
        icon: "🔬",
        reward: { type: "theme", id: "theme-scientific-method" },
        description: "Estudar todas as disciplinas e alcançar pelo menos 70% de domínio médio em cada uma.",
        evaluate: context => {
          const subjects = context.subjects || [];
          const qualified = subjects.filter(item =>
            item.coverage > 0 && item.average >= 70
          ).length;
          return {
            current: qualified,
            target: Math.max(1, subjects.length),
            complete:
              subjects.length > 0 &&
              qualified === subjects.length,
            evidence:
              `${qualified}/${subjects.length} disciplinas com domínio médio de pelo menos 70%`,
            metadata: {
              qualified,
              totalSubjects: subjects.length
            }
          };
        }
      },
      {
        id: "dominio-crescente",
        title: "Domínio Crescente",
        category: "aprendizagem",
        subcategory: "evolucao",
        hidden: false,
        icon: "📈",
        reward: { type: "effect", id: "effect-rising-mastery" },
        description: "Manter tendência de evolução em cinco tópicos.",
        evaluate: context => ({
          current: context.risingTopics,
          target: 5,
          complete: context.risingTopics >= 5,
          evidence:
            `${context.risingTopics} tópico${context.risingTopics === 1 ? "" : "s"} com tendência de evolução`,
          metadata: { risingTopics: context.risingTopics }
        })
      }
    ];
  },

  register() {
    ONC.BadgeRuleEngine?.registerMany?.(this.rules());
  }
};
