window.ONC = window.ONC || {};

ONC.KnowledgeGraph = {
  nodes: [],
  edges: [],

  init() {
    this.build();
  },

  build() {
    const cards = [...document.querySelectorAll(".topicCard")];
    this.nodes = cards.map(card => ({
      id: card.dataset.topicId,
      title: card.dataset.topicTitle || "",
      discipline: card.dataset.discipline || "",
      group: card.closest("[data-group]")?.dataset?.group || "",
      recurrence: Number(card.dataset.recurrence || 0)
    }));

    const edges = [];
    const byDiscipline = new Map();

    this.nodes.forEach(node => {
      const list = byDiscipline.get(node.discipline) || [];
      list.push(node);
      byDiscipline.set(node.discipline, list);
    });

    byDiscipline.forEach(nodes => {
      nodes.forEach((node, index) => {
        if (nodes[index - 1]) {
          edges.push({
            from: nodes[index - 1].id,
            to: node.id,
            type: "sequence",
            weight: 0.55
          });
        }
        if (nodes[index + 1]) {
          edges.push({
            from: node.id,
            to: nodes[index + 1].id,
            type: "sequence",
            weight: 0.55
          });
        }
      });
    });

    const explicit = [
      ["astronomia-forma-da-terra", "astronomia-rotacao"],
      ["astronomia-rotacao", "astronomia-dia-e-noite"],
      ["astronomia-rotacao", "astronomia-fusos-horarios"],
      ["astronomia-translacao-da-terra", "astronomia-ano-e-estacoes-do-ano"],
      ["astronomia-solsticio-e-equinocio", "astronomia-ano-e-estacoes-do-ano"],
      ["astronomia-fases-da-lua", "astronomia-mes-lunar"],
      ["astronomia-fases-da-lua", "astronomia-eclipses"],
      ["fisica-calor-e-temperatura", "fisica-propagacao-do-calor"],
      ["fisica-forca", "fisica-leis-de-newton"],
      ["quimica-materia", "quimica-transformacoes-fisicas-e-quimicas"],
      ["biologia-celula", "biologia-tecidos"],
      ["biologia-sistema-nervoso", "biologia-visao"]
    ];

    explicit.forEach(([from, to]) => {
      if (this.node(from) && this.node(to)) {
        edges.push({ from, to, type: "prerequisite", weight: 0.9 });
      }
    });

    this.edges = edges;
  },

  node(topicId) {
    return this.nodes.find(node => node.id === topicId) || null;
  },

  prerequisites(topicId) {
    return this.edges
      .filter(edge => edge.to === topicId)
      .map(edge => ({ ...edge, topic: this.node(edge.from) }))
      .filter(item => item.topic);
  },

  dependents(topicId) {
    return this.edges
      .filter(edge => edge.from === topicId)
      .map(edge => ({ ...edge, topic: this.node(edge.to) }))
      .filter(item => item.topic);
  },

  riskPropagation(topicId, deficit = 1) {
    return this.dependents(topicId).map(item => ({
      topicId: item.topic.id,
      title: item.topic.title,
      discipline: item.topic.discipline,
      risk: Math.round(Math.min(100, deficit * item.weight * 100))
    }));
  }
};
