window.ONC = window.ONC || {};

ONC.GuardianDashboardUI = {
  init() {
    this.render();
  },

  render() {
    const root = document.getElementById("guardianDashboardPanel");
    if (!root) return;

    const snapshot = ONC.GuardianDashboardEngine.current();

    root.innerHTML = `
      <div class="guardianHeader">
        <div>
          <span class="dashboardLabel">Painel do responsável</span>
          <h2>Acompanhamento de ${snapshot.student}</h2>
          <p>${snapshot.narrative}</p>
        </div>
        <div class="guardianPreparation">
          <strong>${snapshot.overview.preparation}%</strong>
          <span>preparação interna</span>
        </div>
      </div>

      <div class="guardianMetrics">
        <article><strong>${snapshot.week.activeDays}</strong><span>dias ativos</span></article>
        <article><strong>${snapshot.week.minutes}</strong><span>minutos na semana</span></article>
        <article><strong>${snapshot.week.questions}</strong><span>questões</span></article>
        <article><strong>${snapshot.week.accuracy}%</strong><span>precisão</span></article>
        <article><strong>${snapshot.overview.mastery}%</strong><span>domínio médio</span></article>
        <article><strong>${snapshot.overview.memory}%</strong><span>memória média</span></article>
      </div>

      <div class="guardianColumns">
        <section class="guardianStrengths">
          <h3>Pontos positivos</h3>
          ${snapshot.strengths.length ? snapshot.strengths.map(item => `
            <article>
              <strong>${item.title}</strong>
              <span>${item.detail}</span>
              <small>${item.source}</small>
            </article>`).join("") : `
            <p class="note">Ainda não há evidência suficiente para destacar um padrão estável.</p>`}
        </section>

        <section class="guardianAttention">
          <h3>Pontos de atenção</h3>
          ${snapshot.attention.length ? snapshot.attention.slice(0, 3).map((item, index) => `
            <article class="guardianAttention--${item.severity}">
              <strong>${item.title}</strong>
              <span>${item.detail}</span>
              <small>${item.source}</small>
              ${item.topicId ? `
                <button class="textButton" type="button"
                  onclick="ONC.GuardianDashboardEngine.openAttention(${index})">
                  Consultar conteúdo
                </button>` : ""}
            </article>`).join("") : `
            <p class="note">Nenhum ponto de atenção relevante neste momento.</p>`}
        </section>
      </div>

      <details class="guardianSupport">
        <summary>Como apoiar sem aumentar a pressão</summary>
        <div>
          ${snapshot.support.map(item => `
            <article>
              <strong>${item.title}</strong>
              <span>${item.detail}</span>
              <p>${item.do}</p>
            </article>`).join("")}
        </div>
      </details>

      <div class="guardianFooter">
        <small>${snapshot.disclaimer}</small>
        <div>
          <button class="btn" type="button"
            onclick="ONC.GuardianDashboardEngine.downloadText()">
            Baixar resumo
          </button>
          <button class="btn" type="button"
            onclick="ONC.GuardianDashboardEngine.print()">
            Imprimir
          </button>
          <button class="btn" type="button"
            onclick="ONC.GuardianDashboardEngine.refresh('manual');ONC.GuardianDashboardUI.render()">
            Atualizar
          </button>
        </div>
      </div>`;
  },

  renderReport() {
    const root = document.getElementById("guardianDashboardReport");
    if (!root) return;

    const snapshot = ONC.GuardianDashboardEngine.current();

    root.innerHTML = `
      <div class="guardianReportHeader">
        <div>
          <span class="dashboardLabel">Relatório do responsável</span>
          <h2>${snapshot.student}</h2>
          <p>${snapshot.narrative}</p>
        </div>
      </div>

      <div class="guardianReportGrid">
        <article><span>Preparação interna</span><strong>${snapshot.overview.preparation}%</strong></article>
        <article><span>Faixa estimada</span><strong>${snapshot.prediction.lower}–${snapshot.prediction.upper}%</strong></article>
        <article><span>Confiança</span><strong>${snapshot.prediction.confidence.label}</strong></article>
        <article><span>Rotina</span><strong>${snapshot.behavioral.score}/100</strong></article>
        <article><span>Cobertura</span><strong>${snapshot.overview.coverage}%</strong></article>
        <article><span>Método seguinte</span><strong>${snapshot.learning.nextMethod || "—"}</strong></article>
      </div>

      <section class="guardianExecutiveActions">
        <h3>Orientações objetivas</h3>
        ${snapshot.support.map((item, index) => `
          <article>
            <b>${index + 1}</b>
            <div>
              <strong>${item.title}</strong>
              <span>${item.do}</span>
            </div>
          </article>`).join("")}
      </section>

      <details class="guardianMethod">
        <summary>Limites e interpretação</summary>
        <p>A faixa de desempenho é interna à plataforma e não representa nota oficial, corte, classificação ou medalha.</p>
        <p>Os indicadores de rotina descrevem somente eventos registrados. Eles não revelam intenção, personalidade, motivação ou contexto familiar.</p>
        <p>${snapshot.disclaimer}</p>
      </details>`;
  }
};
