window.ONC = window.ONC || {};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await window.ONC_DATA_READY;

    const startup = [
      ["Users", "init"],
      ["Classroom", "init"],
      ["Study", "init"],
      ["StudyTools", "init"],
      ["Attention", "init"],
      ["StudyHistory", "init"],
      ["MemoryEngine", "init"],
      ["MasteryEngine", "init"],
      ["ProgressEngine", "init"],
      ["PriorityEngine", "init"],
      ["MissionEngine", "init"],
      ["Gamification", "init"],
      ["TutorEngine", "init"],
      ["AssessmentEngine", "init"],
      ["AssessmentUI", "init"],
      ["DailyGoals", "init"],
      ["DashboardEngine", "init"],
      ["SmartTutor", "init"],
      ["Questions", "init"],
      ["Quiz", "init"],
      ["Classroom", "addFromCurrentUser"],
      ["UI", "applyRole"]
    ];

    startup.forEach(([moduleName, methodName]) => {
      const module = window.ONC?.[moduleName];
      if (module && typeof module[methodName] === "function") {
        module[methodName]();
      }
    });
  } catch (error) {
    console.error(error);
    const box = document.getElementById("runtimeErrorBox");
    if (box) {
      box.classList.remove("hidden");
      box.textContent =
        `Erro ao carregar a plataforma: ${error.message}`;
    }
  }
});
