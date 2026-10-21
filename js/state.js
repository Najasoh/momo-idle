window.Idle = window.Idle || {};

Idle.state = {
  gold: 0,
  slots: Idle.systems.inventory.emptySlots(),
  bag: Array.from({ length: 28 }, () => null),
  prices: {},
  orders: [],
  mail: [],
  place: "lumbridge",
  town: "lumbridge",
  quests: {},
  questPoints: 0,
  passives: [],
  combine: Array.from({ length: 8 }, () => null),
  deposit: [],
  skills: {
    mining: Idle.professions.mining.createSkill(),
    smithing: Idle.professions.smithing.createSkill(),
    cooking: Idle.professions.cooking.createSkill(),
    fishing: Idle.professions.fishing.createSkill(),
    crafting: Idle.professions.crafting.createSkill(),
    sailing: Idle.professions.sailing.createSkill(),
    woodcutting: Idle.professions.woodcutting.createSkill(),
    firemaking: Idle.professions.firemaking.createSkill(),
    farming: Idle.professions.farming.createSkill(),
    fletching: Idle.professions.fletching.createSkill(),
    slayer: { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel },
  },
  combatSkills: Idle.systems.combat.createSkills(),
  style: "accurate",
  lockUntil: 0,
  grave: null,
  fight: null,
  active: {
    mining: null,
  },
  activity: null,
  screen: "hub",
  equipment: Idle.systems.equipment.empty(),
  selectedEquip: null,
  log: [],
  running: true,

  pushLog(entry) {
    this.log.unshift({ ...entry, at: Date.now() });
    this.log = this.log.slice(0, 8);
  },

  sellSlot(index) {
    const slot = this.slots[index];
    if (!slot) return;
    const item = Idle.systems.inventory.catalog()[slot.id];
    if (!item || item.sell <= 0) return;
    const payout = item.sell * slot.qty;
    this.gold += payout;
    Idle.systems.inventory.removeSlot(this.slots, index);
    if (this.selectedSlot === index) this.selectedSlot = null;
    this.pushLog({
      kind: "sell",
      text: `Sold ${slot.qty} ${item.name} for ${payout} gp.`,
    });
  },

  sellAll() {
    let payout = 0;
    let count = 0;
    const catalog = Idle.systems.inventory.catalog();
    this.slots.forEach((slot, index) => {
      if (!slot) return;
      const item = catalog[slot.id];
      if (!item || item.sell <= 0) return;
      payout += item.sell * slot.qty;
      count += slot.qty;
      this.slots[index] = null;
    });
    this.selectedSlot = null;
    if (!count) return;
    this.gold += payout;
    this.pushLog({ kind: "sell", text: `Sold ${count} items for ${payout} gp.` });
  },
};

Idle.boot = function boot() {
  const saved = Idle.systems.save.load();
  if (!saved) return;
  Idle.state.gold = saved.gold || 0;
  if (Array.isArray(saved.slots) && saved.slots.length === Idle.config.inventorySlots) {
    Idle.state.slots = saved.slots;
  }
  if (saved.skills && saved.skills.mining) {
    Idle.state.skills.mining = {
      level: saved.skills.mining.level || 1,
      xp: saved.skills.mining.xp || 0,
      xpToNext: Idle.config.baseXpToLevel,
    };
    Idle.systems.xp.sync(Idle.state.skills.mining);
  }
  if (saved.skills && saved.skills.smithing) {
    Idle.state.skills.smithing = {
      level: saved.skills.smithing.level || 1,
      xp: saved.skills.smithing.xp || 0,
      xpToNext: Idle.config.baseXpToLevel,
    };
    Idle.systems.xp.sync(Idle.state.skills.smithing);
  }
  if (saved.skills && saved.skills.cooking) {
    Idle.state.skills.cooking = {
      level: saved.skills.cooking.level || 1,
      xp: saved.skills.cooking.xp || 0,
      xpToNext: Idle.config.baseXpToLevel,
    };
    Idle.systems.xp.sync(Idle.state.skills.cooking);
  }
  if (!Idle.state.skills.fishing) Idle.state.skills.fishing = Idle.professions.fishing.createSkill();
  if (!Idle.state.skills.crafting) Idle.state.skills.crafting = Idle.professions.crafting.createSkill();
  if (!Idle.state.skills.slayer) Idle.state.skills.slayer = { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
  if (!Idle.state.skills.farming) Idle.state.skills.farming = Idle.professions.farming.createSkill();
  if (!Idle.state.skills.fletching) Idle.state.skills.fletching = Idle.professions.fletching.createSkill();
  if (!Idle.state.hops) Idle.state.hops = { crop: null, plantedAt: 0 };
  if (!Idle.state.seenMobs) Idle.state.seenMobs = {};
  if (!Idle.state.bank) Idle.state.bank = [];
  if (Array.isArray(saved.bank)) Idle.state.bank = saved.bank;
  if (saved.store) Idle.state.store = saved.store;
  if (saved.seenMobs) Idle.state.seenMobs = saved.seenMobs;
  if (saved.seenItems) Idle.state.seenItems = saved.seenItems;
  if (saved.hops) Idle.state.hops = saved.hops;
  if (!Idle.state.goblinKills) Idle.state.goblinKills = 0;
  if (saved.skills && saved.skills.fishing) {
    Idle.state.skills.fishing = {
      level: saved.skills.fishing.level || 1,
      xp: saved.skills.fishing.xp || 0,
      xpToNext: Idle.config.baseXpToLevel,
    };
    Idle.systems.xp.sync(Idle.state.skills.fishing);
  }
  Idle.state.active.mining = saved.active && saved.active.mining ? saved.active.mining : null;
  Idle.state.activity = saved.activity || (Idle.state.active.mining ? { profession: "mining", id: Idle.state.active.mining } : null);
  if (saved.equipment) Idle.state.equipment = { ...Idle.systems.equipment.empty(), ...saved.equipment };
  if (saved.combatSkills) {
    Idle.state.combatSkills = Idle.systems.combat.createSkills();
    Object.keys(Idle.state.combatSkills).forEach((key) => {
      const savedSkill = saved.combatSkills[key];
      if (!savedSkill) return;
      Idle.state.combatSkills[key].level = savedSkill.level;
      Idle.state.combatSkills[key].xp = savedSkill.xp || 0;
      Idle.systems.xp.sync(Idle.state.combatSkills[key]);
    });
  }
  Idle.state.style = saved.style || "accurate";
  Idle.state.lockUntil = saved.lockUntil || 0;
  Idle.state.grave = saved.grave || null;
  Idle.state.prices = saved.prices || {};
  Idle.state.place = saved.place || "town";
  Idle.state.quests = saved.quests || {};
  Idle.state.town = saved.town || "lumbridge";
  Idle.state.questPoints = saved.questPoints || 0;
  Idle.state.passives = saved.passives || [];
  Idle.state.sales = saved.sales || [];
  Idle.state.mail = saved.mail || [];
  Idle.state.gender = saved.gender || "male";
};
