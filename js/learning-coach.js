window.ONC = window.ONC || {};

ONC.LearningCoach = {
  state: {
    lastAnalysis: null,
    history: [],
    strategyAssignments: [],
    version: 1
  },

  init() {
    this.load();
    this.refresh("startup");
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_learning_coach_${current}`;
  },

  load() {
    this.state = {
      lastAnalysis: null,
      history: [],
      strategyAssignments: [],
      version: 1,
      ...ONC.Storage.get(this.storageKey(), {})
    };
  },

  save() {
    this.state.history = this.state.history.slice(-180);
    this.state.strategyAssignments = this.state.strategyAssignments.slice(-500);
    ONC.Storage.set(this.storageKey(), this.state);
  },

  learningEvents() {
    return [...(ONC.LearningEngine?.state?.events || [])]
      .filter(event => event.timestamp)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },

  topicEvents() {
    return [...(ONC.StudyHistory?.state?.topicEvents || [])]
      .filter(event => event.timestamp)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },

  strategyForEvent(event) {
    if (event.reviewMode || event.source === "review") return "spaced-review";
    if (event.simulationMode || event.source === "simulado") return "simulation";
    if (event.hintUsed) return "guided-practice";
    if (event.source === "question-bank") return "practice";
    return "practice";
  },

  studyStrategyEvents() {
    return this.topicEvents()
      .filter(event => ["opened", "completed", "smart-navigation-complete", "diagnostic-review-complete"].includes(event.type))
      .map(event => ({
        topicId: event.topicId,
        timestamp: event.timestamp,
        strategy: event.type.includes("review") ? "spaced-review" : "reading",
        durationSeconds: Number(event.metadata?.durationSeconds || 0)
      }));
  },

  responseStrategyEvents() {
    return this.learningEvents().map(event => ({
      topicId: event.topicId,
      timestamp: event.timestamp,
      strategy: this.strategyForEvent(event),
      correct: Boolean(event.correct),
      responseTimeMs: Number(event.responseTimeMs || 0),
      errorType: event.errorType || null,
      difficulty: event.difficulty || "Média"
    }));
  },

  strategyOutcomes() {
    const responses = this.responseStrategyEvents();
    const studies = this.studyStrategyEvents();
    const outcomes = [];

    responses.forEach(response => {
      const responseTime = new Date(response.timestamp).getTime();
      const recentStudy = [...studies]
        .filter(study =>
          study.topicId === response.topicId &&
          new Date(study.timestamp).getTime() <= responseTime &&
          responseTime - new Date(study.timestamp).getTime() <= 7 * 86400000
        )
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

      outcomes.push({
        topicId: response.topicId,
        timestamp: response.timestamp,
        strategy: recentStudy?.strategy || response.strategy,
        correct: response.correct,
        responseTimeMs: response.responseTimeMs,
        errorType: response.errorType,
        delayHours: recentStudy
          ? Math.round((responseTime - new Date(recentStudy.timestamp).getTime()) / 3600000)
          : null
      });
    });

    return outcomes;
  },

  strategyMetrics() {
    const labels = {
      reading: "Leitura orientada",
      practice: "Prática por questões",
      "guided-practice": "Prática com apoio",
      "spaced-review": "Revisão espaçada",
      simulation: "Simulado"
    };

    const map = new Map();
    this.strategyOutcomes().forEach(item => {
      if (!map.has(item.strategy)) {
        map.set(item.strategy, {
          key: item.strategy,
          label: labels[item.strategy] || item.strategy,
          attempts: 0,
          correct: 0,
          responseTimes: [],
          recurringErrors: 0,
          postReviewErrors: 0,
          topics: new Set()
        });
      }

      const metric = map.get(item.strategy);
      metric.attempts += 1;
      metric.correct += item.correct ? 1 : 0;
      if (item.responseTimeMs > 0) metric.responseTimes.push(item.responseTimeMs);
      if (item.errorType === "recurring") metric.recurringErrors += 1;
      if (item.errorType === "post-review") metric.postReviewErrors += 1;
      if (item.topicId) metric.topics.add(item.topicId);
    });

    return [...map.values()].map(metric => {
      const accuracy = metric.attempts
        ? Math.round(metric.correct / metric.attempts * 100)
        : 0;
      const averageResponseMs = metric.responseTimes.length
        ? Math.round(metric.responseTimes.reduce((sum, value) => sum + value, 0) / metric.responseTimes.length)
        : 0;
      const confidence = Math.min(100,
        metric.attempts * 8 +
        metric.topics.size * 6
      );

      return {
        key: metric.key,
        label: metric.label,
        attempts: metric.attempts,
        accuracy,
        averageResponseMs,
        recurringErrors: metric.recurringErrors,
        postReviewErrors: metric.postReviewErrors,
        topicCount: metric.topics.size,
        confidence,
        effectiveness: Math.round(
          accuracy * 0.72 +
          Math.min(100, metric.topicCount * 12) * 0.18 +
          Math.min(100, metric.attempts * 8) * 0.10
        )
      };
    }).sort((a, b) => b.effectiveness - a.effectiveness);
  },

  topicPatterns() {
    const profiles = ONC.LearningEngine?.allProfiles?.() || [];
    const metricsByTopic = new Map();

    this.strategyOutcomes().forEach(item => {
      if (!item.topicId) return;
      if (!metricsByTopic.has(item.topicId)) {
        metricsByTopic.set(item.topicId, []);
      }
      metricsByTopic.get(item.topicId).push(item);
    });

    return profiles
      .filter(profile => profile.attempts > 0)
      .map(profile => {
        const topic = ONC.KnowledgeGraph?.node?.(profile.topicId) ||
          ONC.MasteryEngine?.topicIndex?.find(item => item.id === profile.topicId);
        const items = metricsByTopic.get(profile.topicId) || [];
        const strategies = {};

        items.forEach(item => {
          if (!strategies[item.strategy]) {
            strategies[item.strategy] = { attempts: 0, correct: 0 };
          }
          strategies[item.strategy].attempts += 1;
          strategies[item.strategy].correct += item.correct ? 1 : 0;
        });

        const rankedStrategies = Object.entries(strategies)
          .map(([key, value]) => ({
            key,
            attempts: value.attempts,
            accuracy: Math.round(value.correct / value.attempts * 100)
          }))
          .sort((a, b) => b.accuracy - a.accuracy || b.attempts - a.attempts);

        return {
          topicId: profile.topicId,
          title: topic?.title || profile.topicId,
          discipline: topic?.discipline || "",
          attempts: profile.attempts,
          accuracy: profile.accuracy,
          recentAccuracy: profile.recentAccuracy,
          confidence: profile.confidence,
          trend: profile.trend,
          averageResponseMs: profile.averageResponseMs,
          errorType: ONC.LearningEngine?.strongestErrorType?.(profile.topicId),
          bestObservedStrategy: rankedStrategies[0] || null,
          strategyEvidence: rankedStrategies
        };
      });
  },

  inferPattern(topic) {
    if (topic.errorType === "distraction") {
      return {
        key: "careful-reading",
        label: "Ritmo de resposta precisa de controle",
        evidence: "Há indícios de respostas apressadas.",
        strategy: "guided-practice"
      };
    }

    if (topic.errorType === "recurring") {
      return {
        key: "concept-rebuild",
        label: "Conceito precisa ser reconstruído",
        evidence: "O mesmo tipo de erro aparece repetidamente.",
        strategy: "reading"
      };
    }

    if (topic.errorType === "post-review") {
      return {
        key: "spacing-adjustment",
        label: "Intervalo de revisão precisa de ajuste",
        evidence: "Houve erro depois de uma revisão registrada.",
        strategy: "spaced-review"
      };
    }

    if (topic.averageResponseMs >= 70000 && topic.accuracy < 60) {
      return {
        key: "worked-example",
        label: "Raciocínio ainda exige muitos passos",
        evidence: "Tempo alto combinado com precisão baixa.",
        strategy: "guided-practice"
      };
    }

    if (topic.trend === "rising" && topic.accuracy >= 65) {
      return {
        key: "advance",
        label: "Aprendizagem em evolução",
        evidence: "A precisão recente está subindo.",
        strategy: "practice"
      };
    }

    if (topic.confidence < 40) {
      return {
        key: "more-evidence",
        label: "Estratégia ainda não confirmada",
        evidence: "Há poucas respostas variadas para este tópico.",
        strategy: "practice"
      };
    }

    return {
      key: "consolidate",
      label: "Consolidação gradual",
      evidence: "O histórico pede alternância entre revisão e prática.",
      strategy: "spaced-review"
    };
  },

  recommendedMethod(pattern, topic) {
    const methods = {
      reading: {
        label: "Leitura orientada",
        steps: [
          "Leia o resumo do tópico.",
          "Explique o conceito com suas próprias palavras.",
          "Resolva duas questões de verificação."
        ],
        minutes: 8
      },
      practice: {
        label: "Prática de recuperação",
        steps: [
          "Responda três questões sem consultar o conteúdo.",
          "Revise apenas os erros.",
          "Tente uma questão de dificuldade maior."
        ],
        minutes: 8
      },
      "guided-practice": {
        label: "Prática guiada",
        steps: [
          "Leia o comando com calma.",
          "Elimine alternativas usando evidências.",
          "Registre por que a resposta correta é melhor."
        ],
        minutes: 10
      },
      "spaced-review": {
        label: "Revisão espaçada",
        steps: [
          "Recupere o conceito sem consultar.",
          "Confira o resumo.",
          "Faça uma questão curta e programe nova revisão."
        ],
        minutes: 5
      }
    };

    const method = methods[pattern.strategy] || methods.practice;
    return {
      ...method,
      topicId: topic.topicId,
      topic: topic.title,
      discipline: topic.discipline
    };
  },

  recommendedTopics() {
    const recommendations = ONC.RecommendationEngine?.rank?.({
      limit: 12,
      excludeMastered: true
    }) || [];
    const patterns = new Map(
      this.topicPatterns().map(topic => [topic.topicId, topic])
    );

    return recommendations.slice(0, 6).map(item => {
      const topic = patterns.get(item.topicId) || {
        topicId: item.topicId,
        title: item.title,
        discipline: item.discipline,
        accuracy: 0,
        confidence: item.confidence || 0,
        trend: item.trend,
        averageResponseMs: 0,
        errorType: item.errorType
      };
      const pattern = this.inferPattern(topic);
      return {
        ...topic,
        priority: item.score,
        reasons: item.reasons,
        pattern,
        method: this.recommendedMethod(pattern, topic)
      };
    });
  },

  learningProfile(strategies, topics) {
    const strongest = strategies.find(item =>
      item.attempts >= 3 && item.confidence >= 35
    );
    const conceptual = topics.filter(item => item.pattern.key === "concept-rebuild").length;
    const spacing = topics.filter(item => item.pattern.key === "spacing-adjustment").length;
    const careful = topics.filter(item => item.pattern.key === "careful-reading").length;

    let headline = "Perfil ainda em observação";
    let explanation = "O sistema precisa de mais respostas e revisões para comparar estratégias.";

    if (strongest) {
      headline = `${strongest.label} apresenta o melhor resultado observado`;
      explanation = `${strongest.accuracy}% de precisão em ${strongest.attempts} tentativa${strongest.attempts === 1 ? "" : "s"}, com confiança ${strongest.confidence}%.`;
    }

    if (conceptual >= 2) {
      headline = "Reconstrução conceitual deve vir antes de mais questões";
      explanation = `${conceptual} tópicos apresentam erro recorrente, sugerindo revisão da base.`;
    } else if (spacing >= 2) {
      headline = "Ajuste dos intervalos de revisão é prioritário";
      explanation = `${spacing} tópicos mostram recuperação instável após revisão.`;
    } else if (careful >= 2) {
      headline = "Controle do ritmo pode melhorar a precisão";
      explanation = `${careful} tópicos apresentam indício de resposta apressada.`;
    }

    return {
      headline,
      explanation,
      strongestStrategy: strongest || null
    };
  },

  confidence(strategies, topics) {
    const observations = strategies.reduce((sum, item) => sum + item.attempts, 0);
    const topicCount = topics.filter(item => item.attempts >= 2).length;
    const score = Math.min(100, observations * 4 + topicCount * 5);

    return {
      score,
      label: score >= 70 ? "Média-alta" : score >= 45 ? "Média" : "Baixa"
    };
  },

  calculate() {
    const strategies = this.strategyMetrics();
    const topics = this.recommendedTopics();
    const profile = this.learningProfile(strategies, topics);

    return {
      generatedAt: new Date().toISOString(),
      profile,
      confidence: this.confidence(strategies, topics),
      strategies,
      topics,
      bestNextMethod: topics[0]?.method || null,
      disclaimer: "O Coach compara resultados observados dentro da plataforma. Ele não determina estilo fixo de aprendizagem, capacidade intelectual, diagnóstico pedagógico ou preferência permanente."
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
      confidence: analysis.confidence.label,
      bestMethod: analysis.bestNextMethod?.label || null,
      trigger
    });
    this.save();
    return analysis;
  },

  current() {
    return this.state.lastAnalysis || this.refresh("missing");
  },

  startMethod(topicId) {
    const recommendation = this.current().topics.find(item => item.topicId === topicId);
    if (!recommendation) return false;

    this.state.strategyAssignments.push({
      timestamp: new Date().toISOString(),
      topicId,
      strategy: recommendation.pattern.strategy,
      method: recommendation.method.label
    });
    this.save();

    if (recommendation.pattern.strategy === "practice" ||
        recommendation.pattern.strategy === "guided-practice") {
      ONC.UI?.showSection?.("questionBankSection");
      const subject = document.getElementById("bankSubject");
      const search = document.getElementById("bankSearch");
      if (subject) subject.value = recommendation.discipline;
      if (search) search.value = recommendation.title;
      ONC.Questions?.render?.();
      return true;
    }

    return ONC.SmartNavigator?.goToTopic?.(topicId, {
      source: "learning-coach",
      reason: `O Coach recomendou ${recommendation.method.label.toLowerCase()} para este tópico.`,
      focus: true
    });
  },

  applyToDailyPlan() {
    const coach = ONC.DailyCoachEngine?.brief?.();
    const analysis = this.current();
    if (!coach?.plan?.length || !analysis.topics.length) return false;

    const methodByTopic = new Map(
      analysis.topics.map(item => [item.topicId, item.method])
    );

    coach.plan.forEach(task => {
      const method = methodByTopic.get(task.topicId);
      if (!method) return;
      task.learningMethod = method.label;
      task.methodSteps = method.steps;
      task.minutes = Math.max(task.minutes, Math.min(12, method.minutes));
      task.reasons = [
        ...(task.reasons || []),
        `método recomendado: ${method.label.toLowerCase()}`
      ];
    });

    ONC.DailyCoachEngine.state.lastBrief = coach;
    ONC.DailyCoachEngine.save();
    ONC.DailyCoachUI?.render?.();
    ONC.Notifications?.announce?.("Métodos de aprendizagem aplicados ao plano diário.");
    return true;
  }
};
