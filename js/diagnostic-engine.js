window.ONC = window.ONC || {};

ONC.DiagnosticEngine = {
  library: null,
  state: { diagnoses: [], topicSummaries: {} },

  async init() {
    await this.loadLibrary();
    this.loadState();
    this.rebuildSummaries();
  },

  async loadLibrary() {
    try {
      const response = await fetch("./data/misconceptions.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.library = await response.json();
    } catch (error) {
      console.error("[Estude ONC] Taxonomia de diagnóstico", error);
      this.library = { categories: {}, comparisons: [] };
    }
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_diagnostic_engine_${current}`;
  },

  loadState() {
    this.state = ONC.Storage.get(this.storageKey(), {
      diagnoses: [],
      topicSummaries: {}
    });
  },

  save() {
    this.state.diagnoses = this.state.diagnoses.slice(-1500);
    ONC.Storage.set(this.storageKey(), this.state);
  },

  normalize(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  },

  latestLearningEvent(questionId) {
    return [...(ONC.LearningEngine?.state?.events || [])]
      .reverse()
      .find(event => event.questionId === questionId) || null;
  },

  diagnose(question, selectedValue, learningEvent = null) {
    const event = learningEvent || this.latestLearningEvent(question?.id);
    const topic = ONC.Attention?.findStudyTopic?.(question?.subject, question?.topic);
    const correct = Number(selectedValue) === Number(question?.answer);

    if (correct) {
      return {
        correct: true,
        category: null,
        label: "Aplicação correta",
        confidence: this.correctConfidence(topic?.id),
        evidence: ["a alternativa correta foi selecionada"],
        rootCause: null,
        skill: this.inferSkill(question),
        intervention: "Avançar ou praticar uma questão de variação maior.",
        limitations: "Acerto isolado não comprova domínio estável."
      };
    }

    const evidence = [];
    const candidates = [];

    this.addHistoryCandidates(candidates, evidence, topic?.id, event);
    this.addContentCandidates(candidates, evidence, question, selectedValue);
    this.addDistractorCandidates(candidates, evidence, question, selectedValue);

    if (!candidates.length) {
      candidates.push({ category: "insufficient-evidence", score: 0.28, source: "fallback" });
      evidence.push("há poucas evidências específicas para esta resposta");
    }

    const grouped = candidates.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.score;
      return acc;
    }, {});

    const ranked = Object.entries(grouped)
      .sort((a, b) => b[1] - a[1]);

    const [category, rawScore] = ranked[0];
    const secondScore = ranked[1]?.[1] || 0;
    const attempts = topic?.id ? ONC.LearningEngine.profile(topic.id).attempts : 0;
    const confidence = Math.round(Math.max(15, Math.min(92,
      35 + rawScore * 22 + Math.min(20, attempts * 2) + Math.min(15, (rawScore - secondScore) * 15)
    )));

    const definition = this.library?.categories?.[category] || {
      label: category,
      description: "Hipótese pedagógica.",
      intervention: "Revisar o conteúdo e tentar novamente."
    };

    const diagnosis = {
      id: `${Date.now()}-${question?.id || topic?.id || "unknown"}`,
      timestamp: new Date().toISOString(),
      questionId: question?.id || null,
      topicId: topic?.id || null,
      topic: topic?.title || question?.topic || "",
      discipline: topic?.discipline || question?.subject || "",
      selectedValue,
      answer: question?.answer,
      correct: false,
      category,
      label: definition.label,
      rootCause: definition.description,
      confidence,
      evidence: [...new Set(evidence)].slice(0, 5),
      alternatives: ranked.slice(1, 3).map(([key]) => ({
        category: key,
        label: this.library?.categories?.[key]?.label || key
      })),
      skill: this.inferSkill(question),
      intervention: definition.intervention,
      prerequisite: this.prerequisite(topic?.id),
      limitations: confidence < 50
        ? "Hipótese preliminar: são necessárias mais respostas variadas."
        : "Hipótese baseada no histórico local; não constitui diagnóstico profissional."
    };

    this.state.diagnoses.push(diagnosis);
    this.rebuildTopic(topic?.id);
    this.save();
    return diagnosis;
  },

  addHistoryCandidates(candidates, evidence, topicId, event) {
    if (!topicId) return;
    const profile = ONC.LearningEngine?.profile?.(topicId) || {};
    const mastery = ONC.MasteryEngine?.get?.(topicId)?.score || 0;

    if (event?.errorType === "distraction") {
      candidates.push({ category: "attention-speed", score: 1.3 });
      evidence.push("a resposta foi muito rápida para o padrão deste tópico");
    }
    if (event?.errorType === "post-review" || profile.forgettingCount > 0) {
      candidates.push({ category: "memory-retrieval", score: 1.2 });
      evidence.push("houve erro após uma revisão registrada");
    }
    if (event?.errorType === "recurring" || (profile.errors || 0) >= 3) {
      candidates.push({ category: "concept-confusion", score: 0.85 });
      candidates.push({ category: "procedural-step", score: 0.65 });
      evidence.push("o erro se repete no histórico recente");
    }
    if (event?.errorType === "unstable-mastery" || mastery >= 70) {
      candidates.push({ category: "memory-retrieval", score: 0.9 });
      evidence.push("o tópico tinha domínio anterior elevado");
    }
    if ((profile.confidence || 0) < 35) {
      candidates.push({ category: "insufficient-evidence", score: 0.6 });
      evidence.push("a confiança estatística do tópico ainda é baixa");
    }
    if ((profile.averageResponseMs || 0) > 80000) {
      candidates.push({ category: "procedural-step", score: 0.55 });
      evidence.push("o tempo de resposta está acima do padrão esperado");
    }
  },

  addContentCandidates(candidates, evidence, question, selectedValue) {
    const corpus = this.normalize([
      question?.topic,
      question?.q,
      question?.intro,
      question?.explanation,
      ...(question?.options || [])
    ].join(" "));

    for (const comparison of this.library?.comparisons || []) {
      const matched = comparison.terms.filter(term =>
        corpus.includes(this.normalize(term))
      );
      if (matched.length >= 2) {
        candidates.push({ category: comparison.category, score: 1.15 });
        evidence.push(`a questão exige distinguir ${comparison.terms.join(" e ")}`);
      }
    }

    if (/grafico|tabela|imagem|figura|mapa|diagrama/.test(corpus)) {
      candidates.push({ category: "reading-evidence", score: 0.85 });
      evidence.push("a questão depende de evidência visual ou tabular");
    }
    if (/por que|causa|consequencia|provoca|resulta|explica/.test(corpus)) {
      candidates.push({ category: "causal-reversal", score: 0.72 });
      evidence.push("a questão exige organizar causa e consequência");
    }
    if (/unidade|km|metro|hora|ano-luz|massa|volume|densidade|porcent/.test(corpus)) {
      candidates.push({ category: "scale-unit", score: 0.72 });
      evidence.push("a questão envolve grandeza, escala ou unidade");
    }
    if (/posicao|movimento|orbita|eixo|hemisferio|direcao|latitude|longitude/.test(corpus)) {
      candidates.push({ category: "spatial-model", score: 0.76 });
      evidence.push("a solução exige visualização de posição ou movimento");
    }
    if (/sempre|nunca|todos|somente|apenas/.test(
      this.normalize(question?.options?.[selectedValue] || "")
    )) {
      candidates.push({ category: "overgeneralization", score: 0.68 });
      evidence.push("a alternativa escolhida usa uma afirmação absoluta");
    }
  },

  addDistractorCandidates(candidates, evidence, question, selectedValue) {
    if (selectedValue === null || selectedValue === undefined) {
      candidates.push({ category: "reading-evidence", score: 0.5 });
      evidence.push("a questão foi finalizada sem alternativa marcada");
      return;
    }

    const selected = this.normalize(question?.options?.[selectedValue] || "");
    const correct = this.normalize(question?.options?.[question?.answer] || "");

    const selectedTokens = new Set(selected.split(/\s+/).filter(token => token.length > 3));
    const correctTokens = new Set(correct.split(/\s+/).filter(token => token.length > 3));
    const overlap = [...selectedTokens].filter(token => correctTokens.has(token)).length;

    if (overlap >= 2) {
      candidates.push({ category: "concept-confusion", score: 0.7 });
      evidence.push("a alternativa escolhida é semanticamente próxima da correta");
    } else {
      candidates.push({ category: "reading-evidence", score: 0.42 });
      evidence.push("a alternativa escolhida se afasta dos elementos centrais da resposta correta");
    }
  },

  inferSkill(question) {
    const corpus = this.normalize(`${question?.subject || ""} ${question?.topic || ""} ${question?.q || ""}`);
    const rules = [
      [/rotacao|translacao|orbita|eclipse|lua|solsticio/, "modelagem de movimentos astronômicos"],
      [/latitude|longitude|coordenada|mapa|bussola/, "orientação e leitura espacial"],
      [/densidade|massa|volume|proporcao|porcentagem/, "raciocínio quantitativo e proporcional"],
      [/calor|temperatura|energia/, "relações de energia térmica"],
      [/celula|orgao|sistema|tecido/, "organização biológica"],
      [/mistura|substancia|reacao|transformacao/, "classificação e transformação da matéria"],
      [/fonte|tempo historico|patrimonio|colonizacao/, "interpretação histórica e evidências"]
    ];
    return rules.find(([pattern]) => pattern.test(corpus))?.[1] ||
      `compreensão de ${question?.topic || "conceito científico"}`;
  },

  prerequisite(topicId) {
    if (!topicId) return null;
    const prerequisite = ONC.KnowledgeGraph?.prerequisites?.(topicId)?.[0]?.topic;
    return prerequisite
      ? { topicId: prerequisite.id, title: prerequisite.title }
      : null;
  },

  correctConfidence(topicId) {
    if (!topicId) return 25;
    return ONC.LearningEngine?.profile?.(topicId)?.confidence || 25;
  },

  rebuildSummaries() {
    const ids = new Set(this.state.diagnoses.map(item => item.topicId).filter(Boolean));
    ids.forEach(id => this.rebuildTopic(id));
    this.save();
  },

  rebuildTopic(topicId) {
    if (!topicId) return null;
    const list = this.state.diagnoses.filter(item => item.topicId === topicId && !item.correct);
    const counts = list.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});
    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const recent = list.slice(-5);
    const averageConfidence = recent.length
      ? Math.round(recent.reduce((sum, item) => sum + item.confidence, 0) / recent.length)
      : 0;

    const summary = {
      topicId,
      diagnoses: list.length,
      dominantCategory: dominant?.[0] || null,
      dominantLabel: dominant
        ? this.library?.categories?.[dominant[0]]?.label || dominant[0]
        : null,
      averageConfidence,
      recent: recent.reverse()
    };
    this.state.topicSummaries[topicId] = summary;
    return summary;
  },

  summary(topicId) {
    return this.state.topicSummaries[topicId] || this.rebuildTopic(topicId);
  },

  rootCauseClusters() {
    const groups = {};
    this.state.diagnoses.filter(item => !item.correct).forEach(item => {
      const key = `${item.skill}::${item.category}`;
      if (!groups[key]) {
        groups[key] = {
          skill: item.skill,
          category: item.category,
          label: item.label,
          count: 0,
          topics: new Set(),
          confidenceTotal: 0
        };
      }
      groups[key].count += 1;
      groups[key].topics.add(item.topic);
      groups[key].confidenceTotal += item.confidence;
    });

    return Object.values(groups)
      .map(item => ({
        ...item,
        topics: [...item.topics],
        confidence: Math.round(item.confidenceTotal / item.count)
      }))
      .sort((a, b) => b.count - a.count || b.confidence - a.confidence);
  }
};
