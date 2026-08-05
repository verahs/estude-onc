window.ONC = window.ONC || {};

ONC.AdaptiveTutorUI = {
  init() {
    this.render();
  },

  render() {
    this.renderDashboard();
    this.renderReports();
  },

  trendLabel(value) {
    return {
      rising: "↗ aprendendo rapidamente",
      falling: "↘ retenção em queda",
      stable: "→ desempenho estável",
      insufficient: "dados ainda insuficientes"
    }[value] || "dados ainda insuficientes";
  },

  errorLabel(value) {
    return {
      distraction: "possível distração",
      conceptual: "erro conceitual",
      recurring: "erro recorrente",
      "post-review": "esquecimento após revisão",
      "unstable-mastery": "domínio instável"
    }[value] || "sem padrão dominante";
  },

  renderDashboard() {
    const root = document.getElementById("adaptiveTutorPanel");
    if (!root) return;

    const next = ONC.RecommendationEngine.next();
    if (!next) {
      root.innerHTML = `<p class="note">Responda questões para o tutor construir seu perfil adaptativo.</p>`;
      return;
    }

    root.innerHTML = `
      <div class="adaptiveTutorHeader">
        <div>
          <span class="dashboardLabel">Motor pedagógico adaptativo</span>
          <h2>Por que estudar isto agora?</h2>
        </div>
        <strong class="adaptiveScore">${next.score}</strong>
      </div>
      <div class="adaptiveRecommendation">
        <div>
          <span>${next.discipline}</span>
          <h3>${next.title}</h3>
          <p>${next.reasons.join(" • ")}</p>
        </div>
        <button class="btn primary" type="button"
          onclick="ONC.Attention.openTopic('${next.topicId}')">Começar</button>
      </div>
      <div class="adaptiveMetrics">
        <span><b>${next.mastery}%</b> domínio</span>
        <span><b>${next.confidence}%</b> confiança</span>
        <span><b>${next.memory}%</b> retenção</span>
        <span>${this.trendLabel(next.trend)}</span>
      </div>
      ${next.graphRisk.length ? `
        <details class="dependencyDisclosure">
          <summary>Conteúdos relacionados que podem ser afetados</summary>
          <ul>${next.graphRisk.map(item =>
            `<li>${item.title}: risco estimado ${item.risk}%</li>`
          ).join("")}</ul>
        </details>` : ""}`;
  },

  renderReports() {
    const root = document.getElementById("adaptiveLearningReport");
    if (!root) return;

    const ranked = ONC.RecommendationEngine.rank({ limit: 8, excludeMastered: false });
    const profiles = ranked.map(item => ({
      ...item,
      profile: ONC.LearningEngine.profile(item.topicId),
      diagnosis: ONC.DiagnosticEngine?.summary?.(item.topicId)
    }));

    root.innerHTML = `
      <div class="adaptiveReportHeader">
        <div>
          <span class="dashboardLabel">Perfil cognitivo</span>
          <h2>Diagnóstico adaptativo por tópico</h2>
          <p>Os indicadores usam histórico local e mostram também a confiança da estimativa.</p>
        </div>
        <button class="btn" type="button"
          onclick="ONC.AdaptivePlanner.recalculate('manual')">Recalcular missão</button>
      </div>
      <div class="adaptiveProfileTable">
        ${profiles.map(item => `
          <article>
            <div>
              <strong>${item.title}</strong>
              <span>${item.discipline}</span>
            </div>
            <span>${item.mastery}% domínio</span>
            <span>${item.confidence}% confiança</span>
            <span>${this.trendLabel(item.trend)}</span>
            <span>${this.errorLabel(item.errorType)}</span>
            <span>${item.diagnosis?.dominantLabel || "causa ainda incerta"}</span>
          </article>`).join("")}
      </div>
      <details class="auditDisclosure">
        <summary>Auditoria da última decisão</summary>
        <pre>${JSON.stringify(ONC.RecommendationEngine.audit[0] || {}, null, 2)}</pre>
      </details>`;
  }
};
