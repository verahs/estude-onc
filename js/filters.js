window.ONC = window.ONC || {};
ONC.Filters = {
  priorityBand(percent) {
    if (percent >= 10) return "very-high";
    if (percent >= 8) return "high";
    if (percent >= 5) return "medium";
    return "low";
  }
};
