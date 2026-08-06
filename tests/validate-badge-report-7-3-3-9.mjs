import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const store = {};
const items = [
  {
    id: "a", title: "Newton", category: "aprendizagem",
    categoryLabel: "Aprendizagem", icon: "⚙️",
    evidence: "Física completa", percent: 100,
    unlocked: true, unlockedAt: "2026-08-01T10:00:00Z", rarity: "rara"
  },
  {
    id: "b", title: "Darwin", category: "aprendizagem",
    categoryLabel: "Aprendizagem", icon: "🌿",
    evidence: "80%", percent: 80, unlocked: false, rarity: "comum"
  },
  {
    id: "c", title: "Persistência", category: "comportamento",
    categoryLabel: "Comportamento", icon: "🔥",
    evidence: "7 dias", percent: 100,
    unlocked: true, unlockedAt: "2026-08-02T10:00:00Z", rarity: "comum"
  },
  {
    id: "d", title: "Fênix", category: "recuperacao",
    categoryLabel: "Recuperação", icon: "🔥",
    evidence: "20 para 95", percent: 100,
    unlocked: true, unlockedAt: "2026-08-03T10:00:00Z", rarity: "lendaria"
  },
  {
    id: "e", title: "Segredo", category: "secreta",
    categoryLabel: "Secretas", icon: "◆",
    evidence: "Descoberta", percent: 100,
    unlocked: true, unlockedAt: "2026-08-04T10:00:00Z", rarity: "mitica"
  }
];

const context = { console, window: {}, document: {} };
context.window = context;

context.ONC = {
  Storage: {
    get(key, fallback) { return store[key] ?? fallback; },
    set(key, value) { store[key] = value; }
  },
  Users: { current: { name: "Helena" } },
  Classroom: { currentId: "helena", students: [] },
  BadgeCollectionEngine: {
    allItems: () => items,
    categoryLabel: category => ({
      aprendizagem: "Aprendizagem",
      comportamento: "Comportamento",
      recuperacao: "Recuperação",
      secreta: "Secretas"
    })[category]
  },
  BadgeTimelineEngine: {
    monthlyEvolution: () => [
      { key: "2026-07", total: 2 },
      { key: "2026-08", total: 4 }
    ],
    summary: () => ({
      milestones: [{ title: "Primeira conquista" }]
    })
  },
  IntelligentNotificationEngine: {
    summary: () => ({ total: 2, unread: 1 })
  }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/badge-report-engine.js"), "utf8"),
  context,
  { filename: "badge-report-engine.js" }
);

context.ONC.BadgeReportEngine.init();
let report = context.ONC.BadgeReportEngine.current();

if (report.overview.total !== 5) throw new Error("Total incorreto.");
if (report.overview.unlocked !== 4) throw new Error("Conquistas incorretas.");
if (!report.categories.length) throw new Error("Categorias ausentes.");
if (!report.recent.length) throw new Error("Conquistas recentes ausentes.");
if (!report.nearest.length || report.nearest[0].id !== "b") {
  throw new Error("Próxima medalha incorreta.");
}
if (!report.rare.length || report.rare[0].id !== "e") {
  throw new Error("Raridade incorreta.");
}
if (report.trend.direction !== "rising") throw new Error("Tendência incorreta.");

context.ONC.BadgeReportEngine.setFilter("category", "aprendizagem");
report = context.ONC.BadgeReportEngine.current();
if (report.overview.total !== 2) throw new Error("Filtro por categoria inválido.");

if (!context.ONC.BadgeReportEngine.exportText().includes("RELATÓRIO DE MEDALHAS")) {
  throw new Error("Exportação inválida.");
}

if (!report.disclaimer.includes("não representa nota")) {
  throw new Error("Salvaguarda ausente.");
}

console.log("Relatório de Medalhas validado.");
