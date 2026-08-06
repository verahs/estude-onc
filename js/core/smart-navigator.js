window.ONC = window.ONC || {};

ONC.SmartNavigator = {
  context: null,
  highlightTimer: null,

  init() {
    this.ensureLiveRegion();
  },

  ensureLiveRegion() {
    if (document.getElementById("smartNavigationLive")) return;
    const live = document.createElement("div");
    live.id = "smartNavigationLive";
    live.className = "visuallyHidden";
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    document.body.appendChild(live);
  },

  announce(message) {
    const live = document.getElementById("smartNavigationLive");
    if (!live) return;
    live.textContent = "";
    setTimeout(() => { live.textContent = message; }, 30);
  },

  async goToTopic(topicIdOrText, options = {}) {
    const config = {
      source: "direct",
      reason: "Conteúdo recomendado pelo tutor.",
      focus: true,
      highlight: true,
      smooth: true,
      returnTarget: null,
      retryQuestionId: null,
      ...options
    };

    let item = ONC.ContentIndex.resolve(topicIdOrText);
    if (!item) {
      ONC.ContentIndex.build();
      item = ONC.ContentIndex.resolve(topicIdOrText);
    }

    if (!item) {
      ONC.Notifications?.announce?.("Não foi possível localizar o conteúdo recomendado.", "error");
      this.announce("Conteúdo recomendado não localizado.");
      console.warn("[SmartNavigator] tópico não localizado:", topicIdOrText);
      return false;
    }

    this.context = {
      topicId: item.id,
      source: config.source,
      reason: config.reason,
      returnTarget: config.returnTarget,
      retryQuestionId: config.retryQuestionId,
      openedAt: new Date().toISOString()
    };

    ONC.UI.showSection("studySection");

    if (config.focus) {
      ONC.FocusMode.enable(item.id);
    } else {
      this.expandPath(item);
    }

    await ONC.Study.ensureTopicLoaded(item.card);
    this.injectTutorBanner(item, config);
    ONC.NavigationHistory.start(item.id, config.source, {
      reason: config.reason,
      returnTarget: config.returnTarget,
      retryQuestionId: config.retryQuestionId
    });

    requestAnimationFrame(() => {
      item.card.scrollIntoView({
        behavior: config.smooth ? "smooth" : "auto",
        block: "center"
      });

      item.card.querySelector(".topicSummary")?.focus({ preventScroll: true });
      if (config.highlight) this.highlight(item.card);

      this.announce(`Conteúdo recomendado aberto: ${item.title}.`);
      ONC.Notifications?.announce?.(`Abrindo: ${item.title}`);
    });

    return true;
  },

  expandPath(item) {
    [item.subject, item.group, item.card].forEach(element => {
      if (!element) return;
      element.classList.add("open");
      const button = element.querySelector(":scope > button[aria-expanded]");
      if (button) button.setAttribute("aria-expanded", "true");
      const symbol = element.querySelector(":scope > button .expandSymbol");
      if (symbol) symbol.textContent = "−";
    });
  },

  highlight(card) {
    clearTimeout(this.highlightTimer);
    document.querySelectorAll(".smartNavigationHighlight").forEach(element =>
      element.classList.remove("smartNavigationHighlight")
    );
    card.classList.add("smartNavigationHighlight");
    this.highlightTimer = setTimeout(() => {
      card.classList.remove("smartNavigationHighlight");
    }, 2600);
  },

  injectTutorBanner(item, config) {
    document.querySelectorAll(".smartTutorNavigationBanner").forEach(element => element.remove());

    const banner = document.createElement("section");
    banner.className = "smartTutorNavigationBanner";
    banner.setAttribute("role", "note");
    banner.innerHTML = `
      <div class="smartTutorBannerIcon" aria-hidden="true">🧠</div>
      <div class="smartTutorBannerContent">
        <span>Tutor inteligente</span>
        <strong>${config.reason}</strong>
        <p>Leia este conteúdo antes de tentar novamente. O progresso será registrado no histórico adaptativo.</p>
      </div>
      <button class="textButton" type="button" onclick="ONC.SmartNavigator.exitFocus()">
        Sair do foco
      </button>`;

    item.card.querySelector(".topicDetails")?.prepend(banner);
    this.injectCompletionBar(item);
  },

  injectCompletionBar(item) {
    item.card.querySelector(".smartNavigationCompletion")?.remove();
    const completion = document.createElement("div");
    completion.className = "smartNavigationCompletion";
    completion.innerHTML = `
      <button class="btn primary" type="button"
        onclick="ONC.SmartNavigator.completeReview('${item.id}')">
        ✓ Concluir revisão
      </button>
      <button class="btn" type="button"
        onclick="ONC.SmartNavigator.returnToOrigin()">
        Voltar
      </button>`;
    item.card.querySelector(".topicDetails")?.append(completion);
  },

  async completeReview(topicId) {
    const result = ONC.NavigationHistory.complete(topicId, "review-completed", {
      source: this.context?.source || "smart-navigation"
    });

    ONC.StudyHistory?.recordTopicEvent?.(
      topicId,
      ONC.ContentIndex.get(topicId)?.title || "",
      ONC.ContentIndex.get(topicId)?.discipline || "",
      "diagnostic-review-complete",
      { durationSeconds: result.durationSeconds }
    );

    ONC.LearningEngine?.rebuildTopic?.(topicId);
    ONC.RecommendationEngine?.refresh?.("smart-navigation-complete", topicId);
    ONC.AdaptivePlanner?.recalculate?.("smart-navigation-complete");
    ONC.DailyCoachEngine?.refresh?.("review-complete");
    ONC.DailyCoachUI?.render?.();
    ONC.StudyHabitEngine?.refresh?.("navigation-complete");
    ONC.StudyHabitUI?.render?.();
    ONC.ProcrastinationDetector?.refresh?.("navigation-complete");
    ONC.ProcrastinationUI?.render?.();

    this.announce("Revisão concluída.");
    ONC.Notifications?.announce?.("Revisão concluída. O tutor recalculou a próxima ação.");

    const retry = this.context?.retryQuestionId;
    const returnTarget = this.context?.returnTarget;

    if (retry) {
      const retryNow = window.confirm(
        "Revisão concluída. Deseja voltar ao banco de questões e tentar novamente?"
      );
      if (retryNow) {
        this.goToQuestion(retry);
        return;
      }
    }

    if (returnTarget) {
      const goBack = window.confirm("Revisão concluída. Deseja voltar ao diagnóstico?");
      if (goBack) {
        this.returnToOrigin();
        return;
      }
    }

    this.exitFocus();
  },

  returnToOrigin() {
    const target = this.context?.returnTarget;
    this.exitFocus();

    if (target?.sectionId) {
      ONC.UI.showSection(target.sectionId);
      requestAnimationFrame(() => {
        document.getElementById(target.elementId)?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      });
      return;
    }

    if (this.context?.source === "diagnostic") {
      ONC.UI.showSection("reportsSection");
      requestAnimationFrame(() => {
        document.getElementById("diagnosticReport")?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      });
    }
  },

  exitFocus() {
    ONC.NavigationHistory.pauseActive("focus-exit");
    ONC.FocusMode.disable({ restore: true });
    document.querySelectorAll(".smartTutorNavigationBanner,.smartNavigationCompletion")
      .forEach(element => element.remove());
  },

  goToPrerequisite(topicId, metadata = {}) {
    return this.goToTopic(topicId, {
      source: "diagnostic",
      reason: metadata.reason ||
        "Este conteúdo é um pré-requisito para corrigir a dificuldade identificada.",
      focus: true,
      returnTarget: metadata.returnTarget || {
        sectionId: "reportsSection",
        elementId: "diagnosticReport"
      },
      retryQuestionId: metadata.retryQuestionId || null
    });
  },

  goToWeakness(topicId) {
    return this.goToTopic(topicId, {
      source: "weakness",
      reason: "O tutor identificou este conteúdo como uma fragilidade prioritária.",
      focus: true
    });
  },

  goToMission(topicId) {
    return this.goToTopic(topicId, {
      source: "mission",
      reason: "Este tópico faz parte da missão adaptativa de hoje.",
      focus: true
    });
  },

  goToRevision(topicId) {
    return this.goToTopic(topicId, {
      source: "review",
      reason: "A memória estimada indica que este é o melhor momento para revisar.",
      focus: true
    });
  },

  goToFavorite(topicId) {
    return this.goToTopic(topicId, {
      source: "favorite",
      reason: "Você salvou este conteúdo para consultar novamente.",
      focus: false
    });
  },

  goToLastTopic() {
    const last = [...ONC.NavigationHistory.state.events]
      .reverse()
      .find(event => event.type === "open");
    return last
      ? this.goToTopic(last.topicId, {
          source: "continue",
          reason: "Continuando do último conteúdo acessado.",
          focus: true
        })
      : false;
  },

  goToQuestion(questionId) {
    ONC.FocusMode.disable({ restore: true });
    ONC.UI.showSection("questionBankSection");
    requestAnimationFrame(() => {
      const card = document.getElementById(`bank-${questionId}`);
      if (!card) return;
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.classList.add("smartNavigationHighlight");
      setTimeout(() => card.classList.remove("smartNavigationHighlight"), 2600);
    });
  }
};

// Compatibility facade for tutor modules.
ONC.Tutor = ONC.Tutor || {};
ONC.Tutor.goToRecommendation = topicId => ONC.SmartNavigator.goToWeakness(topicId);
ONC.Tutor.goToMission = topicId => ONC.SmartNavigator.goToMission(topicId);
ONC.Tutor.goToWeakness = topicId => ONC.SmartNavigator.goToWeakness(topicId);
ONC.Tutor.goToRevision = topicId => ONC.SmartNavigator.goToRevision(topicId);
ONC.Tutor.returnToDiagnostic = () => ONC.SmartNavigator.returnToOrigin();
