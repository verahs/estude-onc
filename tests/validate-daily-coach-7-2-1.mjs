import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const state = {};
const context = {
  console,
  window: {},
  document: {
    getElementById: () => null
  },
  setTimeout
};
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
      topicEvents: [],
      questionAttempts: [],
      sessions: []
    },
    recordTopicEvent() {}
  },
  NavigationHistory: {
    analytics: () => ({
      opens: 0,
      completes: 0,
      completionRate: 0,
      averageSeconds: 0
    })
  },
  AdvancedAnalytics: {
    weeklySummary: () => ({
      questions: 8,
      minutes: 30,
      activeDays: 3,
      accuracy: 75
    })
  },
  LearningAnalyticsEngine: {
    overview: () => ({ mastered: 2 }),
    subjects: () => [
      { name: "Astronomia", average: 70 },
      { name: "Física", average: 35 }
    ]
  },
  LearningEngine: {
    state: { events: [] }
  },
  RecommendationEngine: {
    rank: () => [
      {
        topicId: "fisica-forcas",
        title: "Forças",
        discipline: "Física",
        action: "review",
        score: 82,
        confidence: 60,
        reasons: ["erro recente", "retenção em risco"]
      },
      {
        topicId: "astronomia-rotacao",
        title: "Rotação",
        discipline: "Astronomia",
        action: "practice",
        score: 64,
        confidence: 55,
        reasons: ["domínio em consolidação"]
      }
    ]
  }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/daily-coach-engine.js"), "utf8"),
  context,
  { filename: "daily-coach-engine.js" }
);

context.ONC.DailyCoachEngine.init();
const brief = context.ONC.DailyCoachEngine.brief();

if (!brief || !brief.plan.length) {
  throw new Error("Coach não gerou plano diário.");
}

if (brief.plan.reduce((sum, item) => sum + item.minutes, 0) > brief.availableMinutes + 6) {
  throw new Error("Plano excedeu de forma indevida o tempo disponível.");
}

if (!brief.message || !brief.impact.note.includes("não corresponde")) {
  throw new Error("Coach não apresentou orientação ou salvaguarda de impacto.");
}

context.ONC.DailyCoachEngine.setAvailableMinutes(5);
const shortBrief = context.ONC.DailyCoachEngine.brief();
if (shortBrief.availableMinutes !== 5) {
  throw new Error("Tempo disponível não foi atualizado.");
}

console.log("Coach Diário validado.");
