window.ONC = window.ONC || {};

ONC.BadgeTimelineEngine = {
  state: {
    filters: {
      category: "todas",
      period: "todo",
      sort: "recent"
    },
    expandedYears: {},
    version: 1
  },

  init() {
    this.load();
    this.render();
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_badge_timeline_${current}`;
  },

  load() {
    this.state = {
      filters: {
        category: "todas",
        period: "todo",
        sort: "recent"
      },
      expandedYears: {},
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

  rarityLabel(rarity) {
    return {
      comum: "Comum",
      rara: "Rara",
      "muito-rara": "Muito rara",
      lendaria: "Lendária",
      mitica: "Mítica"
    }[rarity] || "Comum";
  },

  allEvents() {
    const items = ONC.BadgeCollectionEngine?.allItems?.() || [];
    return items
      .filter(item => item.unlocked && item.unlockedAt)
      .map(item => ({
        id: item.id,
        title: item.title,
        category: item.category,
        categoryLabel: item.categoryLabel || this.categoryLabel(item.category),
        icon: item.icon || "🏅",
        evidence: item.evidence || "",
        description: item.description || "",
        reward: item.reward || null,
        rarity: item.rarity || "comum",
        rarityLabel: this.rarityLabel(item.rarity || "comum"),
        unlockedAt: item.unlockedAt,
        timestamp: new Date(item.unlockedAt).getTime()
      }))
      .filter(item => Number.isFinite(item.timestamp));
  },

  periodThreshold(period) {
    const now = Date.now();
    const day = 86400000;
    return {
      "7d": now - 7 * day,
      "30d": now - 30 * day,
      "90d": now - 90 * day,
      "1a": now - 365 * day,
      todo: 0
    }[period] ?? 0;
  },

  filteredEvents() {
    const filters = this.state.filters;
    const threshold = this.periodThreshold(filters.period);

    const events = this.allEvents().filter(item => {
      const categoryMatch =
        filters.category === "todas" ||
        item.category === filters.category;
      const periodMatch = item.timestamp >= threshold;
      return categoryMatch && periodMatch;
    });

    events.sort((a, b) =>
      filters.sort === "oldest"
        ? a.timestamp - b.timestamp
        : b.timestamp - a.timestamp
    );

    return events;
  },

  dateKey(value) {
    const date = new Date(value);
    return date.toISOString().slice(0, 10);
  },

  monthKey(value) {
    const date = new Date(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  },

  groupByDay(events = this.filteredEvents()) {
    const groups = new Map();

    events.forEach(event => {
      const key = this.dateKey(event.unlockedAt);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          date: new Date(`${key}T12:00:00`),
          events: []
        });
      }
      groups.get(key).events.push(event);
    });

    return [...groups.values()].sort((a, b) =>
      this.state.filters.sort === "oldest"
        ? a.date - b.date
        : b.date - a.date
    );
  },

  monthlyEvolution() {
    const groups = new Map();

    this.allEvents().forEach(event => {
      const key = this.monthKey(event.unlockedAt);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          total: 0,
          categories: {}
        });
      }

      const month = groups.get(key);
      month.total += 1;
      month.categories[event.category] =
        (month.categories[event.category] || 0) + 1;
    });

    return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
  },

  categoryStats() {
    const events = this.allEvents();
    const categories = ["aprendizagem", "comportamento", "recuperacao", "secreta"];

    return categories.map(category => {
      const group = events.filter(item => item.category === category);
      return {
        key: category,
        label: this.categoryLabel(category),
        total: group.length,
        latest: group[0]?.unlockedAt || null
      };
    });
  },

  milestones() {
    const events = [...this.allEvents()].sort((a, b) => a.timestamp - b.timestamp);
    const result = [];

    if (events[0]) {
      result.push({
        type: "first",
        icon: "🚩",
        title: "Primeira conquista",
        detail: events[0].title,
        timestamp: events[0].unlockedAt
      });
    }

    [5, 10, 20, 30, 50].forEach(target => {
      if (events.length >= target) {
        const event = events[target - 1];
        result.push({
          type: "count",
          icon: "🏆",
          title: `${target} medalhas conquistadas`,
          detail: `Marco alcançado com ${event.title}`,
          timestamp: event.unlockedAt
        });
      }
    });

    const firstSecret = events.find(item => item.category === "secreta");
    if (firstSecret) {
      result.push({
        type: "secret",
        icon: "◆",
        title: "Primeira descoberta secreta",
        detail: firstSecret.title,
        timestamp: firstSecret.unlockedAt
      });
    }

    const completeCategories = this.categoryStats()
      .filter(category => {
        const collectionCategory = ONC.BadgeCollectionEngine?.categories?.()
          ?.find(item => item.key === category.key);
        return collectionCategory?.total > 0 &&
          collectionCategory.unlocked === collectionCategory.total;
      });

    completeCategories.forEach(category => {
      const latest = events
        .filter(item => item.category === category.key)
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      result.push({
        type: "category",
        icon: "⭐",
        title: `${category.label} completa`,
        detail: `Todas as medalhas da categoria foram conquistadas`,
        timestamp: latest?.unlockedAt || new Date().toISOString()
      });
    });

    return result.sort((a, b) =>
      this.state.filters.sort === "oldest"
        ? new Date(a.timestamp) - new Date(b.timestamp)
        : new Date(b.timestamp) - new Date(a.timestamp)
    );
  },

  streak() {
    const days = [...new Set(
      this.allEvents().map(event => this.dateKey(event.unlockedAt))
    )].sort();

    let best = 0;
    let current = 0;
    let previous = null;

    days.forEach(day => {
      const date = new Date(`${day}T12:00:00`);
      if (!previous) {
        current = 1;
      } else {
        const gap = Math.round((date - previous) / 86400000);
        current = gap === 1 ? current + 1 : 1;
      }
      best = Math.max(best, current);
      previous = date;
    });

    return { best, days: days.length };
  },

  setFilter(name, value) {
    if (!(name in this.state.filters)) return;
    this.state.filters[name] = value;
    this.save();
    this.render();
  },

  exportText() {
    const summary = this.summary();
    const lines = [
      "ESTUDE ONC — LINHA DO TEMPO DE MEDALHAS",
      `Estudante: ${ONC.Classroom?.students?.find?.(student => student.id === ONC.Classroom?.currentId)?.name || ONC.Users?.current?.name || "Estudante"}`,
      `Total de conquistas: ${summary.total}`,
      `Primeira conquista: ${summary.first ? new Date(summary.first.unlockedAt).toLocaleDateString("pt-BR") : "—"}`,
      `Conquista mais recente: ${summary.latest ? new Date(summary.latest.unlockedAt).toLocaleDateString("pt-BR") : "—"}`,
      "",
      "CONQUISTAS"
    ];

    summary.events.forEach(event => {
      lines.push(
        `${new Date(event.unlockedAt).toLocaleString("pt-BR")} — ` +
        `${event.title} [${event.categoryLabel}] — ${event.evidence}`
      );
    });

    lines.push("", summary.disclaimer);
    return lines.join("\n");
  },

  downloadText() {
    const date = new Date().toISOString().slice(0, 10);
    ONC.DataPortability?.download?.(
      `estude-onc-linha-do-tempo-${date}.txt`,
      this.exportText(),
      "text/plain;charset=utf-8"
    );
    ONC.Notifications?.announce?.("Linha do tempo baixada.");
  },

  summary() {
    const all = this.allEvents();
    const events = this.filteredEvents();

    return {
      total: all.length,
      filteredTotal: events.length,
      first: [...all].sort((a, b) => a.timestamp - b.timestamp)[0] || null,
      latest: [...all].sort((a, b) => b.timestamp - a.timestamp)[0] || null,
      categories: this.categoryStats(),
      days: this.groupByDay(events),
      months: this.monthlyEvolution(),
      milestones: this.milestones(),
      streak: this.streak(),
      events,
      filters: { ...this.state.filters },
      disclaimer: "A linha do tempo registra conquistas internas da plataforma. Datas e evidências dependem dos eventos armazenados no dispositivo e não representam resultados oficiais da ONC."
    };
  },

  render() {
    ONC.BadgeTimelineUI?.render?.();
  }
};
