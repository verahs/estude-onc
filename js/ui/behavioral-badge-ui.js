window.ONC = window.ONC || {};

ONC.BehavioralBadgeUI = {
  render() {
    const root = document.getElementById("behavioralBadgePanel");
    if (!root || !ONC.BadgeRuleEngine) return;

    const summary = ONC.BadgeRuleEngine.summary();
    const badges = summary.rules.filter(item =>
      item.category === "comportamento" && item.visible
    );
    const unlocked = badges.filter(item => item.unlocked);
    const nearest = badges
      .filter(item => !item.unlocked)
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 4);

    root.innerHTML = `
      <div class="behaviorBadgeHeader">
        <div>
          <span class="dashboardLabel">Medalhas comportamentais</span>
          <h2>${unlocked.length} de ${badges.length} conquistadas</h2>
          <p>Reconhecimento por consistência, foco, revisão e gestão sustentável da rotina.</p>
        </div>
        <div class="behaviorBadgeScore">
          <strong>${badges.length ? Math.round(unlocked.length / badges.length * 100) : 0}%</strong>
          <span>coleção comportamental</span>
        </div>
      </div>

      <div class="behaviorBadgeGrid">
        ${badges.map(item => `
          <article class="${item.unlocked ? "is-unlocked" : ""}">
            <span>${item.unlocked ? item.icon : "◯"}</span>
            <div>
              <strong>${item.title}</strong>
              <small>${item.description}</small>
              <i><b style="width:${item.percent}%"></b></i>
              <em>${item.evidence}</em>
            </div>
            <u>${item.unlocked ? "Conquistada" : `${item.percent}%`}</u>
          </article>`).join("")}
      </div>

      <details class="behaviorBadgeNearest">
        <summary>Mais próximas de desbloquear</summary>
        <div>
          ${nearest.length ? nearest.map(item => `
            <article>
              <strong>${item.icon} ${item.title}</strong>
              <span>${item.evidence}</span>
              <b>${item.percent}%</b>
            </article>`).join("") : `<p class="note">Todas as medalhas comportamentais atuais já foram conquistadas.</p>`}
        </div>
      </details>`;
  },

  renderReport() {
    const root = document.getElementById("behavioralBadgeReport");
    if (!root || !ONC.BadgeRuleEngine) return;

    const badges = ONC.BadgeRuleEngine.summary().rules.filter(item =>
      item.category === "comportamento" && item.visible
    );

    root.innerHTML = `
      <div class="behaviorBadgeReportHeader">
        <div>
          <span class="dashboardLabel">Comportamento e rotina</span>
          <h2>Progresso das medalhas comportamentais</h2>
          <p>Dados derivados dos motores de hábitos, consistência, adiamento, revisão e carga cognitiva.</p>
        </div>
      </div>

      <section class="behaviorBadgeReportList">
        ${badges.map(item => `
          <article>
            <div>
              <strong>${item.icon} ${item.title}</strong>
              <span>${item.evidence}</span>
            </div>
            <b>${item.unlocked ? "Conquistada" : `${item.percent}%`}</b>
            <i><u style="width:${item.percent}%"></u></i>
          </article>`).join("")}
      </section>

      <details class="behaviorBadgeMethod">
        <summary>Critérios e limites</summary>
        <p>As medalhas usam apenas atividades válidas e registros persistidos por estudante. Abrir a plataforma sem interação significativa não gera progresso.</p>
        <p>Os indicadores não avaliam personalidade, disciplina moral, saúde mental ou contexto familiar.</p>
      </details>`;
  }
};
