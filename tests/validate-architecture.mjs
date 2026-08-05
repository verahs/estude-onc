import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const root = process.cwd();
const context = {
  console,
  window: {},
  document: {
    querySelectorAll: () => [],
    getElementById: () => null
  },
  ONC_DATA: {
    subjects: [
      { name: "Astronomia", icon: "🔭", groups: [] },
      { name: "Biologia", icon: "🧬", groups: [] }
    ],
    questions: []
  }
};

context.window = context;
context.window.ONC_DATA = context.ONC_DATA;
context.window.ONC = {
  Study: { progress: {} },
  StudyTools: { state: { topicVisits: {}, reviews: {} } },
  StudyHistory: { topicSessions: () => [] },
  Attention: { attempts: {}, evaluate: () => null },
  Storage: { get: (_, fallback) => fallback }
};

vm.createContext(context);

const files = [
  "js/memory-engine.js",
  "js/mastery-engine.js",
  "js/priority-engine.js",
  "js/learning-analytics-engine.js",
  "js/assessment-engine.js",
  "js/tutor-engine.js",
  "js/architecture-diagnostics.js"
];

for (const file of files) {
  const code = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInContext(code, context, { filename: file });
}

context.ONC.MasteryEngine.topicIndex = [
  { id: "a", title: "Tema A", discipline: "Astronomia", recurrence: 10 },
  { id: "b", title: "Tema B", discipline: "Biologia", recurrence: 5 }
];
context.ONC.PriorityEngine.topicIndex = context.ONC.MasteryEngine.topicIndex;
context.ONC.MemoryEngine.init();
context.ONC.MasteryEngine.refresh();
context.ONC.PriorityEngine.init = () => {};
context.ONC.LearningAnalyticsEngine.init();

const summary = context.ONC.LearningAnalyticsEngine.subjectSummary("Astronomia");
if (!summary || summary.total !== 1) {
  throw new Error("subjectSummary não retornou o total esperado.");
}

if (typeof context.ONC.MasteryEngine.disciplineSummary !== "function") {
  throw new Error("Contrato MasteryEngine.disciplineSummary ausente.");
}

const diagnostic = context.ONC.ArchitectureDiagnostics.validate();
if (!diagnostic.ok) {
  throw new Error(`Contratos ausentes: ${diagnostic.failures.join(", ")}`);
}

console.log("Contratos de arquitetura validados.");
