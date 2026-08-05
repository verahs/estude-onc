window.ONC = window.ONC || {};

ONC.AssessmentUI = {
  init() {
    this.renderAdaptiveSummary();
    this.renderReportWidgets();
  },

  renderAdaptiveSummary() {
    const root = document.getElementById("adaptiveQuizSummary");
    if (!root) return;

    const top = ONC.LearningAnalyticsEngine.priorityTopics({ limit: 3 });
    root.innerHTML = `
      <div>
        <span class="dashboardLabel">Simulado inteligente</span>
        <h3>Questões escolhidas para o seu momento</h3>
        <p>O sistema prioriza erros recentes, domínio baixo, esquecimento e recorrência histórica.</p>
      </div>
      <div class="adaptiveFocus">
        ${top.map(item => `<span>${item.discipline}: ${item.title}</span>`).join("")}
      </div>`;
  },

  renderReportWidgets() {
    this.renderPerformance();
    this.renderHeatmap();
  },

  renderPerformance() {
    const root = document.getElementById("performanceEstimate");
    if (!root) return;
    const estimate = ONC.LearningAnalyticsEngine.performanceEstimate();

    root.innerHTML = `
      <span class="dashboardLabel">Indicador de desempenho</span>
      <div class="performanceEstimateMain">
        <strong>${estimate.index}%</strong>
        <span>${estimate.label}</span>
      </div>
      <div class="performanceEstimateBar"><i style="width:${estimate.index}%"></i></div>
      <p>Confiança ${estimate.confidence.toLowerCase()} • ${estimate.sample} simulado${estimate.sample === 1 ? "" : "s"} recente${estimate.sample === 1 ? "" : "s"}</p>
      <small>${estimate.note}</small>`;
  },

  renderHeatmap() {
    const root = document.getElementById("learningHeatmap");
    if (!root) return;

    root.innerHTML = ONC.LearningAnalyticsEngine.heatmap().map(item => `
      <article class="heatmapRow">
        <span>${item.icon} ${item.discipline}</span>
        <div class="heatmapCells" aria-label="Domínio ${item.mastery}%">
          ${[20,40,60,80,100].map(limit =>
            `<i class="${item.mastery >= limit ? item.level : "empty"}"></i>`
          ).join("")}
        </div>
        <strong>${item.mastery}%</strong>
        <small>${item.studied}/${item.total} tópicos iniciados</small>
      </article>`).join("");
  }
};
