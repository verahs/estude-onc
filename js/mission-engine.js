window.ONC = window.ONC || {};

ONC.MissionEngine = {
  mission: null,

  init() {
    this.loadOrGenerate();
  },

  todayKey() {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0")
    ].join("-");
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_daily_mission_${current}_${this.todayKey()}`;
  },

  loadOrGenerate() {
    const stored = ONC.Storage.get(this.storageKey(), null);
    this.mission = stored || this.generate();
    this.updateAutomaticCompletion();
    this.save();
  },

  generate() {
    const ranked = ONC.PriorityEngine.rank({ excludeMastered: true });
    const alerts = ONC.Attention.allAlerts();
    const tasks = [];
    const used = new Set();

    const alertTopic = alerts[0];
    if (alertTopic) {
      const priority = ranked.find(item => item.id === alertTopic.topicId);
      tasks.push(this.topicTask(priority || {
        id: alertTopic.topicId,
        title: alertTopic.title,
        discipline: alertTopic.discipline,
        score: Math.round(alertTopic.score * 15),
        impact: "Muito alto",
        reasons: alertTopic.reasons,
        mastery: ONC.ProgressEngine.get(alertTopic.topicId)
      }, "review"));
      used.add(alertTopic.topicId);
    }

    const nextStudy = ranked.find(item => !used.has(item.id));
    if (nextStudy) {
      tasks.push(this.topicTask(nextStudy, nextStudy.mastery > 0 ? "reinforce" : "study"));
      used.add(nextStudy.id);
    }

    const questionDiscipline = (ranked.find(item => !used.has(item.id)) || ranked[0])?.discipline || "Astronomia";
    tasks.push({
      id: `questions-${this.todayKey()}`,
      type: "questions",
      title: `Resolver 5 questões de ${questionDiscipline}`,
      discipline: questionDiscipline,
      reason: "Praticar ajuda a transformar leitura em domínio.",
      estimatedMinutes: 8,
      xp: 20,
      completed: false,
      generatedAt: new Date().toISOString()
    });

    return {
      date: this.todayKey(),
      generatedAt: new Date().toISOString(),
      tasks: tasks.slice(0, 3),
      xpEarned: 0
    };
  },

  topicTask(item, type) {
    const labels = {
      review: "Revisar",
      reinforce: "Reforçar",
      study: "Estudar"
    };
    return {
      id: `${type}-${item.id}`,
      type,
      topicId: item.id,
      title: `${labels[type]} ${item.title}`,
      discipline: item.discipline,
      reason: item.reasons?.slice(0, 2).join(" • ") || "Recomendação do tutor",
      impact: item.impact || "Alto",
      estimatedMinutes: 3,
      xp: type === "review" ? 20 : 15,
      completed: false,
      generatedAt: new Date().toISOString()
    };
  },

  save() {
    ONC.Storage.set(this.storageKey(), this.mission);
  },

  updateAutomaticCompletion() {
    if (!this.mission) return;

    for (const task of this.mission.tasks) {
      if (task.type === "questions") {
        const attempts = ONC.StudyHistory.attemptsSince(task.generatedAt)
          .filter(item => item.subject === task.discipline);
        if (attempts.length >= 5) task.completed = true;
      } else if (task.topicId) {
        const mastery = ONC.ProgressEngine.get(task.topicId);
        const event = ONC.StudyHistory.lastTopicEvent(task.topicId, "mission-complete");
        if (mastery >= 70 || event) task.completed = true;
      }
    }

    this.mission.xpEarned = this.mission.tasks
      .filter(task => task.completed)
      .reduce((sum, task) => sum + Number(task.xp || 0), 0);
  },

  toggleTask(taskId, checked) {
    const task = this.mission.tasks.find(item => item.id === taskId);
    if (!task) return;
    task.completed = Boolean(checked);

    if (task.topicId && checked) {
      ONC.StudyHistory.recordTopicEvent(
        task.topicId,
        task.title,
        task.discipline,
        "mission-complete",
        { missionDate: this.mission.date }
      );
    }

    this.mission.xpEarned = this.mission.tasks
      .filter(item => item.completed)
      .reduce((sum, item) => sum + Number(item.xp || 0), 0);

    this.save();
    ONC.SmartTutor.renderMission();
  },

  openTask(taskId) {
    const task = this.mission.tasks.find(item => item.id === taskId);
    if (!task) return;

    if (task.type === "questions") {
      ONC.UI.showSection("questionBankSection");
      const subject = document.getElementById("bankSubject");
      if (subject) {
        subject.value = task.discipline;
        ONC.Questions.render();
      }
      return;
    }

    if (task.topicId) {
      ONC.Attention.openTopic(task.topicId);
    }
  },

  completion() {
    const total = this.mission?.tasks?.length || 0;
    const done = this.mission?.tasks?.filter(task => task.completed).length || 0;
    return {
      total,
      done,
      percent: total ? Math.round(done * 100 / total) : 0,
      completed: total > 0 && done === total
    };
  }
};
