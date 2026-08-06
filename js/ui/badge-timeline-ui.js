window.ONC = window.ONC || {};

ONC.BadgeTimelineUI = {
  init() {
    this.render();
  },

  formatDate(date) {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    }).format(date);
  },

  monthLabel(key) {
    const [year, month] = key.split("-");
    return new Intl.DateTimeFormat("pt-BR", {
      month: "short",
      year: "numeric"
    }).format(new Date(Number(year), Number(month) - 1, 1));
  },

  render() {
    const root = document.getElementById("badgeTimelinePanel");
    if (!root || !ONC.BadgeTimelineEngine) return;

    const summary = ONC.BadgeTimelineEngine.summary();
    const maxMonth = Math.max(1, ...summary.months.map(month => month.total));

    root.innerHTML = `
      <div class="badgeTimelineHeader">
        <div>
          <span class="dashboardLabel">Linha do tempo de medalhas</span>
          <h2>${summary.total} conquista${summary.total === 1 ? "" : "s"} registrada${summary.total === 1 ? "" : "s"}</h2>
          <p>Histórico cronológico, marcos, evolução mensal e distribuição por categoria.</p>
        </div>
        <div class="badgeTimelineScore">
          <strong>${summary.streak.best}</strong>
          <span>melhor sequência de dias com conquistas</span>
        </div>
      </div>

      <div class="badgeTimelineMetrics">
        <article>
          <strong>${summary.first ? new Date(summary.first.unlockedAt).toLocaleDateString("pt-BR") : "—"}</strong>
          <span>primeira conquista</span>
        </article>
        <article>
          <strong>${summary.latest ? new Date(summary.latest.unlockedAt).toLocaleDateString("pt-BR") : "—"}</strong>
          <span>mais recente</span>
        </article>
        <article><strong>${summary.streak.days}</strong><span>dias com conquistas</span></article>
        <article><strong>${summary.filteredTotal}</strong><span>eventos nos filtros</span></article>
      </div>

      <div class="badgeTimelineToolbar">
        <select aria-label="Filtrar categoria"
          onchange="ONC.BadgeTimelineEngine.setFilter('category',this.value)">
          <option value="todas" ${summary.filters.category === "todas" ? "selected" : ""}>Todas as categorias</option>
          <option value="aprendizagem" ${summary.filters.category === "aprendizagem" ? "selected" : ""}>Aprendizagem</option>
          <option value="comportamento" ${summary.filters.category === "comportamento" ? "selected" : ""}>Comportamento</option>
          <option value="recuperacao" ${summary.filters.category === "recuperacao" ? "selected" : ""}>Recuperação</option>
          <option value="secreta" ${summary.filters.category === "secreta" ? "selected" : ""}>Secretas</option>
        </select>

        <select aria-label="Filtrar período"
          onchange="ONC.BadgeTimelineEngine.setFilter('period',this.value)">
          <option value="todo" ${summary.filters.period === "todo" ? "selected" : ""}>Todo o histórico</option>
          <option value="7d" ${summary.filters.period === "7d" ? "selected" : ""}>Últimos 7 dias</option>
          <option value="30d" ${summary.filters.period === "30d" ? "selected" : ""}>Últimos 30 dias</option>
          <option value="90d" ${summary.filters.period === "90d" ? "selected" : ""}>Últimos 90 dias</option>
          <option value="1a" ${summary.filters.period === "1a" ? "selected" : ""}>Último ano</option>
        </select>

        <select aria-label="Ordenar linha do tempo"
          onchange="ONC.BadgeTimelineEngine.setFilter('sort',this.value)">
          <option value="recent" ${summary.filters.sort === "recent" ? "selected" : ""}>Mais recentes primeiro</option>
          <option value="oldest" ${summary.filters.sort === "oldest" ? "selected" : ""}>Mais antigas primeiro</option>
        </select>

        <button class="btn" type="button"
          onclick="ONC.BadgeTimelineEngine.downloadText()">
          Baixar histórico
        </button>
      </div>

      <section class="badgeTimelineMonths">
        <h3>Evolução mensal</h3>
        <div>
          ${summary.months.length ? summary.months.map(month => `
            <article>
              <span>${this.monthLabel(month.key)}</span>
              <i><b style="height:${Math.max(8, Math.round(month.total / maxMonth * 100))}%"></b></i>
              <strong>${month.total}</strong>
            </article>`).join("") : `<p class="note">Ainda não há dados mensais.</p>`}
        </div>
      </section>

      <details class="badgeTimelineMilestones" ${summary.milestones.length ? "open" : ""}>
        <summary>Marcos da coleção</summary>
        <div>
          ${summary.milestones.length ? summary.milestones.map(item => `
            <article>
              <span>${item.icon}</span>
              <div>
                <strong>${item.title}</strong>
                <small>${new Date(item.timestamp).toLocaleString("pt-BR")}</small>
                <p>${item.detail}</p>
              </div>
            </article>`).join("") : `<p class="note">O primeiro marco aparecerá após a primeira conquista.</p>`}
        </div>
      </details>

      <section class="badgeTimelineFlow">
        ${summary.days.length ? summary.days.map(day => `
          <article class="badgeTimelineDay">
            <div class="badgeTimelineDate">
              <span>${String(day.date.getDate()).padStart(2, "0")}</span>
              <small>${day.date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</small>
            </div>
            <div class="badgeTimelineDayContent">
              <h3>${this.formatDate(day.date)}</h3>
              ${day.events.map(event => `
                <button type="button" class="badgeTimelineEvent"
                  onclick="ONC.BadgeCollectionEngine.openDetails('${event.id}')">
                  <span>${event.icon}</span>
                  <div>
                    <strong>${event.title}</strong>
                    <small>${event.categoryLabel} • ${event.rarityLabel}</small>
                    <p>${event.evidence}</p>
                  </div>
                  <time>${new Date(event.unlockedAt).toLocaleTimeString("pt-BR", {hour:"2-digit",minute:"2-digit"})}</time>
                </button>`).join("")}
            </div>
          </article>`).join("") : `
          <p class="note">Nenhuma conquista corresponde aos filtros escolhidos.</p>`}
      </section>

      <div class="badgeTimelineFooter">
        <small>${summary.disclaimer}</small>
      </div>`;
  },

  renderReport() {
    const root = document.getElementById("badgeTimelineReport");
    if (!root || !ONC.BadgeTimelineEngine) return;

    const summary = ONC.BadgeTimelineEngine.summary();
    const maxMonth = Math.max(1, ...summary.months.map(month => month.total));

    root.innerHTML = `
      <div class="badgeTimelineReportHeader">
        <div>
          <span class="dashboardLabel">Histórico de conquistas</span>
          <h2>Distribuição temporal das medalhas</h2>
          <p>Visão consolidada da evolução da coleção ao longo do tempo.</p>
        </div>
      </div>

      <div class="badgeTimelineReportGrid">
        <article><span>Total</span><strong>${summary.total}</strong></article>
        <article><span>Dias com conquistas</span><strong>${summary.streak.days}</strong></article>
        <article><span>Melhor sequência</span><strong>${summary.streak.best}</strong></article>
        <article><span>Marcos</span><strong>${summary.milestones.length}</strong></article>
      </div>

      <section class="badgeTimelineCategoryReport">
        ${summary.categories.map(category => `
          <article>
            <strong>${category.label}</strong>
            <span>${category.total} conquista${category.total === 1 ? "" : "s"}</span>
            <small>${category.latest ? `Última em ${new Date(category.latest).toLocaleDateString("pt-BR")}` : "Sem conquistas"}</small>
          </article>`).join("")}
      </section>

      <section class="badgeTimelineMonthlyReport">
        ${summary.months.map(month => `
          <article>
            <div>
              <strong>${this.monthLabel(month.key)}</strong>
              <span>${month.total}</span>
            </div>
            <i><b style="width:${Math.round(month.total / maxMonth * 100)}%"></b></i>
          </article>`).join("") || `<p class="note">Ainda não há dados mensais.</p>`}
      </section>

      <details class="badgeTimelineMethod">
        <summary>Fonte e limites</summary>
        <p>A linha do tempo usa a data persistida no desbloqueio de cada medalha. Alterações no armazenamento local, restaurações ou troca de dispositivo podem afetar o histórico.</p>
        <p>${summary.disclaimer}</p>
      </details>`;
  }
};
