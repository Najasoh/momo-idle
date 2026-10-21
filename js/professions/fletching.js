window.Idle = window.Idle || {};
Idle.professions = Idle.professions || {};

Idle.professions.fletching = {
  id: "fletching",
  name: "Fletching",
  menu: "Cut and string",
  available: true,

  createSkill() {
    return { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
  },

  nodes() {
    return Idle.data.fletchingRecipes.slice().sort((a, b) => a.level - b.level);
  },

  nodeById(id) {
    return Idle.data.fletchingRecipes.find((recipe) => recipe.id === id) || null;
  },

  canMake(skill, recipe) {
    return Boolean(recipe) && skill.level >= recipe.level;
  },

  hasCost(slots, recipe) {
    return Object.entries(recipe.cost).every(([id, qty]) => Idle.systems.inventory.count(slots, id) >= qty);
  },

  tick(state) {
    const skill = state.skills.fletching;
    const recipe = this.nodeById(state.activity && state.activity.id);
    if (!recipe || state.activity.profession !== "fletching") return { kind: "idle", text: "No fletch selected." };
    if (!this.canMake(skill, recipe)) {
      state.activity = null;
      return { kind: "locked", text: `${recipe.name} requires Fletching ${recipe.level}.` };
    }
    if (!this.hasCost(state.slots, recipe)) {
      state.activity = null;
      return { kind: "full", text: `Missing materials for ${recipe.name}. Fletching stopped.` };
    }
    if (Idle.systems.inventory.findStack(state.slots, recipe.id) === -1 && Idle.systems.inventory.firstEmpty(state.slots) === -1) {
      state.activity = null;
      return { kind: "full", text: "Inventory is full. Fletching stopped." };
    }
    Object.entries(recipe.cost).forEach(([id, qty]) => Idle.systems.inventory.removeQty(state.slots, id, qty));
    Idle.systems.inventory.add(state.slots, recipe.id, recipe.qty || 1);
    const levels = Idle.systems.xp.grant(skill, recipe.xp);
    let text = `Fletched ${recipe.qty || 1} ${recipe.name} (+${recipe.xp} xp).`;
    if (levels > 0) text += ` Fletching is now level ${skill.level}.`;
    return { kind: levels > 0 ? "level" : "mine", text };
  },
};
