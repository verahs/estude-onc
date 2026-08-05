window.ONC = window.ONC || {};

ONC.AdvancedAnalytics = {
  init() {},

  weeklyActivity() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return {
        date: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        minutes: 0,
        topics: new Set(),
        questions: 0,
        correct: 0
      };
    });

    const map = new Map(days.map(day => [day.date, day]));

    (ONC.StudyHistory?.state?.sessions || []).forEach(session => {
      const day = map.get(session.date);
      if (!day) return;
      day.minutes += Math.round(Number(session.seconds || 0) / 60);
      if (session.topicId) day.topics.add(session.topicId);
    });

    (ONC.StudyHistory?.state?.topicEvents || []).forEach(event => {
      const date = event.timestamp?.slice(0, 10);
      const day = map.get(date);
      if (!day) return;
      if (event.topicId) day.topics.add(event.topicId);
    });

    (ONC.StudyHistory?.state?.questionAttempts || []).forEach(attempt => {
      const date = attempt.timestamp?.slice(0, 10);
      const day = map.get(date);
      if (!day) return;
      day.questions += 1;
      if (attempt.correct) day.correct += 1;
    });

    return days.map(day => ({
      ...day,
      topics: day.topics.size
    }));
  },

  weeklySummary() {
    const activity = this.weeklyActivity();
    const minutes = activity.reduce((sum, day) => sum + day.minutes, 0);
    const topics = activity.reduce((sum, day) => sum + day.topics, 0);
    const questions = activity.reduce((sum, day) => sum + day.questions, 0);
    const correct = activity.reduce((sum, day) => sum + day.correct, 0);
    const activeDays = activity.filter(day =>
      day.minutes > 0 || day.topics > 0 || day.questions > 0
    ).length;

    return {
      minutes,
      topics,
      questions,
      correct,
      accuracy: questions ? Math.round((correct / questions) * 100) : 0,
      activeDays,
      activity
    };
  },

  guardianSummary() {
    const overview = ONC.LearningAnalyticsEngine.overview();
    const week = this.weeklySummary();
    const attention = ONC.Attention?.allAlerts?.() || [];
    const priority = ONC.LearningAnalyticsEngine.priorityTopics({ limit: 3 });

    return {
      student: ONC.Users?.current?.name || "Estudante",
      role: ONC.Users?.current?.role || "aluno",
      week,
      overview,
      attentionCount: attention.length,
      mainAttention: attention[0] || null,
      priority
    };
  },

  radarData() {
    return ONC.LearningAnalyticsEngine.subjects().map(subject => ({
      label: subject.name,
      value: subject.average,
      memory: subject.memoryAverage,
      coverage: subject.coverage
    }));
  },

  insightCards() {
    const subjects = ONC.LearningAnalyticsEngine.subjects();
    const strongest = [...subjects].sort((a, b) => b.average - a.average)[0];
    const weakest = [...subjects].sort((a, b) => a.average - b.average)[0];
    const bestCoverage = [...subjects].sort((a, b) => b.coverage - a.coverage)[0];

    return [
      strongest && {
        icon: "💪",
        title: "Maior domínio",
        value: strongest.name,
        detail: `${strongest.average}% de domínio médio`
      },
      weakest && {
        icon: "🎯",
        title: "Maior oportunidade",
        value: weakest.name,
        detail: `${weakest.average}% de domínio médio`
      },
      bestCoverage && {
        icon: "📚",
        title: "Maior cobertura",
        value: bestCoverage.name,
        detail: `${bestCoverage.coverage}% dos tópicos iniciados`
      }
    ].filter(Boolean);
  }
};
