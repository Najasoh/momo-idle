window.Idle = window.Idle || {};
Idle.professions = Idle.professions || {};

Idle.professions.farming = {
  id: "farming",
  name: "Farming",
  menu: "Grow crops",
  available: true,

  createSkill() {
    return { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
  },

  yieldFor(level) {
    if (level >= 50) return [12, 20];
    if (level >= 18) return [6, 16];
    return [1, 12];
  },

  rollYield(level) {
    const [min, max] = this.yieldFor(level);
    return min + Math.floor(Math.random() * (max - min + 1));
  },
};
