window.ONC = window.ONC || {};

ONC.BadgeReportUI = {
  init() {
    this.render();
  },

  trendText(trend) {
    if (trend.direction === "insufficient") return "Dados mensais ainda limitados";
    if (trend.direction === "rising") return `+${trend.change} conquista${trend.change === 1 ? "" : "s"} no mês mais recente`;
    if (trend.direction === "falling") return `${trend.change} conquista${Math.abs(trend.change) === 1 ? "" : "s"} em relação ao mês anterior`;
    return "Mesmo número de conquistas do mês anterior";
  },

  render() {
    const root = document.getElementById("badgeReportPanel");
    if (!root || !ONC.BadgeReportEngine) return;

    const report = ONC.BadgeReportEngine.current();
    const maxMonth = Math.max(1, ...report.months.map(item => item.total));

    root.innerHTML = `
      <div class="badgeReportHeader">
        <div>
          <span class="dashboardLabel">Relatório de medalhas</span>
          <h2>${report.student}</h2>
          <p>Visão executiva da coleção, progresso, conquistas recentes e próximas oportunidades.</p>
        </div>
        <div class="badgeReportScore">
          <strong>${report.overview.completion}%</strong>
          <span>conclusão no filtro atual</span>
        </div>
      </div>

      <div class="badgeReportToolbar">
        <select aria-label="Filtrar período"
          onchange="ONC.BadgeReportEngine.setFilter('period',this.value)">
          <option value="todo" ${report.filters.period === "todo" ? "selected" : ""}>Todo o histórico</option>
          <option value="7d" ${report.filters.period === "7d" ? "selected" : ""}>Últimos 7 dias</option>
          <option value="30d" ${report.filters.period === "30d" ? "selected" : ""}>Últimos 30 dias</option>
          <option value="90d" ${report.filters.period === "90d" ? "selected" : ""}>Últimos 90 dias</option>
          <option value="1a" ${report.filters.period === "1a" ? "selected" : ""}>Último ano</option>
        </select>

        <select aria-label="Filtrar categoria"
          onchange="ONC.BadgeReportEngine.setFilter('category',this.value)">
          <option value="todas" ${report.filters.category === "todas" ? "selected" : ""}>Todas as categorias</option>
          <option value="aprendizagem" ${report.filters.category === "aprendizagem" ? "selected" : ""}>Aprendizagem</option>
          <option value="comportamento" ${report.filters.category === "comportamento" ? "selected" : ""}>Comportamento</option>
          <option value="recuperacao" ${report.filters.category === "recuperacao" ? "selected" : ""}>Recuperação</option>
          <option value="secreta" ${report.filters.category === "secreta" ? "selected" : ""}>Secretas</option>
        </select>

        <button class="btn" type="button" onclick="ONC.BadgeReportEngine.downloadText()">
          Baixar relatório
        </button>
        <button class="btn" type="button" onclick="ONC.BadgeReportEngine.print()">
          Imprimir
        </button>
      </div>

      <div class="badgeReportMetrics">
        <article><strong>${report.overview.total}</strong><span>medalhas no filtro</span></article>
        <article><strong>${report.overview.unlocked}</strong><span>conquistadas</span></article>
        <article><strong>${report.overview.inProgress}</strong><span>em andamento</span></article>
        <article><strong>${report.trend.label}</strong><span>${this.trendText(report.trend)}</span></article>
      </div>

      <section class="badgeReportCategories">
        ${report.categories.map(category => `
          <article>
            <div>
              <strong>${category.label}</strong>
              <span>${category.unlocked}/${category.total}</span>
            </div>
            <i><b style="width:${category.completion}%"></b></i>
            <small>${category.inProgress} em andamento • ${category.averageProgress}% de progresso médio</small>
          </article>`).join("")}
      </section>

      <div class="badgeReportColumns">
        <section>
          <h3>Pontos positivos</h3>
          ${report.strengths.length ? report.strengths.map(item => `
            <article class="badgeReportPositive">
              <strong>${item.title}</strong>
              <span>${item.detail}</span>
            </article>`).join("") : `<p class="note">Ainda não há evidências suficientes para destacar um padrão.</p>`}
        </section>

        <section>
          <h3>Pontos de atenção</h3>
          ${report.attention.length ? report.attention.map(item => `
            <article class="badgeReportAttention">
              <strong>${item.title}</strong>
              <span>${item.detail}</span>
            </article>`).join("") : `<p class="note">Nenhum ponto relevante identificado.</p>`}
        </section>
      </div>

      <section class="badgeReportRecent">
        <h3>Conquistas recentes</h3>
        <div>
          ${report.recent.length ? report.recent.map(item => `
            <button type="button"
              onclick="ONC.BadgeCollectionEngine.openDetails('${item.id}')">
              <span>${item.icon}</span>
              <div>
                <strong>${item.title}</strong>
                <small>${new Date(item.unlockedAt).toLocaleString("pt-BR")}</small>
                <p>${item.evidence}</p>
              </div>
            </button>`).join("") : `<p class="note">Nenhuma conquista registrada no período.</p>`}
        </div>
      </section>

      <section class="badgeReportNearest">
        <h3>Próximas medalhas</h3>
        <div>
          ${report.nearest.length ? report.nearest.map(item => `
            <article>
              <div>
                <strong>${item.icon} ${item.title}</strong>
                <span>${item.evidence}</span>
              </div>
              <b>${item.percent}%</b>
              <i><u style="width:${item.percent}%"></u></i>
            </article>`).join("") : `<p class="note">Nenhuma medalha visível em andamento.</p>`}
        </div>
      </section>

      <section class="badgeReportMonthly">
        <h3>Evolução mensal</h3>
        <div>
          ${report.months.length ? report.months.map(month => `
            <article>
              <span>${ONC.BadgeTimelineUI?.monthLabel?.(month.key) || month.key}</span>
              <i><b style="height:${Math.max(8, Math.round(month.total / maxMonth * 100))}%"></b></i>
              <strong>${month.total}</strong>
            </article>`).join("") : `<p class="note">Ainda não há dados mensais.</p>`}
        </div>
      </section>

      <details class="badgeReportMethod">
        <summary>Como interpretar o relatório</summary>
        <p>O percentual considera apenas as medalhas presentes no filtro atual. O catálogo completo pode conter medalhas secretas ainda bloqueadas.</p>
        <p>Pontos positivos e de atenção são derivados de progresso e conquistas, não de traços pessoais.</p>
        <p>${report.disclaimer}</p>
      </details>`;
  },

  renderReport() {
    const root = document.getElementById("badgeReportDetailed");
    if (!root || !ONC.BadgeReportEngine) return;

    const report = ONC.BadgeReportEngine.current();

    root.innerHTML = `
      <div class="badgeReportDetailedHeader">
        <div>
          <span class="dashboardLabel">Relatório consolidado de medalhas</span>
          <h2>${report.student}</h2>
          <p>Gerado em ${new Date(report.generatedAt).toLocaleString("pt-BR")}</p>
        </div>
      </div>

      <div class="badgeReportDetailedGrid">
        <article><span>Catálogo completo</span><strong>${report.overview.fullCatalogTotal}</strong></article>
        <article><span>Conquistadas no catálogo</span><strong>${report.overview.fullCatalogUnlocked}</strong></article>
        <article><span>Conclusão no filtro</span><strong>${report.overview.completion}%</strong></article>
        <article><span>Marcos</span><strong>${report.milestones.length}</strong></article>
      </div>

      <section class="badgeReportRare">
        <h3>Conquistas de maior raridade</h3>
        ${report.rare.length ? report.rare.map(item => `
          <article>
            <span>${item.icon}</span>
            <div>
              <strong>${item.title}</strong>
              <small>${item.rarity || "comum"}</small>
              <p>${item.evidence}</p>
            </div>
          </article>`).join("") : `<p class="note">Nenhuma conquista rara registrada.</p>`}
      </section>

      <details class="badgeReportDetailedMethod">
        <summary>Limites do relatório</summary>
        <p>Os dados são locais e dependem dos registros persistidos por estudante. Restaurações, exclusões ou troca de dispositivo podem alterar o histórico.</p>
        <p>${report.disclaimer}</p>
      </details>`;
  }
};
