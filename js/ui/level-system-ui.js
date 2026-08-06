window.ONC = window.ONC || {};

ONC.LevelSystemUI = {
  modalTimer: null,

  init() {
    this.ensureModal();
    this.render();
  },

  ensureModal() {
    if (document.getElementById("levelUpModal")) return;

    const modal = document.createElement("div");
    modal.id = "levelUpModal";
    modal.className = "levelUpModal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "levelUpTitle");
    modal.innerHTML = `
      <div>
        <button type="button" class="levelUpClose"
          aria-label="Fechar"
          onclick="ONC.LevelSystemUI.hideLevelUp()">×</button>
        <span id="levelUpIcon" aria-hidden="true"></span>
        <small>Novo nível desbloqueado</small>
        <h2 id="levelUpTitle"></h2>
        <p id="levelUpDescription"></p>
        <button type="button" class="btn primary"
          onclick="ONC.LevelSystemUI.hideLevelUp()">Continuar</button>
      </div>`;
    document.body.appendChild(modal);
  },

  showLevelUp(event) {
    const modal = document.getElementById("levelUpModal");
    const level = ONC.LevelSystem.levels.find(item => item.key === event.levelKey);
    if (!modal || !level) return;

    document.getElementById("levelUpIcon").textContent = level.icon;
    document.getElementById("levelUpTitle").textContent = level.title;
    document.getElementById("levelUpDescription").textContent = level.description;

    modal.classList.add("is-visible");
    ONC.IntelligentNotificationEngine?.emitLevelUp?.(event);
    clearTimeout(this.modalTimer);
    this.modalTimer = setTimeout(() => this.hideLevelUp(), 7000);
  },

  hideLevelUp() {
    clearTimeout(this.modalTimer);
    document.getElementById("levelUpModal")?.classList.remove("is-visible");
  },

  render() {
    const root = document.getElementById("levelSystemPanel");
    if (!root || !ONC.LevelSystem) return;

    const summary = ONC.LevelSystem.summary();

    root.innerHTML = `
      <div class="levelHeader">
        <div>
          <span class="dashboardLabel">Sistema de níveis</span>
          <h2>${summary.current.icon} ${summary.current.title}</h2>
          <p>${summary.current.description}</p>
        </div>
        <div class="levelXP">
          <strong>${summary.xp}</strong>
          <span>XP acumulado</span>
        </div>
      </div>

      <div class="levelProgress">
        <div>
          <span>${summary.current.title}</span>
          <strong>${summary.next
            ? `${summary.progress.remaining} XP para ${summary.next.title}`
            : "Nível máximo atual"}</strong>
        </div>
        <i><b style="width:${summary.progress.percent}%"></b></i>
      </div>

      <div class="levelTimeline">
        ${summary.timeline.map(level => `
          <article class="${level.unlocked ? "is-unlocked" : ""} ${level.current ? "is-current" : ""}">
            <div class="levelTimelineIcon">${level.unlocked ? level.icon : "🔒"}</div>
            <div>
              <strong>${level.title}</strong>
              <span>${level.minXP} XP</span>
            </div>
            ${level.unlocked && !level.claimed ? `
              <button class="textButton" type="button"
                onclick="ONC.LevelSystem.claimReward('${level.key}')">
                Resgatar
              </button>` : level.claimed ? "<small>Resgatado</small>" : ""}
          </article>`).join("")}
      </div>

      <details class="levelUnlocks">
        <summary>Recompensas e desbloqueios</summary>
        <div>
          ${summary.timeline.map(level => `
            <article class="${level.unlocked ? "is-unlocked" : ""}">
              <div>
                <span>${level.icon}</span>
                <strong>${level.title}</strong>
              </div>
              <ul>${level.unlocks.map(item => `<li>${item}</li>`).join("")}</ul>
            </article>`).join("")}
        </div>
      </details>

      <div class="levelFooter">
        <small>${summary.disclaimer}</small>
      </div>`;
  },

  renderReport() {
    const root = document.getElementById("levelSystemReport");
    if (!root || !ONC.LevelSystem) return;

    const summary = ONC.LevelSystem.summary();

    root.innerHTML = `
      <div class="levelReportHeader">
        <div>
          <span class="dashboardLabel">Progressão de níveis</span>
          <h2>${summary.current.title}</h2>
          <p>${summary.current.description}</p>
        </div>
      </div>

      <div class="levelReportGrid">
        <article><span>XP atual</span><strong>${summary.xp}</strong></article>
        <article><span>Nível atual</span><strong>${summary.current.title}</strong></article>
        <article><span>Níveis desbloqueados</span><strong>${summary.unlockedLevels.length}</strong></article>
        <article><span>Recompensas resgatadas</span><strong>${summary.claimedRewards.length}</strong></article>
      </div>

      <section class="levelRoadmap">
        ${summary.timeline.map(level => `
          <article class="${level.unlocked ? "is-unlocked" : ""} ${level.current ? "is-current" : ""}">
            <span>${level.unlocked ? level.icon : "🔒"}</span>
            <div>
              <strong>${level.title}</strong>
              <small>${level.minXP} XP</small>
              <p>${level.description}</p>
            </div>
          </article>`).join("")}
      </section>

      <details class="levelMethod">
        <summary>Como interpretar os níveis</summary>
        <p>O nível é determinado exclusivamente pelo XP acumulado no sistema de gamificação. O XP valoriza aprendizagem, revisão, recuperação e consistência.</p>
        <p>Subir de nível libera elementos cosméticos e novos objetivos, mas não altera respostas, notas ou acesso pedagógico essencial.</p>
        <p>${summary.disclaimer}</p>
      </details>`;
  }
};
