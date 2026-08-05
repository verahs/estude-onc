window.ONC = window.ONC || {};

ONC.NavigationHistory = {
  state: { events: [], active: null },

  init() {
    this.load();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pauseActive("hidden");
    });
    window.addEventListener("beforeunload", () => this.pauseActive("unload"));
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_navigation_history_${current}`;
  },

  load() {
    this.state = ONC.Storage.get(this.storageKey(), { events: [], active: null });
  },

  save() {
    this.state.events = this.state.events.slice(-1000);
    ONC.Storage.set(this.storageKey(), this.state);
  },

  start(topicId, source, metadata = {}) {
    this.pauseActive("new-navigation");

    const now = new Date().toISOString();
    this.state.active = {
      id: `${Date.now()}-${topicId}`,
      topicId,
      source,
      openedAt: now,
      startedAtMs: Date.now(),
      metadata
    };

    this.state.events.push({
      type: "open",
      topicId,
      source,
      timestamp: now,
      metadata
    });
    this.save();
    return this.state.active;
  },

  complete(topicId, outcome = "completed", metadata = {}) {
    const active = this.state.active?.topicId === topicId ? this.state.active : null;
    const durationSeconds = active
      ? Math.max(0, Math.round((Date.now() - active.startedAtMs) / 1000))
      : 0;

    this.state.events.push({
      type: "complete",
      topicId,
      source: active?.source || metadata.source || "unknown",
      outcome,
      durationSeconds,
      timestamp: new Date().toISOString(),
      metadata
    });

    if (active) this.state.active = null;
    this.save();

    ONC.StudyHistory?.recordTopicEvent?.(
      topicId,
      ONC.ContentIndex.get(topicId)?.title || "",
      ONC.ContentIndex.get(topicId)?.discipline || "",
      "smart-navigation-complete",
      { outcome, durationSeconds, ...metadata }
    );

    return { durationSeconds };
  },

  pauseActive(reason = "paused") {
    const active = this.state.active;
    if (!active) return;

    const durationSeconds = Math.max(0, Math.round((Date.now() - active.startedAtMs) / 1000));
    this.state.events.push({
      type: "pause",
      topicId: active.topicId,
      source: active.source,
      reason,
      durationSeconds,
      timestamp: new Date().toISOString()
    });
    this.state.active = null;
    this.save();
  },

  eventsFor(topicId) {
    return this.state.events.filter(event => event.topicId === topicId);
  },

  analytics() {
    const opens = this.state.events.filter(event => event.type === "open");
    const completes = this.state.events.filter(event => event.type === "complete");
    const totalSeconds = completes.reduce((sum, event) => sum + Number(event.durationSeconds || 0), 0);

    return {
      opens: opens.length,
      completes: completes.length,
      completionRate: opens.length ? Math.round((completes.length / opens.length) * 100) : 0,
      averageSeconds: completes.length ? Math.round(totalSeconds / completes.length) : 0,
      sources: opens.reduce((acc, event) => {
        acc[event.source] = (acc[event.source] || 0) + 1;
        return acc;
      }, {})
    };
  }
};
