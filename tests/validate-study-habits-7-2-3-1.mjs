import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const now = new Date();
const isoDaysAgo = (days, hour = 17) => {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

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
  StudyHistory: {
    state: {
      topicEvents: [
        { timestamp: isoDaysAgo(0), discipline: "Física", metadata: { durationSeconds: 600 } },
        { timestamp: isoDaysAgo(2), discipline: "Astronomia", metadata: { durationSeconds: 480 } },
        { timestamp: isoDaysAgo(4), discipline: "Biologia", metadata: { durationSeconds: 420 } }
      ],
      questionAttempts: [
        { timestamp: isoDaysAgo(0, 18), subject: "Física" },
        { timestamp: isoDaysAgo(2, 17), subject: "Astronomia" }
      ],
      quizResults: [],
      sessions: [
        { timestamp: isoDaysAgo(0), seconds: 600, discipline: "Física" },
        { timestamp: isoDaysAgo(2), seconds: 480, discipline: "Astronomia" },
        { timestamp: isoDaysAgo(4), seconds: 420, discipline: "Biologia" }
      ]
    }
  },
  NavigationHistory: {
    state: { events: [] }
  }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/study-habit-engine.js"), "utf8"),
  context,
  { filename: "study-habit-engine.js" }
);

context.ONC.StudyHabitEngine.init();
const analysis = context.ONC.StudyHabitEngine.current();

if (analysis.profile.active7 < 3) {
  throw new Error("Dias ativos não foram detectados.");
}
if (analysis.profile.preferred.hour === null) {
  throw new Error("Horário preferencial não foi calculado.");
}
if (analysis.profile.sessions.averageMinutes <= 0) {
  throw new Error("Duração média inválida.");
}
if (!analysis.disclaimer.includes("Não constituem diagnóstico")) {
  throw new Error("Salvaguarda ausente.");
}

console.log("Detector de Hábitos de Estudo validado.");
