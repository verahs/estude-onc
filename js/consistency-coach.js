window.ONC = window.ONC || {};

ONC.ConsistencyCoach = {
  state: { lastAnalysis: null, history: [], version: 1 },

  init() {
    this.load();
    this.refresh("startup");
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_consistency_coach_${current}`;
  },

  load() {
    this.state = {
      lastAnalysis: null,
      history: [],
      version: 1,
      ...ONC.Storage.get(this.storageKey(), {})
    };
  },

  save() {
    this.state.history = this.state.history.slice(-180);
    ONC.Storage.set(this.storageKey(), this.state);
  },

  habit() {
    return ONC.StudyHabitEngine?.current?.() || {
      profile: {
        active7: 0,
        active14: 0,
        active30: 0,
        consistency: 0,
        streak: 0,
        preferred: { label: "sem padrão" },
        sessions: { averageMinutes: 0 }
      },
      days: [],
      weeklyPattern: []
    };
  },

  disciplineLoad(days = 14) {
    const limit = Date.now() - days * 86400000;
    const map = new Map();

    (ONC.StudyHistory?.state?.topicEvents || []).forEach(event => {
      if (new Date(event.timestamp).getTime() < limit || !event.discipline) return;
      map.set(event.discipline, (map.get(event.discipline) || 0) + 1);
    });

    (ONC.StudyHistory?.state?.questionAttempts || []).forEach(event => {
      if (new Date(event.timestamp).getTime() < limit || !event.subject) return;
      map.set(event.subject, (map.get(event.subject) || 0) + 1);
    });

    const subjects = ONC.LearningAnalyticsEngine?.subjects?.() || [];
    return subjects.map(subject => ({
      discipline: subject.name,
      events: map.get(subject.name) || 0,
      mastery: Number(subject.average || 0),
      coverage: Number(subject.coverage || 0)
    }));
  },

  balanceScore(load) {
    const values = load.map(item => item.events);
    const total = values.reduce((sum, value) => sum + value, 0);
    if (!total) return 0;

    const shares = values.map(value => value / total);
    const ideal = 1 / Math.max(1, values.length);
    const deviation = shares.reduce((sum, share) => sum + Math.abs(share - ideal), 0) / 2;
    return Math.round(Math.max(0, 100 - deviation * 125));
  },

  weeklyTarget(profile) {
    if (profile.active7 >= 5) return 5;
    if (profile.active7 >= 3) return 4;
    return 3;
  },

  overloadRisk(habit) {
    const recent = habit.days?.slice(-7) || [];
    const active = recent.filter(day => day.active);
    const loads = active.map(day => day.events);
    const total = loads.reduce((sum, value) => sum + value, 0);
    const max = loads.length ? Math.max(...loads) : 0;

    return {
      concentrated: total >= 8 && max / total >= 0.60,
      peakShare: total ? Math.round(max / total * 100) : 0,
      activeDays: active.length
    };
  },

  calculateScore(profile, balance, overload) {
    const frequency = Math.min(100, profile.active7 / 4 * 100);
    const spacing = Number(profile.consistency || 0);
    const streak = Math.min(100, Number(profile.streak || 0) / 5 * 100);
    const loadBalance = overload.concentrated ? 40 : 85;

    return Math.round(
      frequency * 0.35 +
      spacing * 0.30 +
      balance * 0.20 +
      streak * 0.10 +
      loadBalance * 0.05
    );
  },

  signals(profile, load, balance, overload) {
    const signals = [];
    const totalEvents = load.reduce((sum, item) => sum + item.events, 0);
    const sorted = [...load].sort((a, b) => b.events - a.events);
    const most = sorted[0];
    const least = [...load].sort((a, b) => a.events - b.events)[0];

    if (profile.active7 < 3) {
      signals.push({
        severity: "attention",
        title: "Frequência abaixo do mínimo recomendado",
        detail: `${profile.active7} dia${profile.active7 === 1 ? "" : "s"} ativo${profile.active7 === 1 ? "" : "s"} nos últimos 7 dias.`,
        action: "Distribua três sessões curtas ao longo da semana."
      });
    } else {
      signals.push({
        severity: "positive",
        title: "Frequência semanal adequada",
        detail: `${profile.active7} dias ativos nos últimos 7 dias.`,
        action: "Preserve o intervalo entre as sessões."
      });
    }

    if (overload.concentrated) {
      signals.push({
        severity: "attention",
        title: "Carga concentrada em um único dia",
        detail: `${overload.peakShare}% das atividades da semana ficaram no dia mais carregado.`,
        action: "Transfira parte da carga para outro dia."
      });
    }

    if (totalEvents >= 5 && balance < 55 && most && least) {
      signals.push({
        severity: "attention",
        title: "Distribuição desigual entre disciplinas",
        detail: `${most.discipline} recebeu mais atenção; ${least.discipline} recebeu menos.`,
        action: `Inclua uma atividade curta de ${least.discipline}.`
      });
    }

    if ((profile.sessions?.averageMinutes || 0) > 25) {
      signals.push({
        severity: "neutral",
        title: "Sessões médias extensas",
        detail: `Média de ${profile.sessions.averageMinutes} minutos por sessão.`,
        action: "Divida sessões longas em blocos menores."
      });
    }

    if (profile.streak >= 4) {
      signals.push({
        severity: "positive",
        title: "Sequência consistente em andamento",
        detail: `${profile.streak} dias consecutivos com atividade.`,
        action: "Mantenha uma atividade curta para preservar a sequência."
      });
    }

    return signals.slice(0, 5);
  },

  buildPlan(profile, load, overload) {
    const targetDays = this.weeklyTarget(profile);
    const missingDays = Math.max(0, targetDays - profile.active7);
    const weakest = [...load].sort((a, b) => {
      const priorityA = a.events * 0.45 + a.mastery * 0.35 + a.coverage * 0.20;
      const priorityB = b.events * 0.45 + b.mastery * 0.35 + b.coverage * 0.20;
      return priorityA - priorityB;
    })[0];

    const actions = [];

    if (missingDays > 0) {
      actions.push({
        title: `Adicionar ${missingDays} dia${missingDays === 1 ? "" : "s"} de estudo`,
        detail: "Sessões de 5 a 10 minutos já contam para a distribuição semanal.",
        type: "schedule"
      });
    }

    if (weakest) {
      actions.push({
        title: `Reservar uma sessão para ${weakest.discipline}`,
        detail: `${weakest.events} atividade${weakest.events === 1 ? "" : "s"} recente${weakest.events === 1 ? "" : "s"} e ${weakest.mastery}% de domínio.`,
        type: "discipline",
        discipline: weakest.discipline
      });
    }

    if (overload.concentrated) {
      actions.push({
        title: "Redistribuir o dia mais carregado",
        detail: "Mova uma tarefa para o próximo dia disponível.",
        type: "redistribute"
      });
    }

    if (!actions.length) {
      actions.push({
        title: "Manter o ritmo atual",
        detail: "A distribuição recente está equilibrada.",
        type: "maintain"
      });
    }

    return {
      targetDays,
      missingDays,
      actions: actions.slice(0, 3)
    };
  },

  calculate() {
    const habit = this.habit();
    const profile = habit.profile;
    const load = this.disciplineLoad(14);
    const balance = this.balanceScore(load);
    const overload = this.overloadRisk(habit);
    const score = this.calculateScore(profile, balance, overload);
    const plan = this.buildPlan(profile, load, overload);

    return {
      generatedAt: new Date().toISOString(),
      score,
      label: score >= 75
        ? "Ritmo consistente"
        : score >= 50
          ? "Consistência em formação"
          : "Rotina precisa de ajuste",
      profile,
      balance,
      overload,
      load,
      plan,
      signals: this.signals(profile, load, balance, overload),
      disclaimer: "O Coach de Consistência descreve distribuição e regularidade do uso. Não avalia disciplina pessoal, motivação, personalidade ou saúde mental."
    };
  },

  refresh(trigger = "manual") {
    const analysis = { ...this.calculate(), trigger };
    this.state.lastAnalysis = analysis;
    this.state.history.push({
      generatedAt: analysis.generatedAt,
      score: analysis.score,
      active7: analysis.profile.active7,
      balance: analysis.balance,
      trigger
    });
    this.save();
    return analysis;
  },

  current() {
    return this.state.lastAnalysis || this.refresh("missing");
  },

  openDiscipline(discipline) {
    ONC.UI?.showSection?.("questionBankSection");
    const select = document.getElementById("bankSubject");
    if (select) {
      select.value = discipline;
      ONC.Questions?.render?.();
    }
  }
};
