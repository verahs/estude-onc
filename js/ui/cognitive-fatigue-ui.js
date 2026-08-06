window.ONC = window.ONC || {};

ONC.CognitiveFatigueUI = {
  pauseInterval: null,

  init() {
    this.render();
  },

  render() {
    const root = document.getElementById("cognitiveFatiguePanel");
    if (!root) return;

    const analysis = ONC.CognitiveFatigueCoach.current();

    root.innerHTML = `
      <div class="fatigueHeader">
        <div>
          <span class="dashboardLabel">Coach de fadiga cognitiva</span>
          <h2>${analysis.recommendation.level}</h2>
          <p>${analysis.recommendation.message}</p>
        </div>
        <div class="fatigueScore">
          <strong>${analysis.score}</strong>
          <span>carga operacional</span>
        </div>
      </div>

      <div class="fatigueConfidence">
        <span>Confiança</span>
        <strong>${analysis.confidence.label}</strong>
        <small>${analysis.confidence.score}/100 — depende da quantidade de respostas e sessões registradas</small>
      </div>

      <div class="fatigueSignals">
        ${analysis.signals.map(signal => `
          <article class="fatigueSignal fatigueSignal--${signal.severity}">
            <strong>${signal.title}</strong>
            <span>${signal.evidence}</span>
            <p>${signal.action}</p>
          </article>`).join("")}
      </div>

      <section class="fatigueRecovery">
        <div>
          <span>Próxima ação segura</span>
          <strong>${analysis.recovery.title}</strong>
          <small>${analysis.recovery.detail}</small>
        </div>
        <button class="btn primary" type="button"
          onclick="ONC.CognitiveFatigueCoach.startRecovery()">
          Aplicar recomendação
        </button>
      </section>

      <div id="fatiguePauseTimer" class="fatiguePauseTimer hidden" aria-live="polite"></div>

      <details class="fatigueDetails">
        <summary>Ver indicadores considerados</summary>
        <div class="fatigueMetrics">
          <article><strong>${analysis.windows.accuracyDrop}%</strong><span>queda de precisão</span></article>
          <article><strong>${analysis.windows.timeIncrease}%</strong><span>aumento do tempo</span></article>
          <article><strong>${analysis.windows.consecutiveErrors}</strong><span>erros consecutivos</span></article>
          <article><strong>${analysis.workload.totalMinutes}</strong><span>minutos em 4 horas</span></article>
          <article><strong>${analysis.switching.rapidSwitches}</strong><span>trocas rápidas</span></article>
        </div>
      </details>

      <div class="fatigueFooter">
        <small>${analysis.disclaimer}</small>
        <button class="btn" type="button"
          onclick="ONC.CognitiveFatigueCoach.refresh('manual');ONC.CognitiveFatigueUI.render()">
          Atualizar
        </button>
      </div>`;
  },

  startPauseTimer(minutes) {
    const root = document.getElementById("fatiguePauseTimer");
    if (!root) return;

    clearInterval(this.pauseInterval);
    let seconds = Math.max(1, Number(minutes || 5)) * 60;
    root.classList.remove("hidden");

    const draw = () => {
      const min = Math.floor(seconds / 60);
      const sec = String(seconds % 60).padStart(2, "0");
      root.innerHTML = `
        <strong>Pausa em andamento: ${min}:${sec}</strong>
        <span>Afaste-se da tela e retorne quando o contador terminar.</span>
        <button class="textButton" type="button"
          onclick="ONC.CognitiveFatigueUI.stopPauseTimer()">Encerrar pausa</button>`;
    };

    draw();
    this.pauseInterval = setInterval(() => {
      seconds -= 1;
      draw();

      if (seconds <= 0) {
        this.stopPauseTimer(true);
      }
    }, 1000);
  },

  stopPauseTimer(completed = false) {
    clearInterval(this.pauseInterval);
    this.pauseInterval = null;

    const root = document.getElementById("fatiguePauseTimer");
    if (root) {
      root.innerHTML = completed
        ? "<strong>Pausa concluída.</strong><span>Retome com uma atividade curta.</span>"
        : "<strong>Pausa encerrada.</strong>";
    }

    ONC.Notifications?.announce?.(
      completed ? "Pausa concluída. Retome com uma atividade curta." : "Pausa encerrada."
    );
  },

  renderReport() {
    const root = document.getElementById("cognitiveFatigueReport");
    if (!root) return;

    const analysis = ONC.CognitiveFatigueCoach.current();
    const components = [
      ["Queda de precisão", analysis.components.accuracyDrop],
      ["Lentidão crescente", analysis.components.responseSlowdown],
      ["Erros rápidos", analysis.components.quickErrors],
      ["Erros consecutivos", analysis.components.consecutiveErrors],
      ["Carga recente", analysis.components.workload],
      ["Troca de tarefa", analysis.components.switching],
      ["Horário tardio", analysis.components.lateHour]
    ];

    root.innerHTML = `
      <div class="fatigueReportHeader">
        <div>
          <span class="dashboardLabel">Carga cognitiva operacional</span>
          <h2>Ritmo, desempenho e duração da sessão</h2>
          <p>O painel indica queda operacional durante o uso, sem fazer diagnóstico de saúde.</p>
        </div>
      </div>

      <div class="fatigueReportGrid">
        <article><span>Índice atual</span><strong>${analysis.score}/100</strong></article>
        <article><span>Confiança</span><strong>${analysis.confidence.label}</strong></article>
        <article><span>Carga em 4h</span><strong>${analysis.workload.totalMinutes} min</strong></article>
        <article><span>Precisão final</span><strong>${analysis.windows.lastAccuracy ?? "—"}%</strong></article>
      </div>

      <div class="fatigueComponentList">
        ${components.map(([label, value]) => `
          <article>
            <div><strong>${label}</strong><span>${Math.round(value)} pontos</span></div>
            <div class="fatigueBar"><i style="width:${Math.round(value)}%"></i></div>
          </article>`).join("")}
      </div>

      <details class="fatigueMethod">
        <summary>Como interpretar</summary>
        <p>O índice aumenta quando há queda de precisão, aumento do tempo de resposta, erros consecutivos, sessões prolongadas ou trocas frequentes.</p>
        <p>Esses sinais podem ter outras causas, como conteúdo difícil, interrupções externas, conexão, sono ou saúde.</p>
        <p>${analysis.disclaimer}</p>
      </details>`;
  }
};
