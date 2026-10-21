/* Mining profession. Other professions should export the same shape. */
window.Idle = window.Idle || {};
Idle.professions = Idle.professions || {};

Idle.professions.mining = {
  id: "mining",
  name: "Mining",
  menu: "Rocks, ore, and essence",
  available: true,

  createSkill() {
    return { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
  },

  nodes() {
    return Idle.data.miningNodes.slice().sort((a, b) => a.level - b.level);
  },

  nodeById(id) {
    return Idle.data.miningNodes.find((node) => node.id === id) || null;
  },

  canMine(skill, node) {
    return Boolean(node) && skill.level >= node.level;
  },

  /* One idle tick. Mutates state. Returns a log line. */
  tick(state) {
    const skill = state.skills.mining;
    const node = this.nodeById(state.active.mining);
    if (!node) return { kind: "idle", text: "No rock selected." };
    if (!this.canMine(skill, node)) {
      state.active.mining = null;
      return { kind: "locked", text: `${node.name} requires Mining ${node.level}.` };
    }
    const stored = Idle.systems.inventory.add(state.slots, node.id, 1);
    if (!stored) {
      state.active.mining = null;
      return { kind: "full", text: "Inventory is full. Mining stopped." };
    }
    const levels = Idle.systems.xp.grant(skill, node.xp);
    const xpText = Number.isInteger(node.xp) ? String(node.xp) : node.xp.toFixed(1);
    const gem = this.rollGem(state);
    let text = `Mined ${node.name} (+${xpText} xp).`;
    if (levels > 0) text += ` Mining is now level ${skill.level}.`;
    if (gem === "nothing") text += " Gem table: nothing.";
    if (gem && gem !== "nothing") text += ` Gem drop: ${gem}.`;
    return { kind: gem && gem !== "nothing" ? "gem" : levels > 0 ? "level" : "mine", text };
  },

  rollGem(state) {
    if (Math.random() >= Idle.data.gemChance) return null;
    const table = Idle.data.gemTable;
    const total = table.reduce((sum, row) => sum + row.weight, 0);
    let roll = Math.random() * total;
    let picked = table[table.length - 1];
    for (const row of table) {
      roll -= row.weight;
      if (roll < 0) {
        picked = row;
        break;
      }
    }
    if (picked.id === "nothing") return "nothing";
    const stored = Idle.systems.inventory.add(state.slots, picked.id, 1);
    return stored ? picked.name : `${picked.name} (no inventory space)`;
  },
};
