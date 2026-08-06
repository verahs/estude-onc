window.ONC = window.ONC || {};

ONC.IntelligentNotificationUI = {
  toastTimer: null,

  init() {
    this.ensureToast();
    this.render();
  },

  ensureToast() {
    if (document.getElementById("intelligentNotificationToast")) return;

    const toast = document.createElement("div");
    toast.id = "intelligentNotificationToast";
    toast.className = "intelligentNotificationToast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  },

  toast(notification) {
    const root = document.getElementById("intelligentNotificationToast");
    if (!root || !notification) return;

    clearTimeout(this.toastTimer);
    root.innerHTML = `
      <span>${notification.icon}</span>
      <div>
        <strong>${notification.title}</strong>
        <p>${notification.message}</p>
      </div>`;
    root.classList.add("is-visible");

    this.toastTimer = setTimeout(() => {
      root.classList.remove("is-visible");
    }, notification.priority === "high" ? 5200 : 3600);
  },

  render() {
    const root = document.getElementById("intelligentNotificationPanel");
    if (!root || !ONC.IntelligentNotificationEngine) return;

    const summary = ONC.IntelligentNotificationEngine.summary();

    root.innerHTML = `
      <div class="notificationHeader">
        <div>
          <span class="dashboardLabel">Notificações inteligentes</span>
          <h2>${summary.unread} não lida${summary.unread === 1 ? "" : "s"}</h2>
          <p>Alertas priorizados, sem duplicidade e com horário de descanso protegido.</p>
        </div>
        <div class="notificationStatus ${summary.quietNow ? "is-quiet" : ""}">
          <strong>${summary.quietNow ? "Silencioso" : "Ativo"}</strong>
          <span>${summary.dailyCount}/${summary.preferences.maxDaily} notificações hoje</span>
        </div>
      </div>

      <div class="notificationActions">
        <button class="btn" type="button"
          onclick="ONC.IntelligentNotificationEngine.markAllRead()">
          Marcar todas como lidas
        </button>
        <button class="btn" type="button"
          onclick="ONC.IntelligentNotificationEngine.clearRead()">
          Limpar lidas
        </button>
        <button class="btn" type="button"
          onclick="ONC.IntelligentNotificationEngine.scan('manual')">
          Verificar agora
        </button>
      </div>

      <div class="notificationList">
        ${summary.items.length ? summary.items.map(item => `
          <article class="${item.read ? "is-read" : ""} notificationPriority--${item.priority}">
            <button type="button" class="notificationMain"
              onclick="ONC.IntelligentNotificationEngine.execute('${item.id}')">
              <span>${item.icon}</span>
              <div>
                <strong>${item.title}</strong>
                <p>${item.message}</p>
                <small>${new Date(item.createdAt).toLocaleString("pt-BR")}</small>
              </div>
              ${!item.read ? `<i aria-label="Não lida"></i>` : ""}
            </button>
            <button type="button" class="notificationDismiss"
              aria-label="Dispensar"
              onclick="ONC.IntelligentNotificationEngine.dismiss('${item.id}')">
              ×
            </button>
          </article>`).join("") : `
          <p class="note">Nenhuma notificação relevante neste momento.</p>`}
      </div>

      <details class="notificationPreferences">
        <summary>Preferências de notificação</summary>
        <div>
          ${[
            ["enabled","Ativar notificações"],
            ["unlocks","Medalhas conquistadas"],
            ["nearBadges","Medalhas próximas"],
            ["milestones","Marcos da coleção"],
            ["coachHints","Sugestões do Coach"],
            ["levelUps","Mudanças de nível"],
            ["quietHoursEnabled","Proteger horário de descanso"]
          ].map(([key,label]) => `
            <label>
              <input type="checkbox"
                ${summary.preferences[key] ? "checked" : ""}
                onchange="ONC.IntelligentNotificationEngine.updatePreference('${key}',this.checked)">
              <span>${label}</span>
            </label>`).join("")}

          <label>
            <span>Início do silêncio</span>
            <input type="number" min="0" max="23"
              value="${summary.preferences.quietStart}"
              onchange="ONC.IntelligentNotificationEngine.updatePreference('quietStart',this.value)">
          </label>

          <label>
            <span>Fim do silêncio</span>
            <input type="number" min="0" max="23"
              value="${summary.preferences.quietEnd}"
              onchange="ONC.IntelligentNotificationEngine.updatePreference('quietEnd',this.value)">
          </label>

          <label>
            <span>Máximo diário</span>
            <input type="number" min="1" max="20"
              value="${summary.preferences.maxDaily}"
              onchange="ONC.IntelligentNotificationEngine.updatePreference('maxDaily',this.value)">
          </label>
        </div>
      </details>

      <div class="notificationFooter">
        <small>${summary.disclaimer}</small>
      </div>`;
  },

  renderReport() {
    const root = document.getElementById("intelligentNotificationReport");
    if (!root || !ONC.IntelligentNotificationEngine) return;

    const summary = ONC.IntelligentNotificationEngine.summary();
    const typeCounts = summary.items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});

    root.innerHTML = `
      <div class="notificationReportHeader">
        <div>
          <span class="dashboardLabel">Relatório de notificações</span>
          <h2>Distribuição e preferências</h2>
          <p>Visão consolidada dos alertas emitidos para o estudante.</p>
        </div>
      </div>

      <div class="notificationReportGrid">
        <article><span>Total</span><strong>${summary.total}</strong></article>
        <article><span>Não lidas</span><strong>${summary.unread}</strong></article>
        <article><span>Emitidas hoje</span><strong>${summary.dailyCount}</strong></article>
        <article><span>Limite diário</span><strong>${summary.preferences.maxDaily}</strong></article>
      </div>

      <section class="notificationTypeReport">
        ${Object.entries(typeCounts).map(([type,total]) => `
          <article>
            <strong>${{
              unlock:"Conquistas",
              near:"Proximidade",
              milestone:"Marcos",
              coach:"Coach",
              level:"Níveis"
            }[type] || type}</strong>
            <span>${total}</span>
          </article>`).join("") || `<p class="note">Nenhuma notificação registrada.</p>`}
      </section>

      <details class="notificationMethod">
        <summary>Regras de prioridade e frequência</summary>
        <p>Notificações de desbloqueio e nível têm prioridade alta. Alertas de proximidade, marcos e Coach respeitam horário silencioso e limite diário.</p>
        <p>Chaves únicas impedem a repetição da mesma notificação.</p>
        <p>${summary.disclaimer}</p>
      </details>`;
  }
};
