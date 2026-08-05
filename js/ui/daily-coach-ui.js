window.ONC = window.ONC || {};

ONC.DailyCoachUI = {
  init() {
    this.render();
  },

  actionLabel(action) {
    return {
      review: "Revisão",
      study: "Leitura",
      practice: "Prática",
      consolidate: "Consolidação",
      questions: "Questões"
    }[action] || "Estudo";
  },

  render() {
    const root = document.getElementById("dailyCoachPanel");
    if (!root) return;

    const brief = ONC.DailyCoachEngine.brief();

    root.innerHTML = `
      <div class="dailyCoachHeader">
        <div>
          <span class="dashboardLabel">Coach diário</span>
          <h2>${brief.greeting}, ${brief.student}.</h2>
          <p>${brief.message}</p>
        </div>
        <label class="coachTimeSelector">
          <span>Tempo disponível</span>
          <select onchange="ONC.DailyCoachEngine.setAvailableMinutes(this.value)">
            ${[5,10,15,20,30].map(value => `
              <option value="${value}" ${value === brief.availableMinutes ? "selected" : ""}>
                ${value} min
              </option>`).join("")}
          </select>
        </label>
      </div>

      <div class="coachEvidence">
        <span>Progresso real</span>
        <strong>${brief.evidence}</strong>
      </div>

      ${brief.flags.length ? `
        <details class="coachAttention">
          <summary>${brief.flags.length} ajuste${brief.flags.length === 1 ? "" : "s"} de rotina identificado${brief.flags.length === 1 ? "" : "s"}</summary>
          <div>
            ${brief.flags.map(flag => `
              <article class="coachFlag coachFlag--${flag.severity}">
                <strong>${flag.title}</strong>
                <p>${flag.message}</p>
                <span>${flag.action}</span>
              </article>`).join("")}
          </div>
        </details>` : ""}

      <div class="coachPlan">
        ${brief.plan.length ? brief.plan.map((task, index) => `
          <article class="coachTask">
            <div class="coachTaskNumber">${index + 1}</div>
            <div class="coachTaskContent">
              <span>${this.actionLabel(task.action)} • ${task.discipline}</span>
              <h3>${task.title}</h3>
              <p>${task.reasons.join(" • ")}</p>
              <div>
                <small>⏱ ${task.minutes} min</small>
                <small>Prioridade ${task.score}</small>
                <small>Confiança ${task.confidence}%</small>
              </div>
            </div>
            <button class="btn ${index === 0 ? "primary" : ""}" type="button"
              onclick="ONC.DailyCoachEngine.startTask('${task.id}')">
              ${index === 0 ? "Começar agora" : "Abrir"}
            </button>
          </article>`).join("") : `
          <div class="coachEmpty">
            <strong>O tutor precisa de mais dados.</strong>
            <span>Leia um tópico e responda algumas questões para gerar o primeiro plano.</span>
          </div>`}
      </div>

      <div class="coachFooter">
        <div>
          <span>Impacto potencial</span>
          <strong>${brief.impact.label}</strong>
          <small>Confiança ${brief.impact.confidence}. ${brief.impact.note}</small>
        </div>
        <button class="btn" type="button"
          onclick="ONC.DailyCoachEngine.applyPlanToMission()">
          Usar como missão de hoje
        </button>
      </div>`;
  },

  renderReport() {
    const root = document.getElementById("dailyCoachReport");
    if (!root) return;

    const brief = ONC.DailyCoachEngine.brief();
    const flags = brief.flags;
    const plan = brief.plan;

    root.innerHTML = `
      <div class="coachReportHeader">
        <div>
          <span class="dashboardLabel">Coach Diário</span>
          <h2>Plano e orientação de hoje</h2>
          <p>Resumo baseado no histórico local, sem previsão oficial de nota ou medalha.</p>
        </div>
        <button class="btn" type="button"
          onclick="ONC.DailyCoachEngine.refresh('report');ONC.DailyCoachUI.render();ONC.DailyCoachUI.renderReport()">
          Atualizar análise
        </button>
      </div>

      <div class="coachReportGrid">
        <article>
          <span>Tempo planejado</span>
          <strong>${plan.reduce((sum, item) => sum + item.minutes, 0)} min</strong>
        </article>
        <article>
          <span>Ações selecionadas</span>
          <strong>${plan.length}</strong>
        </article>
        <article>
          <span>Ajustes comportamentais</span>
          <strong>${flags.length}</strong>
        </article>
        <article>
          <span>Impacto interno</span>
          <strong>+${brief.impact.points}</strong>
        </article>
      </div>

      <div class="coachReportNarrative">
        <article>
          <h3>Orientação principal</h3>
          <p>${brief.message}</p>
        </article>
        <article>
          <h3>Evidência positiva</h3>
          <p>${brief.evidence}</p>
        </article>
        <article>
          <h3>Primeiro passo</h3>
          <p>${plan[0]
            ? `${this.actionLabel(plan[0].action)} ${plan[0].title} por cerca de ${plan[0].minutes} minutos.`
            : "Realizar uma atividade curta para gerar recomendações."}</p>
        </article>
      </div>`;
  }
};
