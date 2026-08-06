window.ONC = window.ONC || {};

ONC.ProcrastinationDetector = {
  state: {
    lastAnalysis: null,
    history: [],
    interventions: [],
    version: 1
  },

  init() {
    this.load();
    this.refresh("startup");
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_procrastination_detector_${current}`;
  },

  load() {
    this.state = {
      lastAnalysis: null,
      history: [],
      interventions: [],
      version: 1,
      ...ONC.Storage.get(this.storageKey(), {})
    };
  },

  save() {
    this.state.history = this.state.history.slice(-180);
    this.state.interventions = this.state.interventions.slice(-200);
    ONC.Storage.set(this.storageKey(), this.state);
  },

  now() {
    return Date.now();
  },

  daysBetween(timestamp) {
    return Math.max(0, (this.now() - new Date(timestamp).getTime()) / 86400000);
  },

  recentNavigation(days = 14) {
    const limit = this.now() - days * 86400000;
    return (ONC.NavigationHistory?.state?.events || [])
      .filter(event => new Date(event.timestamp).getTime() >= limit);
  },

  recentStudyEvents(days = 14) {
    const limit = this.now() - days * 86400000;
    return [
      ...(ONC.StudyHistory?.state?.topicEvents || []),
      ...(ONC.StudyHistory?.state?.questionAttempts || []),
      ...(ONC.StudyHistory?.state?.quizResults || [])
    ].filter(event => new Date(event.timestamp).getTime() >= limit);
  },

  overdueReviews() {
    const topics = ONC.MasteryEngine?.topicIndex || [];
    return topics
      .map(topic => ({
        topic,
        memory: ONC.MemoryEngine?.status?.(topic.id)
      }))
      .filter(item => item.memory?.due && Number(item.memory.forget || 0) >= 45)
      .map(item => ({
        topicId: item.topic.id,
        title: item.topic.title,
        discipline: item.topic.discipline,
        forget: item.memory.forget,
        nextReview: item.memory.nextReview
      }))
      .sort((a, b) => b.forget - a.forget);
  },

  missionStatus() {
    const mission = ONC.MissionEngine?.mission;
    if (!mission?.tasks?.length) {
      return {
        total: 0,
        completed: 0,
        pending: 0,
        completionRate: 0,
        hoursSinceGenerated: 0,
        oldPending: []
      };
    }

    const generated = new Date(mission.generatedAt || Date.now()).getTime();
    const hoursSinceGenerated = Math.max(0, (this.now() - generated) / 3600000);
    const completed = mission.tasks.filter(task => task.completed).length;
    const pendingTasks = mission.tasks.filter(task => !task.completed);

    return {
      total: mission.tasks.length,
      completed,
      pending: pendingTasks.length,
      completionRate: Math.round(completed / mission.tasks.length * 100),
      hoursSinceGenerated: Math.round(hoursSinceGenerated),
      oldPending: hoursSinceGenerated >= 8 ? pendingTasks : []
    };
  },

  openCompletionPairs() {
    const events = this.recentNavigation(21);
    const opens = events.filter(event => event.type === "open");
    const completes = events.filter(event => event.type === "complete");
    const pauses = events.filter(event => event.type === "pause");

    const completionKeys = new Set(
      completes.map(event => `${event.topicId}:${event.source}`)
    );

    const abandoned = opens.filter(event =>
      !completionKeys.has(`${event.topicId}:${event.source}`)
    );

    const veryShortPauses = pauses.filter(event =>
      Number(event.durationSeconds || 0) > 0 &&
      Number(event.durationSeconds || 0) < 60
    );

    return {
      opens: opens.length,
      completes: completes.length,
      pauses: pauses.length,
      abandoned: abandoned.length,
      veryShortPauses: veryShortPauses.length,
      completionRate: opens.length
        ? Math.round(completes.length / opens.length * 100)
        : 0
    };
  },

  taskSwitching() {
    const opens = this.recentNavigation(7)
      .filter(event => event.type === "open")
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let rapidSwitches = 0;
    for (let index = 1; index < opens.length; index += 1) {
      const gapMinutes = (
        new Date(opens[index].timestamp) -
        new Date(opens[index - 1].timestamp)
      ) / 60000;

      if (
        gapMinutes <= 3 &&
        opens[index].topicId !== opens[index - 1].topicId
      ) {
        rapidSwitches += 1;
      }
    }

    return {
      opens: opens.length,
      rapidSwitches,
      rate: opens.length > 1
        ? Math.round(rapidSwitches / (opens.length - 1) * 100)
        : 0
    };
  },

  delayedStarts() {
    const habit = ONC.StudyHabitEngine?.current?.();
    const active7 = habit?.profile?.active7 || 0;
    const events = this.recentStudyEvents(7);
    const lastActivity = events.length
      ? Math.max(...events.map(event => new Date(event.timestamp).getTime()))
      : null;
    const daysInactive = lastActivity
      ? Math.floor((this.now() - lastActivity) / 86400000)
      : null;

    return {
      active7,
      events: events.length,
      daysInactive,
      lowStartFrequency: active7 <= 1 && events.length > 0
    };
  },

  evidenceStrength(metrics) {
    const observations =
      metrics.navigation.opens +
      metrics.study.events +
      metrics.mission.total +
      metrics.overdue.length;

    if (observations >= 25) return { label: "Média-alta", score: 80 };
    if (observations >= 12) return { label: "Média", score: 60 };
    if (observations >= 5) return { label: "Baixa-média", score: 40 };
    return { label: "Baixa", score: 20 };
  },

  calculateScore(metrics) {
    const components = {
      pendingMission: metrics.mission.total
        ? Math.min(100, metrics.mission.pending / metrics.mission.total * 100)
        : 0,
      overdueReview: Math.min(100, metrics.overdue.length * 12),
      abandonment: Math.min(100, metrics.navigation.abandoned * 18),
      shortExit: Math.min(100, metrics.navigation.veryShortPauses * 16),
      switching: Math.min(100, metrics.switching.rate),
      inactivity: metrics.start.daysInactive === null
        ? 0
        : Math.min(100, metrics.start.daysInactive * 18)
    };

    const score = Math.round(
      components.pendingMission * 0.22 +
      components.overdueReview * 0.20 +
      components.abandonment * 0.22 +
      components.shortExit * 0.13 +
      components.switching * 0.10 +
      components.inactivity * 0.13
    );

    return {
      score: Math.max(0, Math.min(100, score)),
      components
    };
  },

  signals(metrics, score) {
    const signals = [];

    if (metrics.mission.oldPending.length) {
      signals.push({
        key: "mission-delay",
        severity: "high",
        title: "Missão aberta há várias horas",
        evidence: `${metrics.mission.oldPending.length} tarefa${metrics.mission.oldPending.length === 1 ? "" : "s"} ainda pendente${metrics.mission.oldPending.length === 1 ? "" : "s"}.`,
        intervention: "Escolha apenas a menor tarefa e conclua antes de abrir outra."
      });
    }

    if (metrics.overdue.length >= 2) {
      signals.push({
        key: "review-avoidance",
        severity: metrics.overdue.length >= 5 ? "high" : "medium",
        title: "Revisões vencidas acumulando",
        evidence: `${metrics.overdue.length} conteúdos estão no período recomendado de revisão.`,
        intervention: "Faça uma revisão de 3 minutos do item com maior risco de esquecimento."
      });
    }

    if (metrics.navigation.abandoned >= 2) {
      signals.push({
        key: "opening-without-completion",
        severity: "medium",
        title: "Conteúdos abertos sem conclusão",
        evidence: `${metrics.navigation.abandoned} aberturas não tiveram conclusão registrada.`,
        intervention: "Reduza o objetivo: termine um único conteúdo antes de mudar de tela."
      });
    }

    if (metrics.navigation.veryShortPauses >= 2) {
      signals.push({
        key: "quick-exit",
        severity: "medium",
        title: "Saídas muito rápidas",
        evidence: `${metrics.navigation.veryShortPauses} sessões terminaram em menos de um minuto.`,
        intervention: "Use a regra dos 2 minutos: permaneça até concluir o primeiro bloco."
      });
    }

    if (metrics.switching.rapidSwitches >= 2) {
      signals.push({
        key: "task-switching",
        severity: "medium",
        title: "Trocas rápidas entre tópicos",
        evidence: `${metrics.switching.rapidSwitches} mudanças ocorreram em intervalos de até 3 minutos.`,
        intervention: "Ative o modo foco e conclua a tarefa atual antes de trocar."
      });
    }

    if (metrics.start.daysInactive !== null && metrics.start.daysInactive >= 3) {
      signals.push({
        key: "delayed-return",
        severity: metrics.start.daysInactive >= 7 ? "high" : "medium",
        title: "Retorno ao estudo adiado",
        evidence: `${metrics.start.daysInactive} dias sem atividade registrada.`,
        intervention: "Retome com 5 minutos, sem tentar compensar os dias anteriores."
      });
    }

    if (!signals.length && score.score < 25) {
      signals.push({
        key: "no-strong-signal",
        severity: "positive",
        title: "Sem sinal forte de adiamento",
        evidence: "O uso recente não mostra acúmulo relevante de tarefas ou abandonos.",
        intervention: "Mantenha metas pequenas e distribuídas."
      });
    }

    return signals.slice(0, 6);
  },

  interventionLevel(score) {
    if (score >= 70) {
      return {
        label: "Intervenção imediata",
        message: "Simplifique o plano para uma tarefa de até 5 minutos."
      };
    }
    if (score >= 45) {
      return {
        label: "Ajuste recomendado",
        message: "Reduza a quantidade de tarefas e use o modo foco."
      };
    }
    if (score >= 25) {
      return {
        label: "Atenção leve",
        message: "Monitore tarefas abertas e revisões pendentes."
      };
    }
    return {
      label: "Sem intervenção necessária",
      message: "Mantenha a rotina atual e conclua as atividades iniciadas."
    };
  },

  smallestNextAction(metrics) {
    const missionTask = metrics.mission.oldPending
      .sort((a, b) =>
        Number(a.estimatedMinutes || 99) - Number(b.estimatedMinutes || 99)
      )[0];

    if (missionTask) {
      return {
        type: "mission",
        id: missionTask.id,
        topicId: missionTask.topicId || null,
        title: missionTask.title,
        minutes: Number(missionTask.estimatedMinutes || 5),
        action: "Abrir a menor tarefa pendente"
      };
    }

    const review = metrics.overdue[0];
    if (review) {
      return {
        type: "review",
        topicId: review.topicId,
        title: `Revisar ${review.title}`,
        minutes: 3,
        action: "Fazer revisão curta"
      };
    }

    const recommendation = ONC.RecommendationEngine?.next?.();
    if (recommendation) {
      return {
        type: "topic",
        topicId: recommendation.topicId,
        title: recommendation.title,
        minutes: 5,
        action: "Começar por 5 minutos"
      };
    }

    return {
      type: "questions",
      topicId: null,
      title: "Responder uma questão",
      minutes: 3,
      action: "Iniciar atividade curta"
    };
  },

  calculate() {
    const metrics = {
      mission: this.missionStatus(),
      overdue: this.overdueReviews(),
      navigation: this.openCompletionPairs(),
      switching: this.taskSwitching(),
      start: this.delayedStarts(),
      study: {
        events: this.recentStudyEvents(14).length
      }
    };

    const score = this.calculateScore(metrics);
    const confidence = this.evidenceStrength(metrics);

    return {
      generatedAt: new Date().toISOString(),
      score: score.score,
      components: score.components,
      level: this.interventionLevel(score.score),
      confidence,
      signals: this.signals(metrics, score),
      nextAction: this.smallestNextAction(metrics),
      metrics,
      disclaimer: "O indicador descreve sinais operacionais de adiamento no uso da plataforma. Não diagnostica procrastinação, transtorno, motivação, personalidade ou saúde mental."
    };
  },

  refresh(trigger = "manual") {
    const analysis = {
      ...this.calculate(),
      trigger
    };

    this.state.lastAnalysis = analysis;
    this.state.history.push({
      generatedAt: analysis.generatedAt,
      score: analysis.score,
      confidence: analysis.confidence.label,
      signalCount: analysis.signals.length,
      trigger
    });
    this.save();
    return analysis;
  },

  current() {
    return this.state.lastAnalysis || this.refresh("missing");
  },

  startSmallestAction() {
    const action = this.current().nextAction;
    if (!action) return false;

    this.state.interventions.push({
      timestamp: new Date().toISOString(),
      action
    });
    this.save();

    if (action.type === "mission") {
      return ONC.MissionEngine?.openTask?.(action.id);
    }

    if (action.type === "review" && action.topicId) {
      return ONC.SmartNavigator?.goToRevision?.(action.topicId);
    }

    if (action.type === "topic" && action.topicId) {
      return ONC.SmartNavigator?.goToTopic?.(action.topicId, {
        source: "procrastination-detector",
        reason: "O sistema reduziu a tarefa para facilitar o início.",
        focus: true
      });
    }

    ONC.UI?.showSection?.("questionBankSection");
    return true;
  }
};
