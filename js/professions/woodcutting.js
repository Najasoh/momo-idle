window.Idle = window.Idle || {};
Idle.professions = Idle.professions || {};

Idle.professions.woodcutting = {
  id: "woodcutting",
  name: "Woodcutting",
  menu: "Chop trees",
  available: true,

  createSkill() {
    return { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
  },

  hasAxe(slots) {
    const catalog = Idle.systems.inventory.catalog();
    return slots.some((slot) => slot && catalog[slot.id] && /axe/i.test(catalog[slot.id].name));
  },

  nodes() {
    return [{ id: "tree", name: "Tree", level: 1, xp: 25, hp: 3, seconds: 2.4, result: "logs" }];
  },

  nodeById(id) {
    return this.nodes().find((node) => node.id === id) || null;
  },

  tick(state) {
    const skill = state.skills.woodcutting;
    const node = this.nodeById(state.activity && state.activity.id);
    if (!node) return { kind: "idle", text: "No tree selected." };
    if (!this.hasAxe(state.slots)) {
      state.activity = null;
      return { kind: "locked", text: "You need an axe to chop trees." };
    }
    const tree = state.tree || { hp: node.hp };
    tree.hp -= 1;
    state.tree = tree;
    if (tree.hp > 0) return { kind: "mine", text: `Chopped the tree. ${tree.hp} hp left.` };
    const stored = Idle.systems.inventory.add(state.slots, node.result, 1);
    if (!stored) {
      state.activity = null;
      return { kind: "full", text: "Inventory is full. Chopping stopped." };
    }
    const levels = Idle.systems.xp.grant(skill, node.xp);
    state.tree = { hp: node.hp };
    let text = `Cut a tree (+${node.xp} Woodcutting xp).`;
    if (levels > 0) text += ` Woodcutting is now level ${skill.level}.`;
    return { kind: levels > 0 ? "level" : "mine", text };
  },
};
