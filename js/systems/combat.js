window.Idle = window.Idle || {};
Idle.systems = Idle.systems || {};

Idle.systems.combat = {
  createSkills() {
    const skill = () => ({ level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel });
    return {
      attack: skill(),
      strength: skill(),
      defence: skill(),
      ranged: skill(),
      magic: skill(),
      prayer: skill(),
      slayer: skill(),
      hitpoints: { level: 10, xp: 0, xpToNext: Idle.config.baseXpToLevel },
    };
  },

  level(skills) {
    const base = 0.25 * (skills.defence.level + skills.hitpoints.level + Math.floor(skills.prayer.level / 2));
    const melee = 0.325 * (skills.attack.level + skills.strength.level);
    const range = 0.325 * Math.floor(skills.ranged.level * 1.5);
    const magic = 0.325 * Math.floor(skills.magic.level * 1.5);
    return Math.round((base + Math.max(melee, range, magic)) * 10) / 10;
  },

  weapon() {
    const id = Idle.state.equipment.weapon;
    return id ? Idle.data.weaponStats[id] || null : null;
  },

  swingSeconds() {
    const weapon = this.weapon();
    return weapon ? weapon.speed : 2.4;
  },

  attackName() {
    const weapon = this.weapon();
    return weapon && weapon.attack ? weapon.attack : "crush";
  },

  styles() {
    const weapon = this.weapon();
    return weapon ? weapon.styles : ["accurate", "aggressive", "defensive"];
  },

  locked() {
    return Idle.state.lockUntil && Date.now() < Idle.state.lockUntil;
  },

  lockLeft() {
    return Math.max(0, Math.ceil((Idle.state.lockUntil - Date.now()) / 1000));
  },

  styleBonus(kind) {
    const style = Idle.data.meleeStyles[Idle.state.style] || Idle.data.meleeStyles.accurate;
    return (style.bonus && style.bonus[kind]) || 0;
  },

  totals() {
    const total = {
      stab: 0, slash: 0, crush: 0, magic: 0, range: 0,
      dstab: 0, dslash: 0, dcrush: 0, dmagic: 0, drange: 0,
      strength: 0, rangedStrength: 0, magicDamage: 0, prayer: 0,
      undead: 0, slayer: 0,
    };
    Object.values(Idle.state.equipment).forEach((id) => {
      const stats = id && Idle.data.weaponStats[id];
      const bonus = stats && stats.bonuses;
      if (!bonus) return;
      total.stab += bonus.stab || 0;
      total.slash += bonus.slash || 0;
      total.crush += bonus.crush || 0;
      total.magic += bonus.magic || 0;
      total.range += bonus.range || 0;
      total.dstab += bonus.dstab || 0;
      total.dslash += bonus.dslash || 0;
      total.dcrush += bonus.dcrush || 0;
      total.dmagic += bonus.magicDefence || 0;
      total.drange += bonus.drange || 0;
      total.strength += bonus.strength || 0;
      total.rangedStrength += bonus.rangedStrength || 0;
      total.magicDamage += bonus.magicDamage || 0;
      total.prayer += bonus.prayer || 0;
      total.undead += bonus.undead || 0;
      total.slayer += bonus.slayer || 0;
    });
    return total;
  },

  gearBonus(key) {
    const total = this.totals();
    if (key === "magicDefence") return total.dmagic;
    return total[key] || 0;
  },

  maxHit(level, bonus, styleKind) {
    const effective = level + this.styleBonus(styleKind) + 8;
    return Math.floor(0.5 + (effective * (bonus + 64)) / 640);
  },

  hitChance(attackRoll, defenceRoll) {
    if (attackRoll > defenceRoll) return 1 - (defenceRoll + 2) / (2 * (attackRoll + 1));
    return attackRoll / (2 * (defenceRoll + 1));
  },

  roll(max, chance) {
    if (Math.random() > chance) return 0;
    return Math.floor(Math.random() * (max + 1));
  },

  playerHit(mob) {
    const skills = Idle.state.combatSkills;
    const attackType = this.attackName();
    const effectiveAttack = skills.attack.level + this.styleBonus("attack") + 8;
    const attackRoll = effectiveAttack * (this.gearBonus(attackType) + 64);
    const effectiveDefence = mob.defence + 8;
    const defenceRoll = effectiveDefence * ((mob.meleeDefence[attackType] || 0) + 64);
    const max = this.maxHit(skills.strength.level, this.gearBonus("strength"), "strength");
    return { damage: this.roll(max, this.hitChance(attackRoll, defenceRoll)), max };
  },

  monsterHit(mob) {
    const skills = Idle.state.combatSkills;
    const effectiveAttack = mob.attack + 8;
    const attackRoll = effectiveAttack * ((mob.aggressive[mob.style] || 0) + 64);
    const effectiveDefence = skills.defence.level + this.styleBonus("defence") + 8;
    const defenceRoll = effectiveDefence * (this.gearBonus(mob.style) + 64);
    const max = Math.floor(0.5 + ((mob.strength + 8) * (((mob.aggressive.strength || 0) + 64)) ) / 640);
    return { damage: this.roll(max, this.hitChance(attackRoll, defenceRoll)), max };
  },

  grantDamageXp(damage) {
    const style = Idle.data.meleeStyles[Idle.state.style] || Idle.data.meleeStyles.accurate;
    if (damage <= 0) return `${Idle.state.style}: no xp`;
    const parts = [];
    Object.entries(style.xp).forEach(([skill, amount]) => {
      const gained = Math.round(amount * damage * 100) / 100;
      Idle.systems.xp.grant(Idle.state.combatSkills[skill], gained);
      parts.push(`+${gained} ${skill}`);
    });
    return `${Idle.state.style}: ${parts.join(", ")}`;
  },

  vaultMobs() {
    return Idle.data.mobs.filter((mob) => mob.area === "vault");
  },

  catacombMobs() {
    return Idle.data.mobs.filter((mob) => mob.area === "catacomb");
  },

  pestilenceMobs() {
    return Idle.data.mobs.filter((mob) => mob.area === "pestilence");
  },

  sepulchreMobs() {
    return Idle.data.mobs.filter((mob) => mob.area === "sepulchre");
  },

  weightedPick(mobs) {
    const total = mobs.reduce((sum, mob) => sum + (mob.spawns || 1), 0);
    let roll = Math.random() * total;
    return mobs.find((mob) => { roll -= mob.spawns || 1; return roll <= 0; }) || mobs[0];
  },

  rollQty(drop) {
    if (drop.min !== undefined) return drop.min + Math.floor(Math.random() * (drop.max - drop.min + 1));
    return drop.qty || 1;
  },

  rollLoot(mob) {
    const names = [];
    const give = (id, qty) => {
      if (id === "coins") {
        Idle.systems.inventory.add(Idle.state.slots, "coins", qty);
        names.push(`${qty} coins`);
        return;
      }
      if (Idle.systems.inventory.add(Idle.state.slots, id, qty)) names.push(`${qty} ${id.replaceAll("_", " ")}`);
    };
    (mob.drops || []).forEach((drop) => give(drop.id, this.rollQty(drop)));
    (mob.table || []).forEach((drop) => {
      if (drop.chance && Math.random() >= drop.chance) return;
      give(drop.id, this.rollQty(drop));
    });
    if (mob.id === "gardener" && Idle.state.questProgress && Idle.state.questProgress.pirates_treasure && !Idle.state.quests.pirates_treasure) {
      if (Math.random() < 0.1) {
        give("one_eyed_hectors_treasure", 1);
        Idle.state.quests.pirates_treasure = true;
        Idle.state.questPoints = (Idle.state.questPoints || 0) + 2;
        Idle.state.questComplete = { name: "Pirate's Treasure", lines: ["2 Quest Points", "One-eyed Hector's treasure"] };
      }
    }
    if (mob.id === "rat" && Idle.state.questProgress && Idle.state.questProgress.witchs_potion && !Idle.state.quests.witchs_potion) {
      if (Math.random() < 0.5) give("rats_tail", 1);
    }
    if (Math.random() < (mob.gemChance || 0)) {
      const table = Idle.data.gemTable || [];
      const total = table.reduce((sum, gem) => sum + gem.weight, 0);
      let roll = Math.random() * total;
      const gem = table.find((entry) => { roll -= entry.weight; return roll <= 0; });
      if (gem && gem.id !== "nothing") give(gem.id, 1);
    }
    if (mob.runeTable) {
      const table = Idle.data.runeTable || [];
      const total = table.reduce((sum, r) => sum + r.weight, 0);
      let roll = Math.random() * total;
      const rune = table.find((entry) => { roll -= entry.weight; return roll <= 0; });
      if (rune) give(rune.id, Math.floor(Math.random() * 8) + 1);
    }
    if (mob.coinTable) {
      const table = Idle.data.coinTable || [];
      const total = table.reduce((sum, c) => sum + c.weight, 0);
      let roll = Math.random() * total;
      const coins = table.find((entry) => { roll -= entry.weight; return roll <= 0; });
      if (coins) give("coins", coins.qty);
    }
    if (mob.slayerXp) {
      const levels = Idle.systems.xp.grant(Idle.state.combatSkills.slayer, mob.slayerXp);
      names.push(`+${mob.slayerXp} slayer${levels ? `, Slayer ${Idle.state.combatSkills.slayer.level}` : ""}`);
    }
    return names;
  },

  mobById(id) {
    return Idle.data.mobs.find((mob) => mob.id === id) || null;
  },
};
