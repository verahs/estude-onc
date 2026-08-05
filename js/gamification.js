window.ONC = window.ONC || {};

ONC.Gamification = {
  state: {
    awardedTasks: {},
    bonusAwards: {},
    xp: 0
  },

  levels: [
    { min: 0, name: "Explorador", icon: "🌱" },
    { min: 100, name: "Aprendiz", icon: "📘" },
    { min: 250, name: "Investigador", icon: "🔎" },
    { min: 500, name: "Cientista", icon: "🧪" },
    { min: 850, name: "Especialista", icon: "🚀" },
    { min: 1300, name: "Mestre ONC", icon: "🏆" }
  ],

  init() {
    this.state = ONC.Storage.get(this.storageKey(), {
      awardedTasks: {},
      bonusAwards: {},
      xp: 0
    });
    this.syncMissionAwards();
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_gamification_${current}`;
  },

  save() {
    ONC.Storage.set(this.storageKey(), this.state);
  },

  awardTask(task, dateKey) {
    if (!task?.completed) return;
    const key = `${dateKey}:${task.id}`;
    if (this.state.awardedTasks[key]) return;

    const xp = Number(task.xp || 0);
    this.state.awardedTasks[key] = xp;
    this.state.xp += xp;
    this.save();
  },

  syncMissionAwards() {
    const mission = ONC.MissionEngine?.mission;
    if (!mission) return;
    for (const task of mission.tasks || []) {
      this.awardTask(task, mission.date);
    }

    const completion = ONC.MissionEngine.completion();
    const bonusKey = `mission-bonus:${mission.date}`;
    if (completion.completed && !this.state.bonusAwards[bonusKey]) {
      this.state.bonusAwards[bonusKey] = 15;
      this.state.xp += 15;
      this.save();
    }
  },

  totalXp() {
    return Number(this.state.xp || 0);
  },

  levelInfo() {
    const xp = this.totalXp();
    let current = this.levels[0];
    let index = 0;

    this.levels.forEach((level, position) => {
      if (xp >= level.min) {
        current = level;
        index = position;
      }
    });

    const next = this.levels[index + 1] || null;
    const currentBase = current.min;
    const span = next ? next.min - currentBase : 1;
    const progress = next
      ? Math.max(0, Math.min(100, Math.round(((xp - currentBase) / span) * 100)))
      : 100;

    return {
      number: index + 1,
      current,
      next,
      xp,
      progress,
      xpToNext: next ? Math.max(0, next.min - xp) : 0
    };
  },

  activeDates() {
    const dates = new Set();

    for (const session of ONC.StudyHistory?.state?.sessions || []) {
      if (session.date) dates.add(session.date);
    }

    for (const event of ONC.StudyHistory?.state?.topicEvents || []) {
      if (event.timestamp) dates.add(event.timestamp.slice(0, 10));
    }

    for (const attempt of ONC.StudyHistory?.state?.questionAttempts || []) {
      if (attempt.timestamp) dates.add(attempt.timestamp.slice(0, 10));
    }

    return [...dates].sort();
  },

  streak() {
    const dates = new Set(this.activeDates());
    if (!dates.size) return 0;

    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    const today = cursor.toISOString().slice(0, 10);
    if (!dates.has(today)) {
      cursor.setDate(cursor.getDate() - 1);
    }

    let count = 0;
    while (dates.has(cursor.toISOString().slice(0, 10))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return count;
  }
};
