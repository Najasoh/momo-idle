window.Idle = window.Idle || {};
Idle.professions = Idle.professions || {};

Idle.professions.smithing = {
  id: "smithing",
  name: "Smithing",
  menu: "Smelt bars at the furnace",
  available: true,

  createSkill() {
    return { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
  },

  nodes() {
    return Idle.data.smithingBars.slice().sort((a, b) => a.level - b.level);
  },

  nodeById(id) {
    return Idle.data.smithingBars.find((bar) => bar.id === id) || null;
  },

  canMake(skill, bar) {
    return Boolean(bar) && skill.level >= bar.level;
  },

  hasCost(slots, bar) {
    return Object.entries(bar.cost).every(([id, qty]) => Idle.systems.inventory.count(slots, id) >= qty);
  },

  tick(state) {
    const skill = state.skills.smithing;
    const bar = this.nodeById(state.activity && state.activity.id);
    if (!bar || state.activity.profession !== "smithing") return { kind: "idle", text: "No bar selected." };
    if (!this.canMake(skill, bar)) {
      state.activity = null;
      return { kind: "locked", text: `${bar.name} requires Smithing ${bar.level}.` };
    }
    if (!this.hasCost(state.slots, bar)) {
      state.activity = null;
      return { kind: "full", text: `Missing ingredients for ${bar.name}. Smithing stopped.` };
    }
    const failed = bar.fail > 0 && Math.random() < bar.fail;
    if (!failed && Idle.systems.inventory.findStack(state.slots, bar.id) === -1 && Idle.systems.inventory.firstEmpty(state.slots) === -1) {
      state.activity = null;
      return { kind: "full", text: "Inventory is full. Smithing stopped." };
    }
    Object.entries(bar.cost).forEach(([id, qty]) => Idle.systems.inventory.removeQty(state.slots, id, qty));
    const xpText = Number.isInteger(bar.xp) ? String(bar.xp) : bar.xp.toFixed(1);
    const levels = Idle.systems.xp.grant(skill, bar.xp);
    if (!failed) Idle.systems.inventory.add(state.slots, bar.id, bar.qty || 1);
    let text = failed
      ? `Smelted ${bar.name}, but the bar failed (+${xpText} xp).`
      : `Smelted ${bar.name} (+${xpText} xp).`;
    if (levels > 0) text += ` Smithing is now level ${skill.level}.`;
    return { kind: failed ? "full" : levels > 0 ? "level" : "mine", text };
  },
};
