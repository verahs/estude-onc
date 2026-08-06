window.ONC = window.ONC || {};

ONC.UpdateManager = {
  CURRENT_VERSION: "8.2.0",
  VERSION_URL: "./data/version.json",
  CHECK_INTERVAL: 15 * 60 * 1000,
  state: { remote: null, lastCheck: null, available: false },

  init() {
    this.ensureUI();
    this.renderCurrent();
    this.check({ silent: true });
    window.setInterval(() => this.check({ silent: true }), this.CHECK_INTERVAL);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) this.check({ silent: true });
    });
  },

  async check({ silent = false } = {}) {
    const status = document.getElementById("updateStatusText");
    if (status && !silent) status.textContent = "Verificando...";
    try {
      const response = await fetch(`${this.VERSION_URL}?check=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const remote = await response.json();
      this.state.remote = remote;
      this.state.lastCheck = new Date().toISOString();
      this.state.available = this.compare(remote.version, this.CURRENT_VERSION) > 0;
      this.render();
      if (this.state.available && !this.isDismissed(remote.version)) this.showBanner();
      return remote;
    } catch (error) {
      console.warn("[UpdateManager] Falha ao verificar atualização", error);
      if (status) status.textContent = "Não foi possível verificar agora.";
      return null;
    }
  },

  compare(a, b) {
    const pa = String(a || "0").split(".").map(Number);
    const pb = String(b || "0").split(".").map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const diff = (pa[i] || 0) - (pb[i] || 0);
      if (diff) return diff;
    }
    return 0;
  },

  isDismissed(version) {
    return sessionStorage.getItem("onc_dismissed_update") === version;
  },

  dismiss() {
    if (this.state.remote?.version) sessionStorage.setItem("onc_dismissed_update", this.state.remote.version);
    document.getElementById("updateAvailableBanner")?.classList.add("hidden");
  },

  async applyUpdate() {
    const button = document.getElementById("updateNowButton");
    if (button) { button.disabled = true; button.textContent = "Atualizando..."; }
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.update().catch(() => null)));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter(key => key.startsWith("estude-onc-")).map(key => caches.delete(key)));
      }
    } finally {
      const url = new URL(location.href);
      url.searchParams.set("v", this.state.remote?.version || Date.now());
      location.replace(url.toString());
    }
  },

  showBanner() {
    document.getElementById("updateAvailableBanner")?.classList.remove("hidden");
  },

  ensureUI() {
    if (!document.getElementById("updateAvailableBanner")) {
      const banner = document.createElement("aside");
      banner.id = "updateAvailableBanner";
      banner.className = "updateAvailableBanner hidden";
      banner.setAttribute("role", "status");
      banner.innerHTML = `<div><strong>Nova versão disponível</strong><span id="updateBannerText"></span></div><div class="updateBannerActions"><button id="updateNowButton" type="button" onclick="ONC.UpdateManager.applyUpdate()">Atualizar agora</button><button type="button" class="updateDismiss" onclick="ONC.UpdateManager.dismiss()" aria-label="Lembrar depois">Agora não</button></div>`;
      document.body.appendChild(banner);
    }

    const system = document.getElementById("intelligenceModule-system");
    if (system && !document.getElementById("updateCenterPanel")) {
      const panel = document.createElement("section");
      panel.id = "updateCenterPanel";
      panel.className = "card updateCenterPanel";
      system.appendChild(panel);
    }
  },

  renderCurrent() { this.ensureUI(); this.render(); },

  render() {
    this.ensureUI();
    const remote = this.state.remote;
    const available = this.state.available;
    const bannerText = document.getElementById("updateBannerText");
    if (bannerText && remote) bannerText.textContent = `Versão ${remote.version} • ${remote.title || "melhorias e correções"}`;

    const panel = document.getElementById("updateCenterPanel");
    if (!panel) return;
    const releases = Array.isArray(remote?.releases) ? remote.releases : [];
    panel.innerHTML = `
      <div class="updateCenterHeader"><div><span class="dashboardLabel">Atualizações</span><h2>Sistema inteligente de atualizações</h2><p>Mantém a plataforma alinhada à versão publicada sem alterar o progresso dos estudantes.</p></div><span class="updateState ${available ? "isAvailable" : "isCurrent"}">${available ? "Atualização disponível" : "Versão atual"}</span></div>
      <div class="updateVersionGrid"><article><span>Instalada</span><strong>v${this.CURRENT_VERSION}</strong></article><article><span>Publicada</span><strong>${remote?.version ? `v${remote.version}` : "Verificando..."}</strong></article><article><span>Status</span><strong id="updateStatusText">${available ? "Nova versão encontrada" : remote ? "Tudo atualizado" : "Verificando..."}</strong></article></div>
      <div class="updateActions"><button type="button" class="btn" onclick="ONC.UpdateManager.check()">Verificar agora</button>${available ? `<button type="button" class="btn primary" onclick="ONC.UpdateManager.applyUpdate()">Atualizar agora</button>` : ""}</div>
      <div class="updateReleaseNotes"><h3>Histórico de versões</h3>${releases.length ? releases.map(item => `<details ${item.version === remote.version ? "open" : ""}><summary><strong>v${item.version}</strong><span>${item.date || ""}</span><b>${item.title || "Atualização"}</b></summary><ul>${(item.changes || []).map(change => `<li>${change}</li>`).join("")}</ul></details>`).join("") : `<p class="note">O histórico será carregado a partir do arquivo público de versões.</p>`}</div>
      <p class="note">A atualização substitui os arquivos da interface. Dados locais, XP, medalhas, histórico e progresso não são apagados.</p>`;
  }
};
