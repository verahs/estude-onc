window.ONC = window.ONC || {};

ONC.ExamStudyPlannerEngine = {
  DEFAULT_EXAM_DATE: "2026-08-13",

  state: {
    examDate: "2026-08-13",
    lastCalculatedAt: null,
    version: 1
  },

  init() {
    this.load();
    this.recalculate("startup");
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_exam_study_planner_${current}`;
  },

  load() {
    this.state = {
      examDate: this.DEFAULT_EXAM_DATE,
      lastCalculatedAt: null,
      version: 1,
      ...ONC.Storage.get(this.storageKey(), {})
    };

    if (!this.isValidDate(this.state.examDate)) {
      this.state.examDate = this.DEFAULT_EXAM_DATE;
    }
  },

  save() {
    ONC.Storage.set(this.storageKey(), this.state);
  },

  isValidDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) &&
      !Number.isNaN(new Date(`${value}T12:00:00`).getTime());
  },

  localMidnight(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  },

  parseLocalDate(value) {
    const [year, month, day] = String(value).split("-").map(Number);
    return new Date(year, month - 1, day);
  },

  daysUntilExam(examDate = this.state.examDate, now = new Date()) {
    if (!this.isValidDate(examDate)) return null;

    const today = this.localMidnight(now);
    const exam = this.parseLocalDate(examDate);
    return Math.ceil((exam - today) / 86400000);
  },

  studyDays(daysRemaining) {
    if (daysRemaining <= 0) return 0;
    const restDays = Math.floor(daysRemaining / 7);
    return Math.max(1, daysRemaining - restDays);
  },

  dailyHours(daysRemaining) {
    if (daysRemaining < 0) return 0;
    if (daysRemaining === 0) return 1;
    if (daysRemaining <= 3) return 2.5;
    if (daysRemaining <= 7) return 2;
    if (daysRemaining <= 14) return 1.5;
    if (daysRemaining <= 30) return 1;
    return 0.75;
  },

  urgency(daysRemaining) {
    if (daysRemaining < 0) {
      return {
        key: "past",
        label: "Data encerrada",
        message: "A data cadastrada já passou. Atualize a data da próxima prova."
      };
    }

    if (daysRemaining === 0) {
      return {
        key: "today",
        label: "Prova hoje",
        message: "Priorize revisão leve, organização e descanso. Evite conteúdo novo."
      };
    }

    if (daysRemaining <= 3) {
      return {
        key: "critical",
        label: "Reta final",
        message: "Use blocos curtos, revisão ativa e simulados direcionados. Preserve o sono."
      };
    }

    if (daysRemaining <= 7) {
      return {
        key: "high",
        label: "Alta prioridade",
        message: "Concentre o estudo nos tópicos críticos e mantenha revisões diárias."
      };
    }

    if (daysRemaining <= 14) {
      return {
        key: "moderate",
        label: "Planejamento intensivo",
        message: "Há tempo para combinar conteúdo, revisão e simulados com equilíbrio."
      };
    }

    if (daysRemaining <= 30) {
      return {
        key: "planned",
        label: "Planejamento regular",
        message: "Distribua o conteúdo e reserve ao menos um dia de descanso por semana."
      };
    }

    return {
      key: "comfortable",
      label: "Prazo confortável",
      message: "Mantenha constância e avance sem sobrecarga."
    };
  },

  sessionPlan(hours) {
    if (hours <= 0) return "Nenhuma carga sugerida.";
    if (hours <= 0.75) return "1 bloco de 40–45 minutos.";
    if (hours <= 1) return "2 blocos de 25 minutos, com pequena pausa.";
    if (hours <= 1.5) return "2 blocos de 40 minutos + 10 minutos de revisão.";
    if (hours <= 2) return "3 blocos de 35 minutos, com pausas.";
    return "3 blocos de 45 minutos, com pausas e encerramento leve.";
  },

  priorityMix(daysRemaining) {
    if (daysRemaining < 0) {
      return [];
    }

    if (daysRemaining === 0) {
      return [
        { label: "Revisão leve", percent: 60 },
        { label: "Organização", percent: 20 },
        { label: "Descanso", percent: 20 }
      ];
    }

    if (daysRemaining <= 3) {
      return [
        { label: "Revisão de erros", percent: 45 },
        { label: "Simulado direcionado", percent: 30 },
        { label: "Conteúdo crítico", percent: 25 }
      ];
    }

    if (daysRemaining <= 7) {
      return [
        { label: "Conteúdo crítico", percent: 40 },
        { label: "Revisão", percent: 35 },
        { label: "Simulado", percent: 25 }
      ];
    }

    return [
      { label: "Conteúdo", percent: 50 },
      { label: "Revisão", percent: 30 },
      { label: "Simulado", percent: 20 }
    ];
  },

  calculate(now = new Date()) {
    const daysRemaining = this.daysUntilExam(this.state.examDate, now);
    const studyDays = this.studyDays(daysRemaining);
    const dailyHours = this.dailyHours(daysRemaining);
    const totalHours = Number((studyDays * dailyHours).toFixed(1));
    const urgency = this.urgency(daysRemaining);

    return {
      examDate: this.state.examDate,
      today: this.localMidnight(now).toISOString().slice(0, 10),
      daysRemaining,
      studyDays,
      restDays: Math.max(0, daysRemaining - studyDays),
      dailyHours,
      totalHours,
      urgency,
      sessionPlan: this.sessionPlan(dailyHours),
      mix: this.priorityMix(daysRemaining),
      generatedAt: new Date().toISOString(),
      disclaimer: "A carga é uma referência de organização, não uma obrigação. Sono, escola, saúde e sinais de fadiga devem reduzir a carga quando necessário."
    };
  },

  setExamDate(value) {
    if (!this.isValidDate(value)) return false;
    this.state.examDate = value;
    this.save();
    this.recalculate("date-change");
    return true;
  },

  resetDefault() {
    this.state.examDate = this.DEFAULT_EXAM_DATE;
    this.save();
    this.recalculate("reset-default");
  },

  recalculate(trigger = "manual") {
    const result = {
      ...this.calculate(),
      trigger
    };

    this.state.lastCalculatedAt = result.generatedAt;
    this.save();
    ONC.ExamStudyPlannerUI?.render?.();
    return result;
  }
};
