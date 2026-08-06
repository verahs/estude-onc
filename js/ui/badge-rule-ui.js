window.ONC = window.ONC || {};

ONC.BadgeRuleUI = {
  toastTimer: null,

  init() {
    this.ensureToast();
    this.render();
  },

  ensureToast() {
    if (document.getElementById("badgeRuleToast")) return;
    const toast = document.createElement("div");
    toast.id = "badgeRuleToast";
    toast.className = "badgeRuleToast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  },

  notifyUnlock(item) {
    const toast = document.getElementById("badgeRuleToast");
    if (!toast || !item) return;
    clearTimeout(this.toastTimer);
    toast.innerHTML = `
      <span aria-hidden="true">🏅</span>
      <div>
        <small>Medalha desbloqueada</small>
        <strong>${item.title}</strong>
        <p>${item.evidence}</p>
      </div>`;
    toast.classList.add("is-visible");
    this.toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 4200);
  },

  render() {
    const root = document.getElementById("badgeRulePanel");
    if (!root || !ONC.BadgeRuleEngine) return;

    const summary = ONC.BadgeRuleEngine.summary();

    root.innerHTML = `
      <div class="badgeRuleHeader">
        <div>
          <span class="dashboardLabel">Motor de regras de medalhas</span>
          <h2>${summary.unlockedCount} de ${summary.totalRules} conquistas reconhecidas</h2>
          <p>Critérios automáticos, progresso explicável e desbloqueio sem duplicidade.</p>
        </div>
        <div class="badgeRuleCompletion">
          <strong>${summary.completion}%</strong>
          <span>coleção atual</span>
        </div>
      </div>

      <div class="badgeRuleMetrics">
        <article><strong>${summary.totalRules}</strong><span>regras registradas</span></article>
        <article><strong>${summary.unlockedCount}</strong><span>desbloqueadas</span></article>
        <article><strong>${summary.nearest.length}</strong><span>mais próximas</span></article>
        <article><strong>${Object.keys(summary.categories).length}</strong><span>categorias</span></article>
      </div>

      <section class="badgeRuleNearest">
        <h3>Próximas medalhas</h3>
        ${summary.nearest.length ? summary.nearest.map(item => `
          <article>
            <div>
              <strong>${item.title}</strong>
              <span>${item.description}</span>
              <small>${item.evidence}</small>
            </div>
            <b>${item.percent}%</b>
            <i><u style="width:${item.percent}%"></u></i>
          </article>`).join("") : `
          <p class="note">Todas as medalhas visíveis atuais já foram conquistadas.</p>`}
      </section>

      <details class="badgeRuleCatalog">
        <summary>Ver catálogo de regras</summary>
        <div>
          ${summary.rules.filter(item => item.visible).map(item => `
            <article class="${item.unlocked ? "is-unlocked" : ""}">
              <span aria-hidden="true">${item.unlocked ? "🏅" : "◯"}</span>
              <div>
                <strong>${item.title}</strong>
                <small>${item.category}</small>
                <p>${item.description}</p>
                <em>${item.evidence}</em>
              </div>
              <b>${item.unlocked ? "Conquistada" : `${item.percent}%`}</b>
            </article>`).join("")}
        </div>
      </details>

      <div class="badgeRuleFooter">
        <small>${summary.disclaimer}</small>
        <button class="btn" type="button"
          onclick="ONC.BadgeRuleEngine.evaluateAll('manual')">
          Reavaliar regras
        </button>
      </div>`;
  },

  renderReport() {
    const root = document.getElementById("badgeRuleReport");
    if (!root || !ONC.BadgeRuleEngine) return;

    const summary = ONC.BadgeRuleEngine.summary();

    root.innerHTML = `
      <div class="badgeRuleReportHeader">
        <div>
          <span class="dashboardLabel">Regras de medalhas</span>
          <h2>Critérios, progresso e evidências</h2>
          <p>O relatório mostra como cada conquista é calculada.</p>
        </div>
      </div>

      <div class="badgeRuleReportGrid">
        <article><span>Regras</span><strong>${summary.totalRules}</strong></article>
        <article><span>Desbloqueadas</span><strong>${summary.unlockedCount}</strong></article>
        <article><span>Conclusão</span><strong>${summary.completion}%</strong></article>
        <article><span>Categorias</span><strong>${Object.keys(summary.categories).length}</strong></article>
      </div>

      <section class="badgeCategoryReport">
        ${Object.entries(summary.categories).map(([category, values]) => `
          <article>
            <div><strong>${category}</strong><span>${values.unlocked}/${values.total}</span></div>
            <i><b style="width:${Math.round(values.unlocked / values.total * 100)}%"></b></i>
          </article>`).join("")}
      </section>

      <details class="badgeRuleMethod">
        <summary>Arquitetura do motor</summary>
        <p>Cada regra possui identificador, categoria, descrição, recompensa, visibilidade, função de avaliação, progresso, evidência e estado de desbloqueio.</p>
        <p>O motor impede conquistas duplicadas, registra cada avaliação e mantém dados separados por estudante.</p>
        <p>${summary.disclaimer}</p>
      </details>`;
  }
};
