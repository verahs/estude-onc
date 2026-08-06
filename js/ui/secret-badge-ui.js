window.ONC = window.ONC || {};

ONC.SecretBadgeUI = {
  render() {
    const root = document.getElementById("secretBadgePanel");
    if (!root || !ONC.SecretDiscoveryEngine) return;

    const summary = ONC.SecretDiscoveryEngine.summary();

    root.innerHTML = `
      <div class="secretBadgeHeader">
        <div>
          <span class="dashboardLabel">Medalhas secretas</span>
          <h2>${summary.discovered} de ${summary.total} descobertas</h2>
          <p>Conquistas ocultas, dicas graduais e critérios seguros de exploração e evolução.</p>
        </div>
        <div class="secretBadgeScore">
          <strong>${summary.collection}%</strong>
          <span>coleção secreta</span>
        </div>
      </div>

      <div class="secretBadgeGrid">
        ${summary.items.map(item => `
          <article class="${item.unlocked ? "is-discovered" : ""}">
            <div class="secretBadgeIcon">${item.unlocked ? item.icon : "◆"}</div>
            <div>
              <strong>${item.unlocked ? item.title : "Medalha secreta"}</strong>
              <span>${item.unlocked ? item.evidence : item.hint.text}</span>
              ${!item.unlocked && item.hint.stage > 0 ? `<small>Dica nível ${item.hint.stage}</small>` : ""}
            </div>
            <b>${item.unlocked ? "Descoberta" : "???"}</b>
          </article>`).join("")}
      </div>

      <details class="secretBadgeNearest">
        <summary>Descobertas mais próximas</summary>
        <div>
          ${summary.nearest.map(item => `
            <article>
              <strong>???</strong>
              <span>${item.hint?.text || "Algo incomum começou a acontecer."}</span>
              <b>${item.percent >= 85 ? "Muito próxima" : item.percent >= 60 ? "Próxima" : "Em formação"}</b>
            </article>`).join("") || `<p class="note">Todas as medalhas secretas atuais já foram descobertas.</p>`}
        </div>
      </details>

      <div class="secretBadgeFooter">
        <small>${summary.disclaimer}</small>
        <button class="btn" type="button"
          onclick="ONC.BadgeRuleEngine.evaluateAll('secret-manual');ONC.SecretDiscoveryEngine.refresh('manual')">
          Reavaliar descobertas
        </button>
      </div>`;
  },

  renderReport() {
    const root = document.getElementById("secretBadgeReport");
    if (!root || !ONC.SecretDiscoveryEngine) return;

    const summary = ONC.SecretDiscoveryEngine.summary();

    root.innerHTML = `
      <div class="secretReportHeader">
        <div>
          <span class="dashboardLabel">Descobertas secretas</span>
          <h2>Coleção e linha do tempo</h2>
          <p>O relatório revela apenas medalhas já conquistadas e mantém as demais protegidas.</p>
        </div>
      </div>

      <div class="secretReportGrid">
        <article><span>Total</span><strong>${summary.total}</strong></article>
        <article><span>Descobertas</span><strong>${summary.discovered}</strong></article>
        <article><span>Ocultas</span><strong>${summary.hidden}</strong></article>
        <article><span>Coleção</span><strong>${summary.collection}%</strong></article>
      </div>

      <section class="secretTimeline">
        ${summary.recent.length ? summary.recent.map(item => `
          <article>
            <span>${item.icon || "🏅"}</span>
            <div>
              <strong>${item.title}</strong>
              <small>${new Date(item.discoveredAt).toLocaleString("pt-BR")}</small>
              <p>${item.evidence}</p>
            </div>
          </article>`).join("") : `<p class="note">Nenhuma medalha secreta foi descoberta ainda.</p>`}
      </section>

      <details class="secretMethod">
        <summary>Segurança e anti-spoiler</summary>
        <p>O sistema libera dicas em três estágios: aproximação, contexto e proximidade alta. O critério completo só aparece após o desbloqueio.</p>
        <p>Critérios que premiariam estudo noturno, velocidade excessiva ou carga desproporcional foram substituídos por exploração, precisão válida e consistência saudável.</p>
        <p>${summary.disclaimer}</p>
      </details>`;
  }
};
