window.ONC = window.ONC || {};

ONC.VisualLibrary = {
  manifest: null,

  async init() {
    try {
      const response = await fetch("./data/visual-library.json");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.manifest = await response.json();
    } catch (error) {
      console.error("[Estude ONC] Biblioteca visual", error);
      this.manifest = { illustrations: {} };
    }
  },

  item(topicId) {
    return this.manifest?.illustrations?.[topicId] || null;
  },

  figure(topicId, title = "") {
    const item = this.item(topicId);
    if (!item) return "";

    return `
      <section class="learningBlock learningBlock--visualPremium" data-block-type="visual">
        <header class="learningBlock__header">
          <span class="learningBlock__icon" aria-hidden="true">🖼️</span>
          <div>
            <h4>Explore a ilustração</h4>
            <p>Observe os elementos e relacione-os ao conceito estudado.</p>
          </div>
        </header>
        <button class="premiumVisualButton" type="button"
          onclick="ONC.VisualLibrary.open('${topicId}')"
          aria-label="Ampliar ilustração: ${item.alt}">
          <img src="./${item.path}" alt="${item.alt}" loading="lazy" decoding="async">
          <span>Ampliar imagem</span>
        </button>
      </section>`;
  },

  open(topicId) {
    const item = this.item(topicId);
    if (!item) return;

    const dialog = document.getElementById("visualLightbox");
    const image = document.getElementById("visualLightboxImage");
    const title = document.getElementById("visualLightboxTitle");

    if (!dialog || !image || !title) return;

    image.src = `./${item.path}`;
    image.alt = item.alt;
    title.textContent = item.title;
    dialog.showModal();
  },

  close() {
    document.getElementById("visualLightbox")?.close();
  },

  topicIdForQuestion(question) {
    return ONC.Attention?.findStudyTopic?.(question.subject, question.topic)?.id || null;
  },

  questionFigure(question) {
    const topicId = this.topicIdForQuestion(question);
    if (!topicId) return "";
    const item = this.item(topicId);
    if (!item) return "";

    return `
      <button class="questionPremiumVisual" type="button"
        onclick="ONC.VisualLibrary.open('${topicId}')"
        aria-label="Ampliar ilustração: ${item.alt}">
        <img src="./${item.path}" alt="${item.alt}" loading="lazy" decoding="async">
      </button>`;
  }
};
