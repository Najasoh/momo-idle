window.Idle = window.Idle || {};
Idle.professions = Idle.professions || {};

Idle.professions.cooking = {
  id: "cooking",
  name: "Cooking",
  menu: "Cook meat at the range",
  available: true,

  createSkill() {
    return { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
  },

  nodes() {
    return Idle.data.cookingRecipes.slice().sort((a, b) => a.level - b.level);
  },

  nodeById(id) {
    return Idle.data.cookingRecipes.find((recipe) => recipe.id === id) || null;
  },

  canMake(skill, recipe) {
    return Boolean(recipe) && skill.level >= recipe.level;
  },

  meat(slots, recipe) {
    return recipe.alternatives.find((id) => Idle.systems.inventory.count(slots, id) >= 1) || null;
  },

  burnChance(skill, recipe) {
    if (!recipe.burn || skill.level >= recipe.stopBurn) return 0;
    let chance = recipe.burn * (1 - (skill.level - 1) / (recipe.stopBurn - 1));
    if (Idle.state.passives && Idle.state.passives.includes("cook_o_matic")) {
      chance *= 1 - (0.05 + Math.random() * 0.1);
    }
    return Math.max(0, chance);
  },

  tick(state) {
    const skill = state.skills.cooking;
    const recipe = this.nodeById(state.activity && state.activity.id);
    if (!recipe || state.activity.profession !== "cooking") return { kind: "idle", text: "No food selected." };
    if (!this.canMake(skill, recipe)) {
      state.activity = null;
      return { kind: "locked", text: `${recipe.name} requires Cooking ${recipe.level}.` };
    }
    const meat = this.meat(state.slots, recipe);
    if (!meat) {
      state.activity = null;
      return { kind: "full", text: `Missing raw meat for ${recipe.name}. Cooking stopped.` };
    }
    const burnt = Math.random() < this.burnChance(skill, recipe);
    const product = burnt ? (recipe.burnt || "burnt_meat") : recipe.id;
    if (Idle.systems.inventory.findStack(state.slots, product) === -1 && Idle.systems.inventory.firstEmpty(state.slots) === -1) {
      state.activity = null;
      return { kind: "full", text: "Inventory is full. Cooking stopped." };
    }
    Idle.systems.inventory.removeQty(state.slots, meat, 1);
    Idle.systems.inventory.add(state.slots, product, 1);
    if (burnt) return { kind: "full", text: `Burnt the ${meat.replaceAll("_", " ")}. +0 xp.` };
    const levels = Idle.systems.xp.grant(skill, recipe.xp);
    let text = `Cooked ${recipe.name} (+${recipe.xp} xp).`;
    if (levels > 0) text += ` Cooking is now level ${skill.level}.`;
    return { kind: levels > 0 ? "level" : "mine", text };
  },
};
