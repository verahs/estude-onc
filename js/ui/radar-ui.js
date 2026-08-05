window.ONC = window.ONC || {};

ONC.RadarUI = {
  point(cx, cy, radius, angle, scale = 1) {
    const radians = (angle - 90) * Math.PI / 180;
    return {
      x: cx + Math.cos(radians) * radius * scale,
      y: cy + Math.sin(radians) * radius * scale
    };
  },

  polygon(points) {
    return points.map(point => `${point.x},${point.y}`).join(" ");
  },

  render(root, data) {
    if (!root || !data?.length) return;

    const size = 360;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 118;
    const count = data.length;
    const step = 360 / count;

    const grids = [0.25, 0.5, 0.75, 1].map(level => {
      const points = data.map((_, index) =>
        this.point(cx, cy, radius, index * step, level)
      );
      return `<polygon points="${this.polygon(points)}" class="radarGrid"></polygon>`;
    }).join("");

    const axes = data.map((item, index) => {
      const end = this.point(cx, cy, radius, index * step, 1);
      const label = this.point(cx, cy, radius + 34, index * step, 1);
      return `
        <line x1="${cx}" y1="${cy}" x2="${end.x}" y2="${end.y}" class="radarAxis"></line>
        <text x="${label.x}" y="${label.y}" class="radarLabel"
          text-anchor="middle" dominant-baseline="middle">${item.label}</text>`;
    }).join("");

    const valuePoints = data.map((item, index) =>
      this.point(cx, cy, radius, index * step, Math.max(0.02, item.value / 100))
    );

    const dots = valuePoints.map((point, index) =>
      `<circle cx="${point.x}" cy="${point.y}" r="4" class="radarDot">
        <title>${data[index].label}: ${data[index].value}%</title>
      </circle>`
    ).join("");

    root.innerHTML = `
      <svg viewBox="0 0 ${size} ${size}" role="img"
        aria-label="Radar de domínio por disciplina">
        ${grids}
        ${axes}
        <polygon points="${this.polygon(valuePoints)}" class="radarValue"></polygon>
        ${dots}
      </svg>`;
  }
};
