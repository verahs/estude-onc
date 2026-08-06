import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const store = {};
const now = new Date();
const iso = days => new Date(now.getTime() - days * 86400000).toISOString();

const context = { console, window: {}, document: { getElementById: () => null } };
context.window = context;
context.ONC = {
  Storage: {
    get(key, fallback) { return store[key] ?? fallback; },
    set(key, value) { store[key] = value; }
  },
  Users: { current: { name: "Helena" } },
  Classroom: { currentId: "helena" },
  IntelligentXPEngine: {
    state: {
      totalXP: 9000,
      ledger: [
        { category: "review", timestamp: iso(2) },
        { category: "mission", timestamp: iso(1) }
      ]
    }
  },
  LevelSystem: {
    levels: [{key:"explorador"}],
    summary: () => ({ current: { key:"explorador", title:"Explorador" } })
  },
  StudyHabitEngine: {
    state: { history: [] },
    current: () => ({ profile: { streak: 30, active30: 30 } })
  },
  ConsistencyCoach: {
    state: { history: [] },
    current: () => ({ overload: { concentrated: false } })
  },
  ProcrastinationDetector: {
    state: { history: [] },
    current: () => ({ metrics: { overdue: [] } })
  },
  CognitiveFatigueCoach: { state: { history: [] } },
  NavigationHistory: {
    state: {
      events: [
        { type:"complete", source:"favorite", durationSeconds:120 },
        { type:"complete", source:"review", durationSeconds:120 },
        { type:"complete", source:"mission", durationSeconds:120 },
        { type:"complete", source:"diagnostic", durationSeconds:120 }
      ]
    }
  },
  StudyHistory: {
    state: {
      sessions: [],
      topicEvents: Array.from({length:141}, (_,i) => ({
        type:"completed", topicId:`t${i}`, timestamp:iso(i%10)
      }))
    }
  },
  LearningAnalyticsEngine: {
    subjects: () => [
      {name:"Física", average:95, coverage:100},
      {name:"Biologia", average:95, coverage:100},
      {name:"Química", average:95, coverage:100},
      {name:"Astronomia", average:95, coverage:100}
    ],
    subjectHistory: () => []
  },
  LearningEngine: {
    state: {
      events: [
        ...Array.from({length:50}, (_,i) => ({
          id:`q${i}`, questionId:`q${i}`, topicId:`t${i}`,
          correct:true, responseTimeMs:12000, timestamp:iso(i%5),
          discipline:i<10 ? "Astronomia" : "Física",
          source:i%2 ? "simulado" : "question-bank"
        }))
      ]
    },
    allProfiles: () => [],
    strongestErrorType: () => null
  },
  MasteryEngine: { topicIndex: Array.from({length:141}, (_,i)=>({id:`t${i}`})) }
};

vm.createContext(context);
for (const file of [
  "js/secret-badge-catalog.js",
  "js/badge-rule-engine.js",
  "js/secret-discovery-engine.js"
]) {
  vm.runInContext(fs.readFileSync(path.join(process.cwd(), file), "utf8"), context, {filename:file});
}

context.ONC.BadgeRuleEngine.init();
context.ONC.SecretDiscoveryEngine.init();

for (const id of [
  "curiosidade-cientifica-secreta","laboratorio-oculto",
  "explorador-total","precisao-sustentada","polimata","imparavel-saudavel"
]) {
  if (!context.ONC.BadgeRuleEngine.isUnlocked(id)) {
    throw new Error(`Medalha secreta não desbloqueada: ${id}`);
  }
}

const summary = context.ONC.SecretDiscoveryEngine.summary();
if (summary.total < 9) throw new Error("Catálogo secreto incompleto.");
if (!summary.discovered) throw new Error("Descobertas ausentes.");
if (!summary.disclaimer.includes("não incentivam privação de sono")) {
  throw new Error("Proteção pedagógica ausente.");
}

const before = context.ONC.BadgeRuleEngine.unlockedList().length;
context.ONC.BadgeRuleEngine.evaluateAll("repeat");
const after = context.ONC.BadgeRuleEngine.unlockedList().length;
if (before !== after) throw new Error("Duplicidade detectada.");

console.log("Medalhas Secretas validadas.");
