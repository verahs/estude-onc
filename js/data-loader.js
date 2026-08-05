window.ONC_DATA = window.ONC_DATA || {};

window.ONC_DATA_READY = (async function loadOncData() {
  const response = await fetch("./data/manifest.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível carregar o manifesto de dados.");
  const manifest = await response.json();

  const subjectPayloads = await Promise.all(
    manifest.subjects.map(async item => {
      const r = await fetch(`./data/${item.file}`, { cache: "no-store" });
      if (!r.ok) throw new Error(`Falha ao carregar ${item.file}.`);
      return r.json();
    })
  );

  const [questionsData, recurrenceData, visualsData, legacyData] = await Promise.all([
    fetch(`./data/${manifest.questions}`, { cache: "no-store" }).then(r => r.json()),
    fetch(`./data/${manifest.recurrence}`, { cache: "no-store" }).then(r => r.json()),
    fetch(`./data/${manifest.visuals}`, { cache: "no-store" }).then(r => r.json()),
    fetch(`./data/${manifest.legacyContent}`, { cache: "no-store" }).then(r => r.json())
  ]);

  ONC_DATA.subjects = subjectPayloads.map(item => ({
    name: item.discipline,
    icon: item.icon,
    groups: item.groups
  }));

  ONC_DATA.structuredStudy = {};
  subjectPayloads.forEach(item => {
    Object.entries(item.topics).forEach(([topic, content]) => {
      ONC_DATA.structuredStudy[`${item.discipline}||${topic}`] = content;
    });
  });

  ONC_DATA.questions = questionsData.questions;
  ONC_DATA.recurrenceRanking = recurrenceData.ranking;
  ONC_DATA.visualTopics = visualsData.visualTopics;
  ONC_DATA.richContent = legacyData.richContent;

  return manifest;
})();
