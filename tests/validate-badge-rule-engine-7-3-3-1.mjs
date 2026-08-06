import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const store = {};
const context = {
  console,
  window: {},
  document: {
    getElementById: () => null
  }
};
context.window = context;

context.ONC = {
  Storage: {
    get(key, fallback) { return store[key] ?? fallback; },
    set(key, value) { store[key] = value; }
  },
  Users: { current: { name: "Helena" } },
  Classroom: { currentId: "helena" },
  IntelligentXPEngine: {
    state: {
      totalXP: 300,
      ledger: [
        { category: "learning", metadata: { bonuses: [] } },
        { category: "review", metadata: { bonuses: [] } }
      ]
    }
  },
  LevelSystem: {
    levels: [
      { key: "explorador" },
      { key: "aprendiz" }
    ],
    summary: () => ({ current: { key: "aprendiz", title: "Aprendiz" } })
  },
  StudyHabitEngine: {
    current: () => ({ profile: { streak: 3, active30: 5 } })
  },
  NavigationHistory: {
    state: {
      events: [
        { type: "open", source: "mission" },
        { type: "open", source: "review" },
        { type: "open", source: "diagnostic" },
        { type: "open", source: "favorite" }
      ]
    }
  }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/badge-rule-engine.js"), "utf8"),
  context,
  { filename: "badge-rule-engine.js" }
);

context.ONC.BadgeRuleEngine.init();
const summary = context.ONC.BadgeRuleEngine.summary();

if (summary.totalRules < 6) throw new Error("Catálogo inicial incompleto.");
if (!context.ONC.BadgeRuleEngine.isUnlocked("primeiro-passo")) {
  throw new Error("Primeiro Passo não desbloqueado.");
}
if (!context.ONC.BadgeRuleEngine.isUnlocked("consistencia-inicial")) {
  throw new Error("Consistência Inicial não desbloqueada.");
}
if (!context.ONC.BadgeRuleEngine.isUnlocked("nivel-aprendiz")) {
  throw new Error("Ascensão Aprendiz não desbloqueada.");
}

const countBefore = context.ONC.BadgeRuleEngine.unlockedList().length;
context.ONC.BadgeRuleEngine.evaluateAll("repeat");
const countAfter = context.ONC.BadgeRuleEngine.unlockedList().length;

if (countAfter !== countBefore) throw new Error("Desbloqueio duplicado.");
if (!summary.disclaimer.includes("não equivalem a nota")) throw new Error("Salvaguarda ausente.");

console.log("Motor de Regras de Medalhas validado.");
