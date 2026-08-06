window.ONC = window.ONC || {};

ONC.IntelligentXPEngine = {
  state: {
    totalXP: 0,
    lifetimeXP: 0,
    atoms: 0,
    ledger: [],
    grantedKeys: {},
    daily: {},
    version: 1
  },

  init() {
    this.load();
    this.recalculate();
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_intelligent_xp_${current}`;
  },

  todayKey() {
    return new Date().toISOString().slice(0, 10);
  },

  load() {
    this.state = {
      totalXP: 0,
      lifetimeXP: 0,
      atoms: 0,
      ledger: [],
      grantedKeys: {},
      daily: {},
      version: 1,
      ...ONC.Storage.get(this.storageKey(), {})
    };
  },

  save() {
    this.state.ledger = this.state.ledger.slice(-1500);
    const keys = Object.entries(this.state.grantedKeys)
      .sort((a, b) => new Date(b[1]) - new Date(a[1]))
      .slice(0, 2500);
    this.state.grantedKeys = Object.fromEntries(keys);
    ONC.Storage.set(this.storageKey(), this.state);
  },

  difficultyMultiplier(difficulty = "Média") {
    return {
      "Fácil": 1,
      "Média": 1.25,
      "Difícil": 1.65
    }[difficulty] || 1.15;
  },

  sourceMultiplier(source = "") {
    if (source.includes("review")) return 1.35;
    if (source.includes("simulation") || source.includes("simulado")) return 1.15;
    if (source.includes("mission")) return 1.15;
    return 1;
  },

  dailyCap() {
    return 450;
  },

  dailyEarned(date = this.todayKey()) {
    return Number(this.state.daily?.[date]?.earned || 0);
  },

  antiFarm(event) {
    const recent = this.state.ledger
      .filter(item =>
        item.questionId &&
        item.questionId === event.questionId &&
        Date.now() - new Date(item.timestamp).getTime() <= 30 * 60000
      );

    const veryFast = event.responseTimeMs > 0 && event.responseTimeMs < 3500;
    const repeated = recent.length >= 2;
    const excessive = this.dailyEarned() >= this.dailyCap();

    let multiplier = 1;
    const reasons = [];

    if (veryFast) {
      multiplier *= event.correct ? 0.35 : 0;
      reasons.push("resposta muito rápida");
    }

    if (repeated) {
      multiplier *= 0.20;
      reasons.push("repetição recente da mesma questão");
    }

    if (excessive) {
      multiplier = 0;
      reasons.push("limite diário de XP atingido");
    }

    return {
      multiplier,
      reasons,
      eligible: multiplier > 0
    };
  },

  recoveryBonus(event) {
    if (!event.correct || !event.topicId) return 0;

    const prior = (ONC.LearningEngine?.state?.events || [])
      .filter(item =>
        item.topicId === event.topicId &&
        item.id !== event.id &&
        new Date(item.timestamp) < new Date(event.timestamp)
      )
      .slice(-5);

    const recentErrors = prior.filter(item => !item.correct).length;
    if (recentErrors >= 3) return 18;
    if (recentErrors >= 2) return 12;
    if (recentErrors >= 1) return 6;
    return 0;
  },

  reviewBonus(event) {
    if (!event.correct) return 0;
    if (event.reviewMode || String(event.source).includes("review")) return 10;
    return 0;
  },

  carefulBonus(event) {
    if (!event.correct) return 0;
    const time = Number(event.responseTimeMs || 0);
    if (time >= 10000 && time <= 90000) return 3;
    return 0;
  },

  masteryBonus(event) {
    if (!event.correct || !event.topicId) return 0;
    const before = Number(ONC.MasteryEngine?.get?.(event.topicId)?.score || 0);
    const profile = ONC.LearningEngine?.profile?.(event.topicId);
    const after = Number(profile?.masteryEstimate || before);
    if (before < 70 && after >= 70) return 25;
    if (before < 50 && after >= 50) return 10;
    return 0;
  },

  responseAward(event) {
    if (!event || !event.correct) {
      return {
        xp: 0,
        base: 0,
        bonuses: [],
        multiplier: 0,
        reason: "Respostas incorretas não retiram XP e não geram recompensa."
      };
    }

    const antiFarm = this.antiFarm(event);
    if (!antiFarm.eligible) {
      return {
        xp: 0,
        base: 0,
        bonuses: [],
        multiplier: 0,
        reason: antiFarm.reasons.join(" • ")
      };
    }

    const base = 6;
    const difficulty = this.difficultyMultiplier(event.difficulty);
    const source = this.sourceMultiplier(event.source);
    const bonuses = [
      { key: "recovery", label: "recuperação de erro", xp: this.recoveryBonus(event) },
      { key: "review", label: "revisão no momento certo", xp: this.reviewBonus(event) },
      { key: "careful", label: "ritmo cuidadoso", xp: this.carefulBonus(event) },
      { key: "mastery", label: "marco de domínio", xp: this.masteryBonus(event) }
    ].filter(item => item.xp > 0);

    const raw = base * difficulty * source + bonuses.reduce((sum, item) => sum + item.xp, 0);
    const xp = Math.max(1, Math.round(raw * antiFarm.multiplier));

    return {
      xp,
      base,
      bonuses,
      multiplier: Math.round(difficulty * source * antiFarm.multiplier * 100) / 100,
      reason: antiFarm.reasons.length
        ? `recompensa reduzida: ${antiFarm.reasons.join(" • ")}`
        : "recompensa pedagógica válida"
    };
  },

  duplicateKey(key) {
    return Boolean(this.state.grantedKeys[key]);
  },

  grant({ key, xp, category, title, detail, topicId = null, questionId = null, metadata = {} }) {
    if (!key || xp <= 0 || this.duplicateKey(key)) return null;

    const available = Math.max(0, this.dailyCap() - this.dailyEarned());
    const awardedXP = Math.min(Number(xp), available);
    if (awardedXP <= 0) return null;

    const date = this.todayKey();
    const entry = {
      id: `${Date.now()}-${key}`,
      key,
      xp: awardedXP,
      category,
      title,
      detail,
      topicId,
      questionId,
      metadata,
      timestamp: new Date().toISOString()
    };

    this.state.ledger.push(entry);
    this.state.grantedKeys[key] = entry.timestamp;
    this.state.totalXP += awardedXP;
    this.state.lifetimeXP += awardedXP;
    this.state.atoms += Math.max(1, Math.floor(awardedXP / 10));
    this.state.daily[date] = {
      earned: this.dailyEarned(date) + awardedXP,
      events: Number(this.state.daily?.[date]?.events || 0) + 1
    };
    this.save();

    ONC.IntelligentXPUI?.notify?.(entry);
    ONC.IntelligentXPUI?.render?.();
    return entry;
  },

  recordResponse(event) {
    if (!event) return null;
    const award = this.responseAward(event);

    return this.grant({
      key: `response:${event.id}`,
      xp: award.xp,
      category: "learning",
      title: award.bonuses.some(item => item.key === "recovery")
        ? "Erro recuperado"
        : "Aprendizagem validada",
      detail: [
        `${event.topic}`,
        `${event.difficulty || "Média"}`,
        ...award.bonuses.map(item => `+${item.xp} ${item.label}`),
        award.reason
      ].join(" • "),
      topicId: event.topicId,
      questionId: event.questionId,
      metadata: award
    });
  },

  recordReview(topicId, durationSeconds = 0) {
    if (!topicId) return null;
    const topic = ONC.ContentIndex?.get?.(topicId);
    const meaningful = Number(durationSeconds || 0) >= 90;
    const xp = meaningful ? 18 : 8;

    return this.grant({
      key: `review:${topicId}:${this.todayKey()}`,
      xp,
      category: "review",
      title: meaningful ? "Revisão concluída" : "Revisão curta concluída",
      detail: `${topic?.title || topicId} • ${Math.round(durationSeconds / 60)} min`,
      topicId,
      metadata: { durationSeconds }
    });
  },

  recordMissionTask(task) {
    if (!task?.id || !task.completed) return null;

    const difficultyBonus = task.impact === "Muito alto" ? 8 :
      task.impact === "Alto" ? 5 : 0;
    const xp = 12 + difficultyBonus + Math.min(8, Number(task.estimatedMinutes || 0));

    return this.grant({
      key: `mission:${ONC.MissionEngine?.mission?.date || this.todayKey()}:${task.id}`,
      xp,
      category: "mission",
      title: "Missão concluída",
      detail: `${task.title} • recompensa por conclusão`,
      topicId: task.topicId || null,
      metadata: { taskId: task.id }
    });
  },

  recordConsistencyMilestone() {
    const habit = ONC.StudyHabitEngine?.current?.()?.profile;
    if (!habit) return null;

    const thresholds = [3, 5, 7, 14, 30];
    const reached = thresholds
      .filter(value => Number(habit.streak || 0) >= value)
      .at(-1);

    if (!reached) return null;

    return this.grant({
      key: `streak:${reached}:${this.todayKey()}`,
      xp: reached >= 14 ? 50 : reached >= 7 ? 35 : reached >= 5 ? 22 : 12,
      category: "consistency",
      title: `${reached} dias de consistência`,
      detail: "Recompensa por regularidade, sem exigir volume excessivo.",
      metadata: { streak: reached }
    });
  },

  recalculate() {
    this.recordConsistencyMilestone();
    this.save();
    ONC.IntelligentXPUI?.render?.();
  },

  level() {
    const levels = [
      { min: 0, title: "Explorador", next: 250 },
      { min: 250, title: "Aprendiz", next: 700 },
      { min: 700, title: "Pesquisador", next: 1400 },
      { min: 1400, title: "Naturalista", next: 2400 },
      { min: 2400, title: "Cientista", next: 3800 },
      { min: 3800, title: "Especialista", next: 5600 },
      { min: 5600, title: "Mestre ONC", next: 8000 },
      { min: 8000, title: "Lenda ONC", next: null }
    ];

    const current = [...levels].reverse().find(item => this.state.totalXP >= item.min) || levels[0];
    const next = levels.find(item => item.min > current.min) || null;
    const progress = next
      ? Math.round((this.state.totalXP - current.min) / (next.min - current.min) * 100)
      : 100;

    return {
      ...current,
      progress: Math.max(0, Math.min(100, progress)),
      remaining: next ? Math.max(0, next.min - this.state.totalXP) : 0,
      nextTitle: next?.title || null
    };
  },

  summary() {
    const today = this.dailyEarned();
    const level = this.level();
    const categories = this.state.ledger.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.xp;
      return acc;
    }, {});

    return {
      totalXP: this.state.totalXP,
      lifetimeXP: this.state.lifetimeXP,
      atoms: this.state.atoms,
      today,
      dailyCap: this.dailyCap(),
      level,
      categories,
      recent: [...this.state.ledger].reverse().slice(0, 8),
      disclaimer: "O XP recompensa aprendizagem, revisão, recuperação e consistência. Erros não retiram XP. Respostas artificiais ou repetidas podem ter recompensa reduzida ou nula."
    };
  }
};
