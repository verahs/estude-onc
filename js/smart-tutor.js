window.ONC = window.ONC || {};

ONC.SmartTutor = {
  refreshing: false,

  init() {
    this.refresh();
  },

  refresh() {
    if (this.refreshing) return;
    this.refreshing = true;

    try {
      ONC.MasteryEngine?.refresh();
      ONC.ProgressEngine.refresh();
      ONC.MissionEngine.updateAutomaticCompletion();
      ONC.MissionEngine.save();
      ONC.Gamification?.syncMissionAwards();
      ONC.UIComponents?.Dashboard?.renderAll();
      ONC.DashboardEngine?.render();
      ONC.StudyTools?.renderResumeCard();
      ONC.StudyTools?.renderWeeklyStats();
      ONC.StudyTools?.renderReviewQueue();
      ONC.Attention?.renderPanel();
      ONC.Attention?.renderCount();
    } finally {
      this.refreshing = false;
    }
  },

  renderMission() {
    ONC.UIComponents?.Mission?.render();
  },

  renderNextAction() {
    ONC.UIComponents?.Dashboard?.renderNextAction();
  },

  renderPreparation() {
    ONC.UIComponents?.Dashboard?.renderPreparation();
  }
};
