window.ONC = window.ONC || {};

ONC.Study = {
  progress: {},
  readingTopicId: null,

  init() {
    this.progress = ONC.Storage.get(
      ONC.Classroom?.currentId ? "onc_progress_" + ONC.Classroom.currentId : "onc_progress",
      {}
    );
    this.render();
    this.renderRecurrenceRanking();
  },

  slug(value) {
    return value.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  },

  escapeAttribute(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  },

  toggle(id, checked) {
    this.progress[id] = checked;
    ONC.Storage.set(
      ONC.Classroom?.currentId ? "onc_progress_" + ONC.Classroom.currentId : "onc_progress",
      this.progress
    );
    const card = document.querySelector(`[data-topic-id="${id}"]`);
    if (card) {
      card.classList.toggle("is-complete", checked);
      const status = card.querySelector(".topicStatus");
      if (status) status.textContent = checked ? "Concluído" : "Pendente";
    }
    this.updateMetrics();
    ONC.StudyTools?.renderDisciplineProgress();
    ONC.StudyHistory?.recordTopicEvent(
      id,
      card?.dataset.topicTitle || "",
      card?.dataset.discipline || "",
      checked ? "completed" : "reopened"
    );
    ONC.SmartTutor?.refresh();
  },

  render() {
    const root = document.getElementById("subjects");
    if (!root) return;

    root.innerHTML = ONC_DATA.subjects.map(subject => `
      <article class="subject">
        <button class="subjectHead" type="button"
          aria-expanded="false"
          onclick="ONC.Study.toggleContainer(this, 'subject')">
          <span>${subject.icon} ${subject.name}</span>
          <span class="expandSymbol" aria-hidden="true">＋</span>
        </button>
        <div class="subjectBody">
          ${subject.groups.map(group => `
            <section class="group">
              <button class="groupHead" type="button"
                aria-expanded="false"
                onclick="ONC.Study.toggleContainer(this, 'group')">
                <span>${group.name}</span>
                <span class="expandSymbol" aria-hidden="true">＋</span>
              </button>
              <div class="groupBody">
                ${group.topics.map(topic => this.topicCard(subject, group, topic)).join("")}
              </div>
            </section>`).join("")}
        </div>
      </article>`).join("");

    this.updateMetrics();
  },

  toggleContainer(button, kind) {
    const parent = button.closest(kind === "subject" ? ".subject" : ".group");
    if (!parent) return;
    const open = parent.classList.toggle("open");
    button.setAttribute("aria-expanded", String(open));
    const symbol = button.querySelector(".expandSymbol");
    if (symbol) symbol.textContent = open ? "−" : "＋";
  },

  async toggleTopic(button) {
    const card = button.closest(".topicCard");
    if (!card) return;
    const open = card.classList.toggle("open");
    button.setAttribute("aria-expanded", String(open));
    const symbol = button.querySelector(".expandSymbol");
    if (symbol) symbol.textContent = open ? "−" : "＋";
    if (open) await this.ensureTopicLoaded(card);
  },

  recurrenceCategory(subject, topic) {
    const t = topic.toLowerCase();
    if (subject === "Astronomia") {
      if (/(lua|eclipse|mês lunar)/.test(t)) return "Astronomia — Lua, fases e eclipses";
      if (/(sistema solar|estrela|galáxia|universo|constela|cometa|asteroide|ano-luz|unidade astronômica|conquista do espaço|gravitação)/.test(t))
        return "Astronomia — Sistema Solar, estrelas e Universo";
      return "Astronomia — Terra, orientação, sombras, fusos e estações";
    }
    if (subject === "Biologia") {
      if (/(vacina|saúde pública|doença|tecnologia e qualidade)/.test(t))
        return "Biologia — saúde pública, vacinação e saneamento";
      if (/(ecossistema|ambient|extinção|migração|diversidade)/.test(t))
        return "Biologia — ecologia, biomas, biodiversidade e impactos";
      return "Biologia — células, corpo humano, visão e sistema nervoso";
    }
    if (subject === "Química") {
      if (/(densidade|flutuabilidade|água)/.test(t) && !/(tratamento|constituição|tipos)/.test(t))
        return "Química/Física — densidade, flutuação e propriedades da água";
      if (/(efeito estufa|energia|fontes de energia|uso da energia)/.test(t))
        return "Física — calor, temperatura, energia e clima";
      return "Química — matéria, propriedades, misturas e transformações";
    }
    if (subject === "Física") {
      if (/(calor|temperatura|térmica|termodinâmico|efeito estufa|materiais e tecnologias|equipamentos térmicos)/.test(t))
        return "Física — calor, temperatura, energia e clima";
      if (/(máquinas simples|onda|movimento)/.test(t))
        return "Física — movimento, ondas e máquinas";
      if (/(terra|orientação|sol|bússola|gnômon)/.test(t))
        return "Astronomia — Terra, orientação, sombras, fusos e estações";
      return "Física/Matemática — medidas, geometria, proporções e gráficos";
    }
    if (subject === "História") {
      if (/(fonte|memória|periodização|tempo e história|narrativa|ofício do historiador|patrimônio)/.test(t))
        return "História — fontes, patrimônio e interpretação histórica";
      if (/(colonização|américa portuguesa|brasil holandês|escravidão moderna|tráfico|mercantilismo|expansão marítima|conquista da américa|reformas pombalinas|monarquias europeias)/.test(t))
        return "História — colonização, expansão e economia colonial";
      return "História — sociedades antigas e medievais";
    }
    return "Física/Matemática — medidas, geometria, proporções e gráficos";
  },

  recurrencePercent(subject, topic) {
    const category = this.recurrenceCategory(subject, topic);
    return ONC_DATA.recurrenceRanking.find(item => item.category === category)?.percent || 0;
  },

  recurrenceLevel(percent) {
    if (percent >= 10) return { key: "very-high", label: "Muito alta", cls: "recVeryHigh" };
    if (percent >= 8) return { key: "high", label: "Alta", cls: "recHigh" };
    if (percent >= 5) return { key: "medium", label: "Média", cls: "recMedium" };
    return { key: "low", label: "Complementar", cls: "recLow" };
  },

  renderRecurrenceRanking() {
    const root = document.getElementById("recurrenceRanking");
    if (!root) return;
    const topRoot = document.getElementById("recurrenceTopThree");
    if (topRoot) {
      topRoot.innerHTML = ONC_DATA.recurrenceRanking.slice(0, 3).map((item, index) => `
        <span><strong>${index + 1}º</strong> ${item.category.replace(/^.*?—\s*/, "")} <b>${item.percent}%</b></span>
      `).join("");
    }

    root.innerHTML = ONC_DATA.recurrenceRanking.map((item, index) => {
      const level = this.recurrenceLevel(item.percent);
      return `<div class="recurrenceRow">
        <span class="recurrencePosition">${index + 1}</span>
        <div class="recurrenceName">
          <strong>${item.category}</strong>
          <span>${item.count} de 100 questões</span>
        </div>
        <div class="recurrenceBar"><span style="width:${Math.min(100, item.percent * 7.5)}%"></span></div>
        <span class="recurrencePercent ${level.cls}">${item.percent}%</span>
      </div>`;
    }).join("");
  },

  topicCard(subject, group, topic) {
    const id = topic.id;
    const checked = this.progress[id] === true;
    const searchableText = [
      subject.name, group.name, topic.title, topic.searchText || ""
    ].join(" ").toLowerCase();

    const recurrence = this.recurrencePercent(subject.name, topic.title);
    const level = this.recurrenceLevel(recurrence);
    const category = this.recurrenceCategory(subject.name, topic.title);

    return `<article class="topicCard ${checked ? "is-complete" : ""}"
      data-topic-id="${id}"
      data-content-file="${this.escapeAttribute(topic.file)}"
      data-visual-type="${this.escapeAttribute(topic.visualType || "")}"
      data-search="${this.escapeAttribute(searchableText)}"
      data-recurrence="${recurrence}"
      data-recurrence-level="${level.key}"
      data-discipline="${this.escapeAttribute(subject.name)}"
      data-topic-title="${this.escapeAttribute(topic.title)}">
      <button class="topicSummary" type="button" aria-expanded="false"
        onclick="ONC.Study.toggleTopic(this)">
        <div class="topicTitleWrap">
          <input type="checkbox" ${checked ? "checked" : ""}
            aria-label="Marcar ${this.escapeAttribute(topic.title)} como concluído"
            onclick="event.stopPropagation()"
            onchange="ONC.Study.toggle('${id}', this.checked)">
          <div>
            <strong class="topicName">${topic.title}</strong>
            <div class="topicMeta">
              <span class="topicStatus">${checked ? "Concluído" : "Pendente"}</span>
              <span class="recurrenceBadge ${level.cls}" title="${this.escapeAttribute(category)}">
                ${recurrence}% de recorrência • ${level.label}
              </span>
            </div>
          </div>
        </div>
        <span class="expandSymbol" aria-hidden="true">＋</span>
      </button>

      <div class="topicDetails">
        <div class="topicReadingToolbar">
          <span>Leitura guiada</span>
          <span class="readingEstimate" data-reading-estimate>Leitura estimada: —</span>
          <button class="favoriteButton ${ONC.StudyTools?.isFavorite(id) ? "is-active" : ""}"
            type="button"
            aria-pressed="${ONC.StudyTools?.isFavorite(id) ? "true" : "false"}"
            title="${ONC.StudyTools?.isFavorite(id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}"
            onclick="ONC.StudyTools.toggleFavorite('${id}', this)">★</button>
          <button class="btn btnSmall" type="button"
            onclick="ONC.Study.focusTopic('${id}')">Focar neste tópico</button>
          <button class="btn btnSmall" type="button"
            onclick="ONC.Study.printTopic('${id}')">Imprimir</button>
        </div>
        <div class="learningFlow" data-topic-content>
          <div class="topicLoading" role="status">O conteúdo será carregado ao abrir este tópico.</div>
        </div>
      </div>
    </article>`;
  },

  async ensureTopicLoaded(card) {
    const target = card?.querySelector("[data-topic-content]");
    if (!card || !target || card.dataset.loaded === "true") return;

    const file = card.dataset.contentFile;
    target.innerHTML = `
      <div class="topicLoading topicLoading--active" role="status">
        <span class="loadingSpinner" aria-hidden="true"></span>
        Carregando conteúdo…
      </div>`;

    try {
      const content = await ONC.TopicRepository.get(file);
      const blocks = Array.isArray(content.blocks) && content.blocks.length
        ? content.blocks
        : this.legacyBlocks(content.legacy || {});

      target.innerHTML = `
        ${blocks.map(block => ONC.StudyBlocks.render(block)).join("")}
        ${ONC.VisualLibrary?.figure?.(card.dataset.topicId, card.dataset.topicTitle) || ""}
      `;
      card.dataset.loaded = "true";

      const readingMinutes = ONC.StudyTools?.estimateReadingMinutes(target.textContent || "") || 1;
      const estimate = card.querySelector("[data-reading-estimate]");
      if (estimate) estimate.textContent = `Leitura estimada: ${readingMinutes} min`;

      ONC.StudyTools?.markTopicOpened(
        card,
        card.dataset.topicTitle,
        card.dataset.discipline
      );
      ONC.StudyTools?.startSession(
        card.dataset.topicId,
        card.dataset.topicTitle,
        card.dataset.discipline
      );

      this.prefetchNeighbors(card);
    } catch (error) {
      console.error(error);
      target.innerHTML = `
        <div class="topicLoadError" role="alert">
          Não foi possível carregar este tópico.
          <button type="button" class="btn btnSmall"
            onclick="ONC.Study.retryTopic(this)">Tentar novamente</button>
        </div>`;
    }
  },

  async retryTopic(button) {
    const card = button.closest(".topicCard");
    if (!card) return;
    card.dataset.loaded = "false";
    await this.ensureTopicLoaded(card);
  },

  prefetchNeighbors(card) {
    const cards = [...document.querySelectorAll(".topicCard")];
    const index = cards.indexOf(card);
    const neighbors = [cards[index - 1], cards[index + 1]]
      .filter(Boolean)
      .map(item => item.dataset.contentFile);
    ONC.TopicRepository.prefetch(neighbors, 2);
  },

  legacyBlocks(content) {
    const map = [
      ["concept", "Entenda a ideia", content.definition],
      ["process", "Como funciona", content.process],
      ["result", "O que podemos concluir", content.result],
      ["example", "Veja na prática", content.example],
      ["onc", "Pense como na ONC", content.exam]
    ];
    return map.filter(item => item[2]).map(([type, label, value]) => ({
      type, label, content: value
    }));
  },

  async focusTopic(id) {
    document.body.classList.add("readingMode");
    document.querySelectorAll(".topicCard").forEach(card => {
      card.classList.toggle("readingFocus", card.dataset.topicId === id);
    });
    const card = document.querySelector(`[data-topic-id="${id}"]`);
    if (card) {
      card.classList.add("open");
      card.querySelector(".topicSummary")?.setAttribute("aria-expanded", "true");
      await this.ensureTopicLoaded(card);
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    this.readingTopicId = id;
    document.getElementById("exitReadingMode")?.classList.remove("hidden");
  },

  exitReadingMode() {
    document.body.classList.remove("readingMode");
    document.querySelectorAll(".topicCard").forEach(card => card.classList.remove("readingFocus"));
    this.readingTopicId = null;
    document.getElementById("exitReadingMode")?.classList.add("hidden");
  },

  printTopic(id) {
    const card = document.querySelector(`[data-topic-id="${id}"]`);
    if (!card) return;
    card.classList.add("printTarget");
    window.print();
    card.classList.remove("printTarget");
  },

  visualFromType(type) {
    if (!type) return "";
    const originalVisual = this.visualSvg(type);
    if (!originalVisual) return "";
    return `
      <section class="learningBlock learningBlock--visual" data-block-type="visual">
        <header class="learningBlock__header">
          <span class="learningBlock__icon" aria-hidden="true">🖼️</span>
          <h4>Veja o esquema</h4>
        </header>
        <div class="learningVisual">${originalVisual}</div>
      </section>`;
  },

  visualSvg(type) {
    const svgs = {
      rotation: `<svg viewBox="0 0 640 260" role="img" aria-label="Rotação da Terra"><rect width="640" height="260" rx="20" fill="#eef6ff"/><circle cx="180" cy="130" r="78" fill="#4f8fd1"/><path d="M118 96c35-30 84-32 125-10M122 165c36 26 80 28 119 8" fill="none" stroke="#7cc27a" stroke-width="18" stroke-linecap="round"/><path d="M90 45c-42 32-55 97-24 143" fill="none" stroke="#1f2a44" stroke-width="7"/><polygon points="57,180 78,185 62,200" fill="#1f2a44"/><circle cx="500" cy="80" r="45" fill="#ffd25a"/><text x="305" y="120" font-size="24" fill="#1f2a44">A Terra gira em torno</text><text x="305" y="152" font-size="24" fill="#1f2a44">do próprio eixo.</text></svg>`,
      moon: `<svg viewBox="0 0 640 240" role="img" aria-label="Fases da Lua"><rect width="640" height="240" rx="20" fill="#101a33"/><g fill="#f4f4dc"><circle cx="95" cy="105" r="48"/><circle cx="245" cy="105" r="48"/><circle cx="395" cy="105" r="48"/><circle cx="545" cy="105" r="48"/></g><circle cx="73" cy="105" r="48" fill="#101a33"/><circle cx="245" cy="105" r="33" fill="#101a33"/><circle cx="417" cy="105" r="48" fill="#101a33"/><text x="52" y="185" fill="white">Crescente</text><text x="208" y="185" fill="white">Quarto</text><text x="370" y="185" fill="white">Minguante</text><text x="520" y="185" fill="white">Cheia</text></svg>`,
      eclipse: `<svg viewBox="0 0 640 240" role="img" aria-label="Alinhamento de eclipse"><rect width="640" height="240" rx="20" fill="#eef2f7"/><circle cx="100" cy="120" r="55" fill="#ffd35f"/><circle cx="320" cy="120" r="30" fill="#777"/><circle cx="535" cy="120" r="52" fill="#4f8fd1"/><polygon points="350,95 483,70 483,170 350,145" fill="#8b93a1" opacity=".35"/><line x1="155" y1="120" x2="290" y2="120" stroke="#f2b72f" stroke-width="6"/><text x="68" y="205">Sol</text><text x="295" y="205">Lua</text><text x="505" y="205">Terra</text></svg>`,
      coordinates: `<svg viewBox="0 0 640 260" role="img" aria-label="Plano cartesiano com ponto dois um"><rect width="640" height="260" rx="20" fill="#f8fafc"/><g stroke="#c9d3df"><line x1="100" y1="55" x2="100" y2="220"/><line x1="200" y1="55" x2="200" y2="220"/><line x1="300" y1="55" x2="300" y2="220"/><line x1="400" y1="55" x2="400" y2="220"/><line x1="500" y1="55" x2="500" y2="220"/><line x1="70" y1="90" x2="560" y2="90"/><line x1="70" y1="150" x2="560" y2="150"/><line x1="70" y1="210" x2="560" y2="210"/></g><g stroke="#172033" stroke-width="5"><line x1="300" y1="45" x2="300" y2="230"/><line x1="60" y1="150" x2="575" y2="150"/></g><circle cx="500" cy="90" r="13" fill="#d43d55"/><text x="515" y="83" font-size="22">(2,1)</text></svg>`,
      default: ""
    };
    return svgs[type] || svgs.default;
  },

  updateMetrics() {
    const cards = [...document.querySelectorAll(".topicCard")];
    const total = cards.length;
    const done = cards.filter(card => this.progress[card.dataset.topicId] === true).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };
    set("overallPct", `${pct}%`);
    set("doneMetric", done);
    set("pendingMetric", Math.max(0, total - done));
    const bar = document.getElementById("overallBar");
    if (bar) bar.style.width = `${pct}%`;
  },

  filter() {
    const q = document.getElementById("studySearch")?.value.trim().toLowerCase() || "";
    const recurrenceChoice = document.getElementById("recurrenceFilter")?.value || "all";
    const favoritesOnly = document.getElementById("favoritesOnly")?.checked || false;
    const attentionOnly = document.getElementById("attentionOnly")?.checked || false;

    document.querySelectorAll(".topicCard").forEach(card => {
      const matchesText = !q || card.dataset.search.includes(q);
      const matchesRecurrence = recurrenceChoice === "all" ||
        card.dataset.recurrenceLevel === recurrenceChoice;
      const matchesFavorite = !favoritesOnly || ONC.StudyTools?.isFavorite(card.dataset.topicId);
      const matchesAttention = !attentionOnly || ONC.Attention?.hasAlert(card.dataset.topicId);
      const show = matchesText && matchesRecurrence && matchesFavorite && matchesAttention;
      card.classList.toggle("hidden", !show);

      if (show && (q || recurrenceChoice !== "all")) {
        card.closest(".group")?.classList.add("open");
        card.closest(".subject")?.classList.add("open");
      }
    });

    document.querySelectorAll(".group").forEach(group => {
      const visible = [...group.querySelectorAll(".topicCard")]
        .some(card => !card.classList.contains("hidden"));
      group.classList.toggle("hidden", !visible);
    });

    document.querySelectorAll(".subject").forEach(subject => {
      const visible = [...subject.querySelectorAll(".group")]
        .some(group => !group.classList.contains("hidden"));
      subject.classList.toggle("hidden", !visible);
    });
  }
};
