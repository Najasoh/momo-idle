Idle.professions.thieving = {
  createSkill() {
    return { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
  },
  nodeById(id) {
    return Idle.data.thieving.targets.find((t) => t.id === id) || Idle.data.thieving.stalls.find((s) => s.id === id);
  },
  tick(state) {
    const node = this.nodeById(state.activity.id);
    if (!node) return { kind: "idle", text: "Nothing." };
    const skill = state.skills.thieving;
    const rate = node.success ? this.success(node) : (1 - (node.fail || 0));
    if (Math.random() > rate) {
      const dmg = node.damage || 1;
      state.hp = Math.max(0, (state.hp || state.combatSkills.hitpoints.level) - dmg);
      this.gasp(node.id);
      state.activity.phase = "stun";
      state.activity.until = performance.now() + 5000;
      return { kind: "full", text: `Stunned. -${dmg} hp.` };
    }
    const levels = Idle.systems.xp.grant(skill, node.xp);
    (node.loot || []).forEach((drop) => Idle.systems.inventory.add(state.slots, drop.id, drop.qty));
    if (node.pet && Math.random() < node.pet) Idle.systems.inventory.add(state.slots, "thiefy", 1);
    const walk = 1000 + Math.random() * 2000;
    state.activity.phase = "walk";
    state.activity.until = performance.now() + walk;
    return { kind: "pick", text: `+${node.xp} thieving${levels ? `, Thieving ${skill.level}` : ""}` };
  },
  gasp(id) {
    const male = ["gasp1m", "gasp1mb", "gasp1ml"];
    const female = ["gasp1f", "gasp1fb", "gasp1fl"];
    let pool = male.concat(female);
    if (id === "man") pool = male;
    if (id === "woman") pool = female;
    Idle.systems.sound.play(pool[Math.floor(Math.random() * pool.length)], false);
  },
  success(target) {
    const level = (Idle.state.skills.thieving && Idle.state.skills.thieving.level) || 1;
    if (target.perfect && level >= target.perfect) return 1;
    return target.success || 0.7;
  },
};
