window.ONC = window.ONC || {};

ONC.DashboardEngine = {
  init() {
    this.render();
  },

  render() {
    const overview = ONC.LearningAnalyticsEngine.overview();

    const masteryValue = document.getElementById("masteryAverageValue");
    const masteryBar = document.getElementById("masteryAverageBar");
    const memoryValue = document.getElementById("memoryAverageValue");
    const memoryBar = document.getElementById("memoryAverageBar");

    if (masteryValue) masteryValue.textContent = `${overview.averageMastery}%`;
    if (masteryBar) masteryBar.style.width = `${overview.averageMastery}%`;
    if (memoryValue) memoryValue.textContent = `${overview.averageMemory}%`;
    if (memoryBar) memoryBar.style.width = `${overview.averageMemory}%`;

    ONC.DailyGoals?.render?.();
    this.next();
    this.review();
  },

  next() {
    const root = document.getElementById("nextBestAction");
    const item = ONC.TutorEngine?.nextBestAction?.();
    if (!root || !item) return;

    const analytics = ONC.LearningAnalyticsEngine.topic(item.id);
    const threshold = ONC.TutorEngine.threshold(item.id);

    root.innerHTML = `
      <div class="nextActionIcon">▶</div>
      <div class="nextActionContent">
        <span class="dashboardLabel">Continue agora</span>
        <h3>${ONC.TutorEngine.action(item.id)} ${item.title}</h3>
        <p>${ONC.TutorEngine.why(item.id).join(" • ")}</p>
        <div class="nextActionMeta">
          <span>⏱ cerca de 3 min</span>
          <span>Domínio atual ${analytics?.mastery?.score || 0}%</span>
          <span>Faltam ${threshold.remaining} pontos para ${threshold.next}%</span>
        </div>
      </div>
      <button class="btn primary"
        onclick="ONC.SmartNavigator.goToWeakness('${item.id}')">▶ Continuar estudo</button>`;
  },

  review() {
    const root = document.getElementById("nextReviewCard");
    if (!root) return;

    const next = ONC.LearningAnalyticsEngine.nextReview();
    if (!next) {
      root.innerHTML = `
        <div class="dashboardEmpty">
          <strong>Próxima revisão</strong>
          <span>Estude um tópico para programar a revisão.</span>
        </div>`;
      return;
    }

    root.innerHTML = `
      <div class="reviewCardIcon">⏰</div>
      <div class="reviewCardContent">
        <span class="dashboardLabel">Próxima revisão</span>
        <h3>${next.title}</h3>
        <p>Memória prevista ${next.memory.memory}% • ${next.memory.recommendation}</p>
        <small>${
          next.memory.due
            ? "Agora"
            : next.memory.nextReview.toLocaleDateString("pt-BR")
        } • cerca de 2 minutos</small>
      </div>
      <button class="btn"
        onclick="ONC.SmartNavigator.goToRevision('${next.id}')">🚀 Começar revisão</button>`;
  }
};
