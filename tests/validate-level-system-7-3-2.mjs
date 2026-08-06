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
    state: { totalXP: 760 }
  },
  Notifications: { announce() {} }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/level-system.js"), "utf8"),
  context,
  { filename: "level-system.js" }
);

context.ONC.LevelSystem.init();
const summary = context.ONC.LevelSystem.summary();

if (summary.current.title !== "Pesquisador") {
  throw new Error(`Nível incorreto: ${summary.current.title}`);
}
if (summary.progress.percent < 0 || summary.progress.percent > 100) {
  throw new Error("Progresso inválido.");
}
if (!summary.unlockedLevels.includes("pesquisador")) {
  throw new Error("Nível atual não foi desbloqueado.");
}
if (!context.ONC.LevelSystem.claimReward("pesquisador")) {
  throw new Error("Recompensa não foi resgatada.");
}
if (context.ONC.LevelSystem.claimReward("pesquisador")) {
  throw new Error("Recompensa duplicada foi aceita.");
}
if (!summary.disclaimer.includes("Não equivalem a nota")) {
  throw new Error("Salvaguarda ausente.");
}

console.log("Sistema de Níveis validado.");
