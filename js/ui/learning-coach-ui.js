window.ONC = window.ONC || {};

ONC.LearningCoachUI = {
  init() {
    this.render();
  },

  trendLabel(value) {
    return {
      rising: "↗ evolução",
      falling: "↘ queda recente",
      stable: "→ estável",
      insufficient: "dados limitados"
    }[value] || "dados limitados";
  },

  render() {
    const root = document.getElementById("learningCoachPanel");
    if (!root) return;

    const analysis = ONC.LearningCoach.current();

    root.innerHTML = `
      <div class="learningCoachHeader">
        <div>
          <span class="dashboardLabel">Coach de aprendizagem</span>
          <h2>${analysis.profile.headline}</h2>
          <p>${analysis.profile.explanation}</p>
        </div>
        <div class="learningCoachConfidence">
          <strong>${analysis.confidence.score}</strong>
          <span>confiança ${analysis.confidence.label.toLowerCase()}</span>
        </div>
      </div>

      <div class="learningStrategyCards">
        ${analysis.strategies.length ? analysis.strategies.slice(0, 5).map(strategy => `
          <article>
            <span>${strategy.label}</span>
            <strong>${strategy.accuracy}%</strong>
            <small>${strategy.attempts} tentativa${strategy.attempts === 1 ? "" : "s"} • confiança ${strategy.confidence}%</small>
            <i><b style="width:${strategy.effectiveness}%"></b></i>
          </article>`).join("") : `
          <article class="learningCoachEmpty">
            <strong>Estratégias ainda não comparáveis</strong>
            <span>Use leitura, questões e revisões em momentos diferentes para gerar evidências.</span>
          </article>`}
      </div>

      ${analysis.topics[0] ? `
        <section class="learningNextMethod">
          <div>
            <span>Melhor método para a próxima ação</span>
            <strong>${analysis.topics[0].method.label}: ${analysis.topics[0].title}</strong>
            <small>${analysis.topics[0].pattern.evidence}</small>
          </div>
          <button class="btn primary" type="button"
            onclick="ONC.LearningCoach.startMethod('${analysis.topics[0].topicId}')">
            Começar método
          </button>
        </section>` : ""}

      <details class="learningTopicMethods">
        <summary>Métodos recomendados por conteúdo</summary>
        <div>
          ${analysis.topics.map(item => `
            <article>
              <div>
                <span>${item.discipline} • prioridade ${item.priority}</span>
                <strong>${item.title}</strong>
                <small>${item.pattern.label} • ${this.trendLabel(item.trend)}</small>
              </div>
              <div class="learningMethodSteps">
                <b>${item.method.label}</b>
                <ol>${item.method.steps.map(step => `<li>${step}</li>`).join("")}</ol>
              </div>
              <button class="btn" type="button"
                onclick="ONC.LearningCoach.startMethod('${item.topicId}')">
                Aplicar
              </button>
            </article>`).join("")}
        </div>
      </details>

      <div class="learningCoachFooter">
        <small>${analysis.disclaimer}</small>
        <div>
          <button class="btn" type="button"
            onclick="ONC.LearningCoach.applyToDailyPlan()">
            Aplicar ao plano diário
          </button>
          <button class="btn" type="button"
            onclick="ONC.LearningCoach.refresh('manual');ONC.LearningCoachUI.render()">
            Atualizar
          </button>
        </div>
      </div>`;
  },

  renderReport() {
    const root = document.getElementById("learningCoachReport");
    if (!root) return;

    const analysis = ONC.LearningCoach.current();

    root.innerHTML = `
      <div class="learningCoachReportHeader">
        <div>
          <span class="dashboardLabel">Estratégias de aprendizagem</span>
          <h2>Resultados observados por método</h2>
          <p>Comparação baseada nas atividades registradas, sem classificar o aluno em um estilo fixo.</p>
        </div>
      </div>

      <div class="learningCoachReportGrid">
        <article><span>Confiança</span><strong>${analysis.confidence.label}</strong></article>
        <article><span>Estratégias observadas</span><strong>${analysis.strategies.length}</strong></article>
        <article><span>Tópicos orientados</span><strong>${analysis.topics.length}</strong></article>
        <article><span>Próximo método</span><strong>${analysis.bestNextMethod?.label || "—"}</strong></article>
      </div>

      <section class="learningStrategyTable">
        ${analysis.strategies.map(strategy => `
          <article>
            <div>
              <strong>${strategy.label}</strong>
              <span>${strategy.topicCount} tópico${strategy.topicCount === 1 ? "" : "s"}</span>
            </div>
            <span>${strategy.accuracy}% precisão</span>
            <span>${strategy.attempts} tentativas</span>
            <span>${strategy.averageResponseMs ? Math.round(strategy.averageResponseMs / 1000) + "s" : "—"} por resposta</span>
            <span>${strategy.effectiveness} efetividade</span>
          </article>`).join("")}
      </section>

      <details class="learningCoachMethodology">
        <summary>Como as recomendações são formadas</summary>
        <p>O sistema compara precisão, tempo, repetição de erros, revisões anteriores e evolução recente. A recomendação pode ser leitura orientada, prática, prática guiada ou revisão espaçada.</p>
        <p>Um resultado melhor observado não prova causalidade e não define preferência permanente.</p>
        <p>${analysis.disclaimer}</p>
      </details>`;
  }
};
