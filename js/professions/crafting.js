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
    if (recipe.coins && Idle.systems.inventory.count(slots, "coins") < recipe.coins) return false;
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
    Object.entries(recipe.cost).forEach(([id, qty]) => {
      if (id === "thread") {
        const slot = state.slots.find((entry) => entry && entry.id === "thread");
        if (slot) {
          slot.uses = (slot.uses || 5) - 1;
          if (slot.uses <= 0) Idle.systems.inventory.removeQty(state.slots, "thread", 1);
        }
      } else {
        Idle.systems.inventory.removeQty(state.slots, id, qty);
      }
    });
    if (recipe.coins) Idle.systems.inventory.removeQty(state.slots, "coins", recipe.coins);
    Idle.systems.inventory.add(state.slots, recipe.id, 1);
    const levels = Idle.systems.xp.grant(skill, recipe.xp);
    let text = `Crafted ${recipe.name} (+${recipe.xp} xp).`;
    if (levels > 0) text += ` Crafting is now level ${skill.level}.`;
    return { kind: levels > 0 ? "level" : "mine", text };
  },
};
