import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const memory = {};
const context = {
  console,
  window: {},
  document: { querySelectorAll: () => [] },
  ONC_DATA: { questions: [] }
};
context.window = context;
context.ONC = {
  Storage: {
    get(key, fallback) { return memory[key] ?? fallback; },
    set(key, value) { memory[key] = value; }
  },
  Users: { current: { name: "Teste" } },
  Classroom: { currentId: "teste" },
  MasteryEngine: {
    topicIndex: [{ id: "t1", title: "Tema", discipline: "Física", recurrence: 10 }],
    get: () => ({ score: 20, reading: 30, quiz: 10 })
  },
  MemoryEngine: { status: () => ({ memory: 25, forget: 75 }) },
  Attention: {
    evaluate: () => ({ errors: 2, score: 3 }),
    findStudyTopic: () => ({ id: "t1", title: "Tema", discipline: "Física" })
  },
  PriorityEngine: { calculate: () => ({ daysInactive: 8 }) }
};

vm.createContext(context);

for (const file of [
  "js/knowledge-graph.js",
  "js/learning-engine.js",
  "js/recommendation-engine.js"
]) {
  vm.runInContext(
    fs.readFileSync(path.join(process.cwd(), file), "utf8"),
    context,
    { filename: file }
  );
}

context.ONC.KnowledgeGraph.nodes = [
  { id: "t1", title: "Tema", discipline: "Física", recurrence: 10 }
];
context.ONC.KnowledgeGraph.edges = [];
context.ONC.LearningEngine.init();

context.ONC.LearningEngine.recordResponse(
  { id: "q1", subject: "Física", topic: "Tema", answer: 1, difficulty: "Média" },
  0,
  { responseTimeMs: 5000 }
);

const profile = context.ONC.LearningEngine.profile("t1");
if (profile.attempts !== 1 || profile.errors !== 1) {
  throw new Error("Perfil cognitivo não registrou a tentativa.");
}

context.ONC.RecommendationEngine.init();
const recommendation = context.ONC.RecommendationEngine.next();

if (!recommendation || recommendation.score <= 0 || !recommendation.reasons.length) {
  throw new Error("Recommendation Engine não produziu recomendação explicável.");
}

console.log("Motor adaptativo validado.");
