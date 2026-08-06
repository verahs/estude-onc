import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const now = new Date();
const hoursAgo = hours => new Date(now.getTime() - hours * 3600000).toISOString();
const daysAgo = days => new Date(now.getTime() - days * 86400000).toISOString();

const state = {};
const context = { console, window: {}, document: {} };
context.window = context;

context.ONC = {
  Storage: {
    get(key, fallback) { return state[key] ?? fallback; },
    set(key, value) { state[key] = value; }
  },
  Users: { current: { name: "Helena" } },
  Classroom: { currentId: "helena" },
  MissionEngine: {
    mission: {
      generatedAt: hoursAgo(10),
      tasks: [
        { id: "t1", title: "Revisar Rotação", topicId: "rotacao", estimatedMinutes: 3, completed: false },
        { id: "t2", title: "Questões", estimatedMinutes: 8, completed: true }
      ]
    }
  },
  MasteryEngine: {
    topicIndex: [
      { id: "rotacao", title: "Rotação", discipline: "Astronomia" },
      { id: "forca", title: "Força", discipline: "Física" }
    ]
  },
  MemoryEngine: {
    status(id) {
      return id === "rotacao"
        ? { due: true, forget: 80, nextReview: new Date() }
        : { due: false, forget: 20, nextReview: new Date() };
    }
  },
  NavigationHistory: {
    state: {
      events: [
        { type: "open", topicId: "rotacao", source: "mission", timestamp: hoursAgo(2) },
        { type: "pause", topicId: "rotacao", source: "mission", durationSeconds: 30, timestamp: hoursAgo(1.9) },
        { type: "open", topicId: "forca", source: "mission", timestamp: hoursAgo(1.8) }
      ]
    }
  },
  StudyHistory: {
    state: {
      topicEvents: [{ timestamp: daysAgo(4) }],
      questionAttempts: [],
      quizResults: []
    }
  },
  StudyHabitEngine: {
    current: () => ({ profile: { active7: 1 } })
  },
  RecommendationEngine: {
    next: () => ({ topicId: "rotacao", title: "Rotação" })
  }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/procrastination-detector.js"), "utf8"),
  context,
  { filename: "procrastination-detector.js" }
);

context.ONC.ProcrastinationDetector.init();
const analysis = context.ONC.ProcrastinationDetector.current();

if (analysis.score <= 0) throw new Error("Índice não detectou sinais.");
if (!analysis.signals.length) throw new Error("Sinais ausentes.");
if (!analysis.nextAction) throw new Error("Menor próxima ação ausente.");
if (!analysis.disclaimer.includes("Não diagnostica")) throw new Error("Salvaguarda ausente.");

console.log("Detector de Procrastinação validado.");
