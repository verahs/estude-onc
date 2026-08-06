window.ONC = window.ONC || {};

ONC.IntelligentXPUI = {
  toastTimer: null,

  init() {
    this.ensureToast();
    this.render();
  },

  ensureToast() {
    if (document.getElementById("intelligentXPToast")) return;
    const toast = document.createElement("div");
    toast.id = "intelligentXPToast";
    toast.className = "intelligentXPToast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  },

  notify(entry) {
    if (!entry) return;
    const toast = document.getElementById("intelligentXPToast");
    if (!toast) return;

    clearTimeout(this.toastTimer);
    toast.innerHTML = `
      <strong>+${entry.xp} XP</strong>
      <span>${entry.title}</span>`;
    toast.classList.add("is-visible");

    this.toastTimer = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2600);
  },

  render() {
    const root = document.getElementById("intelligentXPPanel");
    if (!root || !ONC.IntelligentXPEngine) return;

    const summary = ONC.IntelligentXPEngine.summary();

    root.innerHTML = `
      <div class="xpHeader">
        <div>
          <span class="dashboardLabel">XP inteligente</span>
          <h2>${summary.level.title}</h2>
          <p>Recompensas por aprendizagem real, revisão, recuperação e consistência.</p>
        </div>
        <div class="xpTotal">
          <strong>${summary.totalXP}</strong>
          <span>XP total</span>
        </div>
      </div>

      <div class="xpProgress">
        <div>
          <span>${summary.level.title}</span>
          <strong>${summary.level.nextTitle
            ? `${summary.level.remaining} XP para ${summary.level.nextTitle}`
            : "Nível máximo atual"}</strong>
        </div>
        <i><b style="width:${summary.level.progress}%"></b></i>
      </div>

      <div class="xpMetrics">
        <article><strong>${summary.today}</strong><span>XP hoje</span></article>
        <article><strong>${summary.dailyCap}</strong><span>limite pedagógico diário</span></article>
        <article><strong>${summary.atoms}</strong><span>átomos acumulados</span></article>
        <article><strong>${summary.recent.length}</strong><span>ganhos recentes exibidos</span></article>
      </div>

      <details class="xpHistory">
        <summary>Ver histórico de ganhos</summary>
        <div>
          ${summary.recent.length ? summary.recent.map(item => `
            <article>
              <div>
                <strong>${item.title}</strong>
                <span>${item.detail}</span>
              </div>
              <b>+${item.xp} XP</b>
            </article>`).join("") : `
            <p class="note">Conclua uma atividade válida para gerar o primeiro ganho.</p>`}
        </div>
      </details>

      <div class="xpFooter">
        <small>${summary.disclaimer}</small>
      </div>`;
  },

  renderReport() {
    const root = document.getElementById("intelligentXPReport");
    if (!root || !ONC.IntelligentXPEngine) return;

    const summary = ONC.IntelligentXPEngine.summary();
    const labels = {
      learning: "Aprendizagem",
      review: "Revisão",
      mission: "Missões",
      consistency: "Consistência"
    };
    const categories = Object.entries(summary.categories)
      .sort((a, b) => b[1] - a[1]);

    root.innerHTML = `
      <div class="xpReportHeader">
        <div>
          <span class="dashboardLabel">Economia de XP</span>
          <h2>Origem das recompensas</h2>
          <p>O sistema evita premiar volume vazio e não aplica punição por erro.</p>
        </div>
      </div>

      <div class="xpReportGrid">
        <article><span>XP atual</span><strong>${summary.totalXP}</strong></article>
        <article><span>XP vitalício</span><strong>${summary.lifetimeXP}</strong></article>
        <article><span>Nível</span><strong>${summary.level.title}</strong></article>
        <article><span>Átomos</span><strong>${summary.atoms}</strong></article>
      </div>

      <section class="xpCategoryList">
        ${categories.length ? categories.map(([key, value]) => `
          <article>
            <div><strong>${labels[key] || key}</strong><span>${value} XP</span></div>
            <i><b style="width:${Math.min(100, value / Math.max(1, summary.lifetimeXP) * 100)}%"></b></i>
          </article>`).join("") : `
          <p class="note">Ainda não há recompensas suficientes para compor o relatório.</p>`}
      </section>

      <details class="xpMethod">
        <summary>Regras do XP inteligente</summary>
        <p>O ganho considera dificuldade, origem da atividade, recuperação de erro, revisão, ritmo adequado e conclusão de missão.</p>
        <p>Respostas muito rápidas, repetição recente da mesma questão e excesso diário reduzem ou anulam a recompensa. O XP já conquistado não é retirado.</p>
        <p>${summary.disclaimer}</p>
      </details>`;
  }
};
