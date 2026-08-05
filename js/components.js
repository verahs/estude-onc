window.ONC = window.ONC || {};

ONC.StudyBlocks = {
  labels: {
    concept: "Entenda a ideia",
    process: "Como funciona",
    result: "O que podemos concluir",
    example: "Veja na prática",
    onc: "Pense como na ONC",
    observe: "Observe",
    comparison: "Compare",
    strategy: "Estratégia",
    connection: "Faça a conexão",
    experiment: "Experimente",
    review: "Revisão rápida",
    visual: "Veja o esquema"
  },

  icons: {
    concept: "💡",
    process: "⚙️",
    result: "🔎",
    example: "🏡",
    onc: "📝",
    observe: "👀",
    comparison: "↔️",
    strategy: "🧭",
    connection: "🔗",
    experiment: "🧪",
    review: "⚡",
    visual: "🖼️"
  },

  render(block) {
    if (!block) return "";
    const type = block.type || "concept";
    const label = block.label || this.labels[type] || "Conteúdo";
    const icon = this.icons[type] || "📘";

    if (type === "review" && Array.isArray(block.items)) {
      return `
        <section class="learningBlock learningBlock--${type}" data-block-type="${type}">
          <header class="learningBlock__header">
            <span class="learningBlock__icon" aria-hidden="true">${icon}</span>
            <h4>${label}</h4>
          </header>
          <ul class="learningBlock__list">
            ${block.items.map(item => `<li>${item}</li>`).join("")}
          </ul>
        </section>`;
    }

    return `
      <section class="learningBlock learningBlock--${type}" data-block-type="${type}">
        <header class="learningBlock__header">
          <span class="learningBlock__icon" aria-hidden="true">${icon}</span>
          <h4>${label}</h4>
        </header>
        <div class="learningBlock__content">${block.content || ""}</div>
      </section>`;
  }
};
