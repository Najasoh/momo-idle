/* Profession XP. Requirement to leave `level` is base * scale^(level-1). */
window.Idle = window.Idle || {};
Idle.systems = Idle.systems || {};

Idle.systems.xp = {
  requirement(level) {
    const { baseXpToLevel, xpScale } = Idle.config;
    return baseXpToLevel * Math.pow(xpScale, level - 1);
  },

  /* Add XP. Returns how many levels were gained. Overflow carries. */
  grant(skill, amount) {
    skill.xp += amount;
    let gained = 0;
    let need = this.requirement(skill.level);
    while (skill.xp >= need) {
      skill.xp -= need;
      skill.level += 1;
      gained += 1;
      need = this.requirement(skill.level);
    }
    skill.xpToNext = need;
    return gained;
  },

  sync(skill) {
    skill.xpToNext = this.requirement(skill.level);
  },
};
