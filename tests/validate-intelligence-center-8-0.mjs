import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const store = {};
const fakeClassList = () => ({
  add() {}, remove() {}, toggle() {}, contains() { return false; }
});

const context = {
  console,
  location: { hash: "" },
  history: { replaceState() {} },
  document: {
    documentElement: { dataset: {} },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    getElementById() { return null; },
    addEventListener() {},
    activeElement: { tagName: "BODY" }
  },
  window: {}
};
context.window = context;

context.ONC = {
  Storage: {
    get(key, fallback) {
      return store[key] ? JSON.parse(JSON.stringify(store[key])) : fallback;
    },
    set(key, value) {
      store[key] = JSON.parse(JSON.stringify(value));
    }
  },
  Users: { current: { name: "Helena" } },
  Classroom: { currentId: "helena" }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/intelligence-center-8-0.js"), "utf8"),
  context,
  { filename: "intelligence-center-8-0.js" }
);

const center = context.ONC.IntelligenceCenter;
center.load();

if (center.modules.length !== 7) throw new Error("Arquitetura de módulos incompleta.");
for (const key of ["dashboard","learning","ai","badges","evolution","guardian","system"]) {
  if (!center.modules.some(item => item.key === key)) {
    throw new Error(`Módulo ausente: ${key}`);
  }
}

center.state.activeModule = "badges";
center.state.favorites.push("learning");
center.save();
center.state.activeModule = "dashboard";
center.state.favorites = [];
center.load();

if (center.state.activeModule !== "badges") throw new Error("Último módulo não persistido.");
if (!center.state.favorites.includes("learning")) throw new Error("Favoritos não persistidos.");

center.toggleTheme();
if (center.state.theme !== "dark") throw new Error("Tema escuro não ativado.");

if (center.moduleForNode({id:"badgeCollectionReport",className:"card"}) !== "badges") {
  throw new Error("Classificação de medalhas inválida.");
}
if (center.moduleForNode({id:"dailyCoachReport",className:"card"}) !== "ai") {
  throw new Error("Classificação de IA inválida.");
}
if (center.moduleForNode({id:"guardianDashboardReport",className:"card"}) !== "guardian") {
  throw new Error("Classificação do responsável inválida.");
}

console.log("Central de Inteligência validada.");
