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
    get(key, fallback) {
      return store[key] ? JSON.parse(JSON.stringify(store[key])) : fallback;
    },
    set(key, value) {
      store[key] = JSON.parse(JSON.stringify(value));
    }
  },
  Users: { current: { name: "Helena" } },
  Classroom: { currentId: "helena" }
};

vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(process.cwd(), "js/exam-study-planner-engine.js"), "utf8"),
  context,
  { filename: "exam-study-planner-engine.js" }
);

const planner = context.ONC.ExamStudyPlannerEngine;
planner.load();

if (planner.state.examDate !== "2026-08-13") {
  throw new Error("Data padrão incorreta.");
}

const referenceDate = new Date(2026, 7, 5);
const plan = planner.calculate(referenceDate);

if (plan.daysRemaining !== 8) {
  throw new Error(`Contagem incorreta: ${plan.daysRemaining}`);
}
if (plan.dailyHours !== 1.5) {
  throw new Error("Carga diária incorreta para oito dias.");
}
if (plan.studyDays !== 7 || plan.restDays !== 1) {
  throw new Error("Distribuição de estudo e descanso incorreta.");
}
if (plan.totalHours !== 10.5) {
  throw new Error(`Total de horas incorreto: ${plan.totalHours}`);
}

planner.setExamDate("2026-08-20");
planner.load();
if (planner.state.examDate !== "2026-08-20") {
  throw new Error("Data alterada não persistiu.");
}

planner.resetDefault();
if (planner.state.examDate !== "2026-08-13") {
  throw new Error("Restauração da data padrão falhou.");
}

const examDayPlan = planner.calculate(new Date(2026, 7, 13));
if (examDayPlan.dailyHours !== 1 || examDayPlan.urgency.key !== "today") {
  throw new Error("Orientação do dia da prova incorreta.");
}

if (!plan.disclaimer.includes("não uma obrigação")) {
  throw new Error("Salvaguarda ausente.");
}

console.log("Planejador da Prova validado.");
