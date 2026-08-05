window.ONC = window.ONC || {};

ONC.ArchitectureDiagnostics = {
  contracts: {
    MasteryEngine: ["get", "average", "disciplineSummary"],
    MemoryEngine: ["status", "averageMemory"],
    PriorityEngine: ["rank", "calculate"],
    LearningAnalyticsEngine: [
      "topic",
      "subjectSummary",
      "overview",
      "performanceEstimate",
      "heatmap"
    ],
    AssessmentEngine: ["adaptivePool", "diagnostic"],
    TutorEngine: ["nextBestAction", "why"]
  },

  validate() {
    const failures = [];

    Object.entries(this.contracts).forEach(([moduleName, methods]) => {
      const module = ONC[moduleName];

      methods.forEach(methodName => {
        if (!module || typeof module[methodName] !== "function") {
          failures.push(`${moduleName}.${methodName}`);
        }
      });
    });

    return {
      ok: failures.length === 0,
      failures
    };
  }
};
