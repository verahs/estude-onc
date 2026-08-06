window.ONC = window.ONC || {};

ONC.LevelSystem = {
  state: {
    currentLevelKey: "explorador",
    unlockedLevels: ["explorador"],
    claimedRewards: [],
    levelUpHistory: [],
    version: 1
  },

  levels: [
    {
      key: "explorador",
      title: "Explorador",
      minXP: 0,
      icon: "🧭",
      description: "Inicia a jornada científica e aprende a usar o mapa de estudos.",
      unlocks: ["Tema base", "Moldura Explorador"]
    },
    {
      key: "aprendiz",
      title: "Aprendiz",
      minXP: 250,
      icon: "📘",
      description: "Consolida os primeiros hábitos e revisões.",
      unlocks: ["Tema Azul Laboratório", "Avatar Aprendiz"]
    },
    {
      key: "pesquisador",
      title: "Pesquisador",
      minXP: 700,
      icon: "🔎",
      description: "Investiga padrões, erros e hipóteses de aprendizagem.",
      unlocks: ["Moldura Pesquisador", "Efeito de progresso"]
    },
    {
      key: "naturalista",
      title: "Naturalista",
      minXP: 1400,
      icon: "🌿",
      description: "Amplia o domínio entre diferentes áreas da ciência.",
      unlocks: ["Tema Natureza Científica", "Avatar Naturalista"]
    },
    {
      key: "cientista",
      title: "Cientista",
      minXP: 2400,
      icon: "🧪",
      description: "Aplica método, revisão e prática com regularidade.",
      unlocks: ["Laboratório Avançado", "Moldura Cientista"]
    },
    {
      key: "especialista",
      title: "Especialista",
      minXP: 3800,
      icon: "⚛️",
      description: "Mantém desempenho consistente em conteúdos complexos.",
      unlocks: ["Tema Especialista", "Avatar Especialista"]
    },
    {
      key: "mestre-onc",
      title: "Mestre ONC",
      minXP: 5600,
      icon: "🏅",
      description: "Demonstra domínio amplo, memória e recuperação de dificuldades.",
      unlocks: ["Moldura Mestre ONC", "Efeito de conquista"]
    },
    {
      key: "lenda-onc",
      title: "Lenda ONC",
      minXP: 8000,
      icon: "🌟",
      description: "Alcança o maior nível atual por evolução sustentada.",
      unlocks: ["Tema Lenda ONC", "Avatar Lenda ONC"]
    }
  ],

  init() {
    this.load();
    this.evaluate("startup");
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_level_system_${current}`;
  },

  load() {
    this.state = {
      currentLevelKey: "explorador",
      unlockedLevels: ["explorador"],
      claimedRewards: [],
      levelUpHistory: [],
      version: 1,
      ...ONC.Storage.get(this.storageKey(), {})
    };
  },

  save() {
    this.state.levelUpHistory = this.state.levelUpHistory.slice(-100);
    ONC.Storage.set(this.storageKey(), this.state);
  },

  xp() {
    return Number(ONC.IntelligentXPEngine?.state?.totalXP || 0);
  },

  currentDefinition() {
    const xp = this.xp();
    return [...this.levels].reverse().find(level => xp >= level.minXP) || this.levels[0];
  },

  previousDefinition() {
    return this.levels.find(level => level.key === this.state.currentLevelKey) || this.levels[0];
  },

  nextDefinition(level = this.currentDefinition()) {
    const index = this.levels.findIndex(item => item.key === level.key);
    return index >= 0 ? this.levels[index + 1] || null : null;
  },

  evaluate(trigger = "manual") {
    const current = this.currentDefinition();
    const previous = this.previousDefinition();

    this.levels
      .filter(level => this.xp() >= level.minXP)
      .forEach(level => {
        if (!this.state.unlockedLevels.includes(level.key)) {
          this.state.unlockedLevels.push(level.key);
        }
      });

    if (current.key !== previous.key) {
      this.state.currentLevelKey = current.key;
      const event = {
        id: `${Date.now()}-${current.key}`,
        levelKey: current.key,
        title: current.title,
        icon: current.icon,
        xp: this.xp(),
        trigger,
        timestamp: new Date().toISOString()
      };
      this.state.levelUpHistory.push(event);
      this.save();
      ONC.LevelSystemUI?.showLevelUp?.(event);
      ONC.Notifications?.announce?.(`Novo nível desbloqueado: ${current.title}.`);
    } else {
      this.state.currentLevelKey = current.key;
      this.save();
    }

    ONC.LevelSystemUI?.render?.();
    return this.summary();
  },

  progress() {
    const current = this.currentDefinition();
    const next = this.nextDefinition(current);
    const xp = this.xp();

    if (!next) {
      return {
        percent: 100,
        currentXP: xp,
        startXP: current.minXP,
        targetXP: current.minXP,
        remaining: 0
      };
    }

    const range = next.minXP - current.minXP;
    const earned = xp - current.minXP;

    return {
      percent: Math.max(0, Math.min(100, Math.round(earned / range * 100))),
      currentXP: xp,
      startXP: current.minXP,
      targetXP: next.minXP,
      remaining: Math.max(0, next.minXP - xp)
    };
  },

  claimReward(levelKey) {
    if (!this.state.unlockedLevels.includes(levelKey)) return false;
    if (this.state.claimedRewards.includes(levelKey)) return false;

    this.state.claimedRewards.push(levelKey);
    this.save();

    const level = this.levels.find(item => item.key === levelKey);
    ONC.Notifications?.announce?.(
      `Recompensas do nível ${level?.title || levelKey} adicionadas ao inventário.`
    );
    ONC.LevelSystemUI?.render?.();
    return true;
  },

  summary() {
    const current = this.currentDefinition();
    const next = this.nextDefinition(current);

    return {
      xp: this.xp(),
      current,
      next,
      progress: this.progress(),
      unlockedLevels: [...this.state.unlockedLevels],
      claimedRewards: [...this.state.claimedRewards],
      timeline: this.levels.map(level => ({
        ...level,
        unlocked: this.state.unlockedLevels.includes(level.key),
        claimed: this.state.claimedRewards.includes(level.key),
        current: level.key === current.key
      })),
      recentLevelUps: [...this.state.levelUpHistory].reverse().slice(0, 6),
      disclaimer: "Os níveis representam progresso dentro da plataforma. Não equivalem a nota, classificação, medalha oficial ou capacidade intelectual."
    };
  }
};
