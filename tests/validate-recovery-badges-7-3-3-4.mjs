import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const store = {};
const now = new Date();
const iso = days => new Date(now.getTime() - days * 86400000).toISOString();

const learningEvents = [
  { id: "a1", questionId: "q1", topicId: "t1", correct: false, timestamp: iso(10) },
  { id: "a2", questionId: "q1", topicId: "t1", correct: true, timestamp: iso(9) },
  { id: "b1", questionId: "q2", topicId: "t2", correct: false, timestamp: iso(8) },
  { id: "b2", questionId: "q2", topicId: "t2", correct: true, timestamp: iso(7) },
  { id: "c1", questionId: "q3", topicId: "t3", correct: false, timestamp: iso(6) },
  { id: "c2", questionId: "q3", topicId: "t3", correct: true, timestamp: iso(5) }
];

const recoveryLedger = Array.from({length: 20}, (_, i) => ({
  category: "learning",
  timestamp: iso(i),
  metadata: { bonuses: [{ key: "recovery", xp: 6 }] }
}));

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
      totalXP: 2000,
      ledger: recoveryLedger
    }
  },
  LevelSystem: {
    levels: [{ key: "explorador" }],
    summary: () => ({ current: { key: "explorador", title: "Explorador" } })
  },
  StudyHabitEngine: {
    state: { history: [] },
    current: () => ({ profile: { streak: 3, active30: 8 } })
  },
  ProcrastinationDetector: {
    state: { history: [] },
    current: () => ({ metrics: { overdue: [] } })
  },
  CognitiveFatigueCoach: { state: { history: [] } },
  ConsistencyCoach: { state: { history: [] } },
  NavigationHistory: { state: { events: [] } },
  StudyHistory: {
    state: {
      sessions: [
        { timestamp: iso(10) },
        { timestamp: iso(5) },
        { timestamp: iso(4) },
        { timestamp: iso(3) }
      ]
    }
  },
  LearningAnalyticsEngine: {
    subjects: () => [],
    subjectHistory: () => []
  },
  LearningEngine: {
    state: { events: learningEvents },
    allProfiles: () => [
      { topicId: "t1", attempts: 4, masteryEstimate: 95, accuracy: 95, recentAccuracy: 90, trend: "rising" },
      { topicId: "t2", attempts: 4, masteryEstimate: 80, accuracy: 80, recentAccuracy: 80, trend: "rising" },
      { topicId: "t3", attempts: 4, masteryEstimate: 78, accuracy: 78, recentAccuracy: 75, trend: "rising" }
    ],
    strongestErrorType: () => null
  },
  KnowledgeGraph: {
    node: id => ({ id, title: id === "t1" ? "Força" : id })
  },
  MasteryEngine: { topicIndex: [] }
};

vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(process.cwd(), "js/recovery-badge-catalog.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(process.cwd(), "js/badge-rule-engine.js"), "utf8"), context);

context.ONC.BadgeRuleEngine.init();

const summary = context.ONC.BadgeRuleEngine.summary();
const recovery = summary.rules.filter(item => item.category === "recuperacao");
if (recovery.length < 10) throw new Error("Catálogo de recuperação incompleto.");

if (!context.ONC.BadgeRuleEngine.isUnlocked("resiliencia")) {
  throw new Error("Resiliência não desbloqueada.");
}
if (!context.ONC.BadgeRuleEngine.isUnlocked("retorno-ao-ritmo")) {
  throw new Error("Retorno ao Ritmo não desbloqueada.");
}

const before = context.ONC.BadgeRuleEngine.unlockedList().length;
context.ONC.BadgeRuleEngine.evaluateAll("repeat");
const after = context.ONC.BadgeRuleEngine.unlockedList().length;
if (before !== after) throw new Error("Duplicidade detectada.");

console.log("Medalhas de Recuperação validadas.");
