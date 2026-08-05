window.ONC = window.ONC || {};

ONC.AdvancedDashboardUI = {
  init() {
    this.render();
  },

  render() {
    this.renderInsights();
    this.renderRadar();
    this.renderWeeklyChart();
    this.renderGuardianPanel();
  },

  renderInsights() {
    const root = document.getElementById("learningInsights");
    if (!root) return;

    root.innerHTML = ONC.AdvancedAnalytics.insightCards().map(item => `
      <article class="insightCard">
        <span class="insightIcon">${item.icon}</span>
        <div>
          <small>${item.title}</small>
          <strong>${item.value}</strong>
          <span>${item.detail}</span>
        </div>
      </article>`).join("");
  },

  renderRadar() {
    const root = document.getElementById("disciplineRadar");
    ONC.RadarUI.render(root, ONC.AdvancedAnalytics.radarData());
  },

  renderWeeklyChart() {
    const root = document.getElementById("weeklyActivityChart");
    if (!root) return;

    const week = ONC.AdvancedAnalytics.weeklySummary();
    const max = Math.max(1, ...week.activity.map(day => day.minutes));

    root.innerHTML = `
      <div class="weeklyChartBars">
        ${week.activity.map(day => `
          <div class="weeklyBarItem">
            <div class="weeklyBarTrack">
              <i style="height:${Math.max(4, Math.round((day.minutes / max) * 100))}%"
                title="${day.minutes} min"></i>
            </div>
            <strong>${day.minutes}</strong>
            <span>${day.label}</span>
          </div>`).join("")}
      </div>
      <div class="weeklyMetrics">
        <span><strong>${week.minutes}</strong> min</span>
        <span><strong>${week.topics}</strong> tópicos</span>
        <span><strong>${week.questions}</strong> questões</span>
        <span><strong>${week.activeDays}</strong> dias ativos</span>
      </div>`;
  },

  renderGuardianPanel() {
    const root = document.getElementById("guardianDashboard");
    if (!root) return;

    const summary = ONC.AdvancedAnalytics.guardianSummary();

    root.innerHTML = `
      <div class="guardianHeader">
        <div>
          <span class="dashboardLabel">Visão do responsável</span>
          <h2>${summary.student}</h2>
          <p>Resumo objetivo da última semana de estudo.</p>
        </div>
        <button class="btn" type="button" onclick="ONC.GuardianReport.print()">
          Imprimir relatório
        </button>
      </div>

      <div class="guardianMetrics">
        <article><strong>${summary.week.minutes}</strong><span>minutos estudados</span></article>
        <article><strong>${summary.week.questions}</strong><span>questões respondidas</span></article>
        <article><strong>${summary.week.accuracy}%</strong><span>precisão semanal</span></article>
        <article><strong>${summary.overview.averageMastery}%</strong><span>domínio médio</span></article>
      </div>

      <div class="guardianNarrative">
        <article>
          <h3>O que avançou</h3>
          <p>${summary.week.activeDays
            ? `Houve atividade em ${summary.week.activeDays} dia${summary.week.activeDays === 1 ? "" : "s"}, com ${summary.week.topics} tópico${summary.week.topics === 1 ? "" : "s"} visitado${summary.week.topics === 1 ? "" : "s"}.`
            : "Ainda não houve atividade registrada nesta semana."}</p>
        </article>
        <article>
          <h3>O que merece atenção</h3>
          <p>${summary.mainAttention
            ? `${summary.mainAttention.title}, em ${summary.mainAttention.discipline}, deve ser revisado primeiro.`
            : "Nenhum conteúdo está em alerta neste momento."}</p>
        </article>
        <article>
          <h3>Próximo passo recomendado</h3>
          <p>${summary.priority[0]
            ? `Estudar ${summary.priority[0].title}, de ${summary.priority[0].discipline}.`
            : "Concluir a missão diária sugerida pelo tutor."}</p>
        </article>
      </div>

      <p class="guardianNote">
        Este painel resume dados registrados no navegador. Ele não substitui avaliação escolar ou orientação pedagógica profissional.
      </p>`;
  }
};
