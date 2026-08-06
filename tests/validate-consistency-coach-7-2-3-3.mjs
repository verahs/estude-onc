import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const state = {};
const context = { console, window: {}, document: { getElementById: () => null } };
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
        active7: 2,
        active14: 5,
        active30: 9,
        consistency: 48,
        streak: 1,
        sessions: { averageMinutes: 12 }
      },
      days: [
        { active: true, events: 8 },
        { active: false, events: 0 },
        { active: true, events: 2 }
      ]
    })
  },
  StudyHistory: {
    state: {
      topicEvents: [
        { timestamp: new Date().toISOString(), discipline: "Astronomia" },
        { timestamp: new Date().toISOString(), discipline: "Astronomia" }
      ],
      questionAttempts: [
        { timestamp: new Date().toISOString(), subject: "Física" }
      ]
    }
  },
  LearningAnalyticsEngine: {
    subjects: () => [
      { name: "Astronomia", average: 70, coverage: 60 },
      { name: "Física", average: 40, coverage: 30 },
      { name: "Biologia", average: 50, coverage: 20 }
    ]
  }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/consistency-coach.js"), "utf8"),
  context,
  { filename: "consistency-coach.js" }
);

context.ONC.ConsistencyCoach.init();
const analysis = context.ONC.ConsistencyCoach.current();

if (analysis.score < 0 || analysis.score > 100) throw new Error("Índice inválido.");
if (!analysis.plan.actions.length) throw new Error("Plano ausente.");
if (!analysis.signals.length) throw new Error("Sinais ausentes.");
if (!analysis.disclaimer.includes("Não avalia disciplina pessoal")) throw new Error("Salvaguarda ausente.");

console.log("Coach de Consistência validado.");
