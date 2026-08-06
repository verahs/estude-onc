window.ONC = window.ONC || {};

ONC.BadgeReportEngine = {
  state: {
    filters: {
      period: "todo",
      category: "todas"
    },
    generatedReports: [],
    version: 1
  },

  init() {
    this.load();
    this.refresh("startup");
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_badge_report_${current}`;
  },

  load() {
    this.state = {
      filters: {
        period: "todo",
        category: "todas"
      },
      generatedReports: [],
      version: 1,
      ...ONC.Storage.get(this.storageKey(), {})
    };
  },

  save() {
    this.state.generatedReports = this.state.generatedReports.slice(-120);
    ONC.Storage.set(this.storageKey(), this.state);
  },

  studentName() {
    const selected = ONC.Classroom?.students?.find?.(
      student => student.id === ONC.Classroom?.currentId
    );
    return selected?.name || ONC.Users?.current?.name || "Estudante";
  },

  threshold(period) {
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

  filteredItems() {
    const items = ONC.BadgeCollectionEngine?.allItems?.() || [];
    const threshold = this.threshold(this.state.filters.period);

    return items.filter(item => {
      const categoryMatch =
        this.state.filters.category === "todas" ||
        item.category === this.state.filters.category;

      const periodMatch =
        !item.unlockedAt ||
        new Date(item.unlockedAt).getTime() >= threshold;

      return categoryMatch && periodMatch;
    });
  },

  categoryStats(items) {
    const categories = ["aprendizagem", "comportamento", "recuperacao", "secreta"];

    return categories.map(category => {
      const group = items.filter(item => item.category === category);
      const unlocked = group.filter(item => item.unlocked).length;
      const inProgress = group.filter(item => !item.unlocked && item.percent > 0).length;
      const averageProgress = group.length
        ? Math.round(group.reduce((sum, item) => sum + Number(item.percent || 0), 0) / group.length)
        : 0;

      return {
        key: category,
        label: ONC.BadgeCollectionEngine?.categoryLabel?.(category) || category,
        total: group.length,
        unlocked,
        inProgress,
        completion: group.length ? Math.round(unlocked / group.length * 100) : 0,
        averageProgress
      };
    });
  },

  recentAchievements(items) {
    return items
      .filter(item => item.unlocked && item.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
      .slice(0, 8);
  },

  nearestBadges(items) {
    return items
      .filter(item => !item.unlocked && !item.hiddenSecret && item.percent > 0)
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 6);
  },

  rareAchievements(items) {
    const weight = {
      mitica: 5,
      lendaria: 4,
      "muito-rara": 3,
      rara: 2,
      comum: 1
    };

    return items
      .filter(item => item.unlocked)
      .sort((a, b) =>
        (weight[b.rarity] || 0) - (weight[a.rarity] || 0) ||
        new Date(b.unlockedAt || 0) - new Date(a.unlockedAt || 0)
      )
      .slice(0, 5);
  },

  monthlyData() {
    return ONC.BadgeTimelineEngine?.monthlyEvolution?.() || [];
  },

  strengths(categories, items) {
    const results = [];

    const strongestCategory = [...categories]
      .filter(item => item.total > 0)
      .sort((a, b) => b.completion - a.completion)[0];

    if (strongestCategory && strongestCategory.completion > 0) {
      results.push({
        title: `${strongestCategory.label} é a categoria mais avançada`,
        detail: `${strongestCategory.unlocked}/${strongestCategory.total} medalhas conquistadas (${strongestCategory.completion}%).`
      });
    }

    const recovery = categories.find(item => item.key === "recuperacao");
    if (recovery?.unlocked >= 2) {
      results.push({
        title: "Recuperações reconhecidas",
        detail: `${recovery.unlocked} medalhas indicam melhora após erros ou dificuldades.`
      });
    }

    const behavioral = categories.find(item => item.key === "comportamento");
    if (behavioral?.unlocked >= 2) {
      results.push({
        title: "Rotina com evidências positivas",
        detail: `${behavioral.unlocked} medalhas comportamentais já foram conquistadas.`
      });
    }

    const secret = items.filter(item => item.category === "secreta" && item.unlocked).length;
    if (secret > 0) {
      results.push({
        title: "Descobertas secretas",
        detail: `${secret} medalha${secret === 1 ? "" : "s"} secreta${secret === 1 ? "" : "s"} descoberta${secret === 1 ? "" : "s"}.`
      });
    }

    return results.slice(0, 4);
  },

  attentionPoints(categories, nearest) {
    const results = [];

    const lowestCategory = [...categories]
      .filter(item => item.total > 0)
      .sort((a, b) => a.averageProgress - b.averageProgress)[0];

    if (lowestCategory && lowestCategory.averageProgress < 50) {
      results.push({
        title: `${lowestCategory.label} precisa de mais evidências`,
        detail: `Progresso médio de ${lowestCategory.averageProgress}% nas medalhas da categoria.`
      });
    }

    nearest.slice(0, 3).forEach(item => {
      results.push({
        title: `${item.title} está próxima`,
        detail: `${item.percent}% concluída. ${item.evidence}`
      });
    });

    return results.slice(0, 4);
  },

  trend(months) {
    if (months.length < 2) {
      return {
        direction: "insufficient",
        label: "Dados limitados",
        change: 0
      };
    }

    const current = Number(months.at(-1)?.total || 0);
    const previous = Number(months.at(-2)?.total || 0);
    const change = current - previous;

    return {
      direction: change > 0 ? "rising" : change < 0 ? "falling" : "stable",
      label: change > 0 ? "Crescimento" : change < 0 ? "Redução" : "Estável",
      change
    };
  },

  calculate() {
    const items = this.filteredItems();
    const allItems = ONC.BadgeCollectionEngine?.allItems?.() || [];
    const categories = this.categoryStats(items);
    const unlocked = items.filter(item => item.unlocked);
    const inProgress = items.filter(item => !item.unlocked && item.percent > 0);
    const months = this.monthlyData();
    const nearest = this.nearestBadges(items);
    const timeline = ONC.BadgeTimelineEngine?.summary?.() || {};

    return {
      generatedAt: new Date().toISOString(),
      student: this.studentName(),
      filters: { ...this.state.filters },
      overview: {
        total: items.length,
        unlocked: unlocked.length,
        inProgress: inProgress.length,
        completion: items.length ? Math.round(unlocked.length / items.length * 100) : 0,
        fullCatalogTotal: allItems.length,
        fullCatalogUnlocked: allItems.filter(item => item.unlocked).length
      },
      categories,
      recent: this.recentAchievements(items),
      nearest,
      rare: this.rareAchievements(items),
      months,
      trend: this.trend(months),
      milestones: timeline.milestones || [],
      strengths: this.strengths(categories, items),
      attention: this.attentionPoints(categories, nearest),
      notifications: ONC.IntelligentNotificationEngine?.summary?.() || null,
      disclaimer: "O relatório resume medalhas internas da plataforma. Ele não representa nota, ranking oficial, classificação na ONC ou avaliação de capacidade intelectual, personalidade ou valor pessoal."
    };
  },

  refresh(trigger = "manual") {
    const report = {
      ...this.calculate(),
      trigger
    };

    this.state.generatedReports.push({
      generatedAt: report.generatedAt,
      student: report.student,
      unlocked: report.overview.unlocked,
      completion: report.overview.completion,
      trigger
    });
    this.save();
    ONC.BadgeReportUI?.render?.();
    return report;
  },

  current() {
    return this.calculate();
  },

  setFilter(name, value) {
    if (!(name in this.state.filters)) return;
    this.state.filters[name] = value;
    this.save();
    this.refresh("filter");
  },

  exportText() {
    const report = this.current();
    const lines = [
      "ESTUDE ONC — RELATÓRIO DE MEDALHAS",
      `Estudante: ${report.student}`,
      `Gerado em: ${new Date(report.generatedAt).toLocaleString("pt-BR")}`,
      "",
      "RESUMO",
      `Medalhas no filtro: ${report.overview.total}`,
      `Conquistadas: ${report.overview.unlocked}`,
      `Em andamento: ${report.overview.inProgress}`,
      `Conclusão: ${report.overview.completion}%`,
      "",
      "POR CATEGORIA"
    ];

    report.categories.forEach(category => {
      lines.push(
        `${category.label}: ${category.unlocked}/${category.total} conquistadas • ` +
        `${category.inProgress} em andamento • ${category.averageProgress}% de progresso médio`
      );
    });

    lines.push("", "CONQUISTAS RECENTES");
    if (report.recent.length) {
      report.recent.forEach(item => {
        lines.push(
          `- ${item.title} — ${new Date(item.unlockedAt).toLocaleString("pt-BR")} — ${item.evidence}`
        );
      });
    } else {
      lines.push("- Nenhuma conquista registrada no período.");
    }

    lines.push("", "PRÓXIMAS MEDALHAS");
    if (report.nearest.length) {
      report.nearest.forEach(item => {
        lines.push(`- ${item.title}: ${item.percent}% — ${item.evidence}`);
      });
    } else {
      lines.push("- Nenhuma medalha visível em andamento.");
    }

    lines.push("", "PONTOS POSITIVOS");
    report.strengths.forEach(item => lines.push(`- ${item.title}: ${item.detail}`));

    lines.push("", "PONTOS DE ATENÇÃO");
    report.attention.forEach(item => lines.push(`- ${item.title}: ${item.detail}`));

    lines.push("", report.disclaimer);
    return lines.join("\n");
  },

  downloadText() {
    const date = new Date().toISOString().slice(0, 10);
    ONC.DataPortability?.download?.(
      `estude-onc-relatorio-medalhas-${date}.txt`,
      this.exportText(),
      "text/plain;charset=utf-8"
    );
    ONC.Notifications?.announce?.("Relatório de medalhas baixado.");
  },

  print() {
    document.body.classList.add("printingBadgeReport");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("printingBadgeReport");
    }, 300);
  }
};
