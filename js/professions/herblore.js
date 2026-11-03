window.Idle = window.Idle || {};
Idle.professions = Idle.professions || {};

Idle.professions.herblore = {
  id: "herblore",
  name: "Herblore",

  createSkill() {
    return { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
  },

  nodes() {
    return (Idle.data.potions || []).slice().sort((a, b) => (a.level || 1) - (b.level || 1));
  },

  nodeById(id) {
    return (Idle.data.potions || []).find((potion) => potion.id === id) || null;
  },

  canCraft(state, potion) {
    if (!potion || !potion.cost) return false;
    return Object.entries(potion.cost).every(([id, qty]) => Idle.systems.inventory.count(state.slots, id) >= qty);
  },

  tick(state) {
    const skill = state.skills.herblore;
    const potion = this.nodeById(state.activity && state.activity.id);
    if (!potion || state.activity.profession !== "herblore") return { kind: "idle", text: "Pick a potion." };
    if (skill.level < (potion.level || 1)) {
      state.activity = null;
      return { kind: "locked", text: `${potion.name} needs Herblore ${potion.level}.` };
    }
    if (!this.canCraft(state, potion)) {
      state.activity = null;
      return { kind: "full", text: "Missing ingredients." };
    }
    Object.entries(potion.cost).forEach(([id, qty]) => Idle.systems.inventory.removeQty(state.slots, id, qty));
    Idle.systems.sound.play(Math.random() < 0.5 ? "bubble_goo" : "bubble_brew", false);
    if (!Idle.systems.inventory.add(state.slots, potion.id, 1)) {
      Object.entries(potion.cost).forEach(([id, qty]) => Idle.systems.inventory.add(state.slots, id, qty));
      state.activity = null;
      return { kind: "full", text: "Inventory full." };
    }
    const levels = Idle.systems.xp.grant(skill, potion.xp || 0);
    return { kind: "ok", text: `Made ${potion.name}.`, levels };
  },
};
