import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const state = {};
const context = { console, window: {} };
context.window = context;

context.ONC = {
  Storage: {
    get(key, fallback) { return state[key] ?? fallback; },
    set(key, value) { state[key] = value; }
  },
  Users: { current: { name: "Helena" } },
  Classroom: { currentId: "helena" },
  StudyHabitEngine: {
    current: () => ({
      profile: {
        consistency: 65,
        active7: 3,
        streak: 2,
        sessions: { averageMinutes: 12 }
      },
      evidence: { totalEvents: 20 },
      signals: [
        { level: "positive", title: "Boa distribuição semanal", message: "3 dias ativos" }
      ]
    })
  },
  ProcrastinationDetector: {
    current: () => ({
      score: 35,
      confidence: { score: 60 },
      metrics: {
        mission: { pending: 1 },
        overdue: []
      },
      signals: [
        { severity: "medium", title: "Tarefa pendente", evidence: "1 tarefa", intervention: "Concluir menor tarefa" }
      ]
    })
  },
  ConsistencyCoach: {
    current: () => ({
      score: 62,
      balance: 70,
      plan: { actions: [] },
      signals: []
    })
  },
  CognitiveFatigueCoach: {
    current: () => ({
      score: 20,
      confidence: { score: 55 },
      signals: []
    })
  }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/behavioral-dashboard-engine.js"), "utf8"),
  context,
  { filename: "behavioral-dashboard-engine.js" }
);

context.ONC.BehavioralDashboardEngine.init();
const snapshot = context.ONC.BehavioralDashboardEngine.current();

if (snapshot.score < 0 || snapshot.score > 100) throw new Error("Índice inválido.");
if (!snapshot.priorities.length) throw new Error("Prioridades ausentes.");
if (!snapshot.disclaimer.includes("Não avalia personalidade")) throw new Error("Salvaguarda ausente.");
if (!Number.isFinite(snapshot.health.consistency)) throw new Error("Dimensões ausentes.");

console.log("Painel Comportamental validado.");
