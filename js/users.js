window.ONC = window.ONC || {};

ONC.Users = {
  current: null,

  init() {
    this.current = ONC.Storage.get("onc_user", null);
    if (this.current) {
      this.hideLogin();
      this.updateChip();
    } else {
      this.showLogin();
    }
  },

  login(name, role = "aluno", options = {}) {
    const cleanName = String(name || "").trim();
    if (!cleanName) {
      alert("Informe o nome.");
      return false;
    }

    this.current = {
      name: cleanName,
      role: role || "aluno",
      ...(options.studentId ? { studentId: options.studentId } : {})
    };

    ONC.Storage.set("onc_user", this.current);
    this.hideLogin();
    this.updateChip();
    ONC.UI?.applyRole?.();

    if (!options.skipProfileRefresh) {
      ONC.AccessProfiles?.syncFromCurrentUser?.();
      ONC.AccessProfiles?.render?.();
    }
    return true;
  },

  visitor() {
    return this.login("Visitante", "visitante");
  },

  logout() {
    ONC.Storage.remove("onc_user");
    this.current = null;
    document.getElementById("userChip")?.classList.add("hidden");
    ONC.AccessProfiles?.open?.();
  },

  showLogin() {
    const overlay = document.getElementById("loginOverlay");
    overlay?.classList.remove("hidden");
  },

  hideLogin() {
    document.getElementById("loginOverlay")?.classList.add("hidden");
  },

  updateChip() {
    const chip = document.getElementById("userChip");
    if (!chip || !this.current) return;
    chip.innerHTML = `<span class="userChipAvatar">${this.initials(this.current.name)}</span><span>${this.current.name}</span>`;
    chip.title = "Perfil atual";
    chip.classList.remove("hidden");
  },

  initials(name) {
    return String(name || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join("") || "?";
  }
};
