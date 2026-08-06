window.ONC = window.ONC || {};

ONC.ConsistencyCoachUI = {
  init() {
    this.render();
  },

  render() {
    const root = document.getElementById("consistencyCoachPanel");
    if (!root) return;

    const analysis = ONC.ConsistencyCoach.current();

    root.innerHTML = `
      <div class="consistencyHeader">
        <div>
          <span class="dashboardLabel">Coach de consistência</span>
          <h2>${analysis.label}</h2>
          <p>Regularidade semanal, equilíbrio entre disciplinas e distribuição da carga.</p>
        </div>
        <div class="consistencyScore">
          <strong>${analysis.score}</strong>
          <span>consistência geral</span>
        </div>
      </div>

      <div class="consistencyMetrics">
        <article><strong>${analysis.profile.active7}</strong><span>dias ativos em 7</span></article>
        <article><strong>${analysis.profile.streak}</strong><span>sequência atual</span></article>
        <article><strong>${analysis.balance}%</strong><span>equilíbrio entre disciplinas</span></article>
        <article><strong>${analysis.overload.peakShare}%</strong><span>maior concentração diária</span></article>
      </div>

      <div class="consistencySignals">
        ${analysis.signals.map(signal => `
          <article class="consistencySignal consistencySignal--${signal.severity}">
            <strong>${signal.title}</strong>
            <span>${signal.detail}</span>
            <p>${signal.action}</p>
          </article>`).join("")}
      </div>

      <section class="consistencyPlan">
        <div>
          <span>Plano de consistência</span>
          <strong>Meta: ${analysis.plan.targetDays} dias ativos nesta semana</strong>
        </div>
        <div>
          ${analysis.plan.actions.map(action => `
            <article>
              <strong>${action.title}</strong>
              <span>${action.detail}</span>
              ${action.discipline ? `
                <button class="textButton" type="button"
                  onclick="ONC.ConsistencyCoach.openDiscipline('${action.discipline}')">
                  Abrir ${action.discipline}
                </button>` : ""}
            </article>`).join("")}
        </div>
      </section>

      <div class="consistencyFooter">
        <small>${analysis.disclaimer}</small>
        <button class="btn" type="button"
          onclick="ONC.ConsistencyCoach.refresh('manual');ONC.ConsistencyCoachUI.render()">
          Atualizar
        </button>
      </div>`;
  },

  renderReport() {
    const root = document.getElementById("consistencyCoachReport");
    if (!root) return;

    const analysis = ONC.ConsistencyCoach.current();
    const maxEvents = Math.max(1, ...analysis.load.map(item => item.events));

    root.innerHTML = `
      <div class="consistencyReportHeader">
        <div>
          <span class="dashboardLabel">Consistência semanal</span>
          <h2>Equilíbrio entre frequência, carga e disciplinas</h2>
          <p>O painel acompanha regularidade operacional, sem emitir julgamento sobre comportamento.</p>
        </div>
      </div>

      <div class="consistencyReportGrid">
        <article><span>Índice geral</span><strong>${analysis.score}/100</strong></article>
        <article><span>Meta semanal</span><strong>${analysis.plan.targetDays} dias</strong></article>
        <article><span>Equilíbrio</span><strong>${analysis.balance}%</strong></article>
        <article><span>Concentração máxima</span><strong>${analysis.overload.peakShare}%</strong></article>
      </div>

      <section class="disciplineLoad">
        <h3>Distribuição recente por disciplina</h3>
        ${analysis.load.map(item => `
          <article>
            <div>
              <strong>${item.discipline}</strong>
              <span>${item.events} atividade${item.events === 1 ? "" : "s"} • domínio ${item.mastery}%</span>
            </div>
            <div class="disciplineLoadBar">
              <i style="width:${Math.round(item.events / maxEvents * 100)}%"></i>
            </div>
          </article>`).join("")}
      </section>

      <details class="consistencyMethod">
        <summary>Como o índice é composto</summary>
        <p>Frequência semanal: 35%; regularidade entre sessões: 30%; equilíbrio entre disciplinas: 20%; sequência: 10%; concentração da carga: 5%.</p>
        <p>${analysis.disclaimer}</p>
      </details>`;
  }
};
