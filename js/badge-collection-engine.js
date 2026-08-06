window.ONC = window.ONC || {};

ONC.BadgeCollectionEngine = {
  state: {
    filters: {
      category: "todas",
      status: "todas",
      search: "",
      sort: "progress"
    },
    favorites: [],
    viewed: {},
    version: 1
  },

  init() {
    this.load();
    this.render();
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_badge_collection_${current}`;
  },

  load() {
    this.state = {
      filters: {
        category: "todas",
        status: "todas",
        search: "",
        sort: "progress"
      },
      favorites: [],
      viewed: {},
      version: 1,
      ...ONC.Storage.get(this.storageKey(), {})
    };
  },

  save() {
    ONC.Storage.set(this.storageKey(), this.state);
  },

  categoryLabel(category) {
    return {
      aprendizagem: "Aprendizagem",
      comportamento: "Comportamento",
      recuperacao: "Recuperação",
      secreta: "Secretas",
      memoria: "Memória",
      progressao: "Progressão"
    }[category] || category;
  },

  normalize(rule) {
    const hiddenSecret = rule.category === "secreta" && !rule.unlocked;
    return {
      id: rule.ruleId,
      title: hiddenSecret ? "Medalha secreta" : rule.title,
      realTitle: rule.title,
      category: rule.category,
      categoryLabel: this.categoryLabel(rule.category),
      subcategory: rule.subcategory || "",
      icon: hiddenSecret ? "◆" : (rule.icon || "🏅"),
      description: hiddenSecret
        ? "Critério protegido até o desbloqueio."
        : rule.description,
      evidence: hiddenSecret
        ? (ONC.SecretDiscoveryEngine?.summary?.().items
            ?.find(item => item.ruleId === rule.ruleId)?.hint?.text || "???")
        : rule.evidence,
      percent: Number(rule.percent || 0),
      current: Number(rule.current || 0),
      target: Number(rule.target || 1),
      unlocked: Boolean(rule.unlocked),
      unlockedAt: rule.unlocked?.unlockedAt || null,
      reward: rule.reward || null,
      rarity: rule.rarity || "comum",
      hiddenSecret,
      favorite: this.state.favorites.includes(rule.ruleId)
    };
  },

  allItems() {
    return (ONC.BadgeRuleEngine?.summary?.().rules || [])
      .map(rule => this.normalize(rule));
  },

  filteredItems() {
    const filters = this.state.filters;
    const query = String(filters.search || "").trim().toLocaleLowerCase("pt-BR");

    let items = this.allItems().filter(item => {
      const categoryMatch =
        filters.category === "todas" ||
        item.category === filters.category;

      const statusMatch =
        filters.status === "todas" ||
        (filters.status === "conquistadas" && item.unlocked) ||
        (filters.status === "andamento" && !item.unlocked && item.percent > 0) ||
        (filters.status === "nao-iniciadas" && !item.unlocked && item.percent === 0) ||
        (filters.status === "favoritas" && item.favorite);

      const searchable = [
        item.title,
        item.hiddenSecret ? "" : item.realTitle,
        item.categoryLabel,
        item.subcategory,
        item.description,
        item.evidence
      ].join(" ").toLocaleLowerCase("pt-BR");

      return categoryMatch && statusMatch && (!query || searchable.includes(query));
    });

    items.sort((a, b) => {
      if (filters.sort === "recent") {
        return new Date(b.unlockedAt || 0) - new Date(a.unlockedAt || 0);
      }
      if (filters.sort === "alphabetical") {
        return a.title.localeCompare(b.title, "pt-BR");
      }
      if (filters.sort === "rarity") {
        const weight = { mitica: 5, lendaria: 4, "muito-rara": 3, rara: 2, comum: 1 };
        return (weight[b.rarity] || 0) - (weight[a.rarity] || 0);
      }
      return b.percent - a.percent || Number(b.unlocked) - Number(a.unlocked);
    });

    return items;
  },

  setFilter(name, value) {
    if (!(name in this.state.filters)) return;
    this.state.filters[name] = value;
    this.save();
    this.render();
  },

  toggleFavorite(ruleId) {
    const index = this.state.favorites.indexOf(ruleId);
    if (index >= 0) {
      this.state.favorites.splice(index, 1);
    } else {
      this.state.favorites.push(ruleId);
    }
    this.save();
    this.render();
  },

  markViewed(ruleId) {
    this.state.viewed[ruleId] = new Date().toISOString();
    this.save();
  },

  openDetails(ruleId) {
    const item = this.allItems().find(entry => entry.id === ruleId);
    if (!item) return false;
    this.markViewed(ruleId);
    ONC.BadgeCollectionUI?.openDetails?.(item);
    return true;
  },

  categories() {
    const items = this.allItems();
    return ["aprendizagem", "comportamento", "recuperacao", "secreta"]
      .map(category => {
        const group = items.filter(item => item.category === category);
        const unlocked = group.filter(item => item.unlocked).length;
        return {
          key: category,
          label: this.categoryLabel(category),
          total: group.length,
          unlocked,
          percent: group.length ? Math.round(unlocked / group.length * 100) : 0
        };
      });
  },

  timeline() {
    return this.allItems()
      .filter(item => item.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt));
  },

  summary() {
    const all = this.allItems();
    const unlocked = all.filter(item => item.unlocked);
    const visible = all.filter(item => !item.hiddenSecret || item.unlocked);
    const started = all.filter(item => !item.unlocked && item.percent > 0);
    const favorites = all.filter(item => item.favorite);

    return {
      total: all.length,
      visible: visible.length,
      unlocked: unlocked.length,
      inProgress: started.length,
      favorites: favorites.length,
      completion: all.length ? Math.round(unlocked.length / all.length * 100) : 0,
      categories: this.categories(),
      timeline: this.timeline(),
      filtered: this.filteredItems(),
      filters: { ...this.state.filters },
      disclaimer: "A coleção organiza conquistas da plataforma. Medalhas não equivalem a nota, classificação oficial, medalha da ONC ou capacidade intelectual."
    };
  },

  render() {
    ONC.BadgeCollectionUI?.render?.();
  }
};
