window.Idle = window.Idle || {};
Idle.professions = Idle.professions || {};

Idle.professions.hunter = {
  id: "hunter",
  name: "Hunter",

  createSkill() {
    return { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
  },

  nodes() {
    return (Idle.data.hunterTraps || []).slice().sort((a, b) => (a.level || 1) - (b.level || 1));
  },

  nodeById(id) {
    return (Idle.data.hunterTraps || []).find((trap) => trap.id === id) || null;
  },

  maxTraps(level) {
    if (level >= 80) return 5;
    if (level >= 60) return 4;
    if (level >= 40) return 3;
    return 2;
  },

  catchChance(level) {
    const base = 0.39;
    const at99 = 1.64;
    return Math.min(1, base + ((level - 1) / 98) * (at99 - base));
  },

  catchSeconds() {
    const roll = Math.random();
    if (roll < 0.1) return 1 + Math.floor(Math.random() * 14);
    if (roll < 0.9) return 15 + Math.floor(Math.random() * 26);
    return 41 + Math.floor(Math.random() * 10);
  },

  tick(state) {
    if (!state.skills.hunter) state.skills.hunter = this.createSkill();
    const skill = state.skills.hunter;
    const trap = this.nodeById(state.activity && state.activity.id);
    if (!trap || state.activity.profession !== "hunter") return { kind: "idle", text: "Pick a trap." };
    if (skill.level < (trap.level || 1)) {
      state.activity = null;
      return { kind: "locked", text: `${trap.name} needs Hunter ${trap.level}.` };
    }
    const tool = trap.tool || "bird_snare";
    if (trap.cost && !state.batPaid) {
      if (Idle.systems.inventory.count(state.slots, "coins") < trap.cost) {
        state.activity = null;
        return { kind: "full", text: `Need ${trap.cost} coins to start hunting.` };
      }
      Idle.systems.inventory.removeQty(state.slots, "coins", trap.cost);
      state.batPaid = true;
      Idle.systems.sound.play("coins_cave01", false);
    }
    if (Idle.systems.inventory.count(state.slots, tool) < 1) {
      if (trap.cost) state.batPaid = false;
      if (trap.hurt) {
        state.hp = Math.max(0, (state.hp || 10) - trap.hurt);
        return { kind: "full", text: `No ${tool.replaceAll("_", " ")}. Took ${trap.hurt} damage.` };
      }
      state.activity = null;
      return { kind: "full", text: `Need a ${tool.replaceAll("_", " ")}.` };
    }
    if (trap.screech) {
      const helm = state.equipment && state.equipment.helm;
      const helmItem = helm && Idle.systems.inventory.catalog()[helm];
      const protected = helmItem && helmItem.protects === "screech";
      if (!protected) {
        state.hp = Math.max(0, (state.hp || 10) - trap.screech);
      }
    }
    let chance = this.catchChance(skill.level);
    if (trap.scale) {
      const [startLevel, startChance, endLevel, endChance] = trap.scale;
      const t = Math.max(0, Math.min(1, (skill.level - startLevel) / (endLevel - startLevel)));
      chance = startChance + t * (endChance - startChance);
    } else if (trap.chance) {
      chance = skill.level >= trap.chance[2] ? trap.chance[1] : trap.chance[0];
    }
    if (Math.random() > chance) {
      if (trap.failHurt) {
        if (tool === "noose_wand") {
          state.wandUses = (state.wandUses || 5) - 1;
          if (state.wandUses <= 0) {
            Idle.systems.inventory.removeQty(state.slots, "noose_wand", 1);
            state.wandUses = 5;
          }
        }
        state.hp = Math.max(0, (state.hp || 10) - trap.failHurt);
        return { kind: "ok", text: `Missed. Took ${trap.failHurt} crush damage.` };
      }
      return { kind: "ok", text: "Trap missed." };
    }
    if (tool === "noose_wand") {
      state.wandUses = (state.wandUses || 5) - 1;
      if (state.wandUses <= 0) {
        Idle.systems.inventory.removeQty(state.slots, "noose_wand", 1);
        state.wandUses = 5;
      }
    } else {
      Idle.systems.inventory.removeQty(state.slots, tool, 1);
    }
    Idle.systems.inventory.add(state.slots, trap.id, 1);
    const levels = Idle.systems.xp.grant(skill, trap.xp || 0);
    return { kind: "ok", text: `Caught ${trap.name}.`, levels };
  },
};
