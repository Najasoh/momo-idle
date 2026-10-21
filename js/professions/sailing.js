window.Idle = window.Idle || {};
Idle.professions = Idle.professions || {};

Idle.professions.sailing = {
  id: "sailing",
  name: "Sailing",
  menu: "Sail",
  available: false,

  createSkill() {
    return { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
  },

  nodes() {
    return [];
  },

  nodeById() {
    return null;
  },
};
