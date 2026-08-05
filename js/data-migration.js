window.ONC = window.ONC || {};

ONC.DataMigration = {
  currentVersion: 1,

  init() {
    const stored = Number(ONC.Storage.get("onc_schema_version", 0));
    if (stored >= this.currentVersion) return;

    this.run(stored);
    ONC.Storage.set("onc_schema_version", this.currentVersion);
  },

  run(fromVersion) {
    if (fromVersion < 1) {
      this.normalizeQuizHistory();
      this.normalizeUser();
    }
  },

  normalizeQuizHistory() {
    const history = ONC.Storage.get("onc_quiz_history", []);
    if (!Array.isArray(history)) {
      ONC.Storage.set("onc_quiz_history", []);
      return;
    }

    const normalized = history.map(item => ({
      ...item,
      mode: item.mode || "standard",
      pct: Number(item.pct || 0),
      hits: Number(item.hits || 0),
      total: Number(item.total || 0)
    }));

    ONC.Storage.set("onc_quiz_history", normalized);
  },

  normalizeUser() {
    const user = ONC.Storage.get("onc_user", null);
    if (!user || typeof user !== "object") return;

    ONC.Storage.set("onc_user", {
      name: String(user.name || "Visitante"),
      role: user.role || "visitante",
      ...(user.studentId ? { studentId: user.studentId } : {})
    });
  }
};
