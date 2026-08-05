window.ONC = window.ONC || {};

ONC.SystemSettingsUI = {
  init() {
    this.syncControls();
    this.renderHealth();
  },

  syncControls() {
    const state = ONC.Preferences?.state;
    if (!state) return;

    const font = document.getElementById("preferenceFontSize");
    const contrast = document.getElementById("preferenceContrast");
    const motion = document.getElementById("preferenceMotion");

    if (font) font.value = state.fontSize;
    if (contrast) contrast.value = state.contrast;
    if (motion) motion.value = state.motion;
  },

  renderHealth() {
    const root = document.getElementById("dataHealth");
    if (!root) return;

    const health = ONC.DataPortability.health();
    const architecture = ONC.ArchitectureDiagnostics?.validate?.() || {
      ok: true,
      failures: []
    };

    const formatDate = value => value
      ? new Date(value).toLocaleString("pt-BR")
      : "Não realizado";

    root.innerHTML = `
      <article>
        <strong>${health.keys}</strong>
        <span>conjuntos de dados</span>
      </article>
      <article>
        <strong>${health.kilobytes} KB</strong>
        <span>armazenamento local</span>
      </article>
      <article>
        <strong>v${health.schemaVersion}</strong>
        <span>estrutura dos dados</span>
      </article>
      <article class="${architecture.ok ? "is-ok" : "is-warning"}">
        <strong>${architecture.ok ? "Íntegra" : "Atenção"}</strong>
        <span>arquitetura</span>
      </article>
      <div class="dataHealthDates">
        <span><b>Último backup:</b> ${formatDate(health.lastExport)}</span>
        <span><b>Última restauração:</b> ${formatDate(health.lastImport)}</span>
      </div>`;
  },

  chooseImport() {
    document.getElementById("backupImportInput")?.click();
  },

  importSelected(input) {
    const file = input?.files?.[0];
    if (!file) return;

    ONC.DataPortability.importFile(file)
      .catch(error => console.error("[Estude ONC] importação", error))
      .finally(() => {
        input.value = "";
      });
  }
};
