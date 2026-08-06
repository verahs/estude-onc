window.ONC = window.ONC || {};

ONC.RecoveryBadgeUI = {
  render() {
    const root = document.getElementById("recoveryBadgePanel");
    if (!root || !ONC.BadgeRuleEngine) return;

    const summary = ONC.BadgeRuleEngine.summary();
    const badges = summary.rules.filter(item =>
      item.category === "recuperacao" && item.visible
    );
    const unlocked = badges.filter(item => item.unlocked);
    const nearest = badges
      .filter(item => !item.unlocked)
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 4);

    root.innerHTML = `
      <div class="recoveryBadgeHeader">
        <div>
          <span class="dashboardLabel">Medalhas de recuperação</span>
          <h2>${unlocked.length} de ${badges.length} conquistadas</h2>
          <p>Reconhecimento por transformar erros, dificuldades e interrupções em evolução comprovada.</p>
        </div>
        <div class="recoveryBadgeScore">
          <strong>${badges.length ? Math.round(unlocked.length / badges.length * 100) : 0}%</strong>
          <span>coleção de recuperação</span>
        </div>
      </div>

      <div class="recoveryBadgeGrid">
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

      <details class="recoveryBadgeNearest">
        <summary>Recuperações mais próximas</summary>
        <div>
          ${nearest.length ? nearest.map(item => `
            <article>
              <strong>${item.icon} ${item.title}</strong>
              <span>${item.evidence}</span>
              <b>${item.percent}%</b>
            </article>`).join("") : `<p class="note">Todas as medalhas visíveis de recuperação já foram conquistadas.</p>`}
        </div>
      </details>
    `;
  },

  renderReport() {
    const root = document.getElementById("recoveryBadgeReport");
    if (!root || !ONC.BadgeRuleEngine) return;

    const badges = ONC.BadgeRuleEngine.summary().rules.filter(item =>
      item.category === "recuperacao" && item.visible
    );

    root.innerHTML = `
      <div class="recoveryBadgeReportHeader">
        <div>
          <span class="dashboardLabel">Recuperação da aprendizagem</span>
          <h2>Erros transformados em progresso</h2>
          <p>As medalhas usam histórico de tópicos, questões corrigidas, revisões e recuperação registrada.</p>
        </div>
      </div>

      <section class="recoveryBadgeReportList">
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

      <details class="recoveryBadgeMethod">
        <summary>Critérios e interpretação</summary>
        <p>As conquistas exigem melhora observável após erro, baixa proficiência, revisão ou interrupção. A simples repetição de questões não é suficiente.</p>
        <p>As medalhas não substituem avaliação pedagógica e não rotulam o estudante como resiliente ou não resiliente.</p>
      </details>
    `;
  }
};
