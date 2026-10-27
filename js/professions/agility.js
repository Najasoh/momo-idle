Idle.professions.agility = {
  createSkill() {
    return { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
  },
  nodeById(id) {
    return Idle.data.agility.courses.find((c) => c.id === id);
  },
  tick(state) {
    const course = this.nodeById(state.activity.id);
    if (!course) return { kind: "idle", text: "No course." };
    const step = state.activity.step || 0;
    const obstacle = course.obstacles[step];
    if (!obstacle) {
      state.activity.step = 0;
      if (Math.random() < course.mark) Idle.systems.inventory.add(state.slots, "mark_of_grace", 1);
      return { kind: "level", text: `${course.name} complete.` };
    }
    if (obstacle.fail && Math.random() < obstacle.fail) {
      if (obstacle.dmg) {
        const dmg = 1 + Math.floor(Math.random() * 5);
        Idle.state.hp = Math.max(0, (Idle.state.hp || Idle.state.combatSkills.hitpoints.level) - dmg);
        if (Idle.state.hp <= 0 && Idle.ui && Idle.ui.playerDown) Idle.ui.playerDown(performance.now());
      }
      state.activity = null;
      return { kind: "full", text: `Failed ${obstacle.name}.` };
    }
    const skill = state.skills.agility;
    const levels = Idle.systems.xp.grant(skill, obstacle.xp);
    state.activity.step = step + 1;
    if (state.activity.step >= course.obstacles.length) {
      state.activity = null;
      return { kind: "level", text: `${course.name} complete.` };
    }
    return { kind: "pick", text: `${obstacle.name} +${obstacle.xp} agility${levels ? `, Agility ${skill.level}` : ""}` };
  },
};
