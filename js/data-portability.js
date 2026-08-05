window.ONC = window.ONC || {};

ONC.DataPortability = {
  prefix: "onc_",
  lastExportKey: "onc_last_export_at",

  init() {},

  keys() {
    const keys = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(this.prefix)) keys.push(key);
    }
    return keys.sort();
  },

  snapshot() {
    const data = {};

    this.keys().forEach(key => {
      try {
        data[key] = JSON.parse(localStorage.getItem(key));
      } catch {
        data[key] = localStorage.getItem(key);
      }
    });

    return {
      product: "Estude ONC",
      exportVersion: "1.0",
      appVersion: "5.3",
      schemaVersion: ONC.DataMigration?.currentVersion || 1,
      exportedAt: new Date().toISOString(),
      user: ONC.Users?.current || null,
      data
    };
  },

  download(filename, content, type = "application/json") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  },

  exportAll() {
    const snapshot = this.snapshot();
    const date = new Date().toISOString().slice(0, 10);

    this.download(
      `estude-onc-backup-${date}.json`,
      JSON.stringify(snapshot, null, 2)
    );

    ONC.Storage.set(this.lastExportKey, snapshot.exportedAt);
    ONC.SystemSettingsUI?.renderHealth?.();
    ONC.Notifications?.announce?.("Backup concluído. O arquivo foi baixado.");
  },

  validate(snapshot) {
    if (!snapshot || typeof snapshot !== "object") {
      throw new Error("O arquivo não contém um backup válido.");
    }

    if (snapshot.product !== "Estude ONC") {
      throw new Error("O arquivo não pertence ao Estude ONC.");
    }

    if (!snapshot.data || typeof snapshot.data !== "object") {
      throw new Error("O backup não contém dados restauráveis.");
    }

    const invalidKey = Object.keys(snapshot.data).find(
      key => !key.startsWith(this.prefix)
    );

    if (invalidKey) {
      throw new Error(`Chave não permitida no backup: ${invalidKey}`);
    }

    return true;
  },

  async importFile(file) {
    if (!file) return;

    const text = await file.text();
    let snapshot;

    try {
      snapshot = JSON.parse(text);
      this.validate(snapshot);
    } catch (error) {
      ONC.Notifications?.announce?.(error.message, "error");
      throw error;
    }

    const confirmation = window.confirm(
      "Restaurar este backup substituirá os dados atuais do Estude ONC neste navegador. Deseja continuar?"
    );
    if (!confirmation) return;

    // Safety backup before restore.
    const safety = this.snapshot();
    sessionStorage.setItem(
      "onc_restore_safety_backup",
      JSON.stringify(safety)
    );

    this.keys().forEach(key => localStorage.removeItem(key));

    Object.entries(snapshot.data).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });

    ONC.Storage.set("onc_last_import_at", new Date().toISOString());
    ONC.Notifications?.announce?.("Backup restaurado. A página será atualizada.");
    setTimeout(() => window.location.reload(), 500);
  },

  restoreSafetyBackup() {
    const raw = sessionStorage.getItem("onc_restore_safety_backup");
    if (!raw) return false;

    const snapshot = JSON.parse(raw);
    this.validate(snapshot);
    this.keys().forEach(key => localStorage.removeItem(key));

    Object.entries(snapshot.data).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });

    sessionStorage.removeItem("onc_restore_safety_backup");
    window.location.reload();
    return true;
  },

  resetLearningData() {
    const answer = window.prompt(
      'Para apagar o histórico de aprendizagem deste navegador, digite APAGAR.'
    );

    if (answer !== "APAGAR") {
      ONC.Notifications?.announce?.("Os dados não foram apagados.");
      return;
    }

    const preserve = new Set([
      "onc_user",
      "onc_class_students",
      "onc_class_current",
      "onc_preferences",
      "onc_schema_version"
    ]);

    this.keys().forEach(key => {
      if (!preserve.has(key)) localStorage.removeItem(key);
    });

    ONC.Notifications?.announce?.("Histórico de aprendizagem apagado.");
    setTimeout(() => window.location.reload(), 500);
  },

  health() {
    const keys = this.keys();
    const bytes = keys.reduce((sum, key) => {
      const value = localStorage.getItem(key) || "";
      return sum + new Blob([key, value]).size;
    }, 0);

    return {
      keys: keys.length,
      bytes,
      kilobytes: Math.round((bytes / 1024) * 10) / 10,
      lastExport: ONC.Storage.get(this.lastExportKey, null),
      lastImport: ONC.Storage.get("onc_last_import_at", null),
      schemaVersion: Number(ONC.Storage.get("onc_schema_version", 0))
    };
  }
};
