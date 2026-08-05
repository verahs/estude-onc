window.ONC = window.ONC || {};

ONC.ContentIndex = {
  map: new Map(),
  aliases: new Map(),

  init() {
    this.build();
  },

  normalize(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  },

  build() {
    this.map.clear();
    this.aliases.clear();

    document.querySelectorAll(".topicCard").forEach(card => {
      const subject = card.closest(".subject");
      const group = card.closest(".group");
      const subjectName = subject?.querySelector(".subjectHead span")?.textContent?.trim() || card.dataset.discipline || "";
      const groupName = group?.querySelector(".groupHead span")?.textContent?.trim() || "";
      const item = {
        id: card.dataset.topicId,
        title: card.dataset.topicTitle || card.querySelector(".topicName")?.textContent?.trim() || "",
        discipline: card.dataset.discipline || subjectName,
        group: groupName,
        file: card.dataset.contentFile || "",
        recurrence: Number(card.dataset.recurrence || 0),
        card,
        subject,
        group
      };

      this.map.set(item.id, item);

      [
        item.id,
        item.title,
        `${item.discipline} ${item.title}`,
        `${item.group} ${item.title}`
      ].forEach(alias => {
        const normalized = this.normalize(alias);
        if (normalized) this.aliases.set(normalized, item.id);
      });
    });
  },

  get(topicId) {
    return this.map.get(topicId) || null;
  },

  resolve(topicIdOrText) {
    if (!topicIdOrText) return null;
    if (this.map.has(topicIdOrText)) return this.map.get(topicIdOrText);

    const normalized = this.normalize(topicIdOrText);
    const aliasId = this.aliases.get(normalized);
    if (aliasId) return this.map.get(aliasId);

    const tokens = new Set(normalized.split(" ").filter(token => token.length > 2));
    let best = null;
    let bestScore = 0;

    this.map.forEach(item => {
      const candidate = this.normalize(`${item.discipline} ${item.group} ${item.title}`);
      const candidateTokens = new Set(candidate.split(" ").filter(token => token.length > 2));
      const intersection = [...tokens].filter(token => candidateTokens.has(token)).length;
      const union = new Set([...tokens, ...candidateTokens]).size || 1;
      const score = intersection / union;

      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    });

    return bestScore >= 0.22 ? best : null;
  },

  all() {
    return [...this.map.values()];
  },

  health() {
    return {
      count: this.map.size,
      aliases: this.aliases.size,
      expected: 141,
      complete: this.map.size === 141
    };
  }
};
