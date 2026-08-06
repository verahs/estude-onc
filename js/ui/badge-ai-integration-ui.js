window.ONC = window.ONC || {};

ONC.BadgeAIIntegrationUI = {
  init() {
    this.render();
  },

  render() {
    const root = document.getElementById("badgeAIIntegrationPanel");
    if (!root || !ONC.BadgeAIIntegrationEngine) return;

    const analysis = ONC.BadgeAIIntegrationEngine.current();

    root.innerHTML = `
      <div class="badgeAIHeader">
        <div>
          <span class="dashboardLabel">Integração de medalhas com IA</span>
          <h2>${analysis.suggestions.length} recomendação${analysis.suggestions.length === 1 ? "" : "ões"} pedagógica${analysis.suggestions.length === 1 ? "" : "s"}</h2>
          <p>A IA cruza progresso de medalhas com prioridades reais de aprendizagem e carga cognitiva.</p>
        </div>
        <div class="badgeAIStatus ${analysis.overloaded ? "is-protected" : ""}">
          <strong>${analysis.overloaded ? "Carga protegida" : "Integração ativa"}</strong>
          <span>${analysis.prioritiesAnalyzed} prioridades analisadas</span>
        </div>
      </div>

      ${analysis.coachMessage ? `
        <div class="badgeAICoachMessage">
          <span>🧭</span>
          <p>${analysis.coachMessage}</p>
        </div>` : ""}

      <div class="badgeAISuggestions">
        ${analysis.suggestions.length ? analysis.suggestions.map(item => `
          <article>
            <div class="badgeAISuggestionIcon">${item.icon}</div>
            <div class="badgeAISuggestionContent">
              <span>${item.category}</span>
              <strong>${item.title}</strong>
              <p>${item.message}</p>
              <small>${item.reasons.join(" • ")}</small>
              <i><b style="width:${item.percent}%"></b></i>
              <em>${item.percent}% da medalha • confiança ${item.confidence}</em>
            </div>
            <div class="badgeAISuggestionActions">
              <button class="btn primary" type="button"
                onclick="ONC.BadgeAIIntegrationEngine.applySuggestion('${item.id}')">
                Iniciar ação
              </button>
              <button class="btn" type="button"
                onclick="ONC.BadgeAIIntegrationEngine.applyToDailyPlan('${item.id}')">
                Adicionar ao plano
              </button>
              <button class="textButton" type="button"
                onclick="ONC.BadgeAIIntegrationEngine.dismiss('${item.id}')">
                Não sugerir
              </button>
            </div>
          </article>`).join("") : `
          <p class="note">Nenhuma medalha está suficientemente próxima ou pedagogicamente alinhada neste momento.</p>`}
      </div>

      <details class="badgeAIPreferences">
        <summary>Preferências e critérios</summary>
        <div>
          <label>
            <input type="checkbox" ${analysis.preferences.enabled ? "checked" : ""}
              onchange="ONC.BadgeAIIntegrationEngine.updatePreference('enabled',this.checked)">
            <span>Ativar integração com IA</span>
          </label>
          <label>
            <input type="checkbox" ${analysis.preferences.allowDailyPlanIntegration ? "checked" : ""}
              onchange="ONC.BadgeAIIntegrationEngine.updatePreference('allowDailyPlanIntegration',this.checked)">
            <span>Permitir integração ao plano diário</span>
          </label>
          <label>
            <input type="checkbox" ${analysis.preferences.allowCoachMessages ? "checked" : ""}
              onchange="ONC.BadgeAIIntegrationEngine.updatePreference('allowCoachMessages',this.checked)">
            <span>Exibir mensagens do Coach</span>
          </label>
          <label>
            <input type="checkbox" ${analysis.preferences.avoidOverload ? "checked" : ""}
              onchange="ONC.BadgeAIIntegrationEngine.updatePreference('avoidOverload',this.checked)">
            <span>Reduzir sugestões em caso de sobrecarga</span>
          </label>
          <label>
            <span>Máximo de sugestões</span>
            <input type="number" min="1" max="5"
              value="${analysis.preferences.maxSuggestions}"
              onchange="ONC.BadgeAIIntegrationEngine.updatePreference('maxSuggestions',this.value)">
          </label>
        </div>
      </details>

      <div class="badgeAIFooter">
        <small>${analysis.disclaimer}</small>
      </div>`;
  },

  renderReport() {
    const root = document.getElementById("badgeAIIntegrationReport");
    if (!root || !ONC.BadgeAIIntegrationEngine) return;

    const analysis = ONC.BadgeAIIntegrationEngine.current();

    root.innerHTML = `
      <div class="badgeAIReportHeader">
        <div>
          <span class="dashboardLabel">IA e gamificação</span>
          <h2>Recomendações explicáveis</h2>
          <p>Compatibilidade entre medalhas, prioridades pedagógicas e proteção de carga.</p>
        </div>
      </div>

      <div class="badgeAIReportGrid">
        <article><span>Sugestões</span><strong>${analysis.suggestions.length}</strong></article>
        <article><span>Prioridades analisadas</span><strong>${analysis.prioritiesAnalyzed}</strong></article>
        <article><span>Carga atual</span><strong>${analysis.overloaded ? "Protegida" : "Regular"}</strong></article>
        <article><span>Integração</span><strong>${analysis.enabled ? "Ativa" : "Desativada"}</strong></article>
      </div>

      <section class="badgeAIReportList">
        ${analysis.suggestions.map(item => `
          <article>
            <span>${item.icon}</span>
            <div>
              <strong>${item.title}</strong>
              <small>Pontuação ${item.score}/100 • confiança ${item.confidence}</small>
              <p>${item.reasons.join(" • ")}</p>
            </div>
          </article>`).join("") || `<p class="note">Nenhuma sugestão ativa.</p>`}
      </section>

      <details class="badgeAIMethod">
        <summary>Como a IA decide</summary>
        <p>A pontuação combina proximidade da medalha, categoria, compatibilidade com prioridades do Recommendation Engine e ajuste de segurança.</p>
        <p>Recuperação e aprendizagem recebem maior peso. Em sobrecarga, a recomendação é reduzida ou convertida em revisão leve.</p>
        <p>${analysis.disclaimer}</p>
      </details>`;
  }
};
