window.ONC = window.ONC || {};
ONC.Users = {
  current: null,
  init() {
    this.current = ONC.Storage.get("onc_user", null);
    if (this.current) {
      document.getElementById("loginOverlay").classList.add("hidden");
      this.updateChip();
    }
  },
  login(name, role) {
    if (!name.trim()) {
      alert("Informe o nome.");
      return false;
    }
    this.current = { name: name.trim(), role };
    ONC.Storage.set("onc_user", this.current);
    document.getElementById("loginOverlay").classList.add("hidden");
    this.updateChip();
    ONC.UI.applyRole();
    return true;
  },
  visitor() {
    return this.login("Visitante", "visitante");
  },
  logout() {
    ONC.Storage.remove("onc_user");
    this.current = null;
    document.getElementById("loginOverlay").classList.remove("hidden");
    document.getElementById("userChip").classList.add("hidden");
  },
  updateChip() {
    const chip = document.getElementById("userChip");
    chip.textContent = `${this.current.name} • ${this.current.role}`;
    chip.classList.remove("hidden");
  }
};
