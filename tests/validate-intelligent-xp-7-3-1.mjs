import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const store = {};
const context = { console, window: {}, document: { getElementById: () => null } };
context.window = context;

context.ONC = {
  Storage: {
    get(key, fallback) { return store[key] ?? fallback; },
    set(key, value) { store[key] = value; }
  },
  Users: { current: { name: "Helena" } },
  Classroom: { currentId: "helena" },
  LearningEngine: {
    state: {
      events: [
        { id: "old-1", topicId: "forca", correct: false, timestamp: "2026-08-05T10:00:00.000Z" },
        { id: "old-2", topicId: "forca", correct: false, timestamp: "2026-08-05T10:05:00.000Z" }
      ]
    },
    profile: () => ({ masteryEstimate: 55 })
  },
  MasteryEngine: {
    get: () => ({ score: 40 })
  },
  StudyHabitEngine: {
    current: () => ({ profile: { streak: 3 } })
  }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/intelligent-xp-engine.js"), "utf8"),
  context,
  { filename: "intelligent-xp-engine.js" }
);

context.ONC.IntelligentXPEngine.init();

const correct = {
  id: "new-1",
  topicId: "forca",
  topic: "Força",
  questionId: "q1",
  correct: true,
  responseTimeMs: 15000,
  source: "question-bank",
  difficulty: "Difícil",
  timestamp: "2026-08-05T10:10:00.000Z"
};

const entry = context.ONC.IntelligentXPEngine.recordResponse(correct);
if (!entry || entry.xp <= 0) throw new Error("XP válido não foi concedido.");

const duplicate = context.ONC.IntelligentXPEngine.recordResponse(correct);
if (duplicate !== null) throw new Error("Evento duplicado gerou XP.");

const wrong = context.ONC.IntelligentXPEngine.recordResponse({
  ...correct, id: "wrong-1", correct: false
});
if (wrong !== null) throw new Error("Resposta incorreta gerou XP.");

const summary = context.ONC.IntelligentXPEngine.summary();
if (summary.totalXP <= 0 || !summary.level) throw new Error("Resumo inválido.");
if (!summary.disclaimer.includes("Erros não retiram XP")) throw new Error("Salvaguarda ausente.");

console.log("XP Inteligente validado.");
