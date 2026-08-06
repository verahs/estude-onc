import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const store = {};
const context = {
  console,
  window: {},
  document: { getElementById: () => null }
};
context.window = context;

context.ONC = {
  Storage: {
    get(key, fallback) { return store[key] ?? fallback; },
    set(key, value) { store[key] = value; }
  },
  Users: { current: { name: "Helena" } },
  Classroom: { currentId: "helena" },
  BadgeRuleEngine: {
    summary: () => ({
      rules: [
        {
          ruleId: "newton",
          title: "Newton",
          category: "aprendizagem",
          percent: 88,
          evidence: "Física em 88%",
          description: "Domínio em Física",
          icon: "⚙️",
          hidden: false,
          unlocked: null
        },
        {
          ruleId: "fenix",
          title: "Fênix",
          category: "recuperacao",
          percent: 92,
          evidence: "Força 25% para 85%",
          description: "Recuperar Força",
          icon: "🔥",
          hidden: false,
          unlocked: null
        }
      ]
    })
  },
  RecommendationEngine: {
    top: () => [
      {
        topicId: "forca",
        title: "Força",
        discipline: "Física",
        action: "review",
        score: 90
      }
    ]
  },
  CognitiveFatigueCoach: {
    current: () => ({ recommendation: { mode: "continue" } })
  },
  ConsistencyCoach: {
    current: () => ({ overload: { concentrated: false } })
  },
  DailyCoachEngine: {
    state: {
      lastBrief: {
        plan: []
      }
    },
    brief() { return this.state.lastBrief; },
    save() {}
  }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/badge-ai-integration-engine.js"), "utf8"),
  context,
  { filename: "badge-ai-integration-engine.js" }
);

context.ONC.BadgeAIIntegrationEngine.init();
let analysis = context.ONC.BadgeAIIntegrationEngine.current();

if (!analysis.suggestions.length) throw new Error("Sugestões ausentes.");
if (analysis.suggestions[0].ruleId !== "fenix") {
  throw new Error("Prioridade de recuperação incorreta.");
}
if (!analysis.suggestions[0].reasons.length) {
  throw new Error("Explicabilidade ausente.");
}
if (!context.ONC.BadgeAIIntegrationEngine.applyToDailyPlan(analysis.suggestions[0].id)) {
  throw new Error("Integração com plano diário falhou.");
}
if (!context.ONC.DailyCoachEngine.state.lastBrief.badgeAISuggestion) {
  throw new Error("Sugestão não registrada no plano.");
}

context.ONC.CognitiveFatigueCoach.current = () => ({
  recommendation: { mode: "pause" }
});
analysis = context.ONC.BadgeAIIntegrationEngine.refresh("fatigue");
if (!analysis.overloaded) throw new Error("Proteção de carga ausente.");

context.ONC.BadgeAIIntegrationEngine.dismiss(analysis.suggestions[0].id);
if (!context.ONC.BadgeAIIntegrationEngine.state.dismissedSuggestions.length) {
  throw new Error("Dispensa não persistida.");
}

if (!analysis.disclaimer.includes("reforço secundário")) {
  throw new Error("Salvaguarda ausente.");
}

console.log("Integração de Medalhas com IA validada.");
