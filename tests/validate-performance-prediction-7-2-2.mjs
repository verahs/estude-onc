import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const state = {
  onc_quiz_history: [
    { pct: 70, total: 10, hits: 7, subject: "Astronomia" },
    { pct: 80, total: 10, hits: 8, subject: "Astronomia" },
    { pct: 60, total: 10, hits: 6, subject: "Física" }
  ]
};

const context = { console, window: {}, document: { getElementById: () => null } };
context.window = context;
context.ONC = {
  Storage: {
    get(key, fallback) { return state[key] ?? fallback; },
    set(key, value) { state[key] = value; }
  },
  Users: { current: { name: "Helena" } },
  Classroom: { currentId: "helena" },
  LearningAnalyticsEngine: {
    overview: () => ({
      averageMastery: 58,
      averageMemory: 62,
      coverage: 48,
      preparation: 55
    }),
    subjects: () => [
      { name: "Astronomia", average: 70, memoryAverage: 68, coverage: 60 },
      { name: "Física", average: 42, memoryAverage: 50, coverage: 35 }
    ]
  },
  LearningEngine: {
    allProfiles: () => [
      { attempts: 4, confidence: 55, recentAccuracy: 70, consistency: 65 },
      { attempts: 5, confidence: 62, recentAccuracy: 60, consistency: 70 }
    ]
  },
  DailyCoachEngine: {
    brief: () => ({
      plan: [
        { minutes: 5, score: 80 },
        { minutes: 7, score: 65 }
      ]
    })
  }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/performance-prediction-engine.js"), "utf8"),
  context,
  { filename: "performance-prediction-engine.js" }
);

context.ONC.PerformancePredictionEngine.init();
const prediction = context.ONC.PerformancePredictionEngine.current();

if (prediction.point < 0 || prediction.point > 100) {
  throw new Error("Estimativa fora do intervalo.");
}
if (prediction.lower > prediction.point || prediction.upper < prediction.point) {
  throw new Error("Faixa não contém a estimativa central.");
}
if (!prediction.disclaimer.includes("Não representa nota oficial")) {
  throw new Error("Salvaguarda ausente.");
}
if (!prediction.subjects.length || !prediction.scenario) {
  throw new Error("Predições por disciplina ou cenário ausentes.");
}

console.log("Predição de Desempenho validada.");
