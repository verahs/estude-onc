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
    ONC.LearningBadgeCatalog?.register?.();
    ONC.BehavioralBadgeCatalog?.register?.();
    ONC.RecoveryBadgeCatalog?.register?.();
    ONC.SecretBadgeCatalog?.register?.();
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

    const subjects = ONC.LearningAnalyticsEngine?.subjects?.() || [];
    const profiles = ONC.LearningEngine?.allProfiles?.() || [];
    const learningEvents = ONC.LearningEngine?.state?.events || [];

    const hardCorrectEvents = learningEvents.filter(event =>
      event.correct && event.difficulty === "Difícil"
    );
    const hardCorrectTopics = new Set(
      hardCorrectEvents.map(event => event.topicId).filter(Boolean)
    ).size;

    const topicEvolution = profiles
      .filter(profile => Number(profile.attempts || 0) > 0)
      .map(profile => {
        const events = learningEvents.filter(event =>
          event.topicId === profile.topicId
        );
        const firstWindow = events.slice(0, Math.min(3, events.length));
        const start = firstWindow.length
          ? Math.round(firstWindow.filter(event => event.correct).length / firstWindow.length * 100)
          : 0;
        const current = Number(profile.masteryEstimate ?? profile.accuracy ?? 0);
        const topic = ONC.KnowledgeGraph?.node?.(profile.topicId) ||
          ONC.MasteryEngine?.topicIndex?.find?.(item => item.id === profile.topicId);
        return {
          topicId: profile.topicId,
          title: topic?.title || profile.topicId,
          start,
          current,
          gain: Math.max(0, Math.round(current - start))
        };
      })
      .sort((a, b) => b.gain - a.gain);

    const risingTopics = profiles.filter(profile =>
      profile.trend === "rising"
    ).length;

    const procrastinationHistory = ONC.ProcrastinationDetector?.state?.history || [];
    const fatigueHistory = ONC.CognitiveFatigueCoach?.state?.history || [];
    const consistencyHistory = ONC.ConsistencyCoach?.state?.history || [];
    const habitHistory = ONC.StudyHabitEngine?.state?.history || [];
    const xpEntries = xpLedger || [];

    const uniqueDays = values => new Set(
      values
        .map(item => item.generatedAt || item.timestamp)
        .filter(Boolean)
        .map(value => new Date(value).toISOString().slice(0, 10))
    ).size;

    const lowProcrastinationDays = new Set(
      procrastinationHistory
        .filter(item => Number(item.score || 0) < 25)
        .map(item => new Date(item.generatedAt).toISOString().slice(0, 10))
    ).size;

    const lowFatigueDays = new Set(
      fatigueHistory
        .filter(item => Number(item.score || 0) < 70)
        .map(item => new Date(item.generatedAt).toISOString().slice(0, 10))
    ).size;

    const weeksTargetMet = new Set(
      consistencyHistory
        .filter(item => Number(item.active7 || 0) >= 3 && Number(item.score || 0) >= 55)
        .map(item => {
          const date = new Date(item.generatedAt);
          const first = new Date(date.getFullYear(), 0, 1);
          const week = Math.ceil((((date - first) / 86400000) + first.getDay() + 1) / 7);
          return `${date.getFullYear()}-${week}`;
        })
    ).size;

    const fullMissionDays = new Set(
      xpEntries
        .filter(item => item.category === "mission")
        .map(item => new Date(item.timestamp).toISOString().slice(0, 10))
    ).size;

    const navigationSources = navigation
      .filter(event => event.type === "open")
      .map(event => String(event.source || "").toLowerCase());

    const favoriteUses = navigationSources.filter(source => source.includes("favorite")).length;
    const reviewUses = navigationSources.filter(source => source.includes("review")).length +
      xpEntries.filter(item => item.category === "review").length;
    const dailyPlanUses = navigationSources.filter(source =>
      source.includes("mission") || source.includes("coach")
    ).length;

    const organizationToolsUsed = [
      favoriteUses >= 3,
      reviewUses >= 3,
      dailyPlanUses >= 3
    ].filter(Boolean).length;

    const reviewsOnTime = xpEntries.filter(item => item.category === "review").length;
    const overdueReviews = Number(
      ONC.ProcrastinationDetector?.current?.()?.metrics?.overdue?.length || 0
    );
    const totalReviewsDue = reviewsOnTime + overdueReviews;

    const lifetimeActiveDays = Math.max(
      Number(habit?.profile?.active30 || 0),
      uniqueDays(habitHistory),
      uniqueDays(ONC.StudyHistory?.state?.sessions || [])
    );

    const recoveryTopics = topicEvolution
      .filter(item => item.gain > 0)
      .sort((a, b) => b.gain - a.gain);

    const questionAttempts = learningEvents
      .filter(event => event.questionId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const questionMap = new Map();
    questionAttempts.forEach(event => {
      const list = questionMap.get(event.questionId) || [];
      list.push(event);
      questionMap.set(event.questionId, list);
    });

    let correctedQuestions = 0;
    questionMap.forEach(events => {
      const firstWrongIndex = events.findIndex(event => !event.correct);
      if (
        firstWrongIndex >= 0 &&
        events.slice(firstWrongIndex + 1).some(event => event.correct)
      ) correctedQuestions += 1;
    });

    const recurringErrorRecoveries = profiles.filter(profile => {
      const errorType = ONC.LearningEngine?.strongestErrorType?.(profile.topicId);
      return (
        errorType === "recurring" &&
        Number(profile.recentAccuracy || 0) >= 70 &&
        profile.trend === "rising"
      );
    }).length;

    const highRiskReviews = xpEntries.filter(entry =>
      entry.category === "review" &&
      (
        Number(entry.metadata?.forget || 0) >= 60 ||
        entry.metadata?.risk === "high" ||
        entry.metadata?.highRisk === true
      )
    ).length;

    const recoveryDates = xpEntries
      .filter(entry =>
        entry.metadata?.bonuses?.some?.(bonus => bonus.key === "recovery")
      )
      .map(entry => new Date(entry.timestamp));

    const recoveryWeeks = new Set(
      recoveryDates.map(date => {
        const first = new Date(date.getFullYear(), 0, 1);
        const week = Math.ceil((((date - first) / 86400000) + first.getDay() + 1) / 7);
        return `${date.getFullYear()}-${week}`;
      })
    ).size;

    const sessionDates = [...new Set(
      (ONC.StudyHistory?.state?.sessions || [])
        .map(item => item.timestamp || (item.date ? `${item.date}T12:00:00` : null))
        .filter(Boolean)
        .map(value => new Date(value).toISOString().slice(0, 10))
    )].sort();

    let returnedAfterBreak = false;
    let returnStreak = 0;
    for (let index = 1; index < sessionDates.length; index += 1) {
      const previous = new Date(`${sessionDates[index - 1]}T12:00:00`);
      const currentDate = new Date(`${sessionDates[index]}T12:00:00`);
      const gap = Math.round((currentDate - previous) / 86400000);
      if (gap >= 4) {
        returnedAfterBreak = true;
        let streakCount = 1;
        for (let cursor = index + 1; cursor < sessionDates.length; cursor += 1) {
          const before = new Date(`${sessionDates[cursor - 1]}T12:00:00`);
          const after = new Date(`${sessionDates[cursor]}T12:00:00`);
          if (Math.round((after - before) / 86400000) === 1) streakCount += 1;
          else break;
        }
        returnStreak = Math.max(returnStreak, streakCount);
      }
    }

    const subjectRecovery = (subjects || [])
      .map(subject => {
        const history = ONC.LearningAnalyticsEngine?.subjectHistory?.(subject.name) || [];
        const start = Number(history[0]?.average ?? subject.startAverage ?? subject.average);
        const current = Number(subject.average || 0);
        return {
          name: subject.name,
          start,
          current,
          gain: Math.max(0, Math.round(current - start))
        };
      })
      .sort((a, b) => b.gain - a.gain);

    const recoveryBadgesUnlocked = Object.values(this.state.unlocked || {})
      .filter(item => item.category === "recuperacao")
      .length;


    const validLearningEvents = learningEvents.filter(event =>
      event.timestamp &&
      Number(event.responseTimeMs || 0) >= 3500
    );

    let validCorrectStreak = 0;
    for (let index = validLearningEvents.length - 1; index >= 0; index -= 1) {
      if (!validLearningEvents[index].correct) break;
      validCorrectStreak += 1;
    }

    const topicEventsAll = ONC.StudyHistory?.state?.topicEvents || [];
    const studiedTopics = new Set(
      topicEventsAll
        .filter(event => ["completed", "smart-navigation-complete", "diagnostic-review-complete"].includes(event.type))
        .map(event => event.topicId)
        .filter(Boolean)
    ).size;
    const totalTopics = Number(ONC.MasteryEngine?.topicIndex?.length || 141);

    const astronomyEvents = learningEvents.filter(event =>
      String(event.discipline || event.subject || "").toLowerCase().includes("astronomia")
    );
    const astronomyActiveDays = new Set(
      astronomyEvents
        .map(event => event.timestamp)
        .filter(Boolean)
        .map(value => new Date(value).toISOString().slice(0, 10))
    ).size;
    const astronomyAccuracy = astronomyEvents.length
      ? Math.round(astronomyEvents.filter(event => event.correct).length / astronomyEvents.length * 100)
      : 0;

    const meaningfulSourceMap = new Map();
    (ONC.NavigationHistory?.state?.events || [])
      .filter(event => event.type === "complete" || Number(event.durationSeconds || 0) >= 90)
      .forEach(event => {
        if (event.source) meaningfulSourceMap.set(event.source, true);
      });
    const meaningfulSourceList = [...meaningfulSourceMap.keys()];
    const meaningfulSources = meaningfulSourceList.length;

    const toolChecks = {
      favoritos: (ONC.NavigationHistory?.state?.events || []).some(event =>
        String(event.source || "").includes("favorite") &&
        (event.type === "complete" || Number(event.durationSeconds || 0) >= 90)
      ),
      revisoes: xpEntries.some(entry => entry.category === "review"),
      simulados: learningEvents.some(event =>
        String(event.source || "").includes("simulado") ||
        String(event.source || "").includes("simulation")
      ),
      plano: xpEntries.some(entry => entry.category === "mission")
    };
    const secretToolList = Object.entries(toolChecks)
      .filter(([, used]) => used)
      .map(([name]) => name);
    const secretToolsUsed = secretToolList.length;

    const masteredSubjects = (subjects || []).filter(subject =>
      Number(subject.average || 0) >= 90 &&
      Number(subject.coverage || 0) >= 100
    ).length;
    const totalSubjects = (subjects || []).length;

    const coreCategories = new Set(["aprendizagem", "comportamento", "recuperacao"]);
    const coreRules = this.rules.filter(rule => coreCategories.has(rule.category) && !rule.hidden);
    const visibleCoreBadgesTotal = coreRules.length;
    const visibleCoreBadgesUnlocked = coreRules.filter(rule => this.state.unlocked[rule.id]).length;

    const otherRules = this.rules.filter(rule => rule.id !== "cientista-supremo");
    const allOtherBadgesTotal = otherRules.length;
    const allOtherBadgesUnlocked = otherRules.filter(rule => this.state.unlocked[rule.id]).length;

    const healthyStreak = Number(habit?.profile?.streak || 0);
    const overloadConcentrated = Boolean(
      ONC.ConsistencyCoach?.current?.()?.overload?.concentrated
    );

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
      distinctSources: sources.size,
      subjects,
      topicEvolution,
      risingTopics,
      hardCorrect: hardCorrectEvents.length,
      hardCorrectTopics,
      lowProcrastinationDays,
      lowFatigueDays,
      weeksTargetMet,
      fullMissionDays,
      favoriteUses,
      reviewUses,
      dailyPlanUses,
      organizationToolsUsed,
      reviewsOnTime,
      overdueReviews,
      totalReviewsDue,
      lifetimeActiveDays,
      recoveryTopics,
      correctedQuestions,
      recurringErrorRecoveries,
      highRiskReviews,
      recoveryWeeks,
      returnedAfterBreak,
      returnStreak,
      subjectRecovery,
      recoveryBadgesUnlocked,
      validCorrectStreak,
      studiedTopics,
      totalTopics,
      astronomyActiveDays,
      astronomyAccuracy,
      meaningfulSources,
      meaningfulSourceList,
      secretToolsUsed,
      secretToolList,
      masteredSubjects,
      totalSubjects,
      visibleCoreBadgesTotal,
      visibleCoreBadgesUnlocked,
      allOtherBadgesTotal,
      allOtherBadgesUnlocked,
      healthyStreak,
      overloadConcentrated
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
      icon: rule.icon || "🏅",
      subcategory: rule.subcategory || null,
      rarity: rule.rarity || null,
      metadata: raw.metadata || {},
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
          icon: rule.icon || "🏅",
          description: rule.description || "",
          subcategory: rule.subcategory || null,
          rarity: rule.rarity || null,
          evidence: result.evidence,
          metadata: result.metadata || {},
          unlockedAt: new Date().toISOString(),
          trigger
        };
        ONC.BadgeRuleUI?.notifyUnlock?.(this.state.unlocked[rule.id]);
        ONC.IntelligentNotificationEngine?.emitUnlock?.(this.state.unlocked[rule.id]);
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
    ONC.BadgeCollectionEngine?.render?.();
    ONC.BadgeTimelineEngine?.render?.();
    ONC.IntelligentNotificationEngine?.scan?.("badge-evaluation");
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
