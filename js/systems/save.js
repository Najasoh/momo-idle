window.Idle = window.Idle || {};
Idle.systems = Idle.systems || {};

Idle.systems.save = {
  load() {
    try {
      const raw = localStorage.getItem(Idle.config.saveKey);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  },

  write(state) {
    const payload = {
      gold: state.gold,
      slots: state.slots,
      skills: state.skills,
      active: state.active,
      activity: state.activity,
      equipment: state.equipment,
      combatSkills: state.combatSkills,
      style: state.style,
      lockUntil: state.lockUntil,
      grave: state.grave,
      prices: state.prices,
      orders: state.orders,
      sales: state.sales,
      mail: state.mail,
      place: state.place,
      town: state.town,
      quests: state.quests,
      questPoints: state.questPoints,
      passives: state.passives,
      bank: state.bank,
      store: state.store,
      seenMobs: state.seenMobs,
      seenItems: state.seenItems,
      hops: state.hops,
    };
    localStorage.setItem(Idle.config.saveKey, JSON.stringify(payload));
  },

  clear() {
    localStorage.removeItem(Idle.config.saveKey);
  },
};
