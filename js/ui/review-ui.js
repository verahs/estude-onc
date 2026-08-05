window.ONC = window.ONC || {};
ONC.UIComponents = ONC.UIComponents || {};

ONC.UIComponents.Review = {
  nextReview() {
    const reviews = Object.entries(ONC.StudyTools?.state?.reviews || {})
      .map(([id, item]) => ({ id, ...item }))
      .filter(item => item.dueAt)
      .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

    return reviews[0] || null;
  },

  render() {
    const root = document.getElementById("nextReviewCard");
    if (!root) return;

    const review = this.nextReview();
    if (!review) {
      root.innerHTML = `
        <div class="dashboardEmpty">
          <strong>⏰ Próxima revisão</strong>
          <span>Abra e estude um tópico para que o tutor programe a primeira revisão.</span>
        </div>`;
      return;
    }

    const due = new Date(review.dueAt);
    const now = new Date();
    const diff = due.getTime() - now.getTime();

    let when = "Agora";
    if (diff > 0) {
      const days = Math.ceil(diff / 86400000);
      when = days <= 1
        ? `Hoje, ${due.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
        : due.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    }

    root.innerHTML = `
      <div class="reviewCardIcon" aria-hidden="true">⏰</div>
      <div class="reviewCardContent">
        <span class="dashboardLabel">Próxima revisão</span>
        <h3>${review.title}</h3>
        <p>${review.discipline || "Conteúdo programado"} • ${when}</p>
        <small>Tempo estimado: cerca de 3 minutos.</small>
      </div>
      <button class="btn" type="button" onclick="ONC.StudyTools.openReview('${review.id}')">
        Iniciar
      </button>`;
  }
};
