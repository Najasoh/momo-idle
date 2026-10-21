window.Idle = window.Idle || {};
Idle.professions = Idle.professions || {};

Idle.professions.firemaking = {
  id: "firemaking",
  name: "Firemaking",
  menu: "Light campfires",
  available: true,

  createSkill() {
    return { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
  },

  failRate(level) {
    if (level >= 70) return 0.05;
    if (level >= 40) return 0.2;
    if (level >= 30) return 0.3;
    if (level >= 15) return 0.4;
    return 0.5;
  },

  cookables() {
    return Idle.data.cookingRecipes || [];
  },
};
