window.ONC = window.ONC || {};

ONC.SmartTutor = {
  init() {
    this.refresh();
  },

  refresh() {
    ONC.ProgressEngine.refresh();
    ONC.MissionEngine.updateAutomaticCompletion();
    ONC.MissionEngine.save();
    this.renderMission();
    this.renderNextAction();
    this.renderPreparation();
  },

  renderMission() {
    const root = document.getElementById("dailyMission");
    if (!root || !ONC.MissionEngine.mission) return;

    const mission = ONC.MissionEngine.mission;
    const completion = ONC.MissionEngine.completion();

    root.innerHTML = `
      <div class="missionHeader">
        <div>
          <span class="dashboardLabel">Tutor inteligente</span>
          <h2>${completion.completed ? "🏆 Missão concluída" : "🎯 Missão de hoje"}</h2>
          <p>${completion.completed
            ? `Você concluiu as tarefas e ganhou ${mission.xpEarned} XP.`
            : `Complete ${completion.total} tarefas priorizadas pelo seu desempenho.`}</p>
        </div>
        <div class="missionScore">
          <strong>${completion.percent}%</strong>
          <span>${completion.done} de ${completion.total}</span>
        </div>
      </div>

      <div class="missionProgress" aria-label="${completion.percent}% da missão concluída">
        <span style="width:${completion.percent}%"></span>
      </div>

      <div class="missionTasks">
        ${mission.tasks.map(task => `
          <article class="missionTask ${task.completed ? "is-complete" : ""}">
            <label class="missionCheck">
              <input type="checkbox" ${task.completed ? "checked" : ""}
                onchange="ONC.MissionEngine.toggleTask('${task.id}', this.checked)">
              <span></span>
            </label>
            <div class="missionTaskContent">
              <strong>${task.title}</strong>
              <small>${task.reason}</small>
              <div class="missionTaskMeta">
                <span>⏱ ${task.estimatedMinutes} min</span>
                <span>+${task.xp} XP</span>
                ${task.impact ? `<span>Impacto ${task.impact.toLowerCase()}</span>` : ""}
              </div>
            </div>
            <button class="btn btnSmall" type="button"
              onclick="ONC.MissionEngine.openTask('${task.id}')">
              ${task.completed ? "Ver" : "Começar"}
            </button>
          </article>`).join("")}
      </div>`;
  },

  renderNextAction() {
    const root = document.getElementById("nextBestAction");
    if (!root) return;

    const item = ONC.PriorityEngine.nextBestAction();
    if (!item) {
      root.innerHTML = `
        <div class="dashboardEmpty">
          <strong>Nenhuma recomendação disponível</strong>
          <span>Estude ou responda questões para o tutor conhecer melhor seu desempenho.</span>
        </div>`;
      return;
    }

    root.innerHTML = `
      <div class="nextActionIcon" aria-hidden="true">▶</div>
      <div class="nextActionContent">
        <span class="dashboardLabel">Próxima melhor ação</span>
        <h3>${item.mastery > 0 ? "Reforce" : "Estude"} ${item.title}</h3>
        <p>${item.reasons.slice(0, 3).join(" • ")}</p>
        <div class="nextActionMeta">
          <span>⏱ cerca de 3 min</span>
          <span>Impacto ${item.impact.toLowerCase()}</span>
          <span>Domínio ${item.mastery}%</span>
        </div>
      </div>
      <button class="btn primary" type="button"
        onclick="ONC.Attention.openTopic('${item.id}')">Começar</button>`;
  },

  renderPreparation() {
    const summary = ONC.ProgressEngine.summary();
    const message = document.getElementById("preparationMessage");
    if (!message) return;

    if (summary.preparation >= 75) {
      message.textContent = "Preparação consistente. Priorize revisões e simulados.";
    } else if (summary.preparation >= 45) {
      message.textContent = "Boa evolução. Continue ampliando domínio e cobertura.";
    } else {
      message.textContent = "Fase inicial. Siga a missão diária para construir uma base sólida.";
    }
  }
};
