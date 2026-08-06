window.ONC = window.ONC || {};

ONC.IntelligenceCenter = {
  state: {
    activeModule: "dashboard",
    favorites: [],
    recent: [],
    collapsed: {},
    sidebarCollapsed: false,
    theme: "light",
    version: 1
  },

  modules: [
    { key: "dashboard", label: "Dashboard", icon: "📊", description: "Indicadores essenciais e atalhos." },
    { key: "learning", label: "Aprendizagem", icon: "📚", description: "Domínio, memória, diagnóstico e cobertura." },
    { key: "ai", label: "IA Pedagógica", icon: "🤖", description: "Coach, predição, navegação e recomendações." },
    { key: "badges", label: "Medalhas", icon: "🏅", description: "Coleção, níveis, XP e conquistas." },
    { key: "evolution", label: "Evolução", icon: "📈", description: "Histórico, atividade e tendências." },
    { key: "guardian", label: "Responsável", icon: "👨‍👩‍👧", description: "Síntese objetiva para acompanhamento." },
    { key: "system", label: "Sistema", icon: "⚙️", description: "Backup, preferências, acessibilidade e versão." }
  ],

  init() {
    this.load();
    this.renameMainNavigation();
    this.build();
    this.activate(this.resolveInitialModule(), { remember: false });
    this.applyTheme();
    this.bindKeyboard();
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_intelligence_center_${current}`;
  },

  load() {
    this.state = {
      activeModule: "dashboard",
      favorites: [],
      recent: [],
      collapsed: {},
      sidebarCollapsed: false,
      theme: "light",
      version: 1,
      ...ONC.Storage.get(this.storageKey(), {})
    };
  },

  save() {
    this.state.recent = this.state.recent.slice(0, 8);
    ONC.Storage.set(this.storageKey(), this.state);
  },

  resolveInitialModule() {
    const hash = location.hash.match(/intelligence\/([a-z-]+)/)?.[1];
    return this.modules.some(item => item.key === hash)
      ? hash
      : this.state.activeModule || "dashboard";
  },

  renameMainNavigation() {
    document.querySelectorAll("button").forEach(button => {
      const action = button.getAttribute("onclick") || "";
      if (action.includes("showSection('reportsSection')")) {
        button.textContent = "Central de Inteligência";
        button.classList.add("intelligenceMainButton");
        button.setAttribute("aria-label", "Abrir Central de Inteligência");
      }
    });
  },

  moduleForNode(node) {
    const text = `${node.id || ""} ${node.className || ""}`.toLowerCase();

    if (/guardian|responsavel/.test(text)) return "guardian";
    if (/badge|medalha|levelsystem|intelligentxp/.test(text)) return "badges";
    if (/dailycoach|prediction|diagnostic|navigation|adaptive|procrastination|consistency|fatigue|behavioral|learningcoach|notification/.test(text)) return "ai";
    if (/radar|heatmap|learninginsight|performanceestimate|mastery|memory/.test(text)) return "learning";
    if (/weekly|activity|evolution|history|timeline/.test(text)) return "evolution";
    if (/system|backup|portability|preference|setting|accessibility|version/.test(text)) return "system";
    if (/grid|metric|summary/.test(text)) return "dashboard";
    return "learning";
  },

  build() {
    const section = document.getElementById("reportsSection");
    if (!section || section.dataset.intelligenceBuilt === "true") return;

    section.dataset.intelligenceBuilt = "true";
    section.classList.add("intelligenceCenterSection");

    const originalChildren = [...section.children];
    const originalContent = originalChildren.filter(node =>
      !node.classList.contains("hero")
    );

    section.innerHTML = `
      <div class="intelligenceShell ${this.state.sidebarCollapsed ? "is-sidebar-collapsed" : ""}">
        <aside class="intelligenceSidebar" aria-label="Módulos da Central de Inteligência">
          <div class="intelligenceSidebarBrand">
            <div>
              <span>Central</span>
              <strong>Inteligência</strong>
            </div>
            <button type="button" aria-label="Recolher menu"
              onclick="ONC.IntelligenceCenter.toggleSidebar()">☰</button>
          </div>

          <nav id="intelligenceModuleNav"></nav>

          <div class="intelligenceSidebarBottom">
            <button type="button" onclick="ONC.IntelligenceCenter.openFavorites()">
              <span>★</span><em>Favoritos</em>
            </button>
            <button type="button" onclick="ONC.IntelligenceCenter.toggleTheme()">
              <span id="intelligenceThemeIcon">◐</span><em>Tema</em>
            </button>
          </div>
        </aside>

        <div class="intelligenceWorkspace">
          <header class="intelligenceWorkspaceHeader">
            <div>
              <div id="intelligenceBreadcrumb" class="intelligenceBreadcrumb"></div>
              <h1 id="intelligenceModuleTitle">Dashboard</h1>
              <p id="intelligenceModuleDescription"></p>
            </div>
            <div class="intelligenceHeaderTools">
              <label class="intelligenceSearch">
                <span aria-hidden="true">⌕</span>
                <input id="intelligenceGlobalSearch" type="search"
                  placeholder="Pesquisar indicadores..."
                  oninput="ONC.IntelligenceCenter.search(this.value)">
              </label>
              <button type="button" class="btn"
                onclick="ONC.IntelligenceCenter.toggleFavoriteActive()">
                <span id="intelligenceFavoriteIcon">☆</span>
                <span class="intelligenceFavoriteText">Fixar módulo</span>
              </button>
            </div>
          </header>

          <div id="intelligenceSearchResults" class="intelligenceSearchResults hidden"></div>
          <main id="intelligenceModuleHost" class="intelligenceModuleHost"></main>
        </div>
      </div>`;

    this.renderNavigation();

    const host = document.getElementById("intelligenceModuleHost");
    this.modules.forEach(module => {
      const container = document.createElement("section");
      container.id = `intelligenceModule-${module.key}`;
      container.className = "intelligenceModule hidden";
      container.dataset.module = module.key;
      container.setAttribute("aria-label", module.label);
      host.appendChild(container);
    });

    this.buildDashboard();
    originalContent.forEach(node => {
      const key = this.moduleForNode(node);
      document.getElementById(`intelligenceModule-${key}`)?.appendChild(node);
    });

    this.enhanceCards();
    this.ensureSystemModule();
    this.ensureGuardianModule();
  },

  renderNavigation() {
    const nav = document.getElementById("intelligenceModuleNav");
    if (!nav) return;

    nav.innerHTML = this.modules.map(module => `
      <button type="button"
        data-intelligence-module="${module.key}"
        onclick="ONC.IntelligenceCenter.activate('${module.key}')">
        <span>${module.icon}</span>
        <em>${module.label}</em>
      </button>`).join("");
  },

  buildDashboard() {
    const root = document.getElementById("intelligenceModule-dashboard");
    if (!root) return;

    root.innerHTML = `
      <section class="intelligenceExecutiveGrid">
        <article>
          <span>Domínio médio</span>
          <strong data-intelligence-mirror="masteryAverageValue">—</strong>
          <small>Aprendizagem consolidada</small>
        </article>
        <article>
          <span>Memória</span>
          <strong data-intelligence-mirror="memoryAverageValue">—</strong>
          <small>Retenção estimada</small>
        </article>
        <article>
          <span>XP</span>
          <strong id="intelligenceDashboardXP">—</strong>
          <small>Experiência acumulada</small>
        </article>
        <article>
          <span>Predição</span>
          <strong id="intelligenceDashboardPrediction">—</strong>
          <small>Estimativa de desempenho</small>
        </article>
      </section>

      <section class="intelligenceDashboardColumns">
        <article class="intelligenceOverviewCard">
          <div class="intelligenceCardHeading">
            <div>
              <span class="dashboardLabel">Resumo executivo</span>
              <h2>O que merece atenção agora</h2>
            </div>
          </div>
          <div id="intelligenceDashboardSummary"></div>
        </article>

        <article class="intelligenceOverviewCard">
          <div class="intelligenceCardHeading">
            <div>
              <span class="dashboardLabel">Acesso rápido</span>
              <h2>Módulos</h2>
            </div>
          </div>
          <div class="intelligenceQuickModules">
            ${this.modules.filter(item => item.key !== "dashboard").map(item => `
              <button type="button" onclick="ONC.IntelligenceCenter.activate('${item.key}')">
                <span>${item.icon}</span>
                <div><strong>${item.label}</strong><small>${item.description}</small></div>
              </button>`).join("")}
          </div>
        </article>
      </section>

      <section class="intelligenceDashboardColumns">
        <article class="intelligenceOverviewCard">
          <span class="dashboardLabel">Favoritos</span>
          <h2>Painéis fixados</h2>
          <div id="intelligenceDashboardFavorites"></div>
        </article>
        <article class="intelligenceOverviewCard">
          <span class="dashboardLabel">Histórico</span>
          <h2>Últimos acessos</h2>
          <div id="intelligenceDashboardRecent"></div>
        </article>
      </section>`;

    this.refreshDashboard();
  },

  refreshDashboard() {
    const mirror = id => document.getElementById(id)?.textContent?.trim() || "—";
    document.querySelectorAll("[data-intelligence-mirror]").forEach(element => {
      element.textContent = mirror(element.dataset.intelligenceMirror);
    });

    const xp = ONC.IntelligentXPEngine?.state?.totalXP;
    const prediction = ONC.PerformancePredictionEngine?.current?.()?.prediction?.score ??
      ONC.PerformancePredictionEngine?.current?.()?.score;

    const xpRoot = document.getElementById("intelligenceDashboardXP");
    const predictionRoot = document.getElementById("intelligenceDashboardPrediction");
    if (xpRoot) xpRoot.textContent = Number.isFinite(Number(xp)) ? `${xp} XP` : "—";
    if (predictionRoot) {
      predictionRoot.textContent = Number.isFinite(Number(prediction))
        ? `${Math.round(prediction)}%`
        : "—";
    }

    const summary = document.getElementById("intelligenceDashboardSummary");
    if (summary) {
      const attention = ONC.TutorEngine?.attention?.()?.length ||
        ONC.DiagnosticEngine?.current?.()?.hypotheses?.length || 0;
      const reviews = ONC.MemoryEngine?.due?.()?.length || 0;
      const badgeSuggestions = ONC.BadgeAIIntegrationEngine?.current?.()?.suggestions?.length || 0;

      summary.innerHTML = `
        <article><span>⚠️</span><div><strong>${attention} ponto${attention === 1 ? "" : "s"} de atenção</strong><small>Diagnósticos e padrões que merecem revisão.</small></div></article>
        <article><span>⏰</span><div><strong>${reviews} revisão${reviews === 1 ? "" : "ões"} prevista${reviews === 1 ? "" : "s"}</strong><small>Conteúdos programados pelo motor de memória.</small></div></article>
        <article><span>🏅</span><div><strong>${badgeSuggestions} sugestão${badgeSuggestions === 1 ? "" : "ões"} integrada${badgeSuggestions === 1 ? "" : "s"}</strong><small>Gamificação alinhada a prioridades pedagógicas.</small></div></article>`;
    }

    const favorites = document.getElementById("intelligenceDashboardFavorites");
    if (favorites) {
      favorites.innerHTML = this.state.favorites.length
        ? this.state.favorites.map(key => {
            const module = this.modules.find(item => item.key === key);
            return module ? `<button onclick="ONC.IntelligenceCenter.activate('${key}')">${module.icon} ${module.label}</button>` : "";
          }).join("")
        : `<p class="note">Nenhum módulo foi fixado.</p>`;
    }

    const recent = document.getElementById("intelligenceDashboardRecent");
    if (recent) {
      recent.innerHTML = this.state.recent.length
        ? this.state.recent.map(key => {
            const module = this.modules.find(item => item.key === key);
            return module ? `<button onclick="ONC.IntelligenceCenter.activate('${key}')">${module.icon} ${module.label}</button>` : "";
          }).join("")
        : `<p class="note">O histórico será preenchido conforme a navegação.</p>`;
    }
  },

  enhanceCards() {
    document.querySelectorAll(".intelligenceModule > .card, .intelligenceModule > section.card").forEach((card, index) => {
      if (card.dataset.intelligenceEnhanced === "true") return;
      card.dataset.intelligenceEnhanced = "true";
      const id = card.id || `intelligence-card-${index}`;
      if (!card.id) card.id = id;

      const title = card.querySelector("h2,h3")?.textContent?.trim() ||
        card.getAttribute("aria-label") ||
        "Painel analítico";

      const toolbar = document.createElement("div");
      toolbar.className = "intelligenceCardToolbar";
      toolbar.innerHTML = `
        <button type="button" aria-label="Recolher painel"
          onclick="ONC.IntelligenceCenter.toggleCard('${id}')">⌃</button>
        <button type="button" aria-label="Fixar painel"
          onclick="ONC.IntelligenceCenter.favoritePanel('${id}','${title.replace(/'/g, "’")}')">☆</button>`;
      card.prepend(toolbar);

      if (this.state.collapsed[id]) card.classList.add("is-intelligence-collapsed");
    });
  },

  ensureSystemModule() {
    const root = document.getElementById("intelligenceModule-system");
    if (!root || root.querySelector(".intelligenceSystemHub")) return;

    const version = document.querySelector(".heroEyebrow")?.textContent || "Versão 8.0.0";
    const panel = document.createElement("section");
    panel.className = "card intelligenceSystemHub";
    panel.innerHTML = `
      <span class="dashboardLabel">Administração local</span>
      <h2>Sistema e preferências</h2>
      <div class="intelligenceSystemGrid">
        <button onclick="ONC.DataPortability?.exportAll?.()">⇩<strong>Exportar dados</strong><small>Gerar backup local.</small></button>
        <button onclick="document.querySelector('input[type=file][data-import]')?.click()">⇧<strong>Importar dados</strong><small>Restaurar arquivo compatível.</small></button>
        <button onclick="ONC.IntelligenceCenter.toggleTheme()">◐<strong>Aparência</strong><small>Alternar tema claro e escuro.</small></button>
        <button onclick="ONC.UI?.showSection?.('studySection')">⌂<strong>Voltar ao estudo</strong><small>Acessar mapa e missão.</small></button>
      </div>
      <p class="note">${version} • dados armazenados localmente no navegador.</p>`;
    root.prepend(panel);
  },

  ensureGuardianModule() {
    const root = document.getElementById("intelligenceModule-guardian");
    if (!root || root.querySelector(".intelligenceGuardianIntro")) return;

    const panel = document.createElement("section");
    panel.className = "card intelligenceGuardianIntro";
    panel.innerHTML = `
      <span class="dashboardLabel">Visão do responsável</span>
      <h2>Acompanhamento objetivo</h2>
      <p>Esta área prioriza evolução, rotina, pontos de atenção e próximos passos, evitando excesso de informação técnica.</p>`;
    root.prepend(panel);
  },

  activate(key, options = {}) {
    const module = this.modules.find(item => item.key === key) || this.modules[0];

    document.querySelectorAll(".intelligenceModule").forEach(section => {
      section.classList.toggle("hidden", section.dataset.module !== module.key);
    });

    document.querySelectorAll("[data-intelligence-module]").forEach(button => {
      const active = button.dataset.intelligenceModule === module.key;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });

    this.state.activeModule = module.key;
    if (options.remember !== false) {
      this.state.recent = [
        module.key,
        ...this.state.recent.filter(item => item !== module.key)
      ].slice(0, 8);
      this.save();
      history.replaceState(null, "", `#intelligence/${module.key}`);
    }

    const title = document.getElementById("intelligenceModuleTitle");
    const description = document.getElementById("intelligenceModuleDescription");
    const breadcrumb = document.getElementById("intelligenceBreadcrumb");
    if (title) title.textContent = module.label;
    if (description) description.textContent = module.description;
    if (breadcrumb) breadcrumb.innerHTML = `<span>Central de Inteligência</span><b>›</b><strong>${module.label}</strong>`;

    const favorite = document.getElementById("intelligenceFavoriteIcon");
    if (favorite) favorite.textContent = this.state.favorites.includes(module.key) ? "★" : "☆";

    this.refreshDashboard();
    this.lazyRender(module.key);
    document.querySelector(".intelligenceWorkspace")?.scrollTo({ top: 0, behavior: "smooth" });
  },

  lazyRender(key) {
    const map = {
      learning: [
        ["AdaptiveLearningUI", "renderReport"],
        ["DiagnosticUI", "renderReport"],
        ["LearningCoachUI", "renderReport"]
      ],
      ai: [
        ["DailyCoachUI", "renderReport"],
        ["PerformancePredictionUI", "renderReport"],
        ["BehavioralDashboardUI", "renderReport"],
        ["BadgeAIIntegrationUI", "renderReport"]
      ],
      badges: [
        ["BadgeCollectionUI", "renderReport"],
        ["BadgeTimelineUI", "renderReport"],
        ["BadgeReportUI", "renderReport"],
        ["LevelSystemUI", "renderReport"]
      ],
      guardian: [
        ["GuardianDashboardUI", "renderReport"]
      ]
    };

    (map[key] || []).forEach(([namespace, method]) => {
      try { ONC[namespace]?.[method]?.(); } catch (error) {
        console.warn(`[IntelligenceCenter] ${namespace}.${method}`, error);
      }
    });
  },

  toggleSidebar() {
    this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
    document.querySelector(".intelligenceShell")
      ?.classList.toggle("is-sidebar-collapsed", this.state.sidebarCollapsed);
    this.save();
  },

  toggleTheme() {
    this.state.theme = this.state.theme === "dark" ? "light" : "dark";
    this.applyTheme();
    this.save();
  },

  applyTheme() {
    document.documentElement.dataset.intelligenceTheme = this.state.theme;
    const icon = document.getElementById("intelligenceThemeIcon");
    if (icon) icon.textContent = this.state.theme === "dark" ? "☀" : "◐";
  },

  toggleFavoriteActive() {
    const key = this.state.activeModule;
    const index = this.state.favorites.indexOf(key);
    if (index >= 0) this.state.favorites.splice(index, 1);
    else this.state.favorites.push(key);
    this.save();
    this.activate(key, { remember: false });
  },

  openFavorites() {
    this.activate("dashboard");
    document.getElementById("intelligenceDashboardFavorites")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  },

  favoritePanel(id, title) {
    const key = `panel:${id}`;
    const index = this.state.favorites.indexOf(key);
    if (index >= 0) this.state.favorites.splice(index, 1);
    else this.state.favorites.push(key);
    this.save();
    ONC.Notifications?.announce?.(`${title} ${index >= 0 ? "removido dos" : "adicionado aos"} favoritos.`);
  },

  toggleCard(id) {
    const card = document.getElementById(id);
    if (!card) return;
    const collapsed = card.classList.toggle("is-intelligence-collapsed");
    this.state.collapsed[id] = collapsed;
    this.save();
  },

  search(query) {
    const root = document.getElementById("intelligenceSearchResults");
    if (!root) return;

    const normalized = String(query || "").trim().toLocaleLowerCase("pt-BR");
    if (normalized.length < 2) {
      root.classList.add("hidden");
      root.innerHTML = "";
      return;
    }

    const results = [];
    this.modules.forEach(module => {
      const container = document.getElementById(`intelligenceModule-${module.key}`);
      if (!container) return;

      container.querySelectorAll(".card, article, section").forEach(node => {
        const title = node.querySelector(":scope > h2, :scope > h3, h2, h3")?.textContent?.trim();
        const text = node.textContent?.trim() || "";
        if (
          title &&
          text.toLocaleLowerCase("pt-BR").includes(normalized) &&
          !results.some(item => item.title === title && item.module === module.key)
        ) {
          results.push({
            module: module.key,
            moduleLabel: module.label,
            icon: module.icon,
            title,
            id: node.id || ""
          });
        }
      });
    });

    root.innerHTML = results.slice(0, 12).map(item => `
      <button type="button"
        onclick="ONC.IntelligenceCenter.openSearchResult('${item.module}','${item.id}')">
        <span>${item.icon}</span>
        <div><strong>${item.title}</strong><small>${item.moduleLabel}</small></div>
      </button>`).join("") || `<p class="note">Nenhum painel encontrado.</p>`;
    root.classList.remove("hidden");
  },

  openSearchResult(module, id) {
    this.activate(module);
    document.getElementById("intelligenceSearchResults")?.classList.add("hidden");
    if (id) {
      setTimeout(() => {
        const target = document.getElementById(id);
        target?.classList.remove("is-intelligence-collapsed");
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  },

  bindKeyboard() {
    document.addEventListener("keydown", event => {
      if (event.key === "/" && !/input|textarea|select/i.test(document.activeElement?.tagName || "")) {
        event.preventDefault();
        document.getElementById("intelligenceGlobalSearch")?.focus();
      }
      if (event.key === "Escape") {
        document.getElementById("intelligenceSearchResults")?.classList.add("hidden");
      }
    });
  }
};
