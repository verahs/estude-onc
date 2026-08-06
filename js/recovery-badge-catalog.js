window.ONC = window.ONC || {};

ONC.RecoveryBadgeCatalog = {
  rules() {
    return [
      {
        id: "fenix",
        title: "Fênix",
        category: "recuperacao",
        subcategory: "grande-recuperacao",
        hidden: false,
        icon: "🔥",
        reward: { type: "effect", id: "effect-fenix" },
        description: "Elevar um tópico crítico de até 30% para pelo menos 90%.",
        evaluate: context => {
          const best = context.recoveryTopics
            .filter(item => item.start <= 30)
            .sort((a, b) => b.current - a.current || b.gain - a.gain)[0] || null;

          const current = best
            ? Math.min(100, Math.round(
                Math.min(best.current / 90, best.gain / 60) * 100
              ))
            : 0;

          return {
            current,
            target: 100,
            complete:
              Boolean(best) &&
              best.start <= 30 &&
              best.current >= 90 &&
              best.gain >= 60,
            evidence: best
              ? `${best.title}: ${best.start}% → ${best.current}% (+${best.gain} pontos)`
              : "Nenhum tópico crítico com recuperação suficiente",
            metadata: best || {}
          };
        }
      },
      {
        id: "recomeco",
        title: "Recomeço",
        category: "recuperacao",
        subcategory: "multiplos-topicos",
        hidden: false,
        icon: "🌱",
        reward: { type: "frame", id: "frame-recomeco" },
        description: "Recuperar três tópicos que começaram abaixo de 50% e chegaram a pelo menos 75%.",
        evaluate: context => {
          const recovered = context.recoveryTopics.filter(item =>
            item.start < 50 &&
            item.current >= 75 &&
            item.gain >= 25
          );

          return {
            current: recovered.length,
            target: 3,
            complete: recovered.length >= 3,
            evidence: `${recovered.length}/3 tópicos recuperados`,
            metadata: { topics: recovered.slice(0, 5) }
          };
        }
      },
      {
        id: "resiliencia",
        title: "Resiliência",
        category: "recuperacao",
        subcategory: "correcao-erros",
        hidden: false,
        icon: "🛡️",
        reward: { type: "theme", id: "theme-resiliencia" },
        description: "Registrar vinte acertos de recuperação após erros anteriores.",
        evaluate: context => ({
          current: context.recoveryAwards,
          target: 20,
          complete: context.recoveryAwards >= 20,
          evidence: `${context.recoveryAwards}/20 acertos reconhecidos como recuperação`,
          metadata: {
            source: "IntelligentXPEngine",
            recoveryAwards: context.recoveryAwards
          }
        })
      },
      {
        id: "segunda-tentativa",
        title: "Segunda Tentativa",
        category: "recuperacao",
        subcategory: "questao",
        hidden: false,
        icon: "↻",
        reward: { type: "effect", id: "effect-second-attempt" },
        description: "Corrigir dez questões anteriormente respondidas de forma incorreta.",
        evaluate: context => ({
          current: context.correctedQuestions,
          target: 10,
          complete: context.correctedQuestions >= 10,
          evidence: `${context.correctedQuestions}/10 questões corrigidas em nova tentativa`,
          metadata: { correctedQuestions: context.correctedQuestions }
        })
      },
      {
        id: "virada-cientifica",
        title: "Virada Científica",
        category: "recuperacao",
        subcategory: "disciplina",
        hidden: false,
        icon: "📈",
        reward: { type: "frame", id: "frame-virada-cientifica" },
        description: "Elevar uma disciplina em pelo menos 20 pontos de domínio médio.",
        evaluate: context => {
          const best = context.subjectRecovery?.[0] || null;
          return {
            current: Math.min(20, Number(best?.gain || 0)),
            target: 20,
            complete: Number(best?.gain || 0) >= 20,
            evidence: best
              ? `${best.name}: ${best.start}% → ${best.current}% (+${best.gain} pontos)`
              : "Ainda não há histórico suficiente por disciplina",
            metadata: best || {}
          };
        }
      },
      {
        id: "memoria-recuperada",
        title: "Memória Recuperada",
        category: "recuperacao",
        subcategory: "revisao",
        hidden: false,
        icon: "🧩",
        reward: { type: "theme", id: "theme-memory-recovered" },
        description: "Concluir dez revisões de conteúdos com risco elevado de esquecimento.",
        evaluate: context => ({
          current: context.highRiskReviews,
          target: 10,
          complete: context.highRiskReviews >= 10,
          evidence: `${context.highRiskReviews}/10 revisões de alto risco concluídas`,
          metadata: { highRiskReviews: context.highRiskReviews }
        })
      },
      {
        id: "erro-transformado",
        title: "Erro Transformado",
        category: "recuperacao",
        subcategory: "erro-recorrente",
        hidden: false,
        icon: "🔧",
        reward: { type: "effect", id: "effect-error-transformed" },
        description: "Superar cinco padrões de erro recorrente em tópicos diferentes.",
        evaluate: context => ({
          current: context.recurringErrorRecoveries,
          target: 5,
          complete: context.recurringErrorRecoveries >= 5,
          evidence: `${context.recurringErrorRecoveries}/5 tópicos com erro recorrente superado`,
          metadata: { recurringErrorRecoveries: context.recurringErrorRecoveries }
        })
      },
      {
        id: "retorno-ao-ritmo",
        title: "Retorno ao Ritmo",
        category: "recuperacao",
        subcategory: "rotina",
        hidden: false,
        icon: "⏱️",
        reward: { type: "frame", id: "frame-return-rhythm" },
        description: "Retomar a rotina após pelo menos três dias de inatividade e completar três dias ativos.",
        evaluate: context => ({
          current: context.returnStreak,
          target: 3,
          complete:
            context.returnedAfterBreak &&
            context.returnStreak >= 3,
          evidence: context.returnedAfterBreak
            ? `${context.returnStreak}/3 dias ativos após o retorno`
            : "Ainda não houve retorno validado após intervalo de três dias",
          metadata: {
            returnedAfterBreak: context.returnedAfterBreak,
            returnStreak: context.returnStreak
          }
        })
      },
      {
        id: "recuperacao-consistente",
        title: "Recuperação Consistente",
        category: "recuperacao",
        subcategory: "regularidade",
        hidden: false,
        icon: "🔁",
        reward: { type: "avatar", id: "avatar-recovery-consistent" },
        description: "Registrar recuperação válida em quatro semanas diferentes.",
        evaluate: context => ({
          current: context.recoveryWeeks,
          target: 4,
          complete: context.recoveryWeeks >= 4,
          evidence: `${context.recoveryWeeks}/4 semanas com recuperação registrada`,
          metadata: { recoveryWeeks: context.recoveryWeeks }
        })
      },
      {
        id: "superacao-total",
        title: "Superação Total",
        category: "recuperacao",
        subcategory: "colecao",
        hidden: true,
        icon: "🌟",
        reward: { type: "avatar", id: "avatar-total-recovery" },
        description: "Conquistar seis medalhas de recuperação.",
        evaluate: context => ({
          current: context.recoveryBadgesUnlocked,
          target: 6,
          complete: context.recoveryBadgesUnlocked >= 6,
          evidence: `${context.recoveryBadgesUnlocked}/6 medalhas de recuperação conquistadas`,
          metadata: { recoveryBadgesUnlocked: context.recoveryBadgesUnlocked }
        })
      }
    ];
  },

  register() {
    ONC.BadgeRuleEngine?.registerMany?.(this.rules());
  }
};
