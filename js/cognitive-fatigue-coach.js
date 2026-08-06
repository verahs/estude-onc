window.ONC = window.ONC || {};

ONC.CognitiveFatigueCoach = {
  state: {
    lastAnalysis: null,
    history: [],
    pauses: [],
    version: 1
  },

  init() {
    this.load();
    this.refresh("startup");
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_cognitive_fatigue_${current}`;
  },

  load() {
    this.state = {
      lastAnalysis: null,
      history: [],
      pauses: [],
      version: 1,
      ...ONC.Storage.get(this.storageKey(), {})
    };
  },

  save() {
    this.state.history = this.state.history.slice(-180);
    this.state.pauses = this.state.pauses.slice(-100);
    ONC.Storage.set(this.storageKey(), this.state);
  },

  recentLearningEvents(limit = 24) {
    return (ONC.LearningEngine?.state?.events || [])
      .slice(-limit)
      .filter(event => event.timestamp);
  },

  recentSessionSeconds(hours = 4) {
    const threshold = Date.now() - hours * 3600000;
    const values = [];

    (ONC.StudyHistory?.state?.sessions || []).forEach(session => {
      const timestamp = session.timestamp || (session.date ? `${session.date}T12:00:00` : null);
      if (!timestamp || new Date(timestamp).getTime() < threshold) return;
      values.push(Number(session.seconds || 0));
    });

    (ONC.NavigationHistory?.state?.events || [])
      .filter(event =>
        ["complete", "pause"].includes(event.type) &&
        new Date(event.timestamp).getTime() >= threshold
      )
      .forEach(event => values.push(Number(event.durationSeconds || 0)));

    return values.filter(value => value > 0);
  },

  performanceWindows(events) {
    if (!events.length) {
      return {
        firstAccuracy: null,
        lastAccuracy: null,
        accuracyDrop: 0,
        firstTime: null,
        lastTime: null,
        timeIncrease: 0,
        quickErrors: 0,
        consecutiveErrors: 0
      };
    }

    const split = Math.max(2, Math.floor(events.length / 2));
    const first = events.slice(0, split);
    const last = events.slice(-split);

    const accuracy = list =>
      list.length
        ? list.filter(event => event.correct).length / list.length * 100
        : 0;

    const avgTime = list => {
      const times = list
        .map(event => Number(event.responseTimeMs || 0))
        .filter(value => value > 0);
      return times.length
        ? times.reduce((sum, value) => sum + value, 0) / times.length
        : null;
    };

    const firstAccuracy = Math.round(accuracy(first));
    const lastAccuracy = Math.round(accuracy(last));
    const firstTime = avgTime(first);
    const lastTime = avgTime(last);

    let consecutiveErrors = 0;
    for (let index = events.length - 1; index >= 0; index -= 1) {
      if (events[index].correct) break;
      consecutiveErrors += 1;
    }

    return {
      firstAccuracy,
      lastAccuracy,
      accuracyDrop: Math.max(0, firstAccuracy - lastAccuracy),
      firstTime: firstTime ? Math.round(firstTime) : null,
      lastTime: lastTime ? Math.round(lastTime) : null,
      timeIncrease: firstTime && lastTime
        ? Math.max(0, Math.round((lastTime - firstTime) / firstTime * 100))
        : 0,
      quickErrors: last.filter(event =>
        !event.correct &&
        Number(event.responseTimeMs || 0) > 0 &&
        Number(event.responseTimeMs || 0) < 9000
      ).length,
      consecutiveErrors
    };
  },

  workload() {
    const durations = this.recentSessionSeconds(4);
    const totalSeconds = durations.reduce((sum, value) => sum + value, 0);
    const longest = durations.length ? Math.max(...durations) : 0;

    return {
      sessions: durations.length,
      totalMinutes: Math.round(totalSeconds / 60),
      longestMinutes: Math.round(longest / 60),
      prolonged: totalSeconds >= 45 * 60 || longest >= 30 * 60
    };
  },

  switching() {
    const events = (ONC.NavigationHistory?.state?.events || [])
      .filter(event =>
        event.type === "open" &&
        Date.now() - new Date(event.timestamp).getTime() <= 2 * 3600000
      )
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let rapidSwitches = 0;
    for (let index = 1; index < events.length; index += 1) {
      const gap = (new Date(events[index].timestamp) - new Date(events[index - 1].timestamp)) / 60000;
      if (gap <= 4 && events[index].topicId !== events[index - 1].topicId) {
        rapidSwitches += 1;
      }
    }

    return {
      opens: events.length,
      rapidSwitches,
      elevated: rapidSwitches >= 3
    };
  },

  lateHour() {
    const hour = new Date().getHours();
    return {
      hour,
      late: hour >= 22 || hour < 6
    };
  },

  evidenceStrength(events, workload) {
    const observations = events.length + workload.sessions;
    if (observations >= 18) return { label: "Média-alta", score: 80 };
    if (observations >= 10) return { label: "Média", score: 60 };
    if (observations >= 5) return { label: "Baixa-média", score: 40 };
    return { label: "Baixa", score: 20 };
  },

  scoreComponents(windows, workload, switching, lateHour) {
    const components = {
      accuracyDrop: Math.min(100, windows.accuracyDrop * 4),
      responseSlowdown: Math.min(100, windows.timeIncrease * 1.4),
      quickErrors: Math.min(100, windows.quickErrors * 28),
      consecutiveErrors: Math.min(100, windows.consecutiveErrors * 24),
      workload: workload.prolonged
        ? Math.min(100, workload.totalMinutes * 1.5)
        : Math.min(60, workload.totalMinutes),
      switching: switching.elevated
        ? Math.min(100, switching.rapidSwitches * 22)
        : Math.min(50, switching.rapidSwitches * 12),
      lateHour: lateHour.late ? 55 : 0
    };

    const score = Math.round(
      components.accuracyDrop * 0.24 +
      components.responseSlowdown * 0.16 +
      components.quickErrors * 0.14 +
      components.consecutiveErrors * 0.16 +
      components.workload * 0.18 +
      components.switching * 0.07 +
      components.lateHour * 0.05
    );

    return {
      score: Math.max(0, Math.min(100, score)),
      components
    };
  },

  signals(windows, workload, switching, lateHour) {
    const signals = [];

    if (windows.accuracyDrop >= 15) {
      signals.push({
        severity: windows.accuracyDrop >= 30 ? "high" : "medium",
        title: "Queda de precisão durante a sequência",
        evidence: `A precisão passou de ${windows.firstAccuracy}% para ${windows.lastAccuracy}%.`,
        action: "Interrompa a sequência e faça uma pausa curta antes de continuar."
      });
    }

    if (windows.timeIncrease >= 30) {
      signals.push({
        severity: "medium",
        title: "Respostas ficando mais lentas",
        evidence: `O tempo médio aumentou ${windows.timeIncrease}% entre o início e o final.`,
        action: "Alterne para leitura leve ou encerre a sessão."
      });
    }

    if (windows.consecutiveErrors >= 3) {
      signals.push({
        severity: "high",
        title: "Erros consecutivos",
        evidence: `${windows.consecutiveErrors} respostas incorretas em sequência.`,
        action: "Não insista no mesmo formato agora; revise o conceito ou faça uma pausa."
      });
    }

    if (windows.quickErrors >= 2) {
      signals.push({
        severity: "medium",
        title: "Erros rápidos no trecho final",
        evidence: `${windows.quickErrors} erros ocorreram em menos de 9 segundos.`,
        action: "Reduza o ritmo e releia o comando antes de responder."
      });
    }

    if (workload.prolonged) {
      signals.push({
        severity: "medium",
        title: "Carga recente prolongada",
        evidence: `${workload.totalMinutes} minutos registrados nas últimas 4 horas.`,
        action: "Faça uma pausa de 5 a 10 minutos sem tela."
      });
    }

    if (switching.elevated) {
      signals.push({
        severity: "medium",
        title: "Trocas frequentes entre tópicos",
        evidence: `${switching.rapidSwitches} trocas rápidas nas últimas 2 horas.`,
        action: "Use o modo foco ou encerre a sessão atual."
      });
    }

    if (lateHour.late) {
      signals.push({
        severity: "neutral",
        title: "Estudo em horário tardio",
        evidence: `Atividade registrada por volta de ${String(lateHour.hour).padStart(2, "0")}h.`,
        action: "Prefira revisão leve e evite iniciar conteúdo complexo."
      });
    }

    if (!signals.length) {
      signals.push({
        severity: "positive",
        title: "Sem sinal forte de fadiga operacional",
        evidence: "O desempenho e o ritmo recente permanecem estáveis.",
        action: "Mantenha pausas regulares e encerre antes de queda acentuada."
      });
    }

    return signals.slice(0, 6);
  },

  recommendation(score, signals) {
    if (score >= 70) {
      return {
        level: "Pausa recomendada agora",
        mode: "pause",
        minutes: 10,
        message: "A combinação de queda de desempenho e carga recente indica que continuar pode reduzir a qualidade do estudo."
      };
    }

    if (score >= 45) {
      return {
        level: "Reduzir a carga",
        mode: "light",
        minutes: 5,
        message: "Troque questões difíceis por revisão leve ou faça uma pausa curta."
      };
    }

    if (score >= 25) {
      return {
        level: "Atenção ao ritmo",
        mode: "careful",
        minutes: 3,
        message: "Conclua apenas a tarefa atual e reavalie antes de iniciar outra."
      };
    }

    return {
      level: "Ritmo estável",
      mode: "continue",
      minutes: 0,
      message: "Não há evidência suficiente para recomendar interrupção."
    };
  },

  recoveryAction(recommendation) {
    if (recommendation.mode === "pause") {
      return {
        type: "pause",
        title: "Pausa sem tela",
        detail: "Levante, beba água e descanse os olhos por 10 minutos."
      };
    }

    if (recommendation.mode === "light") {
      const nextReview = ONC.LearningAnalyticsEngine?.nextReview?.();
      return nextReview
        ? {
            type: "review",
            topicId: nextReview.id,
            title: `Revisão leve: ${nextReview.title}`,
            detail: "Leia o resumo sem iniciar uma bateria de questões."
          }
        : {
            type: "pause",
            title: "Pausa curta",
            detail: "Interrompa por 5 minutos antes de retomar."
          };
    }

    if (recommendation.mode === "careful") {
      return {
        type: "finish-current",
        title: "Concluir apenas a tarefa atual",
        detail: "Não adicione uma nova atividade à sessão."
      };
    }

    return {
      type: "continue",
      title: "Continuar com limite",
      detail: "Faça mais uma atividade curta e reavalie o painel."
    };
  },

  calculate() {
    const events = this.recentLearningEvents(24);
    const windows = this.performanceWindows(events);
    const workload = this.workload();
    const switching = this.switching();
    const lateHour = this.lateHour();
    const result = this.scoreComponents(windows, workload, switching, lateHour);
    const recommendation = this.recommendation(result.score);
    const confidence = this.evidenceStrength(events, workload);

    return {
      generatedAt: new Date().toISOString(),
      score: result.score,
      components: result.components,
      confidence,
      windows,
      workload,
      switching,
      lateHour,
      signals: this.signals(windows, workload, switching, lateHour),
      recommendation,
      recovery: this.recoveryAction(recommendation),
      disclaimer: "O Coach identifica sinais operacionais de queda de desempenho e carga prolongada. Não diagnostica fadiga, condição médica, transtorno do sono ou estado psicológico."
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
      mode: analysis.recommendation.mode,
      trigger
    });
    this.save();
    return analysis;
  },

  current() {
    return this.state.lastAnalysis || this.refresh("missing");
  },

  startRecovery() {
    const analysis = this.current();
    const recovery = analysis.recovery;

    this.state.pauses.push({
      timestamp: new Date().toISOString(),
      score: analysis.score,
      recovery
    });
    this.save();

    if (recovery.type === "pause") {
      ONC.CognitiveFatigueUI?.startPauseTimer?.(analysis.recommendation.minutes || 5);
      return true;
    }

    if (recovery.type === "review" && recovery.topicId) {
      return ONC.SmartNavigator?.goToTopic?.(recovery.topicId, {
        source: "fatigue-coach",
        reason: "O Coach recomendou uma atividade de menor carga cognitiva.",
        focus: true
      });
    }

    ONC.Notifications?.announce?.(recovery.detail);
    return true;
  }
};
