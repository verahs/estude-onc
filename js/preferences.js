window.ONC = window.ONC || {};

ONC.Notifications = {
  init() {},

  announce(message, type = "success") {
    const root = document.getElementById("appNotification");
    if (!root) return;

    root.textContent = message;
    root.className = `appNotification is-visible is-${type}`;
    clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      root.classList.remove("is-visible");
    }, 4200);
  }
};

ONC.Preferences = {
  defaults: {
    fontSize: "normal",
    contrast: "standard",
    motion: "standard"
  },

  state: null,

  init() {
    this.state = {
      ...this.defaults,
      ...ONC.Storage.get("onc_preferences", {})
    };
    this.apply();
  },

  set(name, value) {
    if (!(name in this.defaults)) return;
    this.state[name] = value;
    ONC.Storage.set("onc_preferences", this.state);
    this.apply();
    ONC.SystemSettingsUI?.syncControls?.();
  },

  apply() {
    const body = document.body;
    if (!body || !this.state) return;

    body.dataset.fontSize = this.state.fontSize;
    body.dataset.contrast = this.state.contrast;
    body.dataset.motion = this.state.motion;
  },

  reset() {
    this.state = { ...this.defaults };
    ONC.Storage.set("onc_preferences", this.state);
    this.apply();
    ONC.SystemSettingsUI?.syncControls?.();
    ONC.Notifications?.announce?.("Preferências restauradas.");
  }
};
