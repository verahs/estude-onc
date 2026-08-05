window.ONC = window.ONC || {};

ONC.Attention = {
  attempts: {},
  topicIndex: [],
  levels: {
    attention: { label: "Atenção", icon: "⚠️", order: 1 },
    review: { label: "Revisar", icon: "🟠", order: 2 },
    critical: { label: "Prioridade máxima", icon: "🔴", order: 3 }
  },

  init() {
    this.attempts = ONC.Storage.get(this.storageKey(), {});
    this.buildTopicIndex();
    this.refresh();
  },

  storageKey() {
    const current = ONC.Classroom?.currentId || ONC.Users?.current?.name || "visitante";
    return `onc_attention_attempts_${current}`;
  },

  normalize(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  },

  buildTopicIndex() {
    this.topicIndex = [...document.querySelectorAll(".topicCard")].map(card => ({
      id: card.dataset.topicId,
      title: card.dataset.topicTitle || card.querySelector(".topicName")?.textContent || "",
      discipline: card.dataset.discipline || "",
      normalizedTitle: this.normalize(card.dataset.topicTitle || card.querySelector(".topicName")?.textContent || ""),
      recurrence: Number(card.dataset.recurrence || 0),
      card
    }));
  },

  findStudyTopic(subject, topic) {
    const normalizedSubject = this.normalize(subject);
    const normalizedTopic = this.normalize(topic);
    const candidates = this.topicIndex.filter(item =>
      this.normalize(item.discipline) === normalizedSubject
    );

    if (!candidates.length) return null;

    const exact = candidates.find(item => item.normalizedTitle === normalizedTopic);
    if (exact) return exact;

    const contained = candidates.find(item =>
      item.normalizedTitle.includes(normalizedTopic) ||
      normalizedTopic.includes(item.normalizedTitle)
    );
    if (contained) return contained;

    const queryTokens = new Set(normalizedTopic.split(" ").filter(token => token.length > 2));
    let best = null;
    let bestScore = 0;

    for (const item of candidates) {
      const titleTokens = new Set(item.normalizedTitle.split(" ").filter(token => token.length > 2));
      const intersection = [...queryTokens].filter(token => titleTokens.has(token)).length;
      const union = new Set([...queryTokens, ...titleTokens]).size || 1;
      const score = intersection / union;
      if (score > bestScore) {
        best = item;
        bestScore = score;
      }
    }

    return bestScore >= 0.25 ? best : null;
  },

  recordAttempt(question, correct, source = "question-bank") {
    if (!question) return;

    const topic = this.findStudyTopic(question.subject, question.topic);
    if (!topic) {
      console.warn("Não foi possível associar a questão a um tópico:", question.subject, question.topic);
      return;
    }

    const current = this.attempts[topic.id] || {
      topicId: topic.id,
      title: topic.title,
      discipline: topic.discipline,
      attempts: 0,
      errors: 0,
      correct: 0,
      lastErrorAt: null,
      lastAttemptAt: null,
      sources: {}
    };

    current.attempts += 1;
    current.lastAttemptAt = new Date().toISOString();
    current.sources[source] = (current.sources[source] || 0) + 1;

    if (correct) {
      current.correct += 1;
    } else {
      current.errors += 1;
      current.lastErrorAt = new Date().toISOString();
    }

    this.attempts[topic.id] = current;
    ONC.Storage.set(this.storageKey(), this.attempts);
    ONC.StudyHistory?.recordAttempt(question, topic.id, correct, source);
    this.refresh();
    ONC.SmartTutor?.refresh();
  },

  daysSince(dateString) {
    if (!dateString) return 0;
    const elapsed = Date.now() - new Date(dateString).getTime();
    return Math.max(0, Math.floor(elapsed / 86400000));
  },

  evaluate(topicId) {
    const attempt = this.attempts[topicId];
    if (!attempt || attempt.errors < 1) return null;

    const topic = this.topicIndex.find(item => item.id === topicId);
    if (!topic) return null;

    const errorRate = attempt.errors / Math.max(1, attempt.attempts);
    const recurrence = topic.recurrence;
    const days = this.daysSince(attempt.lastErrorAt);

    // An error is mandatory. Recurrence and elapsed time only intensify the alert.
    let score = (attempt.errors * 1.25) + (errorRate * 1.5);
    if (recurrence >= 10) score += 1.0;
    else if (recurrence >= 8) score += 0.7;
    else if (recurrence >= 5) score += 0.35;

    if (days >= 14) score += 0.8;
    else if (days >= 7) score += 0.4;

    let level = "attention";
    if (score >= 4.1) level = "critical";
    else if (score >= 2.7) level = "review";

    const reasons = [];
    reasons.push(`${attempt.errors} erro${attempt.errors === 1 ? "" : "s"} em ${attempt.attempts} tentativa${attempt.attempts === 1 ? "" : "s"}`);
    if (recurrence >= 10) reasons.push("recorrência muito alta");
    else if (recurrence >= 8) reasons.push("recorrência alta");
    else if (recurrence >= 5) reasons.push("recorrência média");
    if (days >= 7) reasons.push(`${days} dias desde o último erro`);

    return {
      topicId,
      title: topic.title,
      discipline: topic.discipline,
      recurrence,
      score,
      level,
      levelInfo: this.levels[level],
      attempts: attempt.attempts,
      errors: attempt.errors,
      correct: attempt.correct,
      reasons
    };
  },

  allAlerts() {
    return Object.keys(this.attempts)
      .map(id => this.evaluate(id))
      .filter(Boolean)
      .sort((a, b) =>
        b.levelInfo.order - a.levelInfo.order ||
        b.score - a.score ||
        b.recurrence - a.recurrence
      );
  },

  hasAlert(topicId) {
    return Boolean(this.evaluate(topicId));
  },

  refresh() {
    this.renderCards();
    this.renderPanel();
    this.renderCount();
    ONC.Study?.filter();
  },

  renderCount() {
    const alerts = this.allAlerts();
    const count = document.getElementById("attentionMetric");
    if (count) count.textContent = alerts.length;
  },

  renderCards() {
    for (const item of this.topicIndex) {
      const alert = this.evaluate(item.id);
      const card = item.card;
      const old = card.querySelector(".attentionBadge");
      old?.remove();
      card.dataset.attention = alert ? alert.level : "none";

      if (!alert) continue;

      const meta = card.querySelector(".topicMeta");
      if (!meta) continue;

      const badge = document.createElement("span");
      badge.className = `attentionBadge attentionBadge--${alert.level}`;
      badge.title = alert.reasons.join(" • ");
      badge.innerHTML = `${alert.levelInfo.icon} ${alert.levelInfo.label}`;
      meta.appendChild(badge);
    }
  },

  renderPanel() {
    const root = document.getElementById("attentionPanelList");
    const summary = document.getElementById("attentionPanelSummary");
    if (!root || !summary) return;

    const alerts = this.allAlerts();
    summary.textContent = alerts.length
      ? `Revise ${alerts.length} conteúdo${alerts.length === 1 ? "" : "s"} identificado${alerts.length === 1 ? "" : "s"} pelos seus resultados.`
      : "Nenhum conteúdo em atenção neste momento.";

    if (!alerts.length) {
      root.innerHTML = `
        <div class="dashboardEmpty">
          <strong>Nenhum alerta gerado</strong>
          <span>Os alertas aparecem somente quando há erro em questões ou simulados. A recorrência sozinha não gera atenção.</span>
        </div>`;
      return;
    }

    root.innerHTML = alerts.slice(0, 8).map(alert => {
      const accuracy = alert.attempts
        ? Math.round((alert.correct / alert.attempts) * 100)
        : 0;
      const lastError = this.attempts[alert.topicId]?.lastErrorAt;
      const days = this.daysSince(lastError);
      const when = days === 0 ? "hoje" : `há ${days} dia${days === 1 ? "" : "s"}`;

      return `
        <article class="attentionItem attentionItem--${alert.level}">
          <div class="attentionItemIcon" aria-hidden="true">${alert.levelInfo.icon}</div>
          <div class="attentionItemContent">
            <strong>${alert.title}</strong>
            <small>${alert.discipline}</small>
            <div class="attentionReasonGrid">
              <span><b>Desempenho:</b> ${alert.correct} acerto${alert.correct === 1 ? "" : "s"} em ${alert.attempts} tentativa${alert.attempts === 1 ? "" : "s"} (${accuracy}%)</span>
              <span><b>Último erro:</b> ${when}</span>
              <span><b>Prioridade:</b> ${alert.levelInfo.label} • recorrência ${alert.recurrence}%</span>
            </div>
          </div>
          <button class="btn btnSmall" type="button"
            onclick="ONC.Attention.openTopic('${alert.topicId}')">⚠ Revisar agora</button>
        </article>`;
    }).join("");
  },

  openTopic(id) {
    const card = document.querySelector(`[data-topic-id="${id}"]`);
    if (!card) return;
    card.closest(".subject")?.classList.add("open");
    card.closest(".group")?.classList.add("open");
    card.classList.add("open");
    card.querySelector(".topicSummary")?.setAttribute("aria-expanded", "true");
    ONC.Study.ensureTopicLoaded(card);
    card.scrollIntoView({ behavior: "smooth", block: "start" });
  },

  reset() {
    if (!confirm("Apagar o histórico usado para gerar os alertas de atenção?")) return;
    this.attempts = {};
    ONC.Storage.remove(this.storageKey());
    this.refresh();
  }
};
