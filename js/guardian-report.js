window.ONC = window.ONC || {};

ONC.GuardianReport = {
  init() {},

  print() {
    document.body.classList.add("printingGuardianReport");
    window.print();
    setTimeout(() => {
      document.body.classList.remove("printingGuardianReport");
    }, 300);
  },

  exportText() {
    const summary = ONC.AdvancedAnalytics.guardianSummary();

    return [
      `ESTUDE ONC — RELATÓRIO DO RESPONSÁVEL`,
      `Estudante: ${summary.student}`,
      ``,
      `Últimos 7 dias`,
      `Minutos estudados: ${summary.week.minutes}`,
      `Questões respondidas: ${summary.week.questions}`,
      `Precisão: ${summary.week.accuracy}%`,
      `Dias ativos: ${summary.week.activeDays}`,
      ``,
      `Domínio médio: ${summary.overview.averageMastery}%`,
      `Memória média: ${summary.overview.averageMemory}%`,
      `Conteúdos em atenção: ${summary.attentionCount}`,
      ``,
      summary.mainAttention
        ? `Principal atenção: ${summary.mainAttention.title} (${summary.mainAttention.discipline})`
        : `Principal atenção: nenhum alerta`,
      summary.priority[0]
        ? `Próximo passo: ${summary.priority[0].title} (${summary.priority[0].discipline})`
        : `Próximo passo: concluir a missão diária`
    ].join("\n");
  }
};
