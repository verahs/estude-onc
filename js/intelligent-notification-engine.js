window.ONC = window.ONC || {};

ONC.IntelligentNotificationEngine = {
  state: {
    notifications: [],
    readIds: [],
    dismissedIds: [],
    emittedKeys: {},
    preferences: {
      enabled: true,
      unlocks: true,
      nearBadges: true,
      milestones: true,
      coachHints: true,
      levelUps: true,
      sound: false,
      quietHoursEnabled: true,
      quietStart: 21,
      quietEnd: 7,
      maxDaily: 5
    },
    daily: {},
    version: 1
  },

  init() {
    this.load();
    this.scan("startup");
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_intelligent_notifications_${current}`;
  },

  load() {
    this.state = {
      notifications: [],
      readIds: [],
      dismissedIds: [],
      emittedKeys: {},
      preferences: {
        enabled: true,
        unlocks: true,
        nearBadges: true,
        milestones: true,
        coachHints: true,
        levelUps: true,
        sound: false,
        quietHoursEnabled: true,
        quietStart: 21,
        quietEnd: 7,
        maxDaily: 5
      },
      daily: {},
      version: 1,
      ...ONC.Storage.get(this.storageKey(), {})
    };
  },

  save() {
    this.state.notifications = this.state.notifications.slice(-300);
    this.state.readIds = this.state.readIds.slice(-500);
    this.state.dismissedIds = this.state.dismissedIds.slice(-500);
    this.state.emittedKeys = Object.fromEntries(
      Object.entries(this.state.emittedKeys)
        .sort((a, b) => new Date(b[1]) - new Date(a[1]))
        .slice(0, 1000)
    );
    ONC.Storage.set(this.storageKey(), this.state);
  },

  todayKey() {
    return new Date().toISOString().slice(0, 10);
  },

  dailyCount(date = this.todayKey()) {
    return Number(this.state.daily?.[date] || 0);
  },

  incrementDaily(date = this.todayKey()) {
    this.state.daily[date] = this.dailyCount(date) + 1;
  },

  isQuietHour(date = new Date()) {
    if (!this.state.preferences.quietHoursEnabled) return false;
    const hour = date.getHours();
    const start = Number(this.state.preferences.quietStart);
    const end = Number(this.state.preferences.quietEnd);

    if (start === end) return true;
    if (start < end) return hour >= start && hour < end;
    return hour >= start || hour < end;
  },

  canEmit(type, priority = "normal") {
    const preferences = this.state.preferences;
    if (!preferences.enabled) return false;

    const prefMap = {
      unlock: "unlocks",
      near: "nearBadges",
      milestone: "milestones",
      coach: "coachHints",
      level: "levelUps"
    };

    const prefKey = prefMap[type];
    if (prefKey && !preferences[prefKey]) return false;

    if (priority !== "high" && this.isQuietHour()) return false;
    if (priority !== "high" && this.dailyCount() >= Number(preferences.maxDaily || 5)) {
      return false;
    }

    return true;
  },

  hasKey(key) {
    return Boolean(this.state.emittedKeys[key]);
  },

  emit({
    key,
    type,
    title,
    message,
    icon = "🔔",
    priority = "normal",
    action = null,
    metadata = {}
  }) {
    if (!key || this.hasKey(key) || !this.canEmit(type, priority)) return null;

    const notification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      key,
      type,
      title,
      message,
      icon,
      priority,
      action,
      metadata,
      createdAt: new Date().toISOString()
    };

    this.state.notifications.push(notification);
    this.state.emittedKeys[key] = notification.createdAt;
    this.incrementDaily();
    this.save();

    ONC.IntelligentNotificationUI?.toast?.(notification);
    ONC.IntelligentNotificationUI?.render?.();
    return notification;
  },

  emitUnlock(unlock) {
    if (!unlock?.ruleId) return null;
    return this.emit({
      key: `unlock:${unlock.ruleId}`,
      type: "unlock",
      title: `Medalha conquistada: ${unlock.title}`,
      message: unlock.evidence || "Uma nova conquista foi adicionada à coleção.",
      icon: unlock.icon || "🏅",
      priority: "high",
      action: {
        label: "Ver medalha",
        kind: "badge",
        target: unlock.ruleId
      },
      metadata: { ruleId: unlock.ruleId }
    });
  },

  emitLevelUp(event) {
    if (!event?.levelKey) return null;
    return this.emit({
      key: `level:${event.levelKey}`,
      type: "level",
      title: `Novo nível: ${event.title}`,
      message: `Você alcançou ${event.xp} XP e desbloqueou uma nova etapa.`,
      icon: event.icon || "⭐",
      priority: "high",
      action: {
        label: "Ver níveis",
        kind: "section",
        target: "studySection"
      },
      metadata: { levelKey: event.levelKey }
    });
  },

  nearBadgeCandidates() {
    const rules = ONC.BadgeRuleEngine?.summary?.().rules || [];
    return rules
      .filter(rule =>
        !rule.unlocked &&
        !rule.hidden &&
        rule.percent >= 75 &&
        rule.percent < 100
      )
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 3);
  },

  scanNearBadges() {
    this.nearBadgeCandidates().forEach(rule => {
      const band = rule.percent >= 90 ? 90 : 75;
      this.emit({
        key: `near:${rule.ruleId}:${band}`,
        type: "near",
        title: `${rule.title} está próxima`,
        message: `${rule.percent}% concluída. ${rule.evidence}`,
        icon: rule.icon || "🏅",
        priority: rule.percent >= 90 ? "high" : "normal",
        action: {
          label: "Acompanhar progresso",
          kind: "badge",
          target: rule.ruleId
        },
        metadata: {
          ruleId: rule.ruleId,
          percent: rule.percent
        }
      });
    });
  },

  scanMilestones() {
    const milestones = ONC.BadgeTimelineEngine?.milestones?.() || [];
    milestones.forEach(item => {
      const keyPart = `${item.type}:${item.title}:${new Date(item.timestamp).toISOString().slice(0, 10)}`;
      this.emit({
        key: `milestone:${keyPart}`,
        type: "milestone",
        title: item.title,
        message: item.detail,
        icon: item.icon || "🏆",
        priority: "normal",
        action: {
          label: "Ver linha do tempo",
          kind: "section",
          target: "studySection"
        }
      });
    });
  },

  scanCoachHint() {
    const hint = ONC.DailyCoachEngine?.badgeHint?.();
    if (!hint || Number(hint.percent || 0) < 75) return;

    const date = this.todayKey();
    this.emit({
      key: `coach:${hint.title}:${date}`,
      type: "coach",
      title: "O Coach identificou uma conquista próxima",
      message: hint.message,
      icon: "🧭",
      priority: "normal",
      action: {
        label: "Ver plano diário",
        kind: "section",
        target: "studySection"
      }
    });
  },

  scan(trigger = "manual") {
    this.scanNearBadges();
    this.scanMilestones();
    this.scanCoachHint();
    this.save();
    ONC.IntelligentNotificationUI?.render?.();
    return this.summary();
  },

  markRead(id) {
    if (!id || this.state.readIds.includes(id)) return;
    this.state.readIds.push(id);
    this.save();
    this.render();
  },

  markAllRead() {
    this.state.notifications.forEach(item => {
      if (!this.state.readIds.includes(item.id)) this.state.readIds.push(item.id);
    });
    this.save();
    this.render();
  },

  dismiss(id) {
    if (!id || this.state.dismissedIds.includes(id)) return;
    this.state.dismissedIds.push(id);
    this.save();
    this.render();
  },

  clearRead() {
    const read = new Set(this.state.readIds);
    this.state.notifications = this.state.notifications.filter(item => !read.has(item.id));
    this.state.readIds = [];
    this.save();
    this.render();
  },

  updatePreference(name, value) {
    if (!(name in this.state.preferences)) return false;

    if (["quietStart", "quietEnd", "maxDaily"].includes(name)) {
      this.state.preferences[name] = Number(value);
    } else {
      this.state.preferences[name] = Boolean(value);
    }

    this.save();
    this.render();
    return true;
  },

  execute(id) {
    const notification = this.state.notifications.find(item => item.id === id);
    if (!notification) return false;

    this.markRead(id);
    const action = notification.action;
    if (!action) return true;

    if (action.kind === "badge") {
      return ONC.BadgeCollectionEngine?.openDetails?.(action.target) || false;
    }

    if (action.kind === "section") {
      ONC.UI?.showSection?.(action.target);
      return true;
    }

    return false;
  },

  visibleNotifications() {
    const dismissed = new Set(this.state.dismissedIds);
    return [...this.state.notifications]
      .filter(item => !dismissed.has(item.id))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  summary() {
    const visible = this.visibleNotifications();
    const read = new Set(this.state.readIds);

    return {
      total: visible.length,
      unread: visible.filter(item => !read.has(item.id)).length,
      items: visible.map(item => ({
        ...item,
        read: read.has(item.id)
      })),
      preferences: { ...this.state.preferences },
      quietNow: this.isQuietHour(),
      dailyCount: this.dailyCount(),
      disclaimer: "As notificações reforçam progresso e organização. Elas não devem interromper o descanso, pressionar o aluno ou transformar medalhas no objetivo principal do estudo."
    };
  },

  render() {
    ONC.IntelligentNotificationUI?.render?.();
  }
};
