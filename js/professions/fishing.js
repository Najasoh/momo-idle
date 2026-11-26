window.Idle = window.Idle || {};
Idle.professions = Idle.professions || {};

Idle.professions.fishing = {
  id: "fishing",
  name: "Fishing",
  menu: "Catch fish at a spot",
  available: true,

  createSkill() {
    return { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
  },

  nodes() {
    return Idle.data.fishingSpots.slice().sort((a, b) => (a.level || 1) - (b.level || 1));
  },

  nodeById(id) {
    return Idle.data.fishingSpots.find((spot) => spot.id === id) || null;
  },

  fishById(id) {
    return (Idle.data.fishingFish || []).find((fish) => fish.id === id) || null;
  },

  available(skill, spot) {
    if (!spot) return [];
    return spot.fish.map((id) => this.fishById(id)).filter((fish) => fish && skill.level >= fish.level);
  },

  canFish(skill, spot) {
    return Boolean(spot) && this.available(skill, spot).length > 0;
  },

  hasTool(state, spot) {
    if (!spot) return false;
    if (spot.barbarian && state.quests && state.quests.barbarian && state.combatSkills.strength.level >= 50) return true;
    return Idle.systems.inventory.count(state.slots, spot.tool) > 0;
  },

  hasBait(state, spot) {
    if (!spot || !spot.consume) return true;
    return Idle.systems.inventory.count(state.slots, spot.consume) > 0;
  },

  catchSeconds(fish) {
    const level = fish ? fish.level : 1;
    return Math.max(3, Math.min(8, 3 + ((level - 1) / 49) * 5));
  },

  tick(state) {
    const skill = state.skills.fishing;
    const spot = this.nodeById(state.activity && state.activity.id);
    if (!spot || state.activity.profession !== "fishing" || state.activity.phase === "travel") return { kind: "idle", text: "Walking to the spot." };
    const table = this.available(skill, spot);
    if (!table.length) {
      state.activity = null;
      return { kind: "locked", text: `${spot.name} needs a higher Fishing level.` };
    }
    if (!this.hasTool(state, spot)) {
      state.activity = null;
      return { kind: "full", text: `Missing ${spot.tool.replaceAll("_", " ")}.` };
    }
    if (!this.hasBait(state, spot)) {
      state.activity = null;
      return { kind: "full", text: `Missing ${spot.consume.replaceAll("_", " ")}.` };
    }
    const fish = table[Math.floor(Math.random() * table.length)];
    const fishingSounds = ["fishing1", "fishing2", "fishing3", "fishing4"];
    Idle.systems.sound.play(fishingSounds[Math.floor(Math.random() * fishingSounds.length)], false);
    if (spot.consume) Idle.systems.inventory.removeQty(state.slots, spot.consume, 1);
    if (fish.id === "raw_awabi_snail") {
      const t = Math.max(0, Math.min(1, (skill.level - 5) / 94));
      const chance = 0.44 + t * (0.99 - 0.44);
      if (Math.random() > chance) return { kind: "ok", text: "The snail got away." };
    }
    let qty = 1;
    if (fish.id === "raw_awabi_snail") qty = 1 + Math.min(21, Math.floor(skill.level / 5));
    if (!Idle.systems.inventory.add(state.slots, fish.id, qty)) {
      state.activity = null;
      return { kind: "full", text: "Inventory is full. Fishing stopped." };
    }
    const levels = Idle.systems.xp.grant(skill, fish.xp);
    let text = `Caught ${qty > 1 ? qty + " " : ""}${fish.name} (+${fish.xp} xp).`;
    if (levels > 0) text += ` Fishing is now level ${skill.level}.`;
    return { kind: levels > 0 ? "level" : "mine", text };
  },
};
