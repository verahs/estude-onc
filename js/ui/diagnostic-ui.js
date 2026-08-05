window.ONC = window.ONC || {};

ONC.DiagnosticUI = {
  init() {
    this.renderReports();
  },

  feedback(diagnosis) {
    if (!diagnosis || diagnosis.correct) return "";

    const confidenceClass = diagnosis.confidence >= 70
      ? "high"
      : diagnosis.confidence >= 45
        ? "medium"
        : "low";

    return `
      <details class="diagnosticFeedback">
        <summary>
          <span>Hipótese sobre a dificuldade</span>
          <strong class="diagnosticConfidence diagnosticConfidence--${confidenceClass}">
            ${diagnosis.confidence}% de confiança
          </strong>
        </summary>
        <div class="diagnosticFeedbackBody">
          <h4>${diagnosis.label}</h4>
          <p>${diagnosis.rootCause}</p>
          <div class="diagnosticEvidence">
            <b>Evidências consideradas</b>
            <ul>${diagnosis.evidence.map(item => `<li>${item}</li>`).join("")}</ul>
          </div>
          <div class="diagnosticAction">
            <b>Intervenção sugerida</b>
            <span>${diagnosis.intervention}</span>
          </div>
          ${diagnosis.prerequisite ? `
            <div class="diagnosticPrerequisite">
              <b>Fundamento relacionado</b>
              <button type="button" class="textButton"
                onclick="ONC.SmartNavigator.goToPrerequisite('${diagnosis.prerequisite.topicId}', {
                  reason: 'Este conteúdo é um pré-requisito para corrigir a dificuldade identificada.',
                  returnTarget: { sectionId: 'reportsSection', elementId: 'diagnosticReport' },
                  retryQuestionId: '${diagnosis.questionId || ""}'
                })">
                📖 Revisar agora: ${diagnosis.prerequisite.title}
              </button>
            </div>` : ""}
          <small>${diagnosis.limitations}</small>
        </div>
      </details>`;
  },

  renderReports() {
    const root = document.getElementById("diagnosticReport");
    if (!root) return;

    const clusters = ONC.DiagnosticEngine.rootCauseClusters().slice(0, 8);
    if (!clusters.length) {
      root.innerHTML = `
        <span class="dashboardLabel">Motor de diagnóstico</span>
        <h2>Causas prováveis das dificuldades</h2>
        <p class="note">Responda questões incorretamente para que o sistema reúna evidências.</p>`;
      return;
    }

    root.innerHTML = `
      <div class="diagnosticReportHeader">
        <div>
          <span class="dashboardLabel">Motor de diagnóstico</span>
          <h2>Causas prováveis das dificuldades</h2>
          <p>Hipóteses agrupadas por habilidade e padrão de erro.</p>
        </div>
      </div>
      <div class="diagnosticClusters">
        ${clusters.map(item => `
          <article>
            <div class="diagnosticClusterHeading">
              <strong>${item.label}</strong>
              <span>${item.count} ocorrência${item.count === 1 ? "" : "s"}</span>
            </div>
            <p>${item.skill}</p>
            <small>${item.topics.slice(0, 3).join(" • ")}</small>
            <div class="diagnosticClusterMeter">
              <i style="width:${item.confidence}%"></i>
            </div>
            <span>${item.confidence}% de confiança média</span>
          </article>`).join("")}
      </div>
      <p class="diagnosticDisclaimer">
        São hipóteses pedagógicas baseadas no histórico local. Não equivalem a diagnóstico profissional.
      </p>`;
  }
};
