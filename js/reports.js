window.ONC = window.ONC || {};
ONC.Reports = {
  render() {
    const history = ONC.Storage.get("onc_quiz_history", []);
    const total = ONC_DATA.subjects.reduce((a,s)=>a+s.groups.reduce((b,g)=>b+g.topics.length,0),0);
    const done = Object.values(ONC.Study.progress).filter(Boolean).length;
    const avg = history.length ? Math.round(history.reduce((a,b)=>a+b.pct,0)/history.length) : null;
    document.getElementById("reportProgress").textContent = `${done}/${total}`;
    document.getElementById("reportQuizCount").textContent = history.length;
    document.getElementById("reportAverage").textContent = avg===null ? "—" : avg+"%";
    const preparation = ONC.ProgressEngine?.summary()?.preparation ?? 0;
    const reportAverage = document.getElementById("reportAverage");
    if (reportAverage && avg === null) reportAverage.textContent = `${preparation}% prep.`;

    document.getElementById("reportHistory").innerHTML = history.length
      ? `<table class="historyTable"><tr><th>Data</th><th>Disciplina</th><th>Resultado</th></tr>
        ${history.map(x=>`<tr><td>${x.date}</td><td>${x.subject}${x.mode==="adaptive" ? " • inteligente" : ""}</td><td>${x.hits}/${x.total} (${x.pct}%)</td></tr>`).join("")}</table>`
      : '<p class="note">Nenhum simulado concluído.</p>';

    ONC.AssessmentUI?.renderReportWidgets();
    ONC.AdvancedDashboardUI?.render();
    ONC.NavigationUI?.renderReport?.();
    ONC.DailyCoachUI?.renderReport?.();
    ONC.PerformancePredictionUI?.renderReport?.();
    ONC.StudyHabitUI?.renderReport?.();
    ONC.ProcrastinationUI?.renderReport?.();
    ONC.ConsistencyCoachUI?.renderReport?.();
  }
};
