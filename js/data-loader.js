window.ONC_DATA = window.ONC_DATA || {};

window.ONC_DATA_READY = (async function loadOncData() {
  const fetchJson = async (path, label) => {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Falha ao carregar ${label}.`);
    return response.json();
  };

  const manifest = await fetchJson("./data/manifest.json", "o manifesto");
  const [catalog, questionsData, recurrenceData, legacyData] = await Promise.all([
    fetchJson(`./data/${manifest.catalog}`, "o catálogo de conteúdos"),
    fetchJson(`./data/${manifest.questions}`, "o banco de questões"),
    fetchJson(`./data/${manifest.recurrence}`, "os dados de recorrência"),
    fetchJson(`./data/${manifest.legacyContent}`, "os conteúdos legados")
  ]);

  ONC_DATA.catalog = catalog;
  ONC_DATA.subjects = catalog.subjects;
  ONC_DATA.questions = questionsData.questions;
  ONC_DATA.recurrenceRanking = recurrenceData.ranking;
  ONC_DATA.richContent = legacyData.richContent;

  return manifest;
})();
