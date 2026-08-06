import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const now = new Date();
const events = [
  { correct: true, responseTimeMs: 12000, timestamp: new Date(now - 20 * 60000).toISOString() },
  { correct: true, responseTimeMs: 13000, timestamp: new Date(now - 18 * 60000).toISOString() },
  { correct: true, responseTimeMs: 14000, timestamp: new Date(now - 16 * 60000).toISOString() },
  { correct: false, responseTimeMs: 23000, timestamp: new Date(now - 8 * 60000).toISOString() },
  { correct: false, responseTimeMs: 25000, timestamp: new Date(now - 6 * 60000).toISOString() },
  { correct: false, responseTimeMs: 7000, timestamp: new Date(now - 4 * 60000).toISOString() }
];

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
  LearningEngine: { state: { events } },
  StudyHistory: {
    state: {
      sessions: [
        { timestamp: new Date(now - 30 * 60000).toISOString(), seconds: 2100 }
      ]
    }
  },
  NavigationHistory: {
    state: { events: [] }
  },
  LearningAnalyticsEngine: {
    nextReview: () => null
  }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/cognitive-fatigue-coach.js"), "utf8"),
  context,
  { filename: "cognitive-fatigue-coach.js" }
);

context.ONC.CognitiveFatigueCoach.init();
const analysis = context.ONC.CognitiveFatigueCoach.current();

if (analysis.score <= 0) throw new Error("Índice não detectou carga.");
if (analysis.windows.accuracyDrop <= 0) throw new Error("Queda de precisão não detectada.");
if (!analysis.signals.length) throw new Error("Sinais ausentes.");
if (!analysis.disclaimer.includes("Não diagnostica fadiga")) throw new Error("Salvaguarda ausente.");

console.log("Coach de Fadiga Cognitiva validado.");
