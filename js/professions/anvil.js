window.Idle = window.Idle || {};
Idle.professions = Idle.professions || {};

Idle.professions.anvil = {
  id: "anvil",
  name: "Anvil",
  menu: "Hammer bars into gear",
  available: true,

  nodes() {
    return Idle.data.anvilItems.slice().sort((a, b) => a.level - b.level);
  },

  nodeById(id) {
    return Idle.data.anvilItems.find((item) => item.id === id) || null;
  },

  forMetal(metal) {
    return Idle.data.anvilItems.filter((item) => item.metal === metal);
  },

  canMake(skill, item) {
    return Boolean(item) && skill.level >= item.level;
  },

  tick(state) {
    const skill = state.skills.smithing;
    const item = this.nodeById(state.activity && state.activity.id);
    if (!item || state.activity.profession !== "anvil") return { kind: "idle", text: "No item selected." };
    if (!this.canMake(skill, item)) {
      state.activity = null;
      return { kind: "locked", text: `${item.name} requires Smithing ${item.level}.` };
    }
    const missing = Object.entries(item.cost).some(([id, qty]) => Idle.systems.inventory.count(state.slots, id) < qty);
    if (missing) {
      state.activity = null;
      const need = Object.entries(item.cost).map(([id, qty]) => `${qty} ${id.replaceAll("_", " ")}`).join(", ");
      return { kind: "full", text: `Missing materials for ${item.name}: ${need}.` };
    }
    if (Idle.systems.inventory.findStack(state.slots, item.id) === -1 && Idle.systems.inventory.firstEmpty(state.slots) === -1) {
      state.activity = null;
      return { kind: "full", text: "Inventory is full. Anvil stopped." };
    }
    Object.entries(item.cost).forEach(([id, qty]) => Idle.systems.inventory.removeQty(state.slots, id, qty));
    Idle.systems.inventory.add(state.slots, item.id, 1);
    const levels = Idle.systems.xp.grant(skill, item.xp);
    const xpText = Number.isInteger(item.xp) ? String(item.xp) : item.xp.toFixed(1);
    let text = `Hammered ${item.name} (+${xpText} Smithing xp).`;
    if (levels > 0) text += ` Smithing is now level ${skill.level}.`;
    return { kind: levels > 0 ? "level" : "mine", text };
  },
};
