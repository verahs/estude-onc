window.ONC = window.ONC || {};

ONC.ExamStudyPlannerUI = {
  init() {
    this.ensurePanel();
    this.render();
  },

  ensurePanel() {
    const system = document.getElementById("intelligenceModule-system");
    if (!system || document.getElementById("examStudyPlannerPanel")) return;

    const panel = document.createElement("section");
    panel.id = "examStudyPlannerPanel";
    panel.className = "card examStudyPlannerPanel";
    system.prepend(panel);
  },

  formatDate(value) {
    if (!value) return "—";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(new Date(`${value}T12:00:00`));
  },

  formatHours(value) {
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);

    if (hours && minutes) return `${hours}h${String(minutes).padStart(2, "0")}`;
    if (hours) return `${hours}h`;
    return `${minutes}min`;
  },

  render() {
    this.ensurePanel();

    const root = document.getElementById("examStudyPlannerPanel");
    if (!root || !ONC.ExamStudyPlannerEngine) return;

    const plan = ONC.ExamStudyPlannerEngine.calculate();
    const past = plan.daysRemaining < 0;

    root.innerHTML = `
      <div class="examPlannerHeader">
        <div>
          <span class="dashboardLabel">Planejamento para a prova</span>
          <h2>Contagem regressiva e carga sugerida</h2>
          <p>A data padrão é 13/08/2026 e pode ser alterada a qualquer momento.</p>
        </div>
        <div class="examPlannerUrgency urgency--${plan.urgency.key}">
          <strong>${plan.urgency.label}</strong>
          <span>${past ? "Atualize a data" : plan.daysRemaining === 0 ? "Hoje" : `${plan.daysRemaining} dia${plan.daysRemaining === 1 ? "" : "s"}`}</span>
        </div>
      </div>

      <div class="examPlannerControls">
        <label>
          <span>Data da prova</span>
          <input id="examPlannerDate" type="date"
            value="${plan.examDate}"
            onchange="ONC.ExamStudyPlannerEngine.setExamDate(this.value)">
        </label>
        <button type="button" class="btn"
          onclick="ONC.ExamStudyPlannerEngine.resetDefault()">
          Restaurar 13/08/2026
        </button>
      </div>

      <div class="examPlannerMetrics">
        <article>
          <span>Prova</span>
          <strong>${this.formatDate(plan.examDate)}</strong>
        </article>
        <article>
          <span>Dias restantes</span>
          <strong>${past ? "Data passada" : plan.daysRemaining}</strong>
        </article>
        <article>
          <span>Estudo por dia</span>
          <strong>${past ? "—" : this.formatHours(plan.dailyHours)}</strong>
        </article>
        <article>
          <span>Total sugerido</span>
          <strong>${past ? "—" : this.formatHours(plan.totalHours)}</strong>
        </article>
      </div>

      <div class="examPlannerBody">
        <section>
          <h3>Distribuição do período</h3>
          <div class="examPlannerDistribution">
            <article>
              <strong>${plan.studyDays}</strong>
              <span>dias de estudo</span>
            </article>
            <article>
              <strong>${plan.restDays}</strong>
              <span>dia${plan.restDays === 1 ? "" : "s"} de descanso</span>
            </article>
          </div>

          <div class="examPlannerSession">
            <span>Formato diário sugerido</span>
            <strong>${past ? "Cadastre uma nova data." : plan.sessionPlan}</strong>
          </div>
        </section>

        <section>
          <h3>Prioridade da preparação</h3>
          <div class="examPlannerMix">
            ${plan.mix.map(item => `
              <article>
                <div>
                  <strong>${item.label}</strong>
                  <span>${item.percent}%</span>
                </div>
                <i><b style="width:${item.percent}%"></b></i>
              </article>`).join("") || `<p class="note">Atualize a data para gerar a distribuição.</p>`}
          </div>
        </section>
      </div>

      <div class="examPlannerGuidance">
        <span aria-hidden="true">🧭</span>
        <div>
          <strong>${plan.urgency.label}</strong>
          <p>${plan.urgency.message}</p>
        </div>
      </div>

      <details class="examPlannerMethod">
        <summary>Como a carga é calculada</summary>
        <p>A recomendação usa os dias corridos até a prova, reserva aproximadamente um dia de descanso a cada sete dias e ajusta a carga diária por faixa de urgência.</p>
        <p>Mais de 30 dias: 45 min/dia. De 15 a 30 dias: 1h/dia. De 8 a 14 dias: 1h30/dia. De 4 a 7 dias: 2h/dia. De 1 a 3 dias: até 2h30/dia. No dia da prova: apenas 1h de revisão leve.</p>
        <p>${plan.disclaimer}</p>
      </details>`;
  }
};
