window.ONC = window.ONC || {};
ONC.UIComponents = ONC.UIComponents || {};

ONC.UIComponents.Level = {
  render() {
    const root = document.getElementById("studentLevelCard");
    if (!root) return;

    const info = ONC.Gamification.levelInfo();
    const progress = ONC.ProgressEngine.summary();

    root.innerHTML = `
      <div class="levelIdentity">
        <span class="levelIcon" aria-hidden="true">${info.current.icon}</span>
        <div>
          <span class="dashboardLabel">Nível ${info.number}</span>
          <h3>${info.current.name}</h3>
          <p>${info.next
            ? `Faltam ${info.xpToNext} XP para chegar ao nível ${info.number + 1}.`
            : "Você alcançou o nível máximo atual."}</p>
        </div>
      </div>
      <div class="levelProgressArea">
        <div class="levelProgressHeader">
          <strong>${info.xp} XP</strong>
          <span>${info.progress}% do nível</span>
        </div>
        <div class="levelProgress"><span style="width:${info.progress}%"></span></div>
        <small>${progress.studied} de ${progress.total} tópicos iniciados</small>
      </div>`;
  }
};
