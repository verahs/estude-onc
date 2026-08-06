import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const now = new Date();
const state = {};

const context = {
  console,
  window: {},
  document: { getElementById: () => null }
};
context.window = context;

context.ONC = {
  Storage: {
    get(key, fallback) { return state[key] ?? fallback; },
    set(key, value) { state[key] = value; }
  },
  Users: { current: { name: "Helena" } },
  Classroom: { currentId: "helena" },
  LearningEngine: {
    state: {
      events: [
        { topicId: "rotacao", correct: true, responseTimeMs: 12000, source: "question-bank", timestamp: new Date(now - 3*86400000).toISOString() },
        { topicId: "rotacao", correct: true, responseTimeMs: 13000, source: "question-bank", timestamp: new Date(now - 2*86400000).toISOString() },
        { topicId: "forca", correct: false, responseTimeMs: 70000, source: "question-bank", errorType: "recurring", timestamp: new Date(now - 86400000).toISOString() }
      ]
    },
    allProfiles: () => [
      { topicId: "rotacao", attempts: 2, accuracy: 100, recentAccuracy: 100, confidence: 50, trend: "rising", averageResponseMs: 12500 },
      { topicId: "forca", attempts: 2, accuracy: 40, recentAccuracy: 30, confidence: 45, trend: "falling", averageResponseMs: 70000 }
    ],
    strongestErrorType: id => id === "forca" ? "recurring" : null
  },
  StudyHistory: {
    state: {
      topicEvents: [
        { topicId: "forca", type: "completed", timestamp: new Date(now - 2*86400000).toISOString(), metadata: { durationSeconds: 500 } }
      ]
    }
  },
  KnowledgeGraph: {
    node: id => ({
      id,
      title: id === "rotacao" ? "Rotação" : "Força",
      discipline: id === "rotacao" ? "Astronomia" : "Física"
    })
  },
  MasteryEngine: { topicIndex: [] },
  RecommendationEngine: {
    rank: () => [
      { topicId: "forca", title: "Força", discipline: "Física", score: 85, reasons: ["erro recorrente"], confidence: 45, trend: "falling", errorType: "recurring" },
      { topicId: "rotacao", title: "Rotação", discipline: "Astronomia", score: 60, reasons: ["consolidar"], confidence: 50, trend: "rising" }
    ]
  }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/learning-coach.js"), "utf8"),
  context,
  { filename: "learning-coach.js" }
);

context.ONC.LearningCoach.init();
const analysis = context.ONC.LearningCoach.current();

if (!analysis.topics.length) throw new Error("Recomendações por tópico ausentes.");
if (!analysis.topics[0].method.steps.length) throw new Error("Método sem etapas.");
if (!analysis.disclaimer.includes("não determina estilo fixo")) throw new Error("Salvaguarda ausente.");
if (!analysis.confidence || !analysis.profile) throw new Error("Perfil ou confiança ausentes.");

console.log("Coach de Aprendizagem validado.");
