window.ONC = window.ONC || {};

ONC.BadgeCollectionUI = {
  init() {
    this.ensureModal();
    this.render();
  },

  ensureModal() {
    if (document.getElementById("badgeCollectionModal")) return;

    const modal = document.createElement("div");
    modal.id = "badgeCollectionModal";
    modal.className = "badgeCollectionModal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `
      <div>
        <button type="button" class="badgeCollectionClose"
          aria-label="Fechar"
          onclick="ONC.BadgeCollectionUI.closeDetails()">×</button>
        <div id="badgeCollectionModalContent"></div>
      </div>`;
    document.body.appendChild(modal);
  },

  closeDetails() {
    document.getElementById("badgeCollectionModal")?.classList.remove("is-visible");
  },

  openDetails(item) {
    const modal = document.getElementById("badgeCollectionModal");
    const content = document.getElementById("badgeCollectionModalContent");
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="badgeDetailIcon">${item.icon}</div>
      <small>${item.categoryLabel}</small>
      <h2>${item.title}</h2>
      <p>${item.description}</p>
      <div class="badgeDetailProgress">
        <div><span>Progresso</span><strong>${item.unlocked ? "Conquistada" : `${item.percent}%`}</strong></div>
        <i><b style="width:${item.percent}%"></b></i>
      </div>
      <div class="badgeDetailEvidence">
        <span>Evidência</span>
        <strong>${item.evidence}</strong>
      </div>
      ${item.unlockedAt ? `<p class="badgeDetailDate">Conquistada em ${new Date(item.unlockedAt).toLocaleString("pt-BR")}</p>` : ""}
      ${item.reward ? `<p class="badgeDetailReward">Recompensa: ${item.reward.type} — ${item.reward.id}</p>` : ""}
      <button type="button" class="btn"
        onclick="ONC.BadgeCollectionEngine.toggleFavorite('${item.id}');ONC.BadgeCollectionUI.closeDetails()">
        ${item.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      </button>`;

    modal.classList.add("is-visible");
  },

  render() {
    const root = document.getElementById("badgeCollectionPanel");
    if (!root || !ONC.BadgeCollectionEngine) return;

    const summary = ONC.BadgeCollectionEngine.summary();

    root.innerHTML = `
      <div class="badgeCollectionHeader">
        <div>
          <span class="dashboardLabel">Coleção de medalhas</span>
          <h2>${summary.unlocked} de ${summary.total} conquistadas</h2>
          <p>Catálogo integrado de aprendizagem, comportamento, recuperação e descobertas secretas.</p>
        </div>
        <div class="badgeCollectionScore">
          <strong>${summary.completion}%</strong>
          <span>coleção completa</span>
        </div>
      </div>

      <div class="badgeCollectionMetrics">
        <article><strong>${summary.unlocked}</strong><span>conquistadas</span></article>
        <article><strong>${summary.inProgress}</strong><span>em andamento</span></article>
        <article><strong>${summary.favorites}</strong><span>favoritas</span></article>
        <article><strong>${summary.total}</strong><span>total do catálogo</span></article>
      </div>

      <div class="badgeCollectionCategories">
        ${summary.categories.map(category => `
          <button type="button"
            class="${summary.filters.category === category.key ? "is-active" : ""}"
            onclick="ONC.BadgeCollectionEngine.setFilter('category','${category.key}')">
            <strong>${category.label}</strong>
            <span>${category.unlocked}/${category.total}</span>
            <i><b style="width:${category.percent}%"></b></i>
          </button>`).join("")}
      </div>

      <div class="badgeCollectionToolbar">
        <button type="button"
          class="${summary.filters.category === "todas" ? "is-active" : ""}"
          onclick="ONC.BadgeCollectionEngine.setFilter('category','todas')">
          Todas
        </button>

        <select aria-label="Filtrar por status"
          onchange="ONC.BadgeCollectionEngine.setFilter('status',this.value)">
          <option value="todas" ${summary.filters.status === "todas" ? "selected" : ""}>Todos os status</option>
          <option value="conquistadas" ${summary.filters.status === "conquistadas" ? "selected" : ""}>Conquistadas</option>
          <option value="andamento" ${summary.filters.status === "andamento" ? "selected" : ""}>Em andamento</option>
          <option value="nao-iniciadas" ${summary.filters.status === "nao-iniciadas" ? "selected" : ""}>Não iniciadas</option>
          <option value="favoritas" ${summary.filters.status === "favoritas" ? "selected" : ""}>Favoritas</option>
        </select>

        <select aria-label="Ordenar medalhas"
          onchange="ONC.BadgeCollectionEngine.setFilter('sort',this.value)">
          <option value="progress" ${summary.filters.sort === "progress" ? "selected" : ""}>Maior progresso</option>
          <option value="recent" ${summary.filters.sort === "recent" ? "selected" : ""}>Mais recentes</option>
          <option value="alphabetical" ${summary.filters.sort === "alphabetical" ? "selected" : ""}>Ordem alfabética</option>
          <option value="rarity" ${summary.filters.sort === "rarity" ? "selected" : ""}>Raridade</option>
        </select>

        <input type="search"
          aria-label="Buscar medalha"
          placeholder="Buscar medalha..."
          value="${summary.filters.search.replace(/"/g, "&quot;")}"
          oninput="ONC.BadgeCollectionEngine.setFilter('search',this.value)">
      </div>

      <div class="badgeCollectionGrid">
        ${summary.filtered.length ? summary.filtered.map(item => `
          <article class="${item.unlocked ? "is-unlocked" : ""} ${item.hiddenSecret ? "is-secret" : ""}">
            <button type="button" class="badgeFavorite"
              aria-label="${item.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}"
              onclick="event.stopPropagation();ONC.BadgeCollectionEngine.toggleFavorite('${item.id}')">
              ${item.favorite ? "★" : "☆"}
            </button>
            <button type="button" class="badgeCollectionCard"
              onclick="ONC.BadgeCollectionEngine.openDetails('${item.id}')">
              <div class="badgeCollectionIcon">${item.icon}</div>
              <span>${item.categoryLabel}</span>
              <strong>${item.title}</strong>
              <small>${item.evidence}</small>
              <i><b style="width:${item.percent}%"></b></i>
              <em>${item.unlocked ? "Conquistada" : `${item.percent}%`}</em>
            </button>
          </article>`).join("") : `
          <p class="note badgeCollectionEmpty">Nenhuma medalha corresponde aos filtros atuais.</p>`}
      </div>

      <details class="badgeCollectionTimeline">
        <summary>Linha do tempo das conquistas</summary>
        <div>
          ${summary.timeline.length ? summary.timeline.slice(0, 12).map(item => `
            <article>
              <span>${item.icon}</span>
              <div>
                <strong>${item.title}</strong>
                <small>${new Date(item.unlockedAt).toLocaleString("pt-BR")}</small>
              </div>
            </article>`).join("") : `<p class="note">Nenhuma conquista registrada até o momento.</p>`}
        </div>
      </details>

      <div class="badgeCollectionFooter">
        <small>${summary.disclaimer}</small>
      </div>`;
  },

  renderReport() {
    const root = document.getElementById("badgeCollectionReport");
    if (!root || !ONC.BadgeCollectionEngine) return;

    const summary = ONC.BadgeCollectionEngine.summary();

    root.innerHTML = `
      <div class="badgeCollectionReportHeader">
        <div>
          <span class="dashboardLabel">Coleção completa</span>
          <h2>Distribuição das conquistas</h2>
          <p>Visão consolidada das medalhas por categoria e status.</p>
        </div>
      </div>

      <div class="badgeCollectionReportGrid">
        <article><span>Total</span><strong>${summary.total}</strong></article>
        <article><span>Conquistadas</span><strong>${summary.unlocked}</strong></article>
        <article><span>Em andamento</span><strong>${summary.inProgress}</strong></article>
        <article><span>Conclusão</span><strong>${summary.completion}%</strong></article>
      </div>

      <section class="badgeCollectionCategoryReport">
        ${summary.categories.map(category => `
          <article>
            <div>
              <strong>${category.label}</strong>
              <span>${category.unlocked}/${category.total}</span>
            </div>
            <i><b style="width:${category.percent}%"></b></i>
          </article>`).join("")}
      </section>

      <details class="badgeCollectionMethod">
        <summary>Escopo e interpretação</summary>
        <p>A coleção reúne regras visíveis e secretas. Medalhas secretas não conquistadas permanecem sem nome e sem critério.</p>
        <p>Favoritos, busca e filtros são preferências locais e separadas por estudante.</p>
        <p>${summary.disclaimer}</p>
      </details>`;
  }
};
