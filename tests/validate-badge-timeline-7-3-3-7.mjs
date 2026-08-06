import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const store = {};
const context = { console, window: {} };
context.window = context;

const items = [
  {
    id: "a", title: "Newton", category: "aprendizagem",
    categoryLabel: "Aprendizagem", icon: "⚙️", evidence: "Física",
    unlocked: true, unlockedAt: "2026-08-01T10:00:00Z", rarity: "comum"
  },
  {
    id: "b", title: "Persistência", category: "comportamento",
    categoryLabel: "Comportamento", icon: "🔥", evidence: "7 dias",
    unlocked: true, unlockedAt: "2026-08-02T11:00:00Z", rarity: "rara"
  },
  {
    id: "c", title: "Fênix", category: "recuperacao",
    categoryLabel: "Recuperação", icon: "🔥", evidence: "20 para 95",
    unlocked: true, unlockedAt: "2026-08-02T12:00:00Z", rarity: "rara"
  },
  {
    id: "d", title: "Segredo", category: "secreta",
    categoryLabel: "Secretas", icon: "◆", evidence: "Descoberta",
    unlocked: true, unlockedAt: "2026-08-03T09:00:00Z", rarity: "lendaria"
  },
  {
    id: "e", title: "Darwin", category: "aprendizagem",
    categoryLabel: "Aprendizagem", icon: "🌿", evidence: "Biologia",
    unlocked: true, unlockedAt: "2026-08-04T10:00:00Z", rarity: "comum"
  }
];

context.ONC = {
  Storage: {
    get(key, fallback) { return store[key] ?? fallback; },
    set(key, value) { store[key] = value; }
  },
  Users: { current: { name: "Helena" } },
  Classroom: { currentId: "helena", students: [] },
  BadgeCollectionEngine: {
    allItems: () => items,
    categories: () => [
      { key: "aprendizagem", total: 2, unlocked: 2 },
      { key: "comportamento", total: 1, unlocked: 1 },
      { key: "recuperacao", total: 1, unlocked: 1 },
      { key: "secreta", total: 1, unlocked: 1 }
    ]
  }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/badge-timeline-engine.js"), "utf8"),
  context,
  { filename: "badge-timeline-engine.js" }
);

context.ONC.BadgeTimelineEngine.init();
let summary = context.ONC.BadgeTimelineEngine.summary();

if (summary.total !== 5) throw new Error("Total incorreto.");
if (summary.days.length !== 4) throw new Error("Agrupamento diário inválido.");
if (!summary.milestones.some(item => item.title === "5 medalhas conquistadas")) {
  throw new Error("Marco de cinco medalhas ausente.");
}
if (!summary.milestones.some(item => item.title === "Primeira descoberta secreta")) {
  throw new Error("Marco secreto ausente.");
}

context.ONC.BadgeTimelineEngine.setFilter("category", "aprendizagem");
summary = context.ONC.BadgeTimelineEngine.summary();
if (summary.filteredTotal !== 2) throw new Error("Filtro por categoria inválido.");

context.ONC.BadgeTimelineEngine.setFilter("sort", "oldest");
summary = context.ONC.BadgeTimelineEngine.summary();
if (summary.events[0].id !== "a") throw new Error("Ordenação antiga inválida.");

if (!context.ONC.BadgeTimelineEngine.exportText().includes("LINHA DO TEMPO")) {
  throw new Error("Exportação inválida.");
}

console.log("Linha do Tempo de Medalhas validada.");
