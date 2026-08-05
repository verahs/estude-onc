window.ONC = window.ONC || {};

ONC.StudyTools = {
  state: {
    favorites: {},
    lastTopic: null,
    sessions: [],
    topicVisits: {},
    reviews: {}
  },

  init() {
    this.load();
    this.bindGlobalShortcuts();
    this.renderResumeCard();
    this.renderDisciplineProgress();
    this.renderWeeklyStats();
    this.renderReviewQueue();
  },

  storageKey(name) {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_${name}_${current}`;
  },

  load() {
    this.state.favorites = ONC.Storage.get(this.storageKey("favorites"), {});
    this.state.lastTopic = ONC.Storage.get(this.storageKey("last_topic"), null);
    this.state.sessions = ONC.Storage.get(this.storageKey("study_sessions"), []);
    this.state.topicVisits = ONC.Storage.get(this.storageKey("topic_visits"), {});
    this.state.reviews = ONC.Storage.get(this.storageKey("reviews"), {});
  },

  save() {
    ONC.Storage.set(this.storageKey("favorites"), this.state.favorites);
    ONC.Storage.set(this.storageKey("last_topic"), this.state.lastTopic);
    ONC.Storage.set(this.storageKey("study_sessions"), this.state.sessions);
    ONC.Storage.set(this.storageKey("topic_visits"), this.state.topicVisits);
    ONC.Storage.set(this.storageKey("reviews"), this.state.reviews);
  },

  bindGlobalShortcuts() {
    document.addEventListener("keydown", event => {
      if (event.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) {
        event.preventDefault();
        document.getElementById("studySearch")?.focus();
      }
      if (event.key === "Escape" && document.body.classList.contains("readingMode")) {
        ONC.Study.exitReadingMode();
      }
    });
  },

  isFavorite(id) {
    return this.state.favorites[id] === true;
  },

  toggleFavorite(id, button) {
    this.state.favorites[id] = !this.isFavorite(id);
    this.save();
    button?.classList.toggle("is-active", this.isFavorite(id));
    button?.setAttribute("aria-pressed", String(this.isFavorite(id)));
    button?.setAttribute("title", this.isFavorite(id) ? "Remover dos favoritos" : "Adicionar aos favoritos");
    this.renderFavoriteCount();
  },

  renderFavoriteCount() {
    const total = Object.values(this.state.favorites).filter(Boolean).length;
    const el = document.getElementById("favoriteMetric");
    if (el) el.textContent = total;
  },

  markTopicOpened(card, topicTitle, discipline) {
    if (!card) return;
    const id = card.dataset.topicId;
    const now = new Date().toISOString();
    this.state.lastTopic = { id, title: topicTitle, discipline, openedAt: now };
    this.state.topicVisits[id] = {
      count: (this.state.topicVisits[id]?.count || 0) + 1,
      lastOpenedAt: now,
      title: topicTitle,
      discipline
    };
    this.scheduleReview(id, topicTitle, discipline);
    this.save();
    this.renderResumeCard();
    this.renderWeeklyStats();
  },

  startSession(topicId, topicTitle, discipline) {
    if (this.currentSession?.topicId === topicId) return;
    this.finishSession();
    this.currentSession = {
      topicId,
      topicTitle,
      discipline,
      startedAt: Date.now()
    };
  },

  finishSession() {
    if (!this.currentSession) return;
    const endedAt = Date.now();
    const seconds = Math.max(1, Math.round((endedAt - this.currentSession.startedAt) / 1000));
    this.state.sessions.push({
      ...this.currentSession,
      endedAt,
      seconds,
      date: new Date().toISOString().slice(0, 10)
    });
    this.state.sessions = this.state.sessions.slice(-500);
    this.currentSession = null;
    this.save();
    this.renderWeeklyStats();
  },

  estimateReadingMinutes(text = "") {
    const clean = String(text).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const words = clean ? clean.split(" ").length : 0;
    return Math.max(1, Math.ceil(words / 170));
  },

  scheduleReview(id, title, discipline) {
    const record = this.state.reviews[id] || {
      level: 0,
      title,
      discipline,
      dueAt: new Date().toISOString()
    };
    if (!record.dueAt) record.dueAt = new Date().toISOString();
    this.state.reviews[id] = record;
  },

  reviewIntervalsDays: [1, 3, 7, 14, 30],

  completeReview(id, quality) {
    const review = this.state.reviews[id];
    if (!review) return;
    let level = review.level || 0;

    if (quality === "again") level = 0;
    if (quality === "hard") level = Math.max(0, level);
    if (quality === "good") level = Math.min(level + 1, this.reviewIntervalsDays.length - 1);
    if (quality === "easy") level = Math.min(level + 2, this.reviewIntervalsDays.length - 1);

    const days = quality === "again" ? 1 : this.reviewIntervalsDays[level];
    const due = new Date();
    due.setDate(due.getDate() + days);

    review.level = level;
    review.dueAt = due.toISOString();
    review.lastQuality = quality;
    review.lastReviewedAt = new Date().toISOString();

    this.save();
    this.renderReviewQueue();
  },

  dueReviews() {
    const now = Date.now();
    return Object.entries(this.state.reviews)
      .filter(([, item]) => new Date(item.dueAt).getTime() <= now)
      .map(([id, item]) => ({ id, ...item }))
      .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  },

  renderResumeCard() {
    const root = document.getElementById("resumeStudyCard");
    if (!root) return;
    const last = this.state.lastTopic;

    if (!last) {
      root.innerHTML = `
        <div class="dashboardEmpty">
          <strong>Continue de onde parou</strong>
          <span>Abra um tópico para iniciar seu histórico de estudo.</span>
        </div>`;
      return;
    }

    root.innerHTML = `
      <div>
        <span class="dashboardLabel">Último tópico aberto</span>
        <strong>${last.title}</strong>
        <small>${last.discipline}</small>
      </div>
      <button class="btn" type="button" onclick="ONC.StudyTools.resumeLastTopic()">
        Continuar
      </button>`;
  },

  resumeLastTopic() {
    const id = this.state.lastTopic?.id;
    if (!id) return;
    const card = document.querySelector(`[data-topic-id="${id}"]`);
    if (!card) return;
    card.closest(".subject")?.classList.add("open");
    card.closest(".group")?.classList.add("open");
    card.classList.add("open");
    card.querySelector(".topicSummary")?.setAttribute("aria-expanded", "true");
    ONC.Study.ensureTopicLoaded(card);
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  },

  renderDisciplineProgress() {
    const root = document.getElementById("disciplineProgress");
    if (!root) return;

    const rows = (ONC_DATA.subjects || []).map(subject => {
      const cards = [...document.querySelectorAll(`.topicCard[data-discipline="${subject.name}"]`)];
      const total = cards.length;
      const done = cards.filter(card => ONC.Study.progress[card.dataset.topicId] === true).length;
      const percent = total ? Math.round(done * 100 / total) : 0;

      return `
        <div class="disciplineProgressRow">
          <div class="disciplineProgressHeader">
            <span>${subject.icon} ${subject.name}</span>
            <strong>${percent}%</strong>
          </div>
          <div class="disciplineProgressBar">
            <span style="width:${percent}%"></span>
          </div>
          <small>${done} de ${total} tópicos concluídos</small>
        </div>`;
    });

    root.innerHTML = rows.join("");
  },

  renderWeeklyStats() {
    const root = document.getElementById("weeklyStudyStats");
    if (!root) return;

    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0,0,0,0);

    const recent = this.state.sessions.filter(s => s.endedAt >= since.getTime());
    const seconds = recent.reduce((sum, s) => sum + (s.seconds || 0), 0);
    const topics = new Set(recent.map(s => s.topicId)).size;
    const days = new Set(recent.map(s => s.date)).size;
    const minutes = Math.round(seconds / 60);

    root.innerHTML = `
      <div class="statMini"><strong>${minutes}</strong><span>minutos estudados</span></div>
      <div class="statMini"><strong>${topics}</strong><span>tópicos visitados</span></div>
      <div class="statMini"><strong>${days}</strong><span>dias ativos</span></div>`;
  },

  renderReviewQueue() {
    const root = document.getElementById("reviewQueue");
    if (!root) return;

    const due = this.dueReviews().slice(0, 6);
    if (!due.length) {
      root.innerHTML = `
        <div class="dashboardEmpty">
          <strong>Nenhuma revisão pendente</strong>
          <span>Os tópicos revisados aparecerão aqui no momento certo.</span>
        </div>`;
      return;
    }

    root.innerHTML = due.map(item => `
      <article class="reviewItem">
        <div>
          <strong>${item.title}</strong>
          <small>${item.discipline}</small>
        </div>
        <div class="reviewActions">
          <button type="button" onclick="ONC.StudyTools.openReview('${item.id}')">Revisar</button>
          <button type="button" onclick="ONC.StudyTools.completeReview('${item.id}','again')">De novo</button>
          <button type="button" onclick="ONC.StudyTools.completeReview('${item.id}','good')">Entendi</button>
          <button type="button" onclick="ONC.StudyTools.completeReview('${item.id}','easy')">Fácil</button>
        </div>
      </article>`).join("");
  },

  openReview(id) {
    const card = document.querySelector(`[data-topic-id="${id}"]`);
    if (!card) return;
    card.closest(".subject")?.classList.add("open");
    card.closest(".group")?.classList.add("open");
    card.classList.add("open");
    ONC.Study.ensureTopicLoaded(card);
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  },

  renderFavoritesOnly(enabled) {
    document.querySelectorAll(".topicCard").forEach(card => {
      const favorite = this.isFavorite(card.dataset.topicId);
      card.classList.toggle("hiddenByFavorite", enabled && !favorite);
    });
  },

  bindUnload() {
    window.addEventListener("beforeunload", () => this.finishSession());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.finishSession();
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  ONC.StudyTools.bindUnload();
});
