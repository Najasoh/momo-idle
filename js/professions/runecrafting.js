/* Runecrafting profession. Water altar is the first. */
window.Idle = window.Idle || {};
Idle.professions = Idle.professions || {};

Idle.professions.runecrafting = {
  id: "runecrafting",
  name: "Runecrafting",
  menu: "Craft runes at altars",
  available: true,

  createSkill() {
    return { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
  },

  nodes() {
    return Idle.data.runecrafting || [];
  },

  nodeById(id) {
    return this.nodes().find((node) => node.id === id) || null;
  },

  canCraft(skill, altar) {
    return Boolean(altar) && skill.level >= altar.level;
  },

  hasTalisman(slots, altar) {
    if (!altar || !altar.talisman) return true;
    return Idle.systems.inventory.count(slots, altar.talisman) > 0;
  },

  hasEssence(slots) {
    return Idle.systems.inventory.count(slots, "rune_essence") > 0 || Idle.systems.inventory.count(slots, "pure_essence") > 0;
  },

  tick(state) {
    const skill = state.skills.runecrafting;
    const altar = this.nodeById(state.activity && state.activity.id);
    if (!altar) return { kind: "idle", text: "No altar selected." };
    if (!this.canCraft(skill, altar)) {
      state.activity = null;
      return { kind: "locked", text: `${altar.name} requires Runecrafting ${altar.level}.` };
    }
    if (!this.hasTalisman(state.slots, altar)) {
      state.activity = null;
      return { kind: "full", text: `You need a ${altar.talisman.replaceAll("_", " ")}.` };
    }
    if (!this.hasEssence(state.slots)) {
      state.activity = null;
      return { kind: "full", text: "You need rune essence or pure essence." };
    }
    const essence = Idle.systems.inventory.count(state.slots, "rune_essence") > 0 ? "rune_essence" : "pure_essence";
    if (!Idle.systems.inventory.removeQty(state.slots, essence, 1)) {
      state.activity = null;
      return { kind: "full", text: "No essence." };
    }
    const stored = Idle.systems.inventory.add(state.slots, altar.rune, 1);
    if (!stored) {
      Idle.systems.inventory.add(state.slots, essence, 1);
      state.activity = null;
      return { kind: "full", text: "Inventory is full." };
    }
    const levels = Idle.systems.xp.grant(skill, altar.xp);
    let text = `Crafted a ${altar.rune.replaceAll("_", " ")} (+${altar.xp} Runecrafting xp).`;
    if (levels > 0) text += ` Runecrafting is now level ${skill.level}.`;
    return { kind: levels > 0 ? "level" : "mine", text };
  },
};

Idle.data = Idle.data || {};
Idle.data.runecrafting = [
  {
    id: "water_altar",
    name: "Water Altar",
    level: 5,
    xp: 6,
    rune: "water_rune",
    talisman: "water_talisman",
    seconds: 2.4,
  },
];
