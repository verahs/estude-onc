import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const store = {};
const context = { console, window: {}, document: { getElementById: () => null } };
context.window = context;

const subjects = [
  { name: "Física", average: 100, coverage: 100, completed: 20, total: 20 },
  { name: "Biologia", average: 100, coverage: 100, completed: 20, total: 20 },
  { name: "Química", average: 100, coverage: 100, completed: 20, total: 20 },
  { name: "Astronomia", average: 90, coverage: 100, completed: 20, total: 20 }
];

const hardEvents = Array.from({ length: 10 }, (_, index) => ({
  id: `h${index}`,
  topicId: `topic-${index % 3}`,
  correct: true,
  difficulty: "Difícil",
  timestamp: new Date().toISOString()
}));

context.ONC = {
  Storage: {
    get(key, fallback) { return store[key] ?? fallback; },
    set(key, value) { store[key] = value; }
  },
  Users: { current: { name: "Helena" } },
  Classroom: { currentId: "helena" },
  IntelligentXPEngine: { state: { totalXP: 800, ledger: [{ category: "learning" }] } },
  LevelSystem: {
    levels: [{ key: "explorador" }, { key: "aprendiz" }, { key: "pesquisador" }],
    summary: () => ({ current: { key: "pesquisador", title: "Pesquisador" } })
  },
  StudyHabitEngine: { current: () => ({ profile: { streak: 5, active30: 10 } }) },
  NavigationHistory: { state: { events: [] } },
  LearningAnalyticsEngine: { subjects: () => subjects },
  LearningEngine: {
    state: { events: hardEvents },
    allProfiles: () => [
      { topicId: "evolucao", attempts: 4, masteryEstimate: 80, accuracy: 80, trend: "rising" },
      { topicId: "topic-0", attempts: 4, masteryEstimate: 75, trend: "rising" },
      { topicId: "topic-1", attempts: 4, masteryEstimate: 75, trend: "rising" },
      { topicId: "topic-2", attempts: 4, masteryEstimate: 75, trend: "rising" },
      { topicId: "topic-3", attempts: 4, masteryEstimate: 75, trend: "rising" }
    ]
  },
  KnowledgeGraph: { node: id => ({ id, title: id }) },
  MasteryEngine: { topicIndex: [] }
};

vm.createContext(context);

vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/learning-badge-catalog.js"), "utf8"),
  context
);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/badge-rule-engine.js"), "utf8"),
  context
);

context.ONC.BadgeRuleEngine.init();

for (const badge of ["newton", "darwin", "lavoisier", "galileu", "einstein", "metodo-cientifico", "dominio-crescente"]) {
  if (!context.ONC.BadgeRuleEngine.isUnlocked(badge)) {
    throw new Error(`Medalha não desbloqueada: ${badge}`);
  }
}

const newton = context.ONC.BadgeRuleEngine.progress("newton");
if (!newton.evidence.includes("Física")) throw new Error("Evidência de Física ausente.");
if (!newton.metadata || newton.metadata.coverage !== 100) throw new Error("Metadados ausentes.");

const count = context.ONC.BadgeRuleEngine.unlockedList().length;
context.ONC.BadgeRuleEngine.evaluateAll("repeat");
if (context.ONC.BadgeRuleEngine.unlockedList().length !== count) {
  throw new Error("Medalhas duplicadas.");
}

console.log("Medalhas de Aprendizagem validadas.");
