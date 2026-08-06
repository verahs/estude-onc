window.ONC = window.ONC || {};

ONC.ProcrastinationUI = {
  init() {
    this.render();
  },

  render() {
    const root = document.getElementById("procrastinationPanel");
    if (!root) return;

    const analysis = ONC.ProcrastinationDetector.current();

    root.innerHTML = `
      <div class="procrastinationHeader">
        <div>
          <span class="dashboardLabel">Detector de adiamento</span>
          <h2>${analysis.level.label}</h2>
          <p>${analysis.level.message}</p>
        </div>
        <div class="procrastinationScore">
          <strong>${analysis.score}</strong>
          <span>índice operacional</span>
        </div>
      </div>

      <div class="procrastinationConfidence">
        <span>Confiança da leitura</span>
        <strong>${analysis.confidence.label}</strong>
        <small>${analysis.confidence.score}/100 — baseada na quantidade de eventos observados</small>
      </div>

      <div class="procrastinationSignals">
        ${analysis.signals.map(signal => `
          <article class="procrastinationSignal procrastinationSignal--${signal.severity}">
            <strong>${signal.title}</strong>
            <span>${signal.evidence}</span>
            <p>${signal.intervention}</p>
          </article>`).join("")}
      </div>

      <section class="smallestAction">
        <div>
          <span>Menor próxima ação</span>
          <strong>${analysis.nextAction.title}</strong>
          <small>Estimativa: ${analysis.nextAction.minutes} min</small>
        </div>
        <button class="btn primary" type="button"
          onclick="ONC.ProcrastinationDetector.startSmallestAction()">
          ${analysis.nextAction.action}
        </button>
      </section>

      <details class="procrastinationDetails">
        <summary>Ver evidências do índice</summary>
        <div class="procrastinationMetrics">
          <article><strong>${analysis.metrics.mission.pending}</strong><span>tarefas pendentes</span></article>
          <article><strong>${analysis.metrics.overdue.length}</strong><span>revisões vencidas</span></article>
          <article><strong>${analysis.metrics.navigation.abandoned}</strong><span>aberturas sem conclusão</span></article>
          <article><strong>${analysis.metrics.navigation.veryShortPauses}</strong><span>saídas rápidas</span></article>
          <article><strong>${analysis.metrics.switching.rapidSwitches}</strong><span>trocas rápidas</span></article>
        </div>
      </details>

      <div class="procrastinationFooter">
        <small>${analysis.disclaimer}</small>
        <button class="btn" type="button"
          onclick="ONC.ProcrastinationDetector.refresh('manual');ONC.ProcrastinationUI.render()">
          Atualizar
        </button>
      </div>`;
  },

  renderReport() {
    const root = document.getElementById("procrastinationReport");
    if (!root) return;

    const analysis = ONC.ProcrastinationDetector.current();
    const components = analysis.components;
    const items = [
      ["Missão pendente", components.pendingMission],
      ["Revisões vencidas", components.overdueReview],
      ["Abertura sem conclusão", components.abandonment],
      ["Saída rápida", components.shortExit],
      ["Troca de tarefa", components.switching],
      ["Inatividade", components.inactivity]
    ];

    root.innerHTML = `
      <div class="procrastinationReportHeader">
        <div>
          <span class="dashboardLabel">Adiamento e conclusão</span>
          <h2>Análise operacional das tarefas iniciadas</h2>
          <p>O painel mede eventos de uso; não atribui intenção, preguiça ou traço psicológico.</p>
        </div>
      </div>

      <div class="procrastinationComponentList">
        ${items.map(([label, value]) => `
          <article>
            <div><strong>${label}</strong><span>${Math.round(value)} pontos</span></div>
            <div class="procrastinationBar"><i style="width:${Math.round(value)}%"></i></div>
          </article>`).join("")}
      </div>

      <div class="procrastinationReportSummary">
        <article>
          <span>Índice atual</span>
          <strong>${analysis.score}/100</strong>
        </article>
        <article>
          <span>Confiança</span>
          <strong>${analysis.confidence.label}</strong>
        </article>
        <article>
          <span>Conclusão de navegações</span>
          <strong>${analysis.metrics.navigation.completionRate}%</strong>
        </article>
        <article>
          <span>Missão concluída</span>
          <strong>${analysis.metrics.mission.completionRate}%</strong>
        </article>
      </div>

      <details class="procrastinationMethod">
        <summary>Como interpretar</summary>
        <p>O índice aumenta com tarefas antigas pendentes, revisões vencidas, aberturas sem conclusão, saídas muito rápidas, trocas frequentes e períodos longos sem atividade.</p>
        <p>Ele não determina a causa desses eventos. Problemas de tempo, conexão, saúde, rotina familiar ou uso compartilhado do dispositivo podem produzir padrões semelhantes.</p>
        <p>${analysis.disclaimer}</p>
      </details>`;
  }
};
