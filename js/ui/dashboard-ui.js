window.ONC = window.ONC || {};
ONC.UIComponents = ONC.UIComponents || {};

ONC.UIComponents.Dashboard = {
  renderSummary() {
    const root = document.getElementById("dailySummary");
    if (!root) return;

    const completion = ONC.MissionEngine.completion();
    const mission = ONC.MissionEngine.mission;
    const remainingMinutes = mission.tasks
      .filter(task => !task.completed)
      .reduce((sum, task) => sum + Number(task.estimatedMinutes || 0), 0);

    const today = new Date().toISOString().slice(0, 10);
    const sessions = (ONC.StudyHistory?.state?.sessions || []).filter(item => item.date === today);
    const minutes = Math.round(sessions.reduce((sum, item) => sum + Number(item.seconds || 0), 0) / 60);
    const xp = ONC.Gamification.totalXp();
    const streak = ONC.Gamification.streak();

    root.innerHTML = completion.completed
      ? `
        <div class="summaryCelebration">🎉</div>
        <div>
          <span class="dashboardLabel">Resumo de hoje</span>
          <h2>Missão concluída!</h2>
          <p>Você estudou ${minutes} min, acumulou ${xp} XP e mantém uma sequência de ${streak} dia${streak === 1 ? "" : "s"}.</p>
        </div>`
      : `
        <div class="summaryWelcome">👋</div>
        <div>
          <span class="dashboardLabel">Resumo de hoje</span>
          <h2>Você sabe exatamente o que fazer agora.</h2>
          <p>Faltam ${completion.total - completion.done} tarefa${completion.total - completion.done === 1 ? "" : "s"} e cerca de ${remainingMinutes} minutos para concluir a missão.</p>
        </div>
        <div class="summaryMetrics">
          <span><strong>${minutes}</strong> min hoje</span>
          <span><strong>${xp}</strong> XP</span>
          <span><strong>${streak}</strong> dias</span>
        </div>`;
  },

  renderPreparation() {
    const summary = ONC.ProgressEngine.summary();
    const root = document.getElementById("preparationLevel");
    const message = document.getElementById("preparationMessage");
    const remaining = document.getElementById("remainingTopicsMetric");

    if (remaining) remaining.textContent = Math.max(0, summary.total - summary.studied);

    let level = { icon: "🌱", label: "Iniciante" };
    if (summary.preparation >= 75) level = { icon: "🚀", label: "Preparação consistente" };
    else if (summary.preparation >= 45) level = { icon: "🔎", label: "Em evolução" };
    else if (summary.preparation >= 15) level = { icon: "📘", label: "Base em construção" };

    if (root) root.innerHTML = `${level.icon} ${level.label}`;

    if (message) {
      if (summary.preparation >= 75) {
        message.textContent = `Você dominou ${summary.mastered} tópicos. Priorize revisões e simulados.`;
      } else if (summary.preparation >= 45) {
        message.textContent = `Você já iniciou ${summary.studied} tópicos. Continue ampliando domínio e cobertura.`;
      } else {
        message.textContent = `Você iniciou ${summary.studied} de ${summary.total} tópicos. Cada missão aumenta sua base.`;
      }
    }
  },

  renderNextAction() {
    const root = document.getElementById("nextBestAction");
    if (!root) return;

    const incomplete = ONC.MissionEngine.mission?.tasks?.filter(task => !task.completed) || [];
    const current = incomplete[0];
    const after = incomplete[1];

    if (!current) {
      root.innerHTML = `
        <div class="dashboardEmpty">
          <strong>Próxima melhor ação</strong>
          <span>A missão de hoje foi concluída. Continue pelas revisões programadas.</span>
        </div>`;
      return;
    }

    const topicMastery = current.topicId ? ONC.ProgressEngine.get(current.topicId) : null;

    root.innerHTML = `
      <div class="nextActionIcon" aria-hidden="true">▶</div>
      <div class="nextActionContent">
        <span class="dashboardLabel">Continue agora</span>
        <h3>${current.title}</h3>
        <p>${current.reason}</p>
        <div class="nextActionMeta">
          <span>⏱ ${current.estimatedMinutes} min</span>
          <span>+${current.xp} XP</span>
          ${topicMastery !== null ? `<span>Domínio atual ${topicMastery}%</span>` : ""}
        </div>
        ${after ? `<small class="afterAction">Depois disso: ${after.title}</small>` : ""}
      </div>
      <button class="btn primary" type="button"
        onclick="ONC.MissionEngine.openTask('${current.id}')">Continuar</button>`;
  },

  renderAll() {
    this.renderSummary();
    this.renderPreparation();
    this.renderNextAction();
    ONC.UIComponents.Level.render();
    ONC.UIComponents.Mission.render();
    ONC.UIComponents.Review.render();
  }
};
