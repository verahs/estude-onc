window.ONC = window.ONC || {};

ONC.FocusMode = {
  activeTopicId: null,
  snapshot: null,

  init() {},

  capture() {
    return [...document.querySelectorAll("#studySection .subject,#studySection .group,#studySection .topicCard")]
      .map(element => ({
        element,
        open: element.classList.contains("open")
      }));
  },

  enable(topicId) {
    const item = ONC.ContentIndex.get(topicId);
    if (!item) return false;

    this.snapshot = this.capture();
    this.activeTopicId = topicId;
    document.body.classList.add("smartFocusMode");

    document.querySelectorAll("#studySection .subject,#studySection .group,#studySection .topicCard")
      .forEach(element => element.classList.remove("open"));

    [item.subject, item.group, item.card].forEach(element => {
      element?.classList.add("open");
      element?.querySelector(":scope > button[aria-expanded]")?.setAttribute("aria-expanded", "true");
      const symbol = element?.querySelector(":scope > button .expandSymbol");
      if (symbol) symbol.textContent = "−";
    });

    item.card.classList.add("smartFocusTarget");
    return true;
  },

  disable({ restore = true } = {}) {
    document.body.classList.remove("smartFocusMode");
    document.querySelectorAll(".smartFocusTarget").forEach(element =>
      element.classList.remove("smartFocusTarget")
    );

    if (restore && this.snapshot) {
      this.snapshot.forEach(({ element, open }) => {
        element.classList.toggle("open", open);
        const button = element.querySelector(":scope > button[aria-expanded]");
        if (button) button.setAttribute("aria-expanded", String(open));
        const symbol = element.querySelector(":scope > button .expandSymbol");
        if (symbol) symbol.textContent = open ? "−" : "＋";
      });
    }

    this.activeTopicId = null;
    this.snapshot = null;
  }
};
