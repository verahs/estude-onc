import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const state = {};
const library = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "data/misconceptions.json"), "utf8")
);

const context = {
  console,
  window: {},
  fetch: async () => ({ ok: true, json: async () => library }),
  document: { querySelectorAll: () => [] }
};
context.window = context;
context.ONC = {
  Storage: {
    get(key, fallback) { return state[key] ?? fallback; },
    set(key, value) { state[key] = value; }
  },
  Users: { current: { name: "Teste" } },
  Classroom: { currentId: "teste" },
  LearningEngine: {
    state: { events: [] },
    profile: () => ({
      attempts: 4,
      errors: 3,
      confidence: 55,
      averageResponseMs: 12000,
      forgettingCount: 0
    })
  },
  MasteryEngine: { get: () => ({ score: 35 }) },
  KnowledgeGraph: { prerequisites: () => [] },
  Attention: {
    findStudyTopic: () => ({
      id: "astronomia-rotacao",
      title: "Rotação",
      discipline: "Astronomia"
    })
  }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/diagnostic-engine.js"), "utf8"),
  context,
  { filename: "diagnostic-engine.js" }
);

await context.ONC.DiagnosticEngine.init();

const diagnosis = context.ONC.DiagnosticEngine.diagnose({
  id: "q1",
  subject: "Astronomia",
  topic: "Rotação",
  q: "Qual movimento explica o dia e a noite?",
  options: ["Translação", "Rotação", "Precessão", "Revolução"],
  answer: 1,
  explanation: "A rotação explica dias e noites."
}, 0, {
  errorType: "recurring",
  responseTimeMs: 12000
});

if (!diagnosis || diagnosis.correct || diagnosis.confidence <= 0) {
  throw new Error("Diagnóstico não foi produzido.");
}

if (!diagnosis.evidence.length || !diagnosis.intervention) {
  throw new Error("Diagnóstico não contém evidências e intervenção.");
}

const clusters = context.ONC.DiagnosticEngine.rootCauseClusters();
if (!clusters.length) {
  throw new Error("Agrupamento de causas não foi criado.");
}

console.log("Motor de diagnóstico validado.");
