window.ONC_DATA = window.ONC_DATA || {};

window.ONC_DATA_READY = (async function loadOncData() {
  const fetchJson = async (path, label) => {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Falha ao carregar ${label}: ${response.status} ${response.statusText}`);
    }
    return response.json();
  };

  const manifest = await fetchJson("./data/manifest.json?v=3.0-sprint-2-hotfix-1", "o manifesto");

  if (!manifest.catalog || !manifest.questions || !manifest.recurrence || !manifest.legacyContent) {
    throw new Error("O manifesto está incompleto ou desatualizado.");
  }

  const [catalog, questionsData, recurrenceData, legacyData] = await Promise.all([
    fetchJson(`./data/${manifest.catalog}?v=3.0-sprint-2-hotfix-1`, "o catálogo de conteúdos"),
    fetchJson(`./data/${manifest.questions}?v=3.0-sprint-2-hotfix-1`, "o banco de questões"),
    fetchJson(`./data/${manifest.recurrence}?v=3.0-sprint-2-hotfix-1`, "os dados de recorrência"),
    fetchJson(`./data/${manifest.legacyContent}?v=3.0-sprint-2-hotfix-1`, "os conteúdos legados")
  ]);

  if (!Array.isArray(catalog.subjects)) {
    throw new Error("O catálogo não possui uma lista válida de disciplinas.");
  }

  ONC_DATA.catalog = catalog;
  ONC_DATA.subjects = catalog.subjects;
  ONC_DATA.questions = Array.isArray(questionsData.questions) ? questionsData.questions : [];
  ONC_DATA.recurrenceRanking = Array.isArray(recurrenceData.ranking) ? recurrenceData.ranking : [];
  ONC_DATA.richContent = legacyData.richContent || {};

  return manifest;
})();