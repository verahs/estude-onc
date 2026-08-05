window.ONC = window.ONC || {};

ONC.StudyHabitEngine = {
  state: {
    lastAnalysis: null,
    history: [],
    version: 1
  },

  init() {
    this.load();
    this.refresh("startup");
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_study_habits_${current}`;
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

  allEvents() {
    const events = [];

    (ONC.StudyHistory?.state?.topicEvents || []).forEach(item => {
      if (!item.timestamp) return;
      events.push({
        type: "topic",
        timestamp: item.timestamp,
        discipline: item.discipline || "",
        durationSeconds: Number(item.metadata?.durationSeconds || 0)
      });
    });

    (ONC.StudyHistory?.state?.questionAttempts || []).forEach(item => {
      if (!item.timestamp) return;
      events.push({
        type: "question",
        timestamp: item.timestamp,
        discipline: item.subject || "",
        durationSeconds: 0
      });
    });

    (ONC.StudyHistory?.state?.quizResults || []).forEach(item => {
      if (!item.timestamp) return;
      events.push({
        type: "quiz",
        timestamp: item.timestamp,
        discipline: item.subject || "",
        durationSeconds: Number(item.durationSeconds || 0)
      });
    });

    (ONC.StudyHistory?.state?.sessions || []).forEach(item => {
      const timestamp = item.timestamp || (item.date ? `${item.date}T12:00:00` : null);
      if (!timestamp) return;
      events.push({
        type: "session",
        timestamp,
        discipline: item.discipline || "",
        durationSeconds: Number(item.seconds || 0)
      });
    });

    (ONC.NavigationHistory?.state?.events || []).forEach(item => {
      if (!item.timestamp) return;
      events.push({
        type: `navigation-${item.type}`,
        timestamp: item.timestamp,
        discipline: "",
        durationSeconds: Number(item.durationSeconds || 0)
      });
    });

    return events
      .filter(item => Number.isFinite(new Date(item.timestamp).getTime()))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },

  dayKey(value) {
    const date = new Date(value);
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  },

  dateFromDayKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
  },

  aggregateDays(period = 30) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (period - 1));

    const map = new Map();
    for (let index = 0; index < period; index += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = this.dayKey(date);
      map.set(key, {
        date: key,
        label: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        events: 0,
        questions: 0,
        topics: 0,
        quizzes: 0,
        seconds: 0,
        hours: [],
        disciplines: new Set()
      });
    }

    this.allEvents().forEach(event => {
      const key = this.dayKey(event.timestamp);
      const day = map.get(key);
      if (!day) return;

      day.events += 1;
      day.seconds += Number(event.durationSeconds || 0);
      day.hours.push(new Date(event.timestamp).getHours());
      if (event.discipline) day.disciplines.add(event.discipline);
      if (event.type === "question") day.questions += 1;
      if (event.type === "topic") day.topics += 1;
      if (event.type === "quiz") day.quizzes += 1;
    });

    return [...map.values()].map(day => ({
      ...day,
      disciplines: [...day.disciplines],
      active: day.events > 0,
      minutes: Math.round(day.seconds / 60)
    }));
  },

  currentStreak(days) {
    const active = new Set(days.filter(day => day.active).map(day => day.date));
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    if (!active.has(this.dayKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;
    while (active.has(this.dayKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  },

  longestStreak(days) {
    let longest = 0;
    let current = 0;
    days.forEach(day => {
      if (day.active) {
        current += 1;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    });
    return longest;
  },

  preferredHours(events) {
    const counts = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
    events.forEach(event => {
      counts[new Date(event.timestamp).getHours()].count += 1;
    });

    const total = counts.reduce((sum, item) => sum + item.count, 0);
    const ranked = [...counts].sort((a, b) => b.count - a.count);
    const best = ranked[0];

    const dayparts = [
      { key: "morning", label: "manhã", start: 6, end: 12 },
      { key: "afternoon", label: "tarde", start: 12, end: 18 },
      { key: "evening", label: "noite", start: 18, end: 24 },
      { key: "dawn", label: "madrugada", start: 0, end: 6 }
    ].map(part => ({
      ...part,
      count: counts
        .filter(item => item.hour >= part.start && item.hour < part.end)
        .reduce((sum, item) => sum + item.count, 0)
    })).sort((a, b) => b.count - a.count);

    return {
      hour: best?.count ? best.hour : null,
      label: best?.count ? `${String(best.hour).padStart(2, "0")}h–${String((best.hour + 1) % 24).padStart(2, "0")}h` : "sem padrão",
      daypart: dayparts[0]?.count ? dayparts[0].label : "sem padrão",
      daypartCount: dayparts[0]?.count || 0,
      share: total && best?.count ? Math.round((best.count / total) * 100) : 0,
      distribution: counts
    };
  },

  sessionStats() {
    const durations = [
      ...(ONC.StudyHistory?.state?.sessions || []).map(item => Number(item.seconds || 0)),
      ...(ONC.NavigationHistory?.state?.events || [])
        .filter(item => ["complete", "pause"].includes(item.type))
        .map(item => Number(item.durationSeconds || 0))
    ].filter(value => value >= 20);

    if (!durations.length) {
      return {
        count: 0,
        averageMinutes: 0,
        medianMinutes: 0,
        shortShare: 0,
        longShare: 0
      };
    }

    const sorted = [...durations].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const median = sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;

    return {
      count: durations.length,
      averageMinutes: Math.round(
        durations.reduce((sum, value) => sum + value, 0) / durations.length / 60
      ),
      medianMinutes: Math.round(median / 60),
      shortShare: Math.round(
        durations.filter(value => value < 180).length / durations.length * 100
      ),
      longShare: Math.round(
        durations.filter(value => value > 1800).length / durations.length * 100
      )
    };
  },

  weeklyPattern(days) {
    const labels = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
    const values = labels.map((label, weekday) => ({
      weekday,
      label,
      activeDays: 0,
      events: 0,
      minutes: 0
    }));

    days.forEach(day => {
      const weekday = this.dateFromDayKey(day.date).getDay();
      values[weekday].events += day.events;
      values[weekday].minutes += day.minutes;
      if (day.active) values[weekday].activeDays += 1;
    });

    return values;
  },

  consistencyScore(days) {
    const last14 = days.slice(-14);
    const activeCount = last14.filter(day => day.active).length;
    const targetScore = Math.min(100, activeCount / 5 * 100);

    const activeDates = last14
      .filter(day => day.active)
      .map(day => this.dateFromDayKey(day.date).getTime());

    let spacingScore = 0;
    if (activeDates.length >= 2) {
      const gaps = [];
      for (let index = 1; index < activeDates.length; index += 1) {
        gaps.push((activeDates[index] - activeDates[index - 1]) / 86400000);
      }
      const averageGap = gaps.reduce((sum, value) => sum + value, 0) / gaps.length;
      const deviation = gaps.reduce((sum, value) => sum + Math.abs(value - averageGap), 0) / gaps.length;
      spacingScore = Math.max(0, 100 - deviation * 35);
    } else if (activeDates.length === 1) {
      spacingScore = 20;
    }

    const loadValues = last14.filter(day => day.active).map(day => day.events);
    let loadBalance = 0;
    if (loadValues.length) {
      const average = loadValues.reduce((sum, value) => sum + value, 0) / loadValues.length;
      const deviation = loadValues.reduce((sum, value) => sum + Math.abs(value - average), 0) / loadValues.length;
      loadBalance = Math.max(0, 100 - (deviation / Math.max(1, average)) * 55);
    }

    return Math.round(
      targetScore * 0.50 +
      spacingScore * 0.30 +
      loadBalance * 0.20
    );
  },

  habitProfile(days, events, sessions) {
    const active7 = days.slice(-7).filter(day => day.active).length;
    const active14 = days.slice(-14).filter(day => day.active).length;
    const active30 = days.filter(day => day.active).length;
    const streak = this.currentStreak(days);
    const longestStreak = this.longestStreak(days);
    const consistency = this.consistencyScore(days);
    const preferred = this.preferredHours(events);

    return {
      active7,
      active14,
      active30,
      streak,
      longestStreak,
      consistency,
      preferred,
      sessions,
      level: consistency >= 75
        ? "Hábito consistente"
        : consistency >= 50
          ? "Hábito em formação"
          : active30
            ? "Rotina irregular"
            : "Sem dados suficientes"
    };
  },

  signals(profile, days) {
    const signals = [];
    const recent7 = days.slice(-7);
    const active7 = profile.active7;

    if (profile.active30 === 0) {
      signals.push({
        key: "no-data",
        level: "neutral",
        title: "Ainda não há rotina observável",
        message: "Realize atividades em dias diferentes para que o sistema identifique padrões."
      });
      return signals;
    }

    if (active7 >= 4) {
      signals.push({
        key: "regularity",
        level: "positive",
        title: "Boa distribuição semanal",
        message: `Você esteve ativo em ${active7} dos últimos 7 dias.`
      });
    } else if (active7 <= 1) {
      signals.push({
        key: "low-frequency",
        level: "attention",
        title: "Frequência semanal baixa",
        message: "Sessões curtas em três dias diferentes seriam mais úteis do que concentrar tudo em um único dia."
      });
    }

    const eventLoads = recent7.filter(day => day.active).map(day => day.events);
    const total = eventLoads.reduce((sum, value) => sum + value, 0);
    const max = eventLoads.length ? Math.max(...eventLoads) : 0;
    if (total >= 6 && max / total >= 0.7) {
      signals.push({
        key: "concentration",
        level: "attention",
        title: "Atividade concentrada em um único dia",
        message: "Distribuir a carga reduz o intervalo entre recuperações da memória."
      });
    }

    if (profile.sessions.count >= 3 && profile.sessions.shortShare >= 70) {
      signals.push({
        key: "very-short",
        level: "neutral",
        title: "Predomínio de sessões muito curtas",
        message: "Sessões breves ajudam a começar, mas reserve ao menos uma sessão de 8 a 15 minutos para consolidação."
      });
    }

    if (profile.sessions.count >= 3 && profile.sessions.longShare >= 40) {
      signals.push({
        key: "long-sessions",
        level: "attention",
        title: "Sessões longas recorrentes",
        message: "Considere pausas e divisão em blocos menores para preservar a atenção."
      });
    }

    if (profile.preferred.hour !== null && profile.preferred.share >= 35) {
      signals.push({
        key: "preferred-time",
        level: "positive",
        title: `Horário mais frequente: ${profile.preferred.label}`,
        message: `A maior parte das atividades ocorre pela ${profile.preferred.daypart}.`
      });
    }

    return signals.slice(0, 5);
  },

  recommendations(profile, signals) {
    const recommendations = [];

    if (profile.active7 < 3) {
      recommendations.push({
        title: "Meta mínima de consistência",
        action: "Estudar 5 a 10 minutos em três dias da semana."
      });
    }
    if (profile.streak >= 3) {
      recommendations.push({
        title: "Preservar a sequência",
        action: "Faça ao menos uma atividade curta hoje para manter o ritmo."
      });
    }
    if (profile.preferred.hour !== null) {
      recommendations.push({
        title: "Usar o horário mais frequente",
        action: `Planeje a próxima sessão perto de ${profile.preferred.label}.`
      });
    }
    if (profile.sessions.averageMinutes > 25) {
      recommendations.push({
        title: "Dividir sessões extensas",
        action: "Use blocos de 15 a 20 minutos com pausa curta."
      });
    } else if (profile.sessions.count && profile.sessions.averageMinutes < 4) {
      recommendations.push({
        title: "Aumentar uma sessão por semana",
        action: "Inclua uma sessão de 8 a 12 minutos para revisão e prática."
      });
    }

    if (!recommendations.length) {
      recommendations.push({
        title: "Continuar coletando evidências",
        action: "Mantenha sessões distribuídas e conclua as atividades iniciadas."
      });
    }

    return recommendations.slice(0, 3);
  },

  calculate() {
    const days = this.aggregateDays(30);
    const events = this.allEvents();
    const sessions = this.sessionStats();
    const profile = this.habitProfile(days, events, sessions);
    const signals = this.signals(profile, days);

    return {
      generatedAt: new Date().toISOString(),
      profile,
      signals,
      recommendations: this.recommendations(profile, signals),
      days,
      weeklyPattern: this.weeklyPattern(days),
      evidence: {
        totalEvents: events.length,
        sessionCount: sessions.count,
        activeDays: profile.active30
      },
      disclaimer: "Os indicadores descrevem padrões de uso da plataforma. Não constituem diagnóstico comportamental, psicológico ou clínico."
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
      consistency: analysis.profile.consistency,
      active7: analysis.profile.active7,
      streak: analysis.profile.streak,
      trigger
    });
    this.save();
    return analysis;
  },

  current() {
    return this.state.lastAnalysis || this.refresh("missing");
  }
};
