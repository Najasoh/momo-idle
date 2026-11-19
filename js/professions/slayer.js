/* Slayer profession. Tasks are mob ids from combat.js. */
window.Idle = window.Idle || {};
Idle.professions = Idle.professions || {};

Idle.professions.slayer = {
  id: "slayer",
  name: "Slayer",
  menu: "Fight assigned creatures",
  available: true,

  createSkill() {
    return { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
  },

  nodes() {
    return (Idle.data.slayerTasks || []).slice().sort((a, b) => (a.level || 1) - (b.level || 1));
  },

  nodeById(id) {
    return this.nodes().find((task) => task.id === id) || null;
  },

  mob(id) {
    return Idle.systems.combat.mobById(id);
  },

  canFight(skill, task) {
    return Boolean(task) && skill.level >= (task.level || 1);
  },
};
