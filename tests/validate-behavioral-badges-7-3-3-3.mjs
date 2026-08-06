import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const store = {};
const now = new Date();
const day = offset => new Date(now.getTime() - offset * 86400000).toISOString();

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
      totalXP: 1000,
      ledger: [
        ...Array.from({length: 6}, (_, i) => ({ category: "review", timestamp: day(i), metadata: {} })),
        ...Array.from({length: 7}, (_, i) => ({ category: "mission", timestamp: day(i), metadata: {} }))
      ]
    }
  },
  LevelSystem: {
    levels: [{ key: "explorador" }, { key: "aprendiz" }],
    summary: () => ({ current: { key: "aprendiz", title: "Aprendiz" } })
  },
  StudyHabitEngine: {
    state: {
      history: Array.from({length: 30}, (_, i) => ({ generatedAt: day(i) }))
    },
    current: () => ({
      profile: { streak: 7, active30: 30 }
    })
  },
  ProcrastinationDetector: {
    state: {
      history: Array.from({length: 14}, (_, i) => ({ generatedAt: day(i), score: 10 }))
    },
    current: () => ({ metrics: { overdue: [] } })
  },
  CognitiveFatigueCoach: {
    state: {
      history: Array.from({length: 14}, (_, i) => ({ generatedAt: day(i), score: 20 }))
    }
  },
  ConsistencyCoach: {
    state: {
      history: [
        { generatedAt: "2026-07-01T10:00:00Z", active7: 4, score: 70 },
        { generatedAt: "2026-07-08T10:00:00Z", active7: 4, score: 70 },
        { generatedAt: "2026-07-15T10:00:00Z", active7: 4, score: 70 },
        { generatedAt: "2026-07-22T10:00:00Z", active7: 4, score: 70 }
      ]
    }
  },
  NavigationHistory: {
    state: {
      events: [
        ...Array.from({length: 3}, () => ({ type: "open", source: "favorite" })),
        ...Array.from({length: 3}, () => ({ type: "open", source: "review" })),
        ...Array.from({length: 3}, () => ({ type: "open", source: "daily-coach" }))
      ]
    }
  },
  StudyHistory: { state: { sessions: [] } },
  LearningAnalyticsEngine: { subjects: () => [] },
  LearningEngine: { state: { events: [] }, allProfiles: () => [] },
  MasteryEngine: { topicIndex: [] }
};

vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(process.cwd(), "js/behavioral-badge-catalog.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(process.cwd(), "js/badge-rule-engine.js"), "utf8"), context);

context.ONC.BadgeRuleEngine.init();

for (const id of ["persistencia","disciplina","memoria","regularidade","foco","equilibrio","planejamento","organizacao"]) {
  if (!context.ONC.BadgeRuleEngine.isUnlocked(id)) {
    throw new Error(`Medalha comportamental não desbloqueada: ${id}`);
  }
}

const summary = context.ONC.BadgeRuleEngine.summary();
const behavioral = summary.rules.filter(item => item.category === "comportamento");
if (behavioral.length < 10) throw new Error("Catálogo comportamental incompleto.");

const before = context.ONC.BadgeRuleEngine.unlockedList().length;
context.ONC.BadgeRuleEngine.evaluateAll("repeat");
const after = context.ONC.BadgeRuleEngine.unlockedList().length;
if (before !== after) throw new Error("Duplicidade detectada.");

console.log("Medalhas Comportamentais validadas.");
