window.ONC = window.ONC || {};

ONC.DailyCoachEngine = {
  state: {
    availableMinutes: 15,
    dismissedDate: null,
    lastBrief: null,
    version: 1
  },

  init() {
    this.load();
    this.refresh("startup");
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_daily_coach_${current}`;
  },

  todayKey() {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("-");
  },

  load() {
    this.state = {
      availableMinutes: 15,
      dismissedDate: null,
      lastBrief: null,
      version: 1,
      ...ONC.Storage.get(this.storageKey(), {})
    };
  },

  save() {
    ONC.Storage.set(this.storageKey(), this.state);
  },

  setAvailableMinutes(minutes) {
    const allowed = [5, 10, 15, 20, 30];
    this.state.availableMinutes = allowed.includes(Number(minutes))
      ? Number(minutes)
      : 15;
    this.save();
    this.refresh("time-change");
    ONC.DailyCoachUI?.render?.();
  },

  greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  },

  studentName() {
    return ONC.Users?.current?.name || "Estudante";
  },

  daysSinceActivity() {
    const timestamps = [
      ...(ONC.StudyHistory?.state?.topicEvents || []).map(item => item.timestamp),
      ...(ONC.StudyHistory?.state?.questionAttempts || []).map(item => item.timestamp),
      ...(ONC.StudyHistory?.state?.sessions || []).map(item =>
        item.timestamp || (item.date ? `${item.date}T12:00:00` : null)
      )
    ].filter(Boolean);

    if (!timestamps.length) return null;
    const latest = Math.max(...timestamps.map(value => new Date(value).getTime()));
    return Math.max(0, Math.floor((Date.now() - latest) / 86400000));
  },

  activeDays(period = 7) {
    const limit = Date.now() - period * 86400000;
    const dates = new Set();

    [
      ...(ONC.StudyHistory?.state?.topicEvents || []),
      ...(ONC.StudyHistory?.state?.questionAttempts || []),
      ...(ONC.StudyHistory?.state?.sessions || [])
    ].forEach(item => {
      const raw = item.timestamp || (item.date ? `${item.date}T12:00:00` : null);
      if (!raw) return;
      const time = new Date(raw).getTime();
      if (time >= limit) dates.add(new Date(time).toISOString().slice(0, 10));
    });

    return dates.size;
  },

  disciplineBalance() {
    const subjects = ONC.LearningAnalyticsEngine?.subjects?.() || [];
    if (!subjects.length) return null;

    const sorted = [...subjects].sort((a, b) => a.average - b.average);
    return {
      weakest: sorted[0],
      strongest: sorted.at(-1),
      gap: Math.max(0, (sorted.at(-1)?.average || 0) - (sorted[0]?.average || 0))
    };
  },

  behaviorFlags() {
    const flags = [];
    const daysInactive = this.daysSinceActivity();
    const activeDays = this.activeDays(7);
    const navigation = ONC.NavigationHistory?.analytics?.() || {};
    const week = ONC.AdvancedAnalytics?.weeklySummary?.() || {
      questions: 0,
      minutes: 0,
      activeDays: 0
    };
    const events = ONC.LearningEngine?.state?.events || [];
    const recent = events.slice(-12);
    const quickErrors = recent.filter(event =>
      !event.correct && event.errorType === "distraction"
    ).length;
    const simulations = recent.filter(event => event.simulationMode).length;
    const readingEvents = (ONC.StudyHistory?.state?.topicEvents || [])
      .filter(event => ["opened", "completed", "smart-navigation-complete"].includes(event.type))
      .slice(-20).length;

    if (daysInactive !== null && daysInactive >= 3) {
      flags.push({
        key: "inactivity",
        severity: daysInactive >= 7 ? "high" : "medium",
        title: `${daysInactive} dias sem atividade registrada`,
        message: "Retome com uma sessão curta para reduzir a resistência de início.",
        action: "Começar por 5 minutos"
      });
    }

    if (activeDays <= 1 && week.minutes > 20) {
      flags.push({
        key: "concentration",
        severity: "medium",
        title: "Estudo concentrado em poucos dias",
        message: "Distribuir sessões tende a favorecer a retenção.",
        action: "Fazer sessões menores"
      });
    }

    if (quickErrors >= 2) {
      flags.push({
        key: "rushing",
        severity: "medium",
        title: "Respostas apressadas recorrentes",
        message: "Leia o comando e elimine alternativas antes de confirmar.",
        action: "Ativar ritmo cuidadoso"
      });
    }

    if (simulations >= 5 && readingEvents < 2) {
      flags.push({
        key: "simulation-only",
        severity: "medium",
        title: "Muita prática e pouca revisão conceitual",
        message: "Intercale simulados com leitura dos tópicos em atenção.",
        action: "Revisar antes do próximo simulado"
      });
    }

    if ((navigation.opens || 0) >= 3 && (navigation.completionRate || 0) < 35) {
      flags.push({
        key: "abandonment",
        severity: "medium",
        title: "Recomendações abertas, mas pouco concluídas",
        message: "Reduza o plano do dia e conclua uma ação por vez.",
        action: "Simplificar plano"
      });
    }

    return flags;
  },

  taskEstimate(item) {
    if (item.action === "review") return 3;
    if (item.action === "study") return 5;
    if (item.action === "practice") return 7;
    return 4;
  },

  plan(minutes = this.state.availableMinutes) {
    const ranked = ONC.RecommendationEngine?.rank?.({
      limit: 20,
      excludeMastered: true
    }) || [];

    const plan = [];
    let remaining = Number(minutes || 15);
    const disciplines = new Set();

    for (const item of ranked) {
      if (remaining <= 0 || plan.length >= 4) break;
      const estimate = this.taskEstimate(item);

      if (estimate > remaining && plan.length) continue;

      const sameDiscipline = disciplines.has(item.discipline);
      const alternativeExists = ranked.some(candidate =>
        !disciplines.has(candidate.discipline) &&
        !plan.some(task => task.topicId === candidate.topicId)
      );
      if (sameDiscipline && alternativeExists && plan.length < 2) continue;

      const allotted = Math.min(estimate, remaining);
      plan.push({
        id: `coach-${item.topicId}`,
        topicId: item.topicId,
        title: item.title,
        discipline: item.discipline,
        action: item.action,
        minutes: allotted,
        score: item.score,
        confidence: item.confidence,
        reasons: item.reasons.slice(0, 3),
        navigation: item.action === "review" ? "revision" : "weakness"
      });
      disciplines.add(item.discipline);
      remaining -= allotted;
    }

    if (remaining >= 4 && plan.length < 4) {
      const target = ranked.find(item =>
        !plan.some(task => task.topicId === item.topicId)
      ) || ranked[0];

      if (target) {
        plan.push({
          id: `coach-practice-${target.topicId}`,
          topicId: target.topicId,
          title: `Questões de ${target.discipline}`,
          discipline: target.discipline,
          action: "questions",
          minutes: Math.min(remaining, 6),
          score: target.score,
          confidence: target.confidence,
          reasons: ["prática curta para verificar se a revisão produziu efeito"],
          navigation: "questions"
        });
      }
    }

    return plan;
  },

  estimatedImpact(plan) {
    if (!plan.length) {
      return {
        label: "Ainda não estimado",
        points: 0,
        confidence: "baixa",
        note: "São necessárias atividades para calcular o impacto."
      };
    }

    const averagePriority = plan.reduce((sum, item) => sum + Number(item.score || 0), 0) / plan.length;
    const averageConfidence = plan.reduce((sum, item) => sum + Number(item.confidence || 0), 0) / plan.length;
    const minutes = plan.reduce((sum, item) => sum + item.minutes, 0);

    const points = Math.max(1, Math.min(8, Math.round(
      averagePriority / 24 + minutes / 14
    )));

    return {
      label: `potencial de +${points} pontos no índice interno de preparação`,
      points,
      confidence: averageConfidence >= 65 ? "média" : "baixa",
      note: "Estimativa interna, não corresponde a nota, classificação ou medalha."
    };
  },

  motivationalEvidence() {
    const overview = ONC.LearningAnalyticsEngine?.overview?.() || {};
    const week = ONC.AdvancedAnalytics?.weeklySummary?.() || {};
    const events = ONC.LearningEngine?.state?.events || [];
    const recent = events.slice(-20);
    const streak = recent.reduceRight((count, event) =>
      count === null ? null : event.correct ? count + 1 : null
    , 0) || 0;

    const candidates = [];
    if (streak >= 3) {
      candidates.push(`Você acumula ${streak} acertos consecutivos.`);
    }
    if ((week.activeDays || 0) >= 3) {
      candidates.push(`Você estudou em ${week.activeDays} dias nos últimos sete dias.`);
    }
    if ((overview.mastered || 0) > 0) {
      candidates.push(`${overview.mastered} tópico${overview.mastered === 1 ? "" : "s"} já atingiu${overview.mastered === 1 ? "" : "ram"} bom domínio.`);
    }
    if ((week.questions || 0) >= 5) {
      candidates.push(`Nesta semana, você respondeu ${week.questions} questões com ${week.accuracy}% de precisão.`);
    }

    return candidates[0] || "Cada sessão concluída melhora a qualidade das próximas recomendações.";
  },

  coachMessage(plan, flags) {
    const balance = this.disciplineBalance();
    const top = plan[0];

    if (flags.some(flag => flag.key === "inactivity")) {
      return "Hoje o objetivo não é compensar o tempo parado. É apenas retomar com uma sessão curta e concluível.";
    }
    if (flags.some(flag => flag.key === "rushing")) {
      return "Seu plano prioriza poucos itens. Trabalhe com calma e confira o comando antes de responder.";
    }
    if (balance?.gap >= 25 && balance.weakest) {
      return `${balance.weakest.name} está atrás das demais disciplinas. O plano reserva espaço para reduzir esse desequilíbrio.`;
    }
    if (top) {
      return `${top.title} é a melhor primeira ação porque combina prioridade pedagógica e possibilidade de ganho em uma sessão curta.`;
    }
    return "O tutor ainda está reunindo dados. Comece por uma leitura breve e algumas questões.";
  },

  refresh(trigger = "manual") {
    const plan = this.plan();
    const flags = this.behaviorFlags();
    const impact = this.estimatedImpact(plan);

    this.state.lastBrief = {
      date: this.todayKey(),
      generatedAt: new Date().toISOString(),
      trigger,
      greeting: this.greeting(),
      student: this.studentName(),
      availableMinutes: this.state.availableMinutes,
      plan,
      flags,
      impact,
      message: this.coachMessage(plan, flags),
      evidence: this.motivationalEvidence()
    };

    this.save();
    return this.state.lastBrief;
  },

  brief() {
    if (this.state.lastBrief?.date !== this.todayKey()) {
      return this.refresh("new-day");
    }
    return this.state.lastBrief || this.refresh("missing");
  },

  startTask(taskId) {
    const task = this.brief().plan.find(item => item.id === taskId);
    if (!task) return false;

    ONC.StudyHistory?.recordTopicEvent?.(
      task.topicId,
      task.title,
      task.discipline,
      "coach-task-start",
      { minutes: task.minutes, score: task.score }
    );

    if (task.navigation === "questions") {
      ONC.UI.showSection("questionBankSection");
      const subject = document.getElementById("bankSubject");
      if (subject) {
        subject.value = task.discipline;
        ONC.Questions.render();
      }
      return true;
    }

    if (task.navigation === "revision") {
      return ONC.SmartNavigator.goToRevision(task.topicId);
    }

    return ONC.SmartNavigator.goToTopic(task.topicId, {
      source: "daily-coach",
      reason: `O Coach Diário escolheu esta ação para o plano de ${this.state.availableMinutes} minutos.`,
      focus: true
    });
  },

  applyPlanToMission() {
    const brief = this.brief();
    if (!brief.plan.length || !ONC.MissionEngine) return false;

    ONC.MissionEngine.mission = {
      date: ONC.MissionEngine.todayKey(),
      generatedAt: new Date().toISOString(),
      trigger: "daily-coach",
      adaptive: true,
      coachPlan: true,
      tasks: brief.plan.map((item, index) => ({
        id: `coach-mission-${index}-${item.topicId}`,
        type: item.action === "questions" ? "questions" : item.action,
        topicId: item.topicId,
        title: item.action === "questions"
          ? `Resolver ${item.title}`
          : `${this.actionLabel(item.action)} ${item.title}`,
        discipline: item.discipline,
        reason: item.reasons.join(" • "),
        explanation: item.reasons,
        estimatedMinutes: item.minutes,
        xp: item.action === "questions" ? 20 : 15,
        completed: false,
        generatedAt: new Date().toISOString(),
        adaptiveScore: item.score,
        confidence: item.confidence
      })),
      xpEarned: 0
    };

    ONC.MissionEngine.updateAutomaticCompletion();
    ONC.MissionEngine.save();
    ONC.UIComponents?.Dashboard?.renderAll?.();
    ONC.DashboardEngine?.render?.();
    ONC.Notifications?.announce?.("Plano do Coach Diário aplicado à missão de hoje.");
    return true;
  },

  actionLabel(action) {
    return {
      review: "Revisar",
      study: "Estudar",
      practice: "Praticar",
      consolidate: "Consolidar"
    }[action] || "Estudar";
  }
};
