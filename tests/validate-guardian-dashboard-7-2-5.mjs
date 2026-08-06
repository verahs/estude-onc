import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const state = {};
const context = { console, window: {}, document: {} };
context.window = context;

context.ONC = {
  Storage: {
    get(key, fallback) { return state[key] ?? fallback; },
    set(key, value) { state[key] = value; }
  },
  Users: { current: { name: "Responsável", role: "responsavel" } },
  Classroom: {
    currentId: "st-1",
    students: [{ id: "st-1", name: "Helena" }]
  },
  AdvancedAnalytics: {
    guardianSummary: () => ({
      week: { minutes: 45, questions: 12, accuracy: 75, activeDays: 3 },
      overview: { averageMastery: 60, averageMemory: 65, preparation: 62 }
    })
  },
  BehavioralDashboardEngine: {
    current: () => ({
      score: 70,
      level: { label: "Rotina em consolidação" },
      confidence: { label: "Média", score: 60 },
      priorities: [{ rank: 1, title: "Distribuir sessões", action: "Estudar em mais um dia", source: "Consistência" }],
      strengths: [{ title: "Boa distribuição", detail: "3 dias ativos", source: "Hábitos" }]
    })
  },
  PerformancePredictionEngine: {
    current: () => ({
      point: 68,
      lower: 58,
      upper: 78,
      confidence: { label: "Média", score: 60 },
      learning: { coverage: 50 },
      risks: []
    })
  },
  LearningCoach: {
    current: () => ({
      profile: { headline: "Prática tem bom resultado", strongestStrategy: null },
      confidence: { label: "Média", score: 55 },
      bestNextMethod: { label: "Revisão espaçada" },
      topics: []
    })
  },
  StudyHabitEngine: {
    current: () => ({ profile: { active7: 3 } })
  },
  DailyCoachEngine: {
    brief: () => ({ plan: [{ title: "Revisar Rotação", minutes: 5 }] })
  },
  ConsistencyCoach: {
    current: () => ({ plan: { targetDays: 4 } })
  },
  CognitiveFatigueCoach: {
    current: () => ({ recommendation: { mode: "continue", message: "Ritmo estável" } })
  }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/guardian-dashboard-engine.js"), "utf8"),
  context,
  { filename: "guardian-dashboard-engine.js" }
);

context.ONC.GuardianDashboardEngine.init();
const snapshot = context.ONC.GuardianDashboardEngine.current();

if (snapshot.student !== "Helena") throw new Error("Estudante incorreto.");
if (!snapshot.strengths.length) throw new Error("Pontos positivos ausentes.");
if (!snapshot.attention.length) throw new Error("Pontos de atenção ausentes.");
if (!snapshot.support.length) throw new Error("Orientações ausentes.");
if (!snapshot.disclaimer.includes("não deve ser usado para rotular")) throw new Error("Salvaguarda ausente.");
if (!context.ONC.GuardianDashboardEngine.exportText().includes("PAINEL DO RESPONSÁVEL")) throw new Error("Exportação inválida.");

console.log("Painel do Responsável validado.");
