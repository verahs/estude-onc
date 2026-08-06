window.ONC = window.ONC || {};

ONC.BadgeAIIntegrationEngine = {
  state: {
    lastAnalysis: null,
    history: [],
    dismissedSuggestions: [],
    appliedSuggestions: [],
    preferences: {
      enabled: true,
      maxSuggestions: 3,
      allowDailyPlanIntegration: true,
      allowCoachMessages: true,
      avoidOverload: true
    },
    version: 1
  },

  init() {
    this.load();
    this.refresh("startup");
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_badge_ai_integration_${current}`;
  },

  load() {
    this.state = {
      lastAnalysis: null,
      history: [],
      dismissedSuggestions: [],
      appliedSuggestions: [],
      preferences: {
        enabled: true,
        maxSuggestions: 3,
        allowDailyPlanIntegration: true,
        allowCoachMessages: true,
        avoidOverload: true
      },
      version: 1,
      ...ONC.Storage.get(this.storageKey(), {})
    };
  },

  save() {
    this.state.history = this.state.history.slice(-240);
    this.state.dismissedSuggestions = this.state.dismissedSuggestions.slice(-300);
    this.state.appliedSuggestions = this.state.appliedSuggestions.slice(-300);
    ONC.Storage.set(this.storageKey(), this.state);
  },

  fatigueMode() {
    return ONC.CognitiveFatigueCoach?.current?.()?.recommendation?.mode || "continue";
  },

  isOverloaded() {
    const fatigue = this.fatigueMode();
    const concentrated = Boolean(
      ONC.ConsistencyCoach?.current?.()?.overload?.concentrated
    );
    return ["pause", "light"].includes(fatigue) || concentrated;
  },

  learningPriorities() {
    return ONC.RecommendationEngine?.top?.(12) ||
      ONC.RecommendationEngine?.cache?.slice?.(0, 12) || [];
  },

  badgeCandidates() {
    const rules = ONC.BadgeRuleEngine?.summary?.().rules || [];
    return rules
      .filter(rule =>
        !rule.unlocked &&
        !rule.hidden &&
        rule.percent >= 55 &&
        rule.percent < 100 &&
        !this.state.dismissedSuggestions.includes(rule.ruleId)
      )
      .map(rule => ({
        ruleId: rule.ruleId,
        title: rule.title,
        category: rule.category,
        percent: Number(rule.percent || 0),
        evidence: rule.evidence || "",
        icon: rule.icon || "🏅",
        description: rule.description || ""
      }));
  },

  categoryWeight(category) {
    return {
      recuperacao: 1.15,
      aprendizagem: 1.10,
      comportamento: 1.00,
      secreta: 0.75
    }[category] || 0.90;
  },

  pedagogicalFit(candidate, learningPriorities) {
    const text = [
      candidate.title,
      candidate.description,
      candidate.evidence
    ].join(" ").toLocaleLowerCase("pt-BR");

    const topicMatch = learningPriorities.find(item =>
      text.includes(String(item.title || "").toLocaleLowerCase("pt-BR")) ||
      text.includes(String(item.discipline || "").toLocaleLowerCase("pt-BR"))
    );

    let fit = 55;
    const reasons = [];

    if (candidate.category === "recuperacao") {
      fit += 20;
      reasons.push("prioriza recuperação de dificuldades");
    }

    if (candidate.category === "aprendizagem") {
      fit += 15;
      reasons.push("reforça domínio ou cobertura");
    }

    if (candidate.category === "comportamento") {
      fit += 8;
      reasons.push("apoia regularidade do estudo");
    }

    if (topicMatch) {
      fit += 20;
      reasons.push(`alinhada à prioridade ${topicMatch.title}`);
    }

    return {
      score: Math.min(100, fit),
      topicMatch,
      reasons
    };
  },

  safetyAdjustment(candidate, baseScore) {
    let score = baseScore;
    const reasons = [];
    const overloaded = this.isOverloaded();

    if (overloaded && this.state.preferences.avoidOverload) {
      if (candidate.category === "comportamento") {
        score -= 8;
        reasons.push("reduzida para evitar cobrança adicional");
      } else {
        score -= 18;
        reasons.push("adiada por carga cognitiva atual");
      }
    }

    if (candidate.percent >= 90) {
      score += 8;
      reasons.push("muito próxima do desbloqueio");
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      reasons,
      overloaded
    };
  },

  actionFor(candidate, fit) {
    if (fit.topicMatch) {
      return {
        kind: fit.topicMatch.action === "review" ? "review" : "topic",
        topicId: fit.topicMatch.topicId,
        title: fit.topicMatch.title,
        discipline: fit.topicMatch.discipline,
        minutes: candidate.category === "recuperacao" ? 8 : 10
      };
    }

    if (candidate.category === "comportamento") {
      return {
        kind: "daily-plan",
        title: "Cumprir uma ação curta do plano diário",
        minutes: 5
      };
    }

    return {
      kind: "collection",
      title: "Consultar o progresso da medalha",
      minutes: 0
    };
  },

  buildSuggestions() {
    const priorities = this.learningPriorities();

    return this.badgeCandidates()
      .map(candidate => {
        const fit = this.pedagogicalFit(candidate, priorities);
        const safety = this.safetyAdjustment(
          candidate,
          Math.round(candidate.percent * 0.45 +
            fit.score * 0.45 +
            this.categoryWeight(candidate.category) * 10)
        );

        return {
          id: `badge-ai:${candidate.ruleId}`,
          ...candidate,
          score: safety.score,
          confidence: priorities.length >= 5 ? "Alta" :
            priorities.length >= 2 ? "Média" : "Baixa",
          reasons: [...fit.reasons, ...safety.reasons],
          overloaded: safety.overloaded,
          action: this.actionFor(candidate, fit),
          message: safety.overloaded
            ? `${candidate.title} está próxima, mas a prioridade agora é preservar a carga de estudo.`
            : `${candidate.title} está em ${candidate.percent}%. Uma ação pedagógica curta pode avançar a aprendizagem e a conquista.`
        };
      })
      .filter(item => item.score >= 45)
      .sort((a, b) => b.score - a.score)
      .slice(0, Number(this.state.preferences.maxSuggestions || 3));
  },

  coachMessage(suggestions) {
    if (!this.state.preferences.allowCoachMessages || !suggestions.length) return null;

    const top = suggestions[0];
    if (top.overloaded) {
      return "Há uma conquista próxima, mas hoje o melhor resultado é preservar energia e fazer apenas uma revisão leve.";
    }

    return `${top.title} está próxima. O sistema recomenda ${top.action.title.toLowerCase()}, porque essa ação também atende uma prioridade real de aprendizagem.`;
  },

  calculate() {
    const suggestions = this.state.preferences.enabled
      ? this.buildSuggestions()
      : [];

    return {
      generatedAt: new Date().toISOString(),
      enabled: this.state.preferences.enabled,
      suggestions,
      coachMessage: this.coachMessage(suggestions),
      overloaded: this.isOverloaded(),
      prioritiesAnalyzed: this.learningPriorities().length,
      preferences: { ...this.state.preferences },
      disclaimer: "A IA usa medalhas apenas como reforço secundário. Recomendações pedagógicas, recuperação, descanso e carga cognitiva têm prioridade sobre qualquer conquista."
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
      suggestions: analysis.suggestions.map(item => item.ruleId),
      overloaded: analysis.overloaded,
      trigger
    });
    this.save();
    ONC.BadgeAIIntegrationUI?.render?.();
    return analysis;
  },

  current() {
    return this.state.lastAnalysis || this.refresh("missing");
  },

  applySuggestion(id) {
    const suggestion = this.current().suggestions.find(item => item.id === id);
    if (!suggestion) return false;

    let result = false;

    if (suggestion.action.kind === "review" && suggestion.action.topicId) {
      result = ONC.SmartNavigator?.goToRevision?.(suggestion.action.topicId) || false;
    } else if (suggestion.action.kind === "topic" && suggestion.action.topicId) {
      result = ONC.SmartNavigator?.goToTopic?.(suggestion.action.topicId, {
        source: "badge-ai",
        reason: `A IA integrou a medalha ${suggestion.title} a uma prioridade real de aprendizagem.`,
        focus: true
      }) || false;
    } else if (suggestion.action.kind === "daily-plan") {
      ONC.UI?.showSection?.("studySection");
      result = true;
    } else {
      result = ONC.BadgeCollectionEngine?.openDetails?.(suggestion.ruleId) || false;
    }

    this.state.appliedSuggestions.push({
      id,
      ruleId: suggestion.ruleId,
      action: suggestion.action,
      appliedAt: new Date().toISOString()
    });
    this.save();

    ONC.Notifications?.announce?.(
      `Sugestão aplicada: ${suggestion.action.title}.`
    );
    return result;
  },

  applyToDailyPlan(id) {
    if (!this.state.preferences.allowDailyPlanIntegration) return false;

    const suggestion = this.current().suggestions.find(item => item.id === id);
    const brief = ONC.DailyCoachEngine?.brief?.();
    if (!suggestion || !brief) return false;

    brief.badgeAISuggestion = {
      ruleId: suggestion.ruleId,
      title: suggestion.title,
      message: suggestion.message,
      action: suggestion.action,
      score: suggestion.score,
      confidence: suggestion.confidence
    };

    if (
      suggestion.action.topicId &&
      !brief.plan.some(task => task.topicId === suggestion.action.topicId)
    ) {
      brief.plan.push({
        id: `badge-ai-${suggestion.ruleId}`,
        topicId: suggestion.action.topicId,
        title: suggestion.action.title,
        discipline: suggestion.action.discipline || "Ciências",
        action: suggestion.action.kind === "review" ? "review" : "study",
        navigation: suggestion.action.kind === "review" ? "revision" : "topic",
        minutes: suggestion.action.minutes || 8,
        score: suggestion.score,
        confidence: suggestion.confidence,
        reasons: [
          "prioridade pedagógica compatível",
          `progresso da medalha ${suggestion.title}: ${suggestion.percent}%`
        ],
        badgeAI: true
      });
    }

    ONC.DailyCoachEngine.state.lastBrief = brief;
    ONC.DailyCoachEngine.save();
    ONC.DailyCoachUI?.render?.();

    this.state.appliedSuggestions.push({
      id,
      ruleId: suggestion.ruleId,
      action: "daily-plan",
      appliedAt: new Date().toISOString()
    });
    this.save();

    ONC.Notifications?.announce?.(
      "Sugestão integrada ao plano diário."
    );
    return true;
  },

  dismiss(id) {
    const suggestion = this.current().suggestions.find(item => item.id === id);
    if (!suggestion) return false;

    if (!this.state.dismissedSuggestions.includes(suggestion.ruleId)) {
      this.state.dismissedSuggestions.push(suggestion.ruleId);
    }
    this.save();
    this.refresh("dismiss");
    return true;
  },

  updatePreference(name, value) {
    if (!(name in this.state.preferences)) return false;

    this.state.preferences[name] =
      name === "maxSuggestions"
        ? Math.max(1, Math.min(5, Number(value || 3)))
        : Boolean(value);

    this.save();
    this.refresh("preference");
    return true;
  }
};
