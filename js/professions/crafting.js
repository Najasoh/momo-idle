window.Idle = window.Idle || {};
Idle.professions = Idle.professions || {};

Idle.professions.crafting = {
  id: "crafting",
  name: "Crafting",
  menu: "Spin and craft",
  available: true,

  createSkill() {
    return { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
  },

  stations() {
    return Idle.data.craftingStations;
  },

  nodes() {
    return Idle.data.craftingRecipes.slice().sort((a, b) => a.level - b.level);
  },

  nodeById(id) {
    return Idle.data.craftingRecipes.find((recipe) => recipe.id === id) || null;
  },

  canMake(skill, recipe) {
    return Boolean(recipe) && skill.level >= recipe.level;
  },

  hasCost(slots, recipe) {
    return Object.entries(recipe.cost).every(([id, qty]) => Idle.systems.inventory.count(slots, id) >= qty);
  },

  tick(state) {
    const skill = state.skills.crafting;
    const recipe = this.nodeById(state.activity && state.activity.id);
    if (!recipe || state.activity.profession !== "crafting") return { kind: "idle", text: "No craft selected." };
    if (!this.canMake(skill, recipe)) {
      state.activity = null;
      return { kind: "locked", text: `${recipe.name} requires Crafting ${recipe.level}.` };
    }
    if (!this.hasCost(state.slots, recipe)) {
      state.activity = null;
      return { kind: "full", text: `Missing materials for ${recipe.name}. Crafting stopped.` };
    }
    if (Idle.systems.inventory.findStack(state.slots, recipe.id) === -1 && Idle.systems.inventory.firstEmpty(state.slots) === -1) {
      state.activity = null;
      return { kind: "full", text: "Inventory is full. Crafting stopped." };
    }
    Object.entries(recipe.cost).forEach(([id, qty]) => Idle.systems.inventory.removeQty(state.slots, id, qty));
    Idle.systems.inventory.add(state.slots, recipe.id, 1);
    const levels = Idle.systems.xp.grant(skill, recipe.xp);
    let text = `Crafted ${recipe.name} (+${recipe.xp} xp).`;
    if (levels > 0) text += ` Crafting is now level ${skill.level}.`;
    return { kind: levels > 0 ? "level" : "mine", text };
  },
};
