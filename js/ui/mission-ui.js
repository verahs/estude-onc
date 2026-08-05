window.ONC = window.ONC || {};
ONC.UIComponents = ONC.UIComponents || {};

ONC.UIComponents.Mission = {
  render() {
    const root = document.getElementById("dailyMission");
    if (!root || !ONC.MissionEngine.mission) return;

    ONC.Gamification.syncMissionAwards();

    const mission = ONC.MissionEngine.mission;
    const completion = ONC.MissionEngine.completion();
    const totalReward = mission.tasks.reduce((sum, task) => sum + Number(task.xp || 0), 0) + 15;
    const streak = ONC.Gamification.streak();

    root.innerHTML = `
      <div class="missionHeader">
        <div>
          <span class="dashboardLabel">Tutor inteligente</span>
          <h2>${completion.completed ? "🏆 Missão concluída" : "🎯 Missão de hoje"}</h2>
          <p>${completion.completed
            ? `Excelente. Você recebeu ${mission.xpEarned + 15} XP pela missão.`
            : `Conclua ${completion.total} tarefas escolhidas a partir do seu desempenho.`}</p>
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
                <span class="xpChip">+${task.xp} XP</span>
                ${task.impact ? `<span>Impacto ${task.impact.toLowerCase()}</span>` : ""}
              </div>
            </div>
            <button class="btn btnSmall" type="button"
              onclick="ONC.MissionEngine.openTask('${task.id}')">
              ${task.completed ? "Ver" : "Começar"}
            </button>
          </article>`).join("")}
      </div>

      <div class="missionReward">
        <span>🏆 Recompensa total: <strong>${totalReward} XP</strong></span>
        <span>🔥 Sequência atual: <strong>${streak} dia${streak === 1 ? "" : "s"}</strong></span>
      </div>`;
  }
};
