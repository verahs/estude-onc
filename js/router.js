window.ONC = window.ONC || {};
ONC.UI = {
  sections: ["studySection", "questionBankSection", "quizSection", "reportsSection"],
  showSection(id) {
    this.sections.forEach(sectionId => {
      const section = document.getElementById(sectionId);
      if (section) section.classList.toggle("hidden", sectionId !== id);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (id === "reportsSection") ONC.Reports.render();
  },
  expandStudy() {
    this.showSection("studySection");
    document.querySelectorAll("#studySection .subject,#studySection .group,#studySection .topicCard")
      .forEach(el => el.classList.add("open"));
  },
  collapseStudy() {
    this.showSection("studySection");
    document.querySelectorAll("#studySection .subject,#studySection .group,#studySection .topicCard")
      .forEach(el => el.classList.remove("open"));
  },
  applyRole() {
    const role = ONC.Users.current?.role || "visitante";
    document.querySelectorAll("[data-role]").forEach(el => {
      const allowed = el.dataset.role.split(",");
      el.classList.toggle("hidden", !allowed.includes(role));
    });
  },
  expandAll() {
    this.expandStudy();
  },
  collapseAll() {
    this.collapseStudy();
  }
};
