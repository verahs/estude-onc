window.ONC = window.ONC || {};

ONC.BadgeRuleEngine = {
  state: {
    unlocked: {},
    progress: {},
    evaluations: [],
    version: 1
  },

  rules: [],

  init() {
    this.load();
    this.registerCoreRules();
    this.evaluateAll("startup");
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_badge_rules_${current}`;
  },

  load() {
    this.state = {
      unlocked: {},
      progress: {},
      evaluations: [],
      version: 1,
      ...ONC.Storage.get(this.storageKey(), {})
    };
  },

  save() {
    this.state.evaluations = this.state.evaluations.slice(-1000);
    ONC.Storage.set(this.storageKey(), this.state);
  },

  register(rule) {
    if (!rule?.id || typeof rule.evaluate !== "function") {
      throw new Error("Regra de medalha inválida.");
    }

    const existing = this.rules.findIndex(item => item.id === rule.id);
    if (existing >= 0) {
      this.rules[existing] = { ...this.rules[existing], ...rule };
    } else {
      this.rules.push(rule);
    }
    return rule;
  },

  registerMany(rules = []) {
    rules.forEach(rule => this.register(rule));
  },

  registerCoreRules() {
    this.registerMany([
      {
        id: "primeiro-passo",
        title: "Primeiro Passo",
        category: "aprendizagem",
        hidden: false,
        reward: { type: "frame", id: "frame-primeiro-passo" },
        description: "Concluir a primeira atividade válida.",
        evaluate: context => ({
          current: context.xpEvents,
          target: 1,
          complete: context.xpEvents >= 1,
          evidence: `${context.xpEvents} ganho${context.xpEvents === 1 ? "" : "s"} de XP registrado${context.xpEvents === 1 ? "" : "s"}`
        })
      },
      {
        id: "consistencia-inicial",
        title: "Consistência Inicial",
        category: "comportamento",
        hidden: false,
        reward: { type: "frame", id: "frame-consistencia-inicial" },
        description: "Manter três dias consecutivos de atividade.",
        evaluate: context => ({
          current: context.streak,
          target: 3,
          complete: context.streak >= 3,
          evidence: `${context.streak} dia${context.streak === 1 ? "" : "s"} consecutivo${context.streak === 1 ? "" : "s"}`
        })
      },
      {
        id: "revisor",
        title: "Revisor",
        category: "memoria",
        hidden: false,
        reward: { type: "theme", id: "theme-revisor" },
        description: "Concluir cinco revisões válidas.",
        evaluate: context => ({
          current: context.reviews,
          target: 5,
          complete: context.reviews >= 5,
          evidence: `${context.reviews} revisão${context.reviews === 1 ? "" : "ões"} concluída${context.reviews === 1 ? "" : "s"}`
        })
      },
      {
        id: "recuperacao-inicial",
        title: "Recuperação Inicial",
        category: "recuperacao",
        hidden: false,
        reward: { type: "effect", id: "effect-recovery" },
        description: "Obter três recompensas por recuperação de erro.",
        evaluate: context => ({
          current: context.recoveryAwards,
          target: 3,
          complete: context.recoveryAwards >= 3,
          evidence: `${context.recoveryAwards} recuperação${context.recoveryAwards === 1 ? "" : "ões"} reconhecida${context.recoveryAwards === 1 ? "" : "s"}`
        })
      },
      {
        id: "nivel-aprendiz",
        title: "Ascensão Aprendiz",
        category: "progressao",
        hidden: false,
        reward: { type: "avatar", id: "avatar-aprendiz" },
        description: "Alcançar o nível Aprendiz.",
        evaluate: context => ({
          current: context.levelIndex,
          target: 1,
          complete: context.levelIndex >= 1,
          evidence: `Nível atual: ${context.levelTitle}`
        })
      },
      {
        id: "curiosidade-cientifica",
        title: "Curiosidade Científica",
        category: "secreta",
        hidden: true,
        reward: { type: "badge", id: "secret-curiosity" },
        description: "Explorar diferentes áreas da plataforma.",
        evaluate: context => ({
          current: context.distinctSources,
          target: 4,
          complete: context.distinctSources >= 4,
          evidence: `${context.distinctSources} áreas diferentes exploradas`
        })
      }
    ]);
  },

  context() {
    const xpLedger = ONC.IntelligentXPEngine?.state?.ledger || [];
    const levelSummary = ONC.LevelSystem?.summary?.();
    const habit = ONC.StudyHabitEngine?.current?.();
    const navigation = ONC.NavigationHistory?.state?.events || [];

    const sources = new Set(
      navigation
        .filter(event => event.type === "open")
        .map(event => event.source)
        .filter(Boolean)
    );

    const recoveryAwards = xpLedger.filter(entry =>
      entry.metadata?.bonuses?.some?.(bonus => bonus.key === "recovery")
    ).length;

    return {
      xp: Number(ONC.IntelligentXPEngine?.state?.totalXP || 0),
      xpEvents: xpLedger.length,
      reviews: xpLedger.filter(entry => entry.category === "review").length,
      missions: xpLedger.filter(entry => entry.category === "mission").length,
      recoveryAwards,
      streak: Number(habit?.profile?.streak || 0),
      activeDays30: Number(habit?.profile?.active30 || 0),
      levelKey: levelSummary?.current?.key || "explorador",
      levelTitle: levelSummary?.current?.title || "Explorador",
      levelIndex: Math.max(0, ONC.LevelSystem?.levels?.findIndex?.(
        level => level.key === levelSummary?.current?.key
      ) || 0),
      distinctSources: sources.size
    };
  },

  normalizeResult(rule, raw = {}) {
    const target = Math.max(1, Number(raw.target || 1));
    const current = Math.max(0, Number(raw.current || 0));
    const percent = raw.complete
      ? 100
      : Math.max(0, Math.min(99, Math.round(current / target * 100)));

    return {
      ruleId: rule.id,
      title: rule.title,
      category: rule.category,
      hidden: Boolean(rule.hidden),
      description: rule.description || "",
      reward: rule.reward || null,
      current,
      target,
      percent,
      complete: Boolean(raw.complete),
      evidence: raw.evidence || "",
      evaluatedAt: new Date().toISOString()
    };
  },

  evaluateRule(rule, context = this.context(), trigger = "manual") {
    try {
      const result = this.normalizeResult(rule, rule.evaluate(context));
      this.state.progress[rule.id] = result;

      if (result.complete && !this.state.unlocked[rule.id]) {
        this.state.unlocked[rule.id] = {
          ruleId: rule.id,
          title: rule.title,
          category: rule.category,
          reward: rule.reward || null,
          evidence: result.evidence,
          unlockedAt: new Date().toISOString(),
          trigger
        };
        ONC.BadgeRuleUI?.notifyUnlock?.(this.state.unlocked[rule.id]);
      }

      this.state.evaluations.push({
        ruleId: rule.id,
        complete: result.complete,
        percent: result.percent,
        trigger,
        timestamp: result.evaluatedAt
      });

      return result;
    } catch (error) {
      console.error(`[BadgeRuleEngine] Falha na regra ${rule.id}:`, error);
      return null;
    }
  },

  evaluateAll(trigger = "manual") {
    const context = this.context();
    const results = this.rules
      .map(rule => this.evaluateRule(rule, context, trigger))
      .filter(Boolean);

    this.save();
    ONC.BadgeRuleUI?.render?.();
    return results;
  },

  isUnlocked(ruleId) {
    return Boolean(this.state.unlocked[ruleId]);
  },

  progress(ruleId) {
    return this.state.progress[ruleId] || null;
  },

  unlockedList() {
    return Object.values(this.state.unlocked)
      .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt));
  },

  summary() {
    const all = this.rules.map(rule => {
      const progress = this.progress(rule.id) || this.normalizeResult(rule, {});
      const unlocked = this.state.unlocked[rule.id] || null;
      return {
        ...progress,
        unlocked,
        visible: !rule.hidden || Boolean(unlocked)
      };
    });

    const visible = all.filter(item => item.visible);
    const unlocked = all.filter(item => item.unlocked);

    return {
      totalRules: all.length,
      visibleRules: visible.length,
      unlockedCount: unlocked.length,
      completion: all.length ? Math.round(unlocked.length / all.length * 100) : 0,
      rules: all,
      unlocked: this.unlockedList(),
      nearest: all
        .filter(item => !item.unlocked && !item.hidden)
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 3),
      categories: all.reduce((acc, item) => {
        acc[item.category] = acc[item.category] || { total: 0, unlocked: 0 };
        acc[item.category].total += 1;
        if (item.unlocked) acc[item.category].unlocked += 1;
        return acc;
      }, {}),
      disclaimer: "As medalhas reconhecem evidências registradas na plataforma. Elas não equivalem a nota, classificação oficial, medalha da ONC ou capacidade intelectual."
    };
  }
};
