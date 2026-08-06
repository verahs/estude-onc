window.ONC = window.ONC || {};

ONC.BehavioralDashboardEngine = {
  state: {
    lastSnapshot: null,
    history: [],
    version: 1
  },

  init() {
    this.load();
    this.refresh("startup");
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_behavioral_dashboard_${current}`;
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

  normalizedHealth() {
    const habit = ONC.StudyHabitEngine?.current?.();
    const procrastination = ONC.ProcrastinationDetector?.current?.();
    const consistency = ONC.ConsistencyCoach?.current?.();
    const fatigue = ONC.CognitiveFatigueCoach?.current?.();

    return {
      habit: Number(habit?.profile?.consistency || 0),
      procrastination: 100 - Number(procrastination?.score || 0),
      consistency: Number(consistency?.score || 0),
      fatigue: 100 - Number(fatigue?.score || 0)
    };
  },

  overallScore(health) {
    return Math.round(
      health.habit * 0.25 +
      health.procrastination * 0.25 +
      health.consistency * 0.30 +
      health.fatigue * 0.20
    );
  },

  level(score) {
    if (score >= 80) return {
      label: "Rotina estável",
      tone: "positive",
      message: "A distribuição recente favorece continuidade e recuperação."
    };
    if (score >= 60) return {
      label: "Rotina em consolidação",
      tone: "neutral",
      message: "A base está adequada, mas ainda existem ajustes pontuais."
    };
    if (score >= 40) return {
      label: "Rotina irregular",
      tone: "attention",
      message: "Há sinais operacionais que podem reduzir a qualidade das sessões."
    };
    return {
      label: "Rotina fragilizada",
      tone: "high",
      message: "Priorize ações pequenas, conclusão e redução de carga."
    };
  },

  collectSignals() {
    const signals = [];

    const habit = ONC.StudyHabitEngine?.current?.();
    (habit?.signals || []).forEach(item => signals.push({
      source: "Hábitos",
      title: item.title,
      detail: item.message,
      action: item.message,
      severity: item.level === "positive" ? "positive" :
        item.level === "attention" ? "medium" : "neutral"
    }));

    const procrastination = ONC.ProcrastinationDetector?.current?.();
    (procrastination?.signals || []).forEach(item => signals.push({
      source: "Adiamento",
      title: item.title,
      detail: item.evidence,
      action: item.intervention,
      severity: item.severity
    }));

    const consistency = ONC.ConsistencyCoach?.current?.();
    (consistency?.signals || []).forEach(item => signals.push({
      source: "Consistência",
      title: item.title,
      detail: item.detail,
      action: item.action,
      severity: item.severity
    }));

    const fatigue = ONC.CognitiveFatigueCoach?.current?.();
    (fatigue?.signals || []).forEach(item => signals.push({
      source: "Carga cognitiva",
      title: item.title,
      detail: item.evidence,
      action: item.action,
      severity: item.severity
    }));

    const severityWeight = { high: 4, medium: 3, attention: 3, neutral: 2, positive: 1 };
    return signals
      .sort((a, b) =>
        (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0)
      )
      .slice(0, 10);
  },

  priorities(signals) {
    const actionable = signals.filter(item => item.severity !== "positive");
    const selected = actionable.slice(0, 3);

    if (!selected.length) {
      return [{
        rank: 1,
        title: "Manter o ritmo atual",
        action: "Preserve sessões distribuídas e conclua as tarefas iniciadas.",
        source: "Síntese"
      }];
    }

    return selected.map((item, index) => ({
      rank: index + 1,
      title: item.title,
      action: item.action,
      source: item.source
    }));
  },

  strengths(signals) {
    return signals
      .filter(item => item.severity === "positive")
      .slice(0, 3)
      .map(item => ({
        title: item.title,
        detail: item.detail,
        source: item.source
      }));
  },

  confidence() {
    const values = [
      ONC.ProcrastinationDetector?.current?.()?.confidence?.score,
      ONC.CognitiveFatigueCoach?.current?.()?.confidence?.score,
      Math.min(100, (ONC.StudyHabitEngine?.current?.()?.evidence?.totalEvents || 0) * 4)
    ].filter(value => Number.isFinite(Number(value)));

    const score = values.length
      ? Math.round(values.reduce((sum, value) => sum + Number(value), 0) / values.length)
      : 0;

    return {
      score,
      label: score >= 70 ? "Média-alta" : score >= 45 ? "Média" : "Baixa"
    };
  },

  trend() {
    const history = this.state.history.slice(-6);
    if (history.length < 2) return {
      direction: "insufficient",
      delta: 0,
      label: "Histórico ainda insuficiente"
    };

    const first = history[0].score;
    const last = history.at(-1).score;
    const delta = last - first;

    if (delta >= 6) return { direction: "up", delta, label: `Melhora de ${delta} pontos` };
    if (delta <= -6) return { direction: "down", delta, label: `Queda de ${Math.abs(delta)} pontos` };
    return { direction: "stable", delta, label: "Estável no período recente" };
  },

  weeklySummary() {
    const habit = ONC.StudyHabitEngine?.current?.();
    const consistency = ONC.ConsistencyCoach?.current?.();
    const procrastination = ONC.ProcrastinationDetector?.current?.();
    const fatigue = ONC.CognitiveFatigueCoach?.current?.();

    return {
      activeDays: habit?.profile?.active7 || 0,
      streak: habit?.profile?.streak || 0,
      sessionAverage: habit?.profile?.sessions?.averageMinutes || 0,
      disciplineBalance: consistency?.balance || 0,
      pendingTasks: procrastination?.metrics?.mission?.pending || 0,
      overdueReviews: procrastination?.metrics?.overdue?.length || 0,
      fatigueScore: fatigue?.score || 0
    };
  },

  calculate() {
    const health = this.normalizedHealth();
    const score = this.overallScore(health);
    const signals = this.collectSignals();

    return {
      generatedAt: new Date().toISOString(),
      score,
      level: this.level(score),
      health,
      confidence: this.confidence(),
      trend: this.trend(),
      signals,
      priorities: this.priorities(signals),
      strengths: this.strengths(signals),
      weekly: this.weeklySummary(),
      disclaimer: "O painel consolida padrões operacionais de uso da plataforma. Não avalia personalidade, motivação, saúde mental, condição médica ou qualidade familiar."
    };
  },

  refresh(trigger = "manual") {
    const snapshot = {
      ...this.calculate(),
      trigger
    };

    this.state.lastSnapshot = snapshot;
    this.state.history.push({
      generatedAt: snapshot.generatedAt,
      score: snapshot.score,
      trigger
    });
    this.save();
    return snapshot;
  },

  current() {
    return this.state.lastSnapshot || this.refresh("missing");
  },

  refreshAll() {
    ONC.StudyHabitEngine?.refresh?.("behavioral-dashboard");
    ONC.ProcrastinationDetector?.refresh?.("behavioral-dashboard");
    ONC.ConsistencyCoach?.refresh?.("behavioral-dashboard");
    ONC.CognitiveFatigueCoach?.refresh?.("behavioral-dashboard");
    const snapshot = this.refresh("refresh-all");
    ONC.BehavioralDashboardUI?.render?.();
    ONC.BehavioralDashboardUI?.renderReport?.();
    return snapshot;
  },

  executePriority(index = 0) {
    const priority = this.current().priorities[index];
    if (!priority) return false;

    const procrastination = ONC.ProcrastinationDetector?.current?.();
    const fatigue = ONC.CognitiveFatigueCoach?.current?.();

    if (priority.source === "Adiamento") {
      return ONC.ProcrastinationDetector?.startSmallestAction?.();
    }

    if (priority.source === "Carga cognitiva") {
      return ONC.CognitiveFatigueCoach?.startRecovery?.();
    }

    if (priority.source === "Consistência") {
      const discipline = ONC.ConsistencyCoach?.current?.()?.plan?.actions
        ?.find(item => item.discipline)?.discipline;
      if (discipline) return ONC.ConsistencyCoach.openDiscipline(discipline);
    }

    ONC.Notifications?.announce?.(priority.action);
    return true;
  }
};
