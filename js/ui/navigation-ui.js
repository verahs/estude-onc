window.ONC = window.ONC || {};

ONC.NavigationUI = {
  init() {
    this.renderReport();
  },

  renderReport() {
    const root = document.getElementById("navigationAnalyticsReport");
    if (!root) return;

    const analytics = ONC.NavigationHistory.analytics();
    const sources = Object.entries(analytics.sources)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    root.innerHTML = `
      <div class="navigationReportHeader">
        <div>
          <span class="dashboardLabel">Navegação inteligente</span>
          <h2>Uso das recomendações</h2>
          <p>Acompanha aberturas, conclusões e origem dos acessos orientados.</p>
        </div>
      </div>
      <div class="navigationMetrics">
        <article><strong>${analytics.opens}</strong><span>aberturas orientadas</span></article>
        <article><strong>${analytics.completes}</strong><span>revisões concluídas</span></article>
        <article><strong>${analytics.completionRate}%</strong><span>taxa de conclusão</span></article>
        <article><strong>${analytics.averageSeconds}s</strong><span>tempo médio registrado</span></article>
      </div>
      <div class="navigationSources">
        ${sources.length
          ? sources.map(([source, count]) => `<span><b>${source}</b> ${count}</span>`).join("")
          : '<span class="note">Ainda não há navegações orientadas registradas.</span>'}
      </div>`;
  }
};
