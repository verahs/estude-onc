window.ONC = window.ONC || {};

ONC.PerformancePredictionEngine = {
  state: {
    lastPrediction: null,
    history: [],
    version: 1
  },

  init() {
    this.load();
    this.refresh("startup");
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_performance_prediction_${current}`;
  },

  load() {
    this.state = {
      lastPrediction: null,
      history: [],
      version: 1,
      ...ONC.Storage.get(this.storageKey(), {})
    };
  },

  save() {
    this.state.history = this.state.history.slice(-200);
    ONC.Storage.set(this.storageKey(), this.state);
  },

  quizHistory() {
    return ONC.Storage.get("onc_quiz_history", [])
      .map(item => ({
        ...item,
        pct: Number(item.pct || 0),
        total: Number(item.total || 0),
        hits: Number(item.hits || 0)
      }))
      .filter(item => item.total > 0);
  },

  recentQuizStats() {
    const recent = this.quizHistory().slice(0, 8);
    if (!recent.length) {
      return {
        count: 0,
        average: null,
        weightedAverage: null,
        consistency: 0,
        minimum: null,
        maximum: null
      };
    }

    const totalQuestions = recent.reduce((sum, item) => sum + item.total, 0);
    const totalHits = recent.reduce((sum, item) => sum + item.hits, 0);
    const average = recent.reduce((sum, item) => sum + item.pct, 0) / recent.length;
    const weightedAverage = totalQuestions ? (totalHits / totalQuestions) * 100 : average;
    const deviation = recent.reduce((sum, item) =>
      sum + Math.abs(item.pct - average), 0
    ) / recent.length;
    const consistency = Math.max(0, Math.round(100 - deviation * 1.45));

    return {
      count: recent.length,
      average: Math.round(average),
      weightedAverage: Math.round(weightedAverage),
      consistency,
      minimum: Math.min(...recent.map(item => item.pct)),
      maximum: Math.max(...recent.map(item => item.pct))
    };
  },

  learningStats() {
    const overview = ONC.LearningAnalyticsEngine?.overview?.() || {};
    const profiles = ONC.LearningEngine?.allProfiles?.() || [];
    const attempted = profiles.filter(profile => profile.attempts > 0);
    const confidence = attempted.length
      ? attempted.reduce((sum, profile) => sum + Number(profile.confidence || 0), 0) / attempted.length
      : 0;
    const recentAccuracy = attempted.length
      ? attempted.reduce((sum, profile) => sum + Number(profile.recentAccuracy || 0), 0) / attempted.length
      : 0;
    const consistency = attempted.length
      ? attempted.reduce((sum, profile) => sum + Number(profile.consistency || 0), 0) / attempted.length
      : 0;

    return {
      mastery: Number(overview.averageMastery || 0),
      memory: Number(overview.averageMemory || 0),
      coverage: Number(overview.coverage || 0),
      preparation: Number(overview.preparation || 0),
      profileCount: attempted.length,
      confidence: Math.round(confidence),
      recentAccuracy: Math.round(recentAccuracy),
      consistency: Math.round(consistency)
    };
  },

  confidenceLevel(sample, profileCount, coverage) {
    const score = Math.min(100,
      Math.min(35, sample * 7) +
      Math.min(35, profileCount * 2) +
      Math.min(30, coverage * 0.3)
    );

    if (score >= 70) return { label: "Média-alta", score };
    if (score >= 45) return { label: "Média", score };
    return { label: "Baixa", score };
  },

  calculate() {
    const quiz = this.recentQuizStats();
    const learning = this.learningStats();

    const baseQuiz = quiz.weightedAverage ?? learning.recentAccuracy ?? 0;
    const sampleFactor = Math.min(1, quiz.count / 5);

    const point = Math.round(
      baseQuiz * (0.42 + sampleFactor * 0.18) +
      learning.mastery * 0.18 +
      learning.memory * 0.09 +
      learning.coverage * 0.07 +
      learning.consistency * 0.06
    );

    const clampedPoint = Math.max(0, Math.min(100, point));
    const confidence = this.confidenceLevel(
      quiz.count,
      learning.profileCount,
      learning.coverage
    );

    const uncertainty = Math.max(6, Math.round(
      20 -
      Math.min(8, quiz.count * 1.5) -
      Math.min(4, learning.profileCount * 0.18) -
      Math.min(3, learning.coverage * 0.03) +
      (100 - quiz.consistency) * 0.04
    ));

    const lower = Math.max(0, clampedPoint - uncertainty);
    const upper = Math.min(100, clampedPoint + uncertainty);

    const subjects = this.subjectPredictions();
    const risks = this.riskFactors(subjects, quiz, learning);
    const opportunities = this.opportunityFactors(subjects);
    const scenario = this.scenarioProjection(clampedPoint, confidence.score);

    return {
      generatedAt: new Date().toISOString(),
      point: clampedPoint,
      lower,
      upper,
      uncertainty,
      confidence,
      label: this.label(clampedPoint),
      quiz,
      learning,
      subjects,
      risks,
      opportunities,
      scenario,
      interpretation: this.interpretation(clampedPoint, lower, upper, confidence),
      disclaimer: "Estimativa interna de desempenho em atividades da plataforma. Não representa nota oficial, corte, classificação ou probabilidade de medalha."
    };
  },

  subjectPredictions() {
    const history = this.quizHistory();
    const subjects = ONC.LearningAnalyticsEngine?.subjects?.() || [];

    return subjects.map(subject => {
      const quizzes = history.filter(item => item.subject === subject.name);
      const quizAverage = quizzes.length
        ? Math.round(quizzes.reduce((sum, item) => sum + item.pct, 0) / quizzes.length)
        : null;

      const point = Math.round(
        (quizAverage ?? subject.average) * 0.5 +
        Number(subject.average || 0) * 0.28 +
        Number(subject.memoryAverage || 0) * 0.12 +
        Number(subject.coverage || 0) * 0.10
      );

      return {
        name: subject.name,
        point: Math.max(0, Math.min(100, point)),
        mastery: Number(subject.average || 0),
        memory: Number(subject.memoryAverage || 0),
        coverage: Number(subject.coverage || 0),
        quizAverage,
        quizCount: quizzes.length
      };
    }).sort((a, b) => b.point - a.point);
  },

  riskFactors(subjects, quiz, learning) {
    const risks = [];
    const weakest = [...subjects].sort((a, b) => a.point - b.point)[0];

    if (weakest && weakest.point < 55) {
      risks.push({
        key: "weak-discipline",
        title: `${weakest.name} concentra o maior risco`,
        detail: `Estimativa interna ${weakest.point}% • cobertura ${weakest.coverage}%.`
      });
    }
    if (learning.coverage < 40) {
      risks.push({
        key: "low-coverage",
        title: "Cobertura ainda limitada",
        detail: `Apenas ${learning.coverage}% dos tópicos possuem atividade registrada.`
      });
    }
    if (learning.memory < 55) {
      risks.push({
        key: "memory",
        title: "Retenção abaixo do ideal",
        detail: `Memória média estimada em ${learning.memory}%.`
      });
    }
    if (quiz.count < 3) {
      risks.push({
        key: "small-sample",
        title: "Amostra pequena de simulados",
        detail: "Faça ao menos três simulados para reduzir a incerteza."
      });
    }
    if (quiz.count && quiz.consistency < 60) {
      risks.push({
        key: "variability",
        title: "Resultados ainda variáveis",
        detail: `Consistência recente em ${quiz.consistency}%.`
      });
    }

    return risks.slice(0, 4);
  },

  opportunityFactors(subjects) {
    const opportunities = [];
    const ordered = [...subjects].sort((a, b) => a.point - b.point);

    ordered.slice(0, 2).forEach(subject => {
      const gain = Math.max(2, Math.min(8, Math.round(
        (100 - subject.point) * 0.08 +
        (100 - subject.coverage) * 0.03
      )));
      opportunities.push({
        subject: subject.name,
        title: `Reforçar ${subject.name}`,
        potentialGain: gain,
        detail: `Priorizar conteúdos com baixo domínio e cobertura pode elevar o índice interno em até ${gain} pontos.`
      });
    });

    return opportunities;
  },

  scenarioProjection(point, confidenceScore) {
    const coach = ONC.DailyCoachEngine?.brief?.();
    const plan = coach?.plan || [];
    const minutes = plan.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
    const priority = plan.length
      ? plan.reduce((sum, item) => sum + Number(item.score || 0), 0) / plan.length
      : 0;

    const expectedGain = plan.length
      ? Math.max(1, Math.min(7, Math.round(minutes / 8 + priority / 35)))
      : 0;

    const discounted = Math.round(expectedGain * Math.max(0.45, confidenceScore / 100));

    return {
      current: point,
      withDailyPlan: Math.min(100, point + discounted),
      estimatedGain: discounted,
      minutes,
      tasks: plan.length,
      note: plan.length
        ? "Cenário condicionado à conclusão do plano e a nova prática de verificação."
        : "Defina um plano no Coach Diário para gerar cenário de evolução."
    };
  },

  label(point) {
    if (point >= 80) return "Desempenho interno forte";
    if (point >= 65) return "Preparação consistente";
    if (point >= 45) return "Em desenvolvimento";
    return "Base ainda em construção";
  },

  interpretation(point, lower, upper, confidence) {
    return `O desempenho central estimado é ${point}%, com faixa provável interna de ${lower}% a ${upper}% e confiança ${confidence.label.toLowerCase()}.`;
  },

  calibration() {
    const history = this.quizHistory();
    if (history.length < 3) {
      return {
        available: false,
        sample: history.length,
        meanAbsoluteError: null,
        note: "São necessários ao menos três simulados para iniciar a calibração."
      };
    }

    const ordered = [...history].reverse();
    const errors = [];

    for (let index = 2; index < ordered.length; index += 1) {
      const previous = ordered.slice(Math.max(0, index - 3), index);
      const prediction = previous.reduce((sum, item) => sum + item.pct, 0) / previous.length;
      errors.push(Math.abs(prediction - ordered[index].pct));
    }

    const mae = errors.length
      ? Math.round(errors.reduce((sum, value) => sum + value, 0) / errors.length)
      : null;

    return {
      available: errors.length > 0,
      sample: errors.length,
      meanAbsoluteError: mae,
      note: mae === null
        ? "Calibração ainda indisponível."
        : `Nos testes retrospectivos, o erro absoluto médio foi de ${mae} pontos percentuais.`
    };
  },

  refresh(trigger = "manual") {
    const prediction = {
      ...this.calculate(),
      trigger,
      calibration: this.calibration()
    };

    this.state.lastPrediction = prediction;
    this.state.history.push({
      generatedAt: prediction.generatedAt,
      point: prediction.point,
      lower: prediction.lower,
      upper: prediction.upper,
      confidence: prediction.confidence.label,
      trigger
    });
    this.save();
    return prediction;
  },

  current() {
    return this.state.lastPrediction || this.refresh("missing");
  }
};
