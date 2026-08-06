window.ONC = window.ONC || {};

ONC.SecretDiscoveryEngine = {
  state: {
    hints: {},
    discoveries: [],
    evaluations: [],
    version: 1
  },

  init() {
    this.load();
    this.refresh("startup");
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_secret_discovery_${current}`;
  },

  load() {
    this.state = {
      hints: {},
      discoveries: [],
      evaluations: [],
      version: 1,
      ...ONC.Storage.get(this.storageKey(), {})
    };
  },

  save() {
    this.state.discoveries = this.state.discoveries.slice(-100);
    this.state.evaluations = this.state.evaluations.slice(-600);
    ONC.Storage.set(this.storageKey(), this.state);
  },

  hintStage(progress) {
    if (progress >= 85) return 3;
    if (progress >= 60) return 2;
    if (progress >= 30) return 1;
    return 0;
  },

  hintText(rule, stage) {
    const generic = {
      0: "???",
      1: "Algo incomum começou a acontecer.",
      2: "Uma conquista secreta está se aproximando.",
      3: "Faltam poucos passos para uma descoberta."
    };

    const contextual = {
      "observador-do-ceu": {
        2: "Continue explorando o céu em dias diferentes.",
        3: "Sua constância em Astronomia está quase revelando algo."
      },
      "laboratorio-oculto": {
        2: "Ferramentas diferentes escondem uma descoberta.",
        3: "Uma última ferramenta pode completar o experimento."
      },
      "explorador-total": {
        2: "O mapa inteiro guarda uma conquista.",
        3: "Poucos tópicos ainda permanecem inexplorados."
      },
      "precisao-sustentada": {
        2: "A precisão consistente está sendo observada.",
        3: "Mantenha a calma e a qualidade das respostas."
      },
      "polimata": {
        2: "Equilíbrio entre áreas pode revelar algo raro.",
        3: "Todas as disciplinas estão quase alinhadas."
      }
    };

    return contextual[rule.ruleId]?.[stage] || generic[stage];
  },

  refresh(trigger = "manual") {
    const summary = ONC.BadgeRuleEngine?.summary?.();
    if (!summary) return null;

    const secretRules = summary.rules.filter(item => item.category === "secreta");

    secretRules.forEach(rule => {
      const stage = this.hintStage(rule.percent);
      const previous = this.state.hints[rule.ruleId] || { stage: 0 };

      if (stage > previous.stage && !rule.unlocked) {
        this.state.hints[rule.ruleId] = {
          stage,
          text: this.hintText(rule, stage),
          updatedAt: new Date().toISOString()
        };
      }

      if (rule.unlocked && !this.state.discoveries.some(item => item.ruleId === rule.ruleId)) {
        this.state.discoveries.push({
          ruleId: rule.ruleId,
          title: rule.title,
          icon: rule.icon,
          rarity: rule.metadata?.rarity || rule.rarity || "rara",
          evidence: rule.evidence,
          discoveredAt: rule.unlocked.unlockedAt || new Date().toISOString()
        });
      }

      this.state.evaluations.push({
        ruleId: rule.ruleId,
        percent: rule.percent,
        stage,
        unlocked: Boolean(rule.unlocked),
        trigger,
        timestamp: new Date().toISOString()
      });
    });

    this.save();
    ONC.SecretBadgeUI?.render?.();
    return this.summary();
  },

  summary() {
    const badgeSummary = ONC.BadgeRuleEngine?.summary?.();
    const secretRules = (badgeSummary?.rules || []).filter(item => item.category === "secreta");

    return {
      total: secretRules.length,
      discovered: secretRules.filter(item => item.unlocked).length,
      hidden: secretRules.filter(item => !item.unlocked).length,
      collection: secretRules.length
        ? Math.round(secretRules.filter(item => item.unlocked).length / secretRules.length * 100)
        : 0,
      items: secretRules.map(rule => ({
        ...rule,
        hint: this.state.hints[rule.ruleId] || {
          stage: 0,
          text: "???"
        }
      })),
      recent: [...this.state.discoveries]
        .sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt))
        .slice(0, 6),
      nearest: secretRules
        .filter(item => !item.unlocked)
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 3),
      disclaimer: "Medalhas secretas são descobertas por evidências registradas. Dicas preservam o critério e não incentivam privação de sono, pressa ou carga excessiva."
    };
  }
};
