window.ONC = window.ONC || {};

ONC.AssessmentEngine = {
  init() {},

  difficultyValue(value) {
    const map = { "Fácil": 1, "Média": 2, "Difícil": 3 };
    return map[value] || 2;
  },

  topicForQuestion(question) {
    return ONC.Attention?.findStudyTopic(question.subject, question.topic) || null;
  },

  questionScore(question) {
    const topic = this.topicForQuestion(question);
    const topicId = topic?.id;
    const mastery = topicId ? ONC.MasteryEngine.get(topicId).score : 0;
    const memory = topicId ? ONC.MemoryEngine.status(topicId) : { forget: 50 };
    const attention = topicId ? ONC.Attention.evaluate(topicId) : null;
    const recurrence = topic?.recurrence || 0;
    const seen = ONC.Quiz?.seen?.[question.id] ? 1 : 0;

    let score = 0;
    score += (100 - mastery) * 0.35;
    score += memory.forget * 0.25;
    score += attention ? 28 : 0;
    score += recurrence * 1.3;
    score += seen ? -12 : 8;

    return {
      question,
      topicId,
      mastery,
      forget: memory.forget,
      recurrence,
      attention: Boolean(attention),
      score
    };
  },

  adaptivePool({ subject = "", count = 10 } = {}) {
    let pool = ONC_DATA.questions.filter(q => !subject || q.subject === subject);
    const scored = pool.map(q => this.questionScore(q));

    scored.sort((a, b) =>
      b.score - a.score ||
      b.recurrence - a.recurrence ||
      Math.random() - 0.5
    );

    // Balance difficulties while preserving priority.
    const target = { 1: 0.3, 2: 0.5, 3: 0.2 };
    const selected = [];
    const byDifficulty = { 1: [], 2: [], 3: [] };

    scored.forEach(item => {
      byDifficulty[this.difficultyValue(item.question.difficulty)].push(item);
    });

    [1, 2, 3].forEach(level => {
      const quota = Math.round(count * target[level]);
      selected.push(...byDifficulty[level].slice(0, quota));
    });

    for (const item of scored) {
      if (selected.length >= count) break;
      if (!selected.includes(item)) selected.push(item);
    }

    return selected.slice(0, count).map(item => item.question);
  },

  reasonForQuestion(question) {
    const item = this.questionScore(question);
    const reasons = [];
    if (item.attention) reasons.push("erro recente");
    if (item.mastery < 40) reasons.push("domínio baixo");
    if (item.forget >= 60) reasons.push("memória precisa de revisão");
    if (item.recurrence >= 8) reasons.push("alta recorrência");
    if (!reasons.length) reasons.push("equilíbrio do simulado");
    return reasons.join(" • ");
  },

  diagnostic(question, selectedValue) {
    const correct = selectedValue === question.answer;
    const topic = this.topicForQuestion(question);
    const selectedText = selectedValue === null
      ? "Nenhuma alternativa"
      : `${"ABCDE"[selectedValue]}. ${question.options[selectedValue]}`;
    const correctText = `${"ABCDE"[question.answer]}. ${question.options[question.answer]}`;

    if (correct) {
      return {
        correct: true,
        title: "Você aplicou o conceito corretamente.",
        selectedText,
        correctText,
        message: question.explanation,
        action: topic ? `Continue praticando ${topic.title} para consolidar o domínio.` : "Continue praticando."
      };
    }

    return {
      correct: false,
      title: "Vamos corrigir o raciocínio.",
      selectedText,
      correctText,
      message: question.explanation,
      action: topic
        ? `Revise o tópico “${topic.title}” antes de tentar outra questão semelhante.`
        : `Revise o conceito de ${question.topic}.`
    };
  },

  performanceEstimate() {
    return ONC.LearningAnalyticsEngine.performanceEstimate();
  },

  heatmap() {
    return ONC.LearningAnalyticsEngine.heatmap();
  }
};
