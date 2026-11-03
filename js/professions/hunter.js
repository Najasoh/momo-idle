window.Idle = window.Idle || {};
Idle.professions = Idle.professions || {};

Idle.professions.hunter = {
  id: "hunter",
  name: "Hunter",

  createSkill() {
    return { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
  },

  nodes() {
    return (Idle.data.hunterTraps || []).slice().sort((a, b) => (a.level || 1) - (b.level || 1));
  },

  nodeById(id) {
    return (Idle.data.hunterTraps || []).find((trap) => trap.id === id) || null;
  },

  maxTraps(level) {
    if (level >= 80) return 5;
    if (level >= 60) return 4;
    if (level >= 40) return 3;
    return 2;
  },

  catchChance(level) {
    const base = 0.39;
    const at99 = 1.64;
    return Math.min(1, base + ((level - 1) / 98) * (at99 - base));
  },

  catchSeconds() {
    const roll = Math.random();
    if (roll < 0.1) return 1 + Math.floor(Math.random() * 14);
    if (roll < 0.9) return 15 + Math.floor(Math.random() * 26);
    return 41 + Math.floor(Math.random() * 10);
  },

  tick(state) {
    const skill = state.skills.hunter;
    const trap = this.nodeById(state.activity && state.activity.id);
    if (!trap || state.activity.profession !== "hunter") return { kind: "idle", text: "Pick a trap." };
    if (skill.level < (trap.level || 1)) {
      state.activity = null;
      return { kind: "locked", text: `${trap.name} needs Hunter ${trap.level}.` };
    }
    const snares = Idle.systems.inventory.count(state.slots, "bird_snare");
    if (snares < 1) {
      state.activity = null;
      return { kind: "full", text: "Need a bird snare." };
    }
    const chance = this.catchChance(skill.level);
    if (Math.random() > chance) return { kind: "ok", text: "Trap missed." };
    Idle.systems.inventory.removeQty(state.slots, "bird_snare", 1);
    Idle.systems.inventory.add(state.slots, "crimson_swift", 1);
    const levels = Idle.systems.xp.grant(skill, trap.xp || 0);
    return { kind: "ok", text: `Caught ${trap.name}.`, levels };
  },
};
