import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const store = {};
const context = { console, window: {}, document: { getElementById: () => null } };
context.window = context;

context.ONC = {
  Storage: {
    get(key, fallback) { return store[key] ?? fallback; },
    set(key, value) { store[key] = value; }
  },
  Users: { current: { name: "Helena" } },
  Classroom: { currentId: "helena" },
  BadgeRuleEngine: {
    summary: () => ({
      rules: [
        {
          ruleId: "newton", title: "Newton", category: "aprendizagem",
          description: "Física completa", evidence: "80%", percent: 80,
          current: 80, target: 100, icon: "⚙️", unlocked: null
        },
        {
          ruleId: "persistencia", title: "Persistência", category: "comportamento",
          description: "7 dias", evidence: "7/7", percent: 100,
          current: 7, target: 7, icon: "🔥",
          unlocked: { unlockedAt: "2026-08-05T10:00:00Z" }
        },
        {
          ruleId: "fenix", title: "Fênix", category: "recuperacao",
          description: "Recuperação", evidence: "100%", percent: 100,
          current: 100, target: 100, icon: "🔥",
          unlocked: { unlockedAt: "2026-08-04T10:00:00Z" }
        },
        {
          ruleId: "segredo", title: "Segredo Real", category: "secreta",
          description: "Critério secreto", evidence: "???", percent: 40,
          current: 40, target: 100, icon: "◆", unlocked: null
        }
      ]
    })
  },
  SecretDiscoveryEngine: {
    summary: () => ({
      items: [{ ruleId: "segredo", hint: { text: "Algo incomum começou." } }]
    })
  }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/badge-collection-engine.js"), "utf8"),
  context,
  { filename: "badge-collection-engine.js" }
);

context.ONC.BadgeCollectionEngine.init();
let summary = context.ONC.BadgeCollectionEngine.summary();

if (summary.total !== 4) throw new Error("Total incorreto.");
if (summary.unlocked !== 2) throw new Error("Conquistas incorretas.");
if (!summary.categories.length) throw new Error("Categorias ausentes.");

const secret = context.ONC.BadgeCollectionEngine.allItems().find(item => item.id === "segredo");
if (secret.title !== "Medalha secreta") throw new Error("Spoiler de medalha secreta.");
if (secret.evidence !== "Algo incomum começou.") throw new Error("Dica secreta ausente.");

context.ONC.BadgeCollectionEngine.setFilter("category", "aprendizagem");
summary = context.ONC.BadgeCollectionEngine.summary();
if (summary.filtered.length !== 1 || summary.filtered[0].id !== "newton") {
  throw new Error("Filtro por categoria inválido.");
}

context.ONC.BadgeCollectionEngine.toggleFavorite("newton");
if (!context.ONC.BadgeCollectionEngine.state.favorites.includes("newton")) {
  throw new Error("Favorito não persistido.");
}

console.log("Coleção de Medalhas validada.");
