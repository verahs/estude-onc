window.ONC = window.ONC || {};

ONC.StudyHabitUI = {
  init() {
    this.render();
  },

  render() {
    const root = document.getElementById("studyHabitPanel");
    if (!root) return;

    const analysis = ONC.StudyHabitEngine.current();
    const profile = analysis.profile;
    const maxEvents = Math.max(1, ...analysis.days.slice(-14).map(day => day.events));

    root.innerHTML = `
      <div class="habitHeader">
        <div>
          <span class="dashboardLabel">Detector de hábitos</span>
          <h2>${profile.level}</h2>
          <p>Padrões observados a partir do uso real da plataforma nos últimos 30 dias.</p>
        </div>
        <div class="habitConsistency">
          <strong>${profile.consistency}</strong>
          <span>consistência</span>
        </div>
      </div>

      <div class="habitMetrics">
        <article><strong>${profile.active7}</strong><span>dias ativos em 7</span></article>
        <article><strong>${profile.streak}</strong><span>sequência atual</span></article>
        <article><strong>${profile.longestStreak}</strong><span>maior sequência</span></article>
        <article><strong>${profile.preferred.label}</strong><span>horário frequente</span></article>
        <article><strong>${profile.sessions.averageMinutes || "—"}</strong><span>minutos por sessão</span></article>
      </div>

      <div class="habitCalendar" aria-label="Atividade dos últimos 14 dias">
        ${analysis.days.slice(-14).map(day => `
          <div class="habitDay ${day.active ? "is-active" : ""}"
            title="${day.date}: ${day.events} eventos">
            <i style="height:${day.active ? Math.max(18, Math.round(day.events / maxEvents * 100)) : 5}%"></i>
            <span>${day.label}</span>
          </div>`).join("")}
      </div>

      <div class="habitSignals">
        ${analysis.signals.map(signal => `
          <article class="habitSignal habitSignal--${signal.level}">
            <strong>${signal.title}</strong>
            <span>${signal.message}</span>
          </article>`).join("")}
      </div>

      <details class="habitRecommendations">
        <summary>Recomendações para fortalecer a rotina</summary>
        <div>
          ${analysis.recommendations.map(item => `
            <article>
              <strong>${item.title}</strong>
              <span>${item.action}</span>
            </article>`).join("")}
        </div>
      </details>

      <div class="habitFooter">
        <small>${analysis.disclaimer}</small>
        <button class="btn" type="button"
          onclick="ONC.StudyHabitEngine.refresh('manual');ONC.StudyHabitUI.render()">
          Atualizar
        </button>
      </div>`;
  },

  renderReport() {
    const root = document.getElementById("studyHabitReport");
    if (!root) return;

    const analysis = ONC.StudyHabitEngine.current();
    const profile = analysis.profile;
    const maxEvents = Math.max(1, ...analysis.weeklyPattern.map(day => day.events));

    root.innerHTML = `
      <div class="habitReportHeader">
        <div>
          <span class="dashboardLabel">Hábitos de estudo</span>
          <h2>Distribuição e ritmo de uso</h2>
          <p>O painel descreve frequência, duração e horários. Não avalia personalidade ou saúde mental.</p>
        </div>
      </div>

      <div class="habitReportGrid">
        <article><span>Dias ativos em 30</span><strong>${profile.active30}</strong></article>
        <article><span>Consistência</span><strong>${profile.consistency}/100</strong></article>
        <article><span>Sessão média</span><strong>${profile.sessions.averageMinutes || "—"} min</strong></article>
        <article><span>Sessão mediana</span><strong>${profile.sessions.medianMinutes || "—"} min</strong></article>
      </div>

      <section class="habitWeekPattern">
        <h3>Padrão por dia da semana</h3>
        <div>
          ${analysis.weeklyPattern.map(day => `
            <article>
              <div class="habitWeekBar">
                <i style="height:${day.events ? Math.max(8, Math.round(day.events / maxEvents * 100)) : 3}%"></i>
              </div>
              <strong>${day.events}</strong>
              <span>${day.label}</span>
            </article>`).join("")}
        </div>
      </section>

      <section class="habitHourPattern">
        <h3>Distribuição por horário</h3>
        <div>
          ${profile.preferred.distribution.map(item => `
            <i style="height:${item.count ? Math.max(5, Math.round(item.count / Math.max(1, ...profile.preferred.distribution.map(x => x.count)) * 100)) : 2}%"
              title="${String(item.hour).padStart(2, "0")}h: ${item.count} evento${item.count === 1 ? "" : "s"}"></i>`).join("")}
        </div>
        <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span>
      </section>

      <div class="habitEvidenceBox">
        <strong>Base da análise</strong>
        <span>${analysis.evidence.totalEvents} eventos • ${analysis.evidence.sessionCount} sessões com duração • ${analysis.evidence.activeDays} dias ativos</span>
        <small>${analysis.disclaimer}</small>
      </div>`;
  }
};
