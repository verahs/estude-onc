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
  BadgeRuleEngine: {
    summary: () => ({
      rules: [
        {
          ruleId: "newton",
          title: "Newton",
          icon: "⚙️",
          percent: 92,
          evidence: "92% concluída",
          hidden: false,
          unlocked: null
        }
      ]
    })
  },
  BadgeTimelineEngine: {
    milestones: () => [
      {
        type: "first",
        title: "Primeira conquista",
        detail: "Persistência",
        icon: "🚩",
        timestamp: "2026-08-05T10:00:00Z"
      }
    ]
  },
  DailyCoachEngine: {
    badgeHint: () => ({
      title: "Newton",
      percent: 92,
      message: "Newton: 92% concluída."
    })
  }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/intelligent-notification-engine.js"), "utf8"),
  context,
  { filename: "intelligent-notification-engine.js" }
);

context.ONC.IntelligentNotificationEngine.load();
context.ONC.IntelligentNotificationEngine.state.preferences.quietHoursEnabled = false;
context.ONC.IntelligentNotificationEngine.save();
context.ONC.IntelligentNotificationEngine.scan("startup");
let summary = context.ONC.IntelligentNotificationEngine.summary();

if (!summary.items.some(item => item.type === "near")) {
  throw new Error("Notificação de proximidade ausente.");
}
if (!summary.items.some(item => item.type === "milestone")) {
  throw new Error("Notificação de marco ausente.");
}

const before = summary.total;
context.ONC.IntelligentNotificationEngine.scan("repeat");
summary = context.ONC.IntelligentNotificationEngine.summary();
if (summary.total !== before) throw new Error("Duplicidade detectada.");

const unlock = context.ONC.IntelligentNotificationEngine.emitUnlock({
  ruleId: "darwin",
  title: "Darwin",
  evidence: "Biologia completa",
  icon: "🌿"
});
if (!unlock) throw new Error("Notificação de desbloqueio ausente.");

context.ONC.IntelligentNotificationEngine.markRead(unlock.id);
if (!context.ONC.IntelligentNotificationEngine.summary().items.find(item => item.id === unlock.id).read) {
  throw new Error("Estado de leitura inválido.");
}

context.ONC.IntelligentNotificationEngine.updatePreference("nearBadges", false);
if (context.ONC.IntelligentNotificationEngine.state.preferences.nearBadges !== false) {
  throw new Error("Preferência não salva.");
}

if (!summary.disclaimer.includes("não devem interromper o descanso")) {
  throw new Error("Salvaguarda ausente.");
}

console.log("Notificações Inteligentes validadas.");
