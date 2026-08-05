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

  async expandStudy() {
    this.showSection("studySection");

    document.querySelectorAll("#studySection .subject,#studySection .group,#studySection .topicCard")
      .forEach(element => element.classList.add("open"));

    document.querySelectorAll("#studySection [aria-expanded]")
      .forEach(button => button.setAttribute("aria-expanded", "true"));

    document.querySelectorAll("#studySection .expandSymbol")
      .forEach(symbol => symbol.textContent = "−");

    const cards = [...document.querySelectorAll("#studySection .topicCard")];
    const files = cards.map(card => card.dataset.contentFile);
    await ONC.TopicRepository.prefetch(files, 6);

    for (const card of cards) {
      await ONC.Study.ensureTopicLoaded(card);
    }
  },

  collapseStudy() {
    this.showSection("studySection");
    document.querySelectorAll("#studySection .subject,#studySection .group,#studySection .topicCard")
      .forEach(element => element.classList.remove("open"));

    document.querySelectorAll("#studySection [aria-expanded]")
      .forEach(button => button.setAttribute("aria-expanded", "false"));

    document.querySelectorAll("#studySection .expandSymbol")
      .forEach(symbol => symbol.textContent = "＋");
  },

  applyRole() {
    const role = ONC.Users.current?.role || "visitante";
    document.querySelectorAll("[data-role]").forEach(element => {
      const allowed = element.dataset.role.split(",");
      element.classList.toggle("hidden", !allowed.includes(role));
    });
  },

  expandAll() {
    return this.expandStudy();
  },

  collapseAll() {
    this.collapseStudy();
  }
};
