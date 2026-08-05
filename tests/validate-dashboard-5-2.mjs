import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const root = process.cwd();

const context = {
  console,
  window: {},
  document: {
    getElementById: () => null
  },
  ONC_DATA: {
    subjects: [
      { name: "Astronomia", icon: "🔭" },
      { name: "Biologia", icon: "🧬" }
    ]
  }
};

context.window = context;
context.window.ONC_DATA = context.ONC_DATA;
context.window.ONC = {
  Users: { current: { name: "Teste", role: "aluno" } },
  StudyHistory: {
    state: {
      sessions: [],
      topicEvents: [],
      questionAttempts: []
    }
  },
  LearningAnalyticsEngine: {
    overview: () => ({
      averageMastery: 20,
      averageMemory: 80
    }),
    subjects: () => [
      { name: "Astronomia", icon: "🔭", average: 30, memoryAverage: 80, coverage: 20 },
      { name: "Biologia", icon: "🧬", average: 10, memoryAverage: 70, coverage: 10 }
    ],
    priorityTopics: () => [
      { title: "Atmosfera", discipline: "Astronomia" }
    ]
  },
  Attention: {
    allAlerts: () => []
  }
};

vm.createContext(context);

for (const file of ["js/advanced-analytics.js", "js/guardian-report.js"]) {
  const code = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInContext(code, context, { filename: file });
}

context.ONC.AdvancedAnalytics.init();

const week = context.ONC.AdvancedAnalytics.weeklySummary();
if (!week || week.activeDays !== 0) {
  throw new Error("Resumo semanal inválido.");
}

const radar = context.ONC.AdvancedAnalytics.radarData();
if (radar.length !== 2) {
  throw new Error("Radar não retornou as disciplinas esperadas.");
}

const guardian = context.ONC.AdvancedAnalytics.guardianSummary();
if (guardian.student !== "Teste") {
  throw new Error("Painel do responsável não retornou o estudante.");
}

console.log("Dashboard avançado validado.");
