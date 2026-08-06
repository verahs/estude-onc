window.ONC = window.ONC || {};

ONC.GuardianDashboardEngine = {
  state: { lastSnapshot: null, history: [], version: 1 },

  init() {
    this.load();
    this.refresh("startup");
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_guardian_dashboard_${current}`;
  },

  load() {
    this.state = {
      lastSnapshot: null,
      history: [],
      version: 1,
      ...ONC.Storage.get(this.storageKey(), {})
    };
  },

  save() {
    this.state.history = this.state.history.slice(-180);
    ONC.Storage.set(this.storageKey(), this.state);
  },

  studentName() {
    const selected = ONC.Classroom?.students?.find(student =>
      student.id === ONC.Classroom?.currentId
    );
    return selected?.name || ONC.Users?.current?.name || "Estudante";
  },

  strengths() {
    const behavioral = ONC.BehavioralDashboardEngine?.current?.();
    const learning = ONC.LearningCoach?.current?.();
    const subjects = ONC.LearningAnalyticsEngine?.subjects?.() || [];

    const items = [];
    (behavioral?.strengths || []).forEach(item => items.push({
      title: item.title,
      detail: item.detail,
      source: item.source
    }));

    const strongest = [...subjects].sort((a, b) => b.average - a.average)[0];
    if (strongest?.average >= 60) {
      items.push({
        title: `Bom desempenho em ${strongest.name}`,
        detail: `${strongest.average}% de domínio médio e ${strongest.coverage}% de cobertura.`,
        source: "Aprendizagem"
      });
    }

    if (learning?.profile?.strongestStrategy) {
      items.push({
        title: `${learning.profile.strongestStrategy.label} tem bom resultado observado`,
        detail: `${learning.profile.strongestStrategy.accuracy}% de precisão nas atividades registradas.`,
        source: "Estratégia"
      });
    }

    return items.slice(0, 4);
  },

  attentionPoints() {
    const behavioral = ONC.BehavioralDashboardEngine?.current?.();
    const prediction = ONC.PerformancePredictionEngine?.current?.();
    const learning = ONC.LearningCoach?.current?.();

    const items = [];

    (behavioral?.priorities || []).forEach(item => items.push({
      title: item.title,
      detail: item.action,
      source: item.source,
      severity: item.rank === 1 ? "high" : "medium"
    }));

    (prediction?.risks || []).slice(0, 2).forEach(item => items.push({
      title: item.title,
      detail: item.detail,
      source: "Desempenho",
      severity: "medium"
    }));

    (learning?.topics || []).slice(0, 2).forEach(item => {
      if (item.pattern.key === "advance") return;
      items.push({
        title: item.title,
        detail: `${item.pattern.label}. Método sugerido: ${item.method.label}.`,
        source: "Aprendizagem",
        severity: item.priority >= 70 ? "high" : "medium",
        topicId: item.topicId
      });
    });

    const unique = new Map();
    items.forEach(item => {
      const key = `${item.source}:${item.title}`;
      if (!unique.has(key)) unique.set(key, item);
    });

    return [...unique.values()].slice(0, 6);
  },

  supportActions() {
    const coach = ONC.DailyCoachEngine?.brief?.();
    const consistency = ONC.ConsistencyCoach?.current?.();
    const fatigue = ONC.CognitiveFatigueCoach?.current?.();
    const actions = [];

    if (coach?.plan?.[0]) {
      actions.push({
        title: "Perguntar sobre a primeira tarefa do dia",
        detail: `${coach.plan[0].title}, estimada em ${coach.plan[0].minutes} minutos.`,
        do: "Evite cobrar todo o plano; ajude o estudante a iniciar apenas a primeira ação."
      });
    }

    if (consistency?.plan?.targetDays) {
      actions.push({
        title: "Proteger a regularidade",
        detail: `Meta atual: ${consistency.plan.targetDays} dias ativos na semana.`,
        do: "Combine horários curtos e previsíveis, sem transformar o estudo em punição."
      });
    }

    if (fatigue?.recommendation?.mode === "pause" ||
        fatigue?.recommendation?.mode === "light") {
      actions.push({
        title: "Respeitar a redução de carga",
        detail: fatigue.recommendation.message,
        do: "Priorize pausa ou revisão leve, em vez de insistir em mais questões."
      });
    }

    actions.push({
      title: "Elogiar o processo com precisão",
      detail: "Use dados concretos, como dias ativos, revisões concluídas ou evolução em uma disciplina.",
      do: "Evite comparar com outros alunos ou usar medalha como única medida de sucesso."
    });

    return actions.slice(0, 4);
  },

  weeklyNarrative(snapshot) {
    const week = snapshot.week;
    const prediction = snapshot.prediction;

    if (!week.activeDays && !week.questions) {
      return "Ainda há poucos dados nesta semana. O melhor apoio é facilitar uma sessão curta e tranquila.";
    }

    const parts = [
      `${snapshot.student} esteve ativo em ${week.activeDays} dia${week.activeDays === 1 ? "" : "s"}`,
      `respondeu ${week.questions} questão${week.questions === 1 ? "" : "ões"}`
    ];

    if (week.questions) parts.push(`com ${week.accuracy}% de precisão`);
    if (prediction.confidence.label !== "Baixa") {
      parts.push(`e apresenta estimativa interna central de ${prediction.point}%`);
    }

    return parts.join(", ") + ".";
  },

  calculate() {
    const advanced = ONC.AdvancedAnalytics?.guardianSummary?.() || {};
    const behavioral = ONC.BehavioralDashboardEngine?.current?.() || {};
    const prediction = ONC.PerformancePredictionEngine?.current?.() || {};
    const learning = ONC.LearningCoach?.current?.() || {};
    const habit = ONC.StudyHabitEngine?.current?.() || {};

    const snapshot = {
      generatedAt: new Date().toISOString(),
      student: this.studentName(),
      week: {
        minutes: advanced.week?.minutes || 0,
        questions: advanced.week?.questions || 0,
        accuracy: advanced.week?.accuracy || 0,
        activeDays: advanced.week?.activeDays || habit.profile?.active7 || 0
      },
      overview: {
        mastery: advanced.overview?.averageMastery || 0,
        memory: advanced.overview?.averageMemory || 0,
        preparation: advanced.overview?.preparation || prediction.point || 0,
        coverage: prediction.learning?.coverage || 0
      },
      prediction: {
        point: prediction.point || 0,
        lower: prediction.lower || 0,
        upper: prediction.upper || 0,
        confidence: prediction.confidence || { label: "Baixa", score: 0 },
        disclaimer: prediction.disclaimer || ""
      },
      behavioral: {
        score: behavioral.score || 0,
        label: behavioral.level?.label || "Dados insuficientes",
        confidence: behavioral.confidence || { label: "Baixa", score: 0 }
      },
      learning: {
        headline: learning.profile?.headline || "Perfil ainda em observação",
        confidence: learning.confidence || { label: "Baixa", score: 0 },
        nextMethod: learning.bestNextMethod?.label || null
      },
      strengths: this.strengths(),
      attention: this.attentionPoints(),
      support: this.supportActions(),
      disclaimer: "Este painel resume dados locais da plataforma. Não substitui avaliação escolar, pedagógica, psicológica ou médica e não deve ser usado para rotular ou punir o estudante."
    };

    snapshot.narrative = this.weeklyNarrative(snapshot);
    return snapshot;
  },

  refresh(trigger = "manual") {
    const snapshot = { ...this.calculate(), trigger };
    this.state.lastSnapshot = snapshot;
    this.state.history.push({
      generatedAt: snapshot.generatedAt,
      activeDays: snapshot.week.activeDays,
      accuracy: snapshot.week.accuracy,
      behavioralScore: snapshot.behavioral.score,
      trigger
    });
    this.save();
    return snapshot;
  },

  current() {
    return this.state.lastSnapshot || this.refresh("missing");
  },

  openAttention(index = 0) {
    const item = this.current().attention[index];
    if (!item) return false;
    if (item.topicId) return ONC.SmartNavigator?.goToWeakness?.(item.topicId);
    ONC.Notifications?.announce?.(item.detail);
    return true;
  },

  exportText() {
    const snapshot = this.current();

    return [
      "ESTUDE ONC — PAINEL DO RESPONSÁVEL",
      `Estudante: ${snapshot.student}`,
      `Atualizado: ${new Date(snapshot.generatedAt).toLocaleString("pt-BR")}`,
      "",
      "RESUMO DA SEMANA",
      snapshot.narrative,
      `Tempo registrado: ${snapshot.week.minutes} min`,
      `Questões: ${snapshot.week.questions}`,
      `Precisão: ${snapshot.week.accuracy}%`,
      `Dias ativos: ${snapshot.week.activeDays}`,
      "",
      "INDICADORES",
      `Domínio médio: ${snapshot.overview.mastery}%`,
      `Memória média: ${snapshot.overview.memory}%`,
      `Cobertura: ${snapshot.overview.coverage}%`,
      `Estimativa interna: ${snapshot.prediction.point}% (${snapshot.prediction.lower}–${snapshot.prediction.upper}%)`,
      `Confiança da estimativa: ${snapshot.prediction.confidence.label}`,
      `Rotina: ${snapshot.behavioral.label} (${snapshot.behavioral.score}/100)`,
      "",
      "PONTOS POSITIVOS",
      ...(snapshot.strengths.length
        ? snapshot.strengths.map(item => `- ${item.title}: ${item.detail}`)
        : ["- Ainda não há evidência suficiente."]),
      "",
      "PONTOS DE ATENÇÃO",
      ...(snapshot.attention.length
        ? snapshot.attention.map(item => `- ${item.title}: ${item.detail}`)
        : ["- Nenhum ponto relevante identificado."]),
      "",
      "COMO APOIAR",
      ...snapshot.support.map(item => `- ${item.title}: ${item.do}`),
      "",
      snapshot.disclaimer
    ].join("\n");
  },

  downloadText() {
    const date = new Date().toISOString().slice(0, 10);
    ONC.DataPortability.download(
      `estude-onc-painel-responsavel-${date}.txt`,
      this.exportText(),
      "text/plain;charset=utf-8"
    );
    ONC.Notifications?.announce?.("Resumo do responsável baixado.");
  },

  print() {
    document.body.classList.add("printingGuardianDashboard");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("printingGuardianDashboard");
    }, 300);
  }
};
