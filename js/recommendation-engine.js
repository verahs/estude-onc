window.ONC = window.ONC || {};

ONC.RecommendationEngine = {
  cache: [],
  audit: [],

  init() {
    this.refresh("startup");
  },

  refresh(trigger = "manual", topicId = null) {
    this.cache = ONC.MasteryEngine.topicIndex
      .map(topic => this.calculate(topic.id))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || b.confidenceGap - a.confidenceGap);

    this.audit.unshift({
      timestamp: new Date().toISOString(),
      trigger,
      topicId,
      top: this.cache.slice(0, 5).map(item => ({
        topicId: item.topicId,
        score: item.score,
        reasons: item.reasons
      }))
    });
    this.audit = this.audit.slice(0, 100);
    ONC.Storage.set("onc_recommendation_audit", this.audit);
    return this.cache;
  },

  normalize(value, maximum = 100) {
    return Math.max(0, Math.min(1, Number(value || 0) / maximum));
  },

  calculate(topicId) {
    const topic = ONC.KnowledgeGraph.node(topicId) ||
      ONC.MasteryEngine.topicIndex.find(item => item.id === topicId);
    if (!topic) return null;

    const learning = ONC.LearningEngine.profile(topicId);
    const mastery = ONC.MasteryEngine.get(topicId);
    const memory = ONC.MemoryEngine.status(topicId);
    const attention = ONC.Attention.evaluate(topicId);
    const priority = ONC.PriorityEngine.calculate(topicId);
    const graphRisk = ONC.KnowledgeGraph.riskPropagation(
      topicId,
      (100 - mastery.score) / 100
    );
    const graphWeight = Math.min(100,
      graphRisk.reduce((sum, item) => sum + item.risk, 0) / Math.max(1, graphRisk.length)
    );

    const factors = {
      historicalRecurrence: this.normalize(topic.recurrence, 12),
      recentError: attention ? this.normalize(attention.score, 5) : 0,
      forgetting: this.normalize(memory.forget),
      lowMastery: this.normalize(100 - mastery.score),
      inactivity: this.normalize(priority?.daysInactive || 0, 21),
      responseDifficulty: learning.averageResponseMs
        ? this.normalize(learning.averageResponseMs, 90000)
        : 0.35,
      confidenceGap: this.normalize(100 - learning.confidence),
      dependencyRisk: this.normalize(graphWeight)
    };

    const weights = {
      historicalRecurrence: 0.18,
      recentError: 0.22,
      forgetting: 0.14,
      lowMastery: 0.20,
      inactivity: 0.08,
      responseDifficulty: 0.05,
      confidenceGap: 0.07,
      dependencyRisk: 0.06
    };

    const score = Math.round(Object.keys(weights).reduce(
      (sum, key) => sum + factors[key] * weights[key] * 100,
      0
    ));

    const reasons = this.explain(topic, learning, mastery, memory, attention, priority, graphRisk);
    return {
      topicId,
      title: topic.title,
      discipline: topic.discipline,
      score,
      mastery: mastery.score,
      confidence: learning.confidence,
      confidenceGap: 100 - learning.confidence,
      memory: memory.memory,
      trend: learning.trend,
      errorType: ONC.LearningEngine.strongestErrorType(topicId),
      factors,
      weights,
      reasons,
      graphRisk: graphRisk.slice(0, 3),
      action: this.action(learning, mastery, memory, attention)
    };
  },

  explain(topic, learning, mastery, memory, attention, priority, graphRisk) {
    const reasons = [];
    if (attention?.errors) {
      reasons.push(`você errou ${attention.errors} vez${attention.errors === 1 ? "" : "es"} neste tema`);
    }
    if (learning.errorTypes?.recurring) reasons.push("o erro está se repetindo");
    if (learning.errorTypes?.distraction) reasons.push("há indício de resposta apressada");
    if (memory.forget >= 70) reasons.push("a retenção está em risco");
    else if (memory.forget >= 45) reasons.push("a memória precisa de consolidação");
    if (mastery.score < 25) reasons.push("o domínio ainda é inicial");
    else if (mastery.score < 50) reasons.push("o domínio ainda está em desenvolvimento");
    if (learning.confidence < 45) reasons.push("a confiança estatística ainda é baixa");
    if (learning.trend === "falling") reasons.push("o desempenho recente caiu");
    if (topic.recurrence >= 10) reasons.push("é muito recorrente nas provas analisadas");
    else if (topic.recurrence >= 8) reasons.push("é recorrente nas provas analisadas");
    if (priority?.daysInactive >= 7) reasons.push(`${priority.daysInactive} dias sem atividade`);
    const diagnosis = ONC.DiagnosticEngine?.summary?.(topic.id);
    if (diagnosis?.dominantLabel) {
      reasons.push(`padrão provável: ${diagnosis.dominantLabel.toLowerCase()}`);
    }
    if (graphRisk.length) reasons.push("este tópico influencia conteúdos relacionados");
    return reasons.slice(0, 5);
  },

  action(learning, mastery, memory, attention) {
    if (attention?.errors || memory.forget >= 70) return "review";
    if (mastery.reading < 55) return "study";
    if (mastery.quiz < 70 || learning.confidence < 55) return "practice";
    return "consolidate";
  },

  rank(options = {}) {
    const { limit = null, discipline = null, excludeMastered = true } = options;
    let list = this.cache.length ? [...this.cache] : this.refresh("rank");
    if (discipline) list = list.filter(item => item.discipline === discipline);
    if (excludeMastered) list = list.filter(item => item.mastery < 85);
    return limit ? list.slice(0, limit) : list;
  },

  next() {
    return this.rank({ limit: 1 })[0] || null;
  }
};
