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
    return Boolean(this.bestAxe(slots));
  },

  bestAxe(slots) {
    const catalog = Idle.systems.inventory.catalog();
    let best = null;
    for (const slot of slots) {
      if (!slot) continue;
      const item = catalog[slot.id];
      if (item && item.wc) {
        if (!best || item.wc > best.wc) best = item;
      }
    }
    return best;
  },

  nodes() {
    return Idle.data.woodcutting.trees;
  },

  nodeById(id) {
    return this.nodes().find((node) => node.id === id) || null;
  },

  rollOak() {
    if (Math.random() < 1 / 360000) Idle.systems.inventory.add(Idle.state.slots, "beaver", 1);
    if (Math.random() < 1 / 4) Idle.systems.inventory.add(Idle.state.slots, "oak_leaves", 1);
    if (Math.random() < 1 / 400) Idle.systems.inventory.add(Idle.state.slots, "ent_seed", 1);
    if (Math.random() < 1 / 2407) Idle.systems.inventory.add(Idle.state.slots, "loop_half_of_key", 1);
    if (Math.random() < 0.1) {
      const nest = Math.random();
      if (nest < 0.33) return "bird_nest_seeds";
      if (nest < 0.66) return "bird_nest_rings";
      return "bird_nest_egg";
    }
    return "oak_logs";
  },

  rollWillow() {
    if (Math.random() < 1 / 360000) Idle.systems.inventory.add(Idle.state.slots, "beaver", 1);
    if (Math.random() < 1 / 4) Idle.systems.inventory.add(Idle.state.slots, "willow_leaves", 1);
    if (Math.random() < 1 / 400) Idle.systems.inventory.add(Idle.state.slots, "ent_seed", 1);
    if (Math.random() < 1 / 2407) Idle.systems.inventory.add(Idle.state.slots, "loop_half_of_key", 1);
    if (Math.random() < 0.1) {
      const nest = Math.random();
      if (nest < 0.33) return "bird_nest_seeds";
      if (nest < 0.66) return "bird_nest_rings";
      return "bird_nest_egg";
    }
    return "willow_logs";
  },

  rollYew() {
    if (Math.random() < 1 / 360000) Idle.systems.inventory.add(Idle.state.slots, "beaver", 1);
    if (Math.random() < 1 / 4) Idle.systems.inventory.add(Idle.state.slots, "yew_leaves", 1);
    if (Math.random() < 1 / 400) Idle.systems.inventory.add(Idle.state.slots, "ent_seed", 1);
    if (Math.random() < 1 / 2407) Idle.systems.inventory.add(Idle.state.slots, "loop_half_of_key", 1);
    if (Math.random() < 1 / 40) Idle.systems.inventory.add(Idle.state.slots, "crystal_shard", 1);
    if (Math.random() < 0.1) {
      const nest = Math.random();
      if (nest < 0.33) return "bird_nest_seeds";
      if (nest < 0.66) return "bird_nest_rings";
      return "bird_nest_egg";
    }
    return "yew_logs";
  },

  tick(state) {
    const skill = state.skills.woodcutting;
    const node = this.nodeById(state.activity && state.activity.id);
    if (!node) return { kind: "idle", text: "No tree selected." };
    if (!this.hasAxe(state.slots)) {
      state.activity = null;
      return { kind: "locked", text: "You need an axe to chop trees." };
    }
    const axe = this.bestAxe(state.slots);
    const needed = node.id === "oak" ? 2 : node.id === "willow" ? 4 : node.id === "yew" ? 8 : 1;
    if (!axe || axe.wc < needed) {
      state.activity = null;
      return { kind: "locked", text: `You need a better axe for ${node.name}.` };
    }
    let fail = 0.30;
    if (skill.level > 55) fail = Math.max(0.05, 0.30 - (skill.level - 55) * 0.005);
    if (Math.random() < fail) {
      return { kind: "mine", text: `Missed the chop.` };
    }
    const drop = node.id === "oak" ? this.rollOak() : node.id === "willow" ? this.rollWillow() : node.id === "yew" ? this.rollYew() : (node.result || "logs");
    const stored = Idle.systems.inventory.add(state.slots, drop, 1);
    if (!stored) {
      state.activity = null;
      return { kind: "full", text: "Inventory is full. Chopping stopped." };
    }
    const levels = Idle.systems.xp.grant(skill, node.xp);
    state.activity.phase = "respawn";
    state.activity.until = performance.now() + (1 + Math.random() * 2) * 1000;
    let text = `Cut a tree (+${node.xp} Woodcutting xp).`;
    if (levels > 0) text += ` Woodcutting is now level ${skill.level}.`;
    return { kind: levels > 0 ? "level" : "mine", text };
  },
};
