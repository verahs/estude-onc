window.ONC = window.ONC || {};

ONC.AccessProfiles = {
  PROFILE_KEY: "onc_access_profiles_v1",
  LAST_KEY: "onc_access_last_profile",
  profiles: [],

  init() {
    this.load();
    this.migrateLegacyData();
    this.render();
    this.bindHeader();
  },

  load() {
    this.profiles = ONC.Storage.get(this.PROFILE_KEY, []);
    if (!Array.isArray(this.profiles)) this.profiles = [];
  },

  save() {
    ONC.Storage.set(this.PROFILE_KEY, this.profiles);
  },

  migrateLegacyData() {
    const students = ONC.Classroom?.students || [];
    let changed = false;

    students.forEach(student => {
      if (!student?.id || !student?.name) return;
      if (!this.profiles.some(profile => profile.studentId === student.id)) {
        this.profiles.push({
          id: `profile-${student.id}`,
          studentId: student.id,
          name: student.name,
          role: "aluno",
          createdAt: new Date().toISOString(),
          migrated: true
        });
        changed = true;
      }
    });

    const current = ONC.Users?.current;
    if (current?.name && current.role !== "visitante") {
      const student = students.find(item =>
        item.id === current.studentId ||
        item.id === ONC.Classroom?.currentId ||
        item.name.toLocaleLowerCase("pt-BR") === current.name.toLocaleLowerCase("pt-BR")
      );

      const exists = this.profiles.some(profile =>
        (student?.id && profile.studentId === student.id) ||
        (!student?.id && profile.name.toLocaleLowerCase("pt-BR") === current.name.toLocaleLowerCase("pt-BR"))
      );

      if (!exists) {
        this.profiles.push({
          id: student?.id ? `profile-${student.id}` : `profile-legacy-${Date.now()}`,
          studentId: student?.id || current.studentId || null,
          name: current.name,
          role: current.role || "aluno",
          createdAt: new Date().toISOString(),
          migrated: true
        });
        changed = true;
      }
    }

    if (changed) this.save();
  },

  syncFromCurrentUser() {
    const current = ONC.Users?.current;
    if (!current || current.role === "visitante") return;
    this.migrateLegacyData();
  },

  initials(name) {
    return ONC.Users?.initials?.(name) || String(name || "?").charAt(0).toUpperCase();
  },

  colorIndex(name) {
    return [...String(name || "")].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 6;
  },

  render() {
    const root = document.getElementById("accessProfilesRoot");
    if (!root) return;

    const last = ONC.Storage.get(this.LAST_KEY, null);
    const sorted = [...this.profiles].sort((a, b) => {
      if (a.id === last) return -1;
      if (b.id === last) return 1;
      return a.name.localeCompare(b.name, "pt-BR");
    });

    root.innerHTML = sorted.length ? sorted.map(profile => `
      <button type="button" class="accessProfileCard ${profile.id === last ? "is-last" : ""}"
        onclick="ONC.AccessProfiles.select('${profile.id}')">
        <span class="accessProfileAvatar avatar-${this.colorIndex(profile.name)}">${this.initials(profile.name)}</span>
        <span class="accessProfileIdentity">
          <strong>${this.escape(profile.name)}</strong>
          <small>${profile.role === "responsavel" ? "Responsável" : profile.role === "professor" ? "Professor" : "Estudante"}${profile.id === last ? " • último acesso" : ""}</small>
        </span>
        <span class="accessProfileArrow">›</span>
      </button>`).join("") : `
      <div class="accessEmptyState">
        <span>👋</span>
        <strong>Primeiro acesso neste dispositivo</strong>
        <p>Crie um perfil para manter o progresso separado.</p>
      </div>`;

    const currentNote = document.getElementById("accessLocalNotice");
    if (currentNote) {
      currentNote.innerHTML = `<strong>Seus estudos ficam salvos neste dispositivo.</strong> Use sempre o mesmo perfil para manter histórico, XP, medalhas e evolução.`;
    }
  },

  select(profileId) {
    const profile = this.profiles.find(item => item.id === profileId);
    if (!profile) return;

    const currentStudentId = ONC.Classroom?.currentId;
    const changingStudent = profile.studentId && currentStudentId && profile.studentId !== currentStudentId;

    if (changingStudent && ONC.Users?.current?.name && ONC.Users.current.name !== profile.name) {
      const confirmed = confirm(`Trocar de ${ONC.Users.current.name} para ${profile.name}? O progresso de cada estudante continuará separado.`);
      if (!confirmed) return;
    }

    ONC.Storage.set(this.LAST_KEY, profile.id);

    if (profile.studentId && ONC.Classroom?.students?.some(student => student.id === profile.studentId)) {
      ONC.Classroom.switchStudent(profile.studentId);
      ONC.Users.hideLogin();
      this.render();
      return;
    }

    ONC.Users.login(profile.name, profile.role || "aluno", {
      studentId: profile.studentId || null,
      skipProfileRefresh: true
    });

    if (profile.role === "aluno") {
      ONC.Classroom?.addFromCurrentUser?.();
      const matched = ONC.Classroom?.students?.find(student => student.name === profile.name);
      if (matched) {
        profile.studentId = matched.id;
        profile.id = `profile-${matched.id}`;
        this.save();
        ONC.Classroom.switchStudent(matched.id);
      }
    }

    ONC.Users.hideLogin();
    this.render();
  },

  create() {
    const nameInput = document.getElementById("newProfileName");
    const roleInput = document.getElementById("newProfileRole");
    const name = String(nameInput?.value || "").trim();
    const role = roleInput?.value || "aluno";

    if (!name) {
      nameInput?.focus();
      return;
    }

    const duplicate = this.profiles.find(profile =>
      profile.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR") &&
      profile.role === role
    );

    if (duplicate) {
      this.select(duplicate.id);
      return;
    }

    ONC.Users.login(name, role, { skipProfileRefresh: true });

    let studentId = null;
    if (role === "aluno") {
      ONC.Classroom?.addFromCurrentUser?.();
      const student = ONC.Classroom?.students?.find(item => item.name === name);
      studentId = student?.id || null;
    }

    const profile = {
      id: studentId ? `profile-${studentId}` : `profile-${role}-${Date.now()}`,
      studentId,
      name,
      role,
      createdAt: new Date().toISOString(),
      migrated: false
    };

    this.profiles.push(profile);
    this.save();
    ONC.Storage.set(this.LAST_KEY, profile.id);

    if (studentId) ONC.Classroom.switchStudent(studentId);
    ONC.Users.hideLogin();
    this.closeCreate();
    this.render();
  },

  open() {
    this.load();
    this.migrateLegacyData();
    this.render();
    ONC.Users?.showLogin?.();
  },

  openCreate() {
    document.getElementById("accessProfileListView")?.classList.add("hidden");
    document.getElementById("accessProfileCreateView")?.classList.remove("hidden");
    setTimeout(() => document.getElementById("newProfileName")?.focus(), 20);
  },

  closeCreate() {
    document.getElementById("accessProfileCreateView")?.classList.add("hidden");
    document.getElementById("accessProfileListView")?.classList.remove("hidden");
  },

  continueLast() {
    const last = ONC.Storage.get(this.LAST_KEY, null);
    if (last && this.profiles.some(profile => profile.id === last)) {
      this.select(last);
      return;
    }
    if (this.profiles.length === 1) this.select(this.profiles[0].id);
  },

  bindHeader() {
    const chip = document.getElementById("userChip");
    if (!chip || chip.dataset.profileBound === "true") return;
    chip.dataset.profileBound = "true";
    chip.setAttribute("role", "button");
    chip.setAttribute("tabindex", "0");
    chip.setAttribute("aria-label", "Trocar perfil");
    chip.addEventListener("click", () => this.open());
    chip.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") this.open();
    });
  },

  escape(value) {
    const div = document.createElement("div");
    div.textContent = String(value || "");
    return div.innerHTML;
  }
};
