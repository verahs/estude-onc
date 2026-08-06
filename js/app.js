window.ONC = window.ONC || {};

document.addEventListener("DOMContentLoaded", async () => {
  const errors = [];

  try {
    await window.ONC_DATA_READY;
  } catch (error) {
    errors.push({ module: "DataLoader", error });
  }

  const startup = [
    ["DataMigration", "init"],
    ["Users", "init"],
    ["Classroom", "init"],
    ["Notifications", "init"],
    ["Preferences", "init"],
    ["DataPortability", "init"],
    ["VisualLibrary", "init"],
    ["Study", "init"],
    ["ContentIndex", "init"],
    ["NavigationHistory", "init"],
    ["FocusMode", "init"],
    ["SmartNavigator", "init"],
    ["StudyTools", "init"],
    ["Attention", "init"],
    ["StudyHistory", "init"],
    ["MemoryEngine", "init"],
    ["MasteryEngine", "init"],
    ["ProgressEngine", "init"],
    ["PriorityEngine", "init"],
    ["KnowledgeGraph", "init"],
    ["LearningEngine", "init"],
    ["DiagnosticEngine", "init"],
    ["LearningAnalyticsEngine", "init"],
    ["RecommendationEngine", "init"],
    ["AdaptivePlanner", "init"],
    ["AdvancedAnalytics", "init"],
    ["DailyCoachEngine", "init"],
    ["PerformancePredictionEngine", "init"],
    ["StudyHabitEngine", "init"],
    ["ProcrastinationDetector", "init"],
    ["MissionEngine", "init"],
    ["Gamification", "init"],
    ["TutorEngine", "init"],
    ["AssessmentEngine", "init"],
    ["AssessmentUI", "init"],
    ["DailyGoals", "init"],
    ["DashboardEngine", "init"],
    ["GuardianReport", "init"],
    ["AdvancedDashboardUI", "init"],
    ["AdaptiveTutorUI", "init"],
    ["DiagnosticUI", "init"],
    ["NavigationUI", "init"],
    ["DailyCoachUI", "init"],
    ["PerformancePredictionUI", "init"],
    ["StudyHabitUI", "init"],
    ["ProcrastinationUI", "init"],
    ["SystemSettingsUI", "init"],
    ["SmartTutor", "init"],
    ["Questions", "init"],
    ["Quiz", "init"],
    ["Classroom", "addFromCurrentUser"],
    ["UI", "applyRole"]
  ];

  for (const [moduleName, methodName] of startup) {
    const module = window.ONC?.[moduleName];

    if (!module || typeof module[methodName] !== "function") {
      continue;
    }

    try {
      module[methodName]();
    } catch (error) {
      errors.push({ module: `${moduleName}.${methodName}`, error });
      console.error(`[Estude ONC] ${moduleName}.${methodName}`, error);
    }
  }

  if (errors.length) {
    const box = document.getElementById("runtimeErrorBox");
    if (box) {
      box.classList.remove("hidden");
      box.innerHTML = `
        <strong>A plataforma carregou parcialmente.</strong>
        <span>${errors.length} módulo${errors.length === 1 ? "" : "s"} apresentou${
          errors.length === 1 ? "" : "aram"
        } erro. Atualize a página com Ctrl + F5.</span>
        <details>
          <summary>Detalhes técnicos</summary>
          <ul>
            ${errors.map(item =>
              `<li>${item.module}: ${item.error?.message || "erro desconhecido"}</li>`
            ).join("")}
          </ul>
        </details>`;
    }
  }
});
