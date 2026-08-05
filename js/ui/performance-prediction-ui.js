window.ONC = window.ONC || {};

ONC.PerformancePredictionUI = {
  init() {
    this.render();
  },

  render() {
    const root = document.getElementById("performancePredictionPanel");
    if (!root) return;

    const prediction = ONC.PerformancePredictionEngine.current();

    root.innerHTML = `
      <div class="predictionHeader">
        <div>
          <span class="dashboardLabel">Predição de desempenho</span>
          <h2>Faixa provável nas atividades da plataforma</h2>
          <p>${prediction.interpretation}</p>
        </div>
        <div class="predictionScore">
          <strong>${prediction.point}%</strong>
          <span>${prediction.label}</span>
        </div>
      </div>

      <div class="predictionRange" aria-label="Faixa estimada de ${prediction.lower}% a ${prediction.upper}%">
        <div class="predictionTrack">
          <i style="left:${prediction.lower}%;width:${Math.max(2, prediction.upper - prediction.lower)}%"></i>
          <b style="left:${prediction.point}%"></b>
        </div>
        <div class="predictionScale">
          <span>${prediction.lower}%</span>
          <span>estimativa central ${prediction.point}%</span>
          <span>${prediction.upper}%</span>
        </div>
      </div>

      <div class="predictionMetrics">
        <article>
          <span>Confiança</span>
          <strong>${prediction.confidence.label}</strong>
          <small>${prediction.confidence.score}/100</small>
        </article>
        <article>
          <span>Simulados usados</span>
          <strong>${prediction.quiz.count}</strong>
          <small>${prediction.quiz.weightedAverage ?? "—"}% média ponderada</small>
        </article>
        <article>
          <span>Cobertura</span>
          <strong>${prediction.learning.coverage}%</strong>
          <small>${prediction.learning.profileCount} perfis com tentativas</small>
        </article>
        <article>
          <span>Cenário com plano</span>
          <strong>${prediction.scenario.withDailyPlan}%</strong>
          <small>ganho potencial +${prediction.scenario.estimatedGain}</small>
        </article>
      </div>

      <div class="predictionColumns">
        <section>
          <h3>Riscos que ampliam a incerteza</h3>
          ${prediction.risks.length
            ? prediction.risks.map(item => `
              <article class="predictionRisk">
                <strong>${item.title}</strong>
                <span>${item.detail}</span>
              </article>`).join("")
            : '<p class="note">Nenhum risco relevante identificado neste momento.</p>'}
        </section>
        <section>
          <h3>Melhores oportunidades</h3>
          ${prediction.opportunities.map(item => `
            <article class="predictionOpportunity">
              <strong>${item.title}</strong>
              <span>${item.detail}</span>
            </article>`).join("")}
        </section>
      </div>

      <div class="predictionFooter">
        <small>${prediction.disclaimer}</small>
        <button class="btn" type="button"
          onclick="ONC.PerformancePredictionEngine.refresh('manual');ONC.PerformancePredictionUI.render();">
          Recalcular
        </button>
      </div>`;
  },

  renderReport() {
    const root = document.getElementById("performancePredictionReport");
    if (!root) return;

    const prediction = ONC.PerformancePredictionEngine.current();
    const calibration = prediction.calibration;

    root.innerHTML = `
      <div class="predictionReportHeader">
        <div>
          <span class="dashboardLabel">Predição de desempenho</span>
          <h2>Composição e incerteza da estimativa</h2>
          <p>A estimativa combina resultados, domínio, memória, cobertura e consistência.</p>
        </div>
      </div>

      <div class="predictionReportGrid">
        <article>
          <span>Estimativa central</span>
          <strong>${prediction.point}%</strong>
        </article>
        <article>
          <span>Faixa interna</span>
          <strong>${prediction.lower}–${prediction.upper}%</strong>
        </article>
        <article>
          <span>Confiança</span>
          <strong>${prediction.confidence.label}</strong>
        </article>
        <article>
          <span>Erro de calibração</span>
          <strong>${calibration.available ? `${calibration.meanAbsoluteError} p.p.` : "—"}</strong>
        </article>
      </div>

      <div class="subjectPredictionTable">
        ${prediction.subjects.map(subject => `
          <article>
            <div><strong>${subject.name}</strong><span>${subject.quizCount} simulado${subject.quizCount === 1 ? "" : "s"}</span></div>
            <span>${subject.point}% estimado</span>
            <span>${subject.mastery}% domínio</span>
            <span>${subject.memory}% memória</span>
            <span>${subject.coverage}% cobertura</span>
          </article>`).join("")}
      </div>

      <details class="predictionMethod">
        <summary>Como esta estimativa é calculada</summary>
        <p>O ponto central combina média ponderada de simulados, domínio, memória, cobertura e consistência. A faixa aumenta quando a amostra é pequena ou variável.</p>
        <p>${calibration.note}</p>
        <p>${prediction.disclaimer}</p>
      </details>`;
  }
};
