window.ONC = window.ONC || {};

ONC.BehavioralDashboardUI = {
  init() {
    this.render();
  },

  icon(direction) {
    return {
      up: "↗",
      down: "↘",
      stable: "→",
      insufficient: "·"
    }[direction] || "·";
  },

  render() {
    const root = document.getElementById("behavioralDashboardPanel");
    if (!root) return;

    const snapshot = ONC.BehavioralDashboardEngine.current();

    root.innerHTML = `
      <div class="behavioralHeader">
        <div>
          <span class="dashboardLabel">Painel comportamental</span>
          <h2>${snapshot.level.label}</h2>
          <p>${snapshot.level.message}</p>
        </div>
        <div class="behavioralScore behavioralScore--${snapshot.level.tone}">
          <strong>${snapshot.score}</strong>
          <span>índice integrado</span>
        </div>
      </div>

      <div class="behavioralMeta">
        <span><b>Confiança:</b> ${snapshot.confidence.label}</span>
        <span><b>Tendência:</b> ${this.icon(snapshot.trend.direction)} ${snapshot.trend.label}</span>
        <span><b>Atualizado:</b> ${new Date(snapshot.generatedAt).toLocaleString("pt-BR")}</span>
      </div>

      <div class="behavioralDimensions">
        <article>
          <span>Hábitos</span>
          <strong>${snapshot.health.habit}%</strong>
          <i><b style="width:${snapshot.health.habit}%"></b></i>
        </article>
        <article>
          <span>Conclusão</span>
          <strong>${snapshot.health.procrastination}%</strong>
          <i><b style="width:${snapshot.health.procrastination}%"></b></i>
        </article>
        <article>
          <span>Consistência</span>
          <strong>${snapshot.health.consistency}%</strong>
          <i><b style="width:${snapshot.health.consistency}%"></b></i>
        </article>
        <article>
          <span>Carga sustentável</span>
          <strong>${snapshot.health.fatigue}%</strong>
          <i><b style="width:${snapshot.health.fatigue}%"></b></i>
        </article>
      </div>

      <section class="behavioralPriority">
        <div class="behavioralPriorityHeader">
          <div>
            <span>Prioridade atual</span>
            <strong>${snapshot.priorities[0]?.title || "Sem ação prioritária"}</strong>
          </div>
          <button class="btn primary" type="button"
            onclick="ONC.BehavioralDashboardEngine.executePriority(0)">
            Aplicar recomendação
          </button>
        </div>
        <p>${snapshot.priorities[0]?.action || "Mantenha o ritmo atual."}</p>
      </section>

      <details class="behavioralAttention">
        <summary>${snapshot.signals.length} ponto${snapshot.signals.length === 1 ? "" : "s"} observado${snapshot.signals.length === 1 ? "" : "s"}</summary>
        <div>
          ${snapshot.signals.map(signal => `
            <article class="behavioralSignal behavioralSignal--${signal.severity}">
              <div>
                <span>${signal.source}</span>
                <strong>${signal.title}</strong>
              </div>
              <p>${signal.detail}</p>
              <small>${signal.action}</small>
            </article>`).join("")}
        </div>
      </details>

      <div class="behavioralFooter">
        <small>${snapshot.disclaimer}</small>
        <button class="btn" type="button"
          onclick="ONC.BehavioralDashboardEngine.refreshAll()">
          Atualizar painel
        </button>
      </div>`;
  },

  renderReport() {
    const root = document.getElementById("behavioralDashboardReport");
    if (!root) return;

    const snapshot = ONC.BehavioralDashboardEngine.current();
    const weekly = snapshot.weekly;

    root.innerHTML = `
      <div class="behavioralReportHeader">
        <div>
          <span class="dashboardLabel">Síntese comportamental</span>
          <h2>Visão consolidada da rotina de estudo</h2>
          <p>Resumo executivo para aluno e responsável, com indicadores locais e explicáveis.</p>
        </div>
      </div>

      <div class="behavioralReportGrid">
        <article><span>Índice integrado</span><strong>${snapshot.score}/100</strong></article>
        <article><span>Dias ativos</span><strong>${weekly.activeDays}/7</strong></article>
        <article><span>Sequência atual</span><strong>${weekly.streak}</strong></article>
        <article><span>Sessão média</span><strong>${weekly.sessionAverage || "—"} min</strong></article>
        <article><span>Equilíbrio disciplinar</span><strong>${weekly.disciplineBalance}%</strong></article>
        <article><span>Tarefas pendentes</span><strong>${weekly.pendingTasks}</strong></article>
        <article><span>Revisões vencidas</span><strong>${weekly.overdueReviews}</strong></article>
        <article><span>Carga cognitiva</span><strong>${weekly.fatigueScore}/100</strong></article>
      </div>

      <section class="behavioralExecutive">
        <div>
          <h3>Três prioridades</h3>
          ${snapshot.priorities.map(item => `
            <article>
              <b>${item.rank}</b>
              <div>
                <strong>${item.title}</strong>
                <span>${item.action}</span>
                <small>${item.source}</small>
              </div>
            </article>`).join("")}
        </div>

        <div>
          <h3>Pontos positivos</h3>
          ${snapshot.strengths.length ? snapshot.strengths.map(item => `
            <article class="behavioralStrength">
              <strong>${item.title}</strong>
              <span>${item.detail}</span>
              <small>${item.source}</small>
            </article>`).join("") : `
            <p class="note">Ainda não há evidência suficiente para destacar um padrão positivo estável.</p>`}
        </div>
      </section>

      <details class="behavioralMethod">
        <summary>Composição e limites</summary>
        <p>O índice integrado combina hábitos (25%), conclusão de tarefas (25%), consistência (30%) e carga sustentável (20%).</p>
        <p>O painel usa apenas eventos locais registrados na plataforma. Não determina causas e pode ser afetado por uso compartilhado, falta de tempo, conexão, saúde ou rotina familiar.</p>
        <p>${snapshot.disclaimer}</p>
      </details>`;
  }
};
