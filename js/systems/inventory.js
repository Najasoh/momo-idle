/* 31-slot inventory. Identical items stack in one slot. */
window.Idle = window.Idle || {};
Idle.systems = Idle.systems || {};

Idle.systems.inventory = {
  emptySlots() {
    return Array.from({ length: Idle.config.inventorySlots }, () => null);
  },

  findStack(slots, itemId) {
    return slots.findIndex((slot) => slot && slot.id === itemId);
  },

  firstEmpty(slots) {
    return slots.findIndex((slot) => slot === null);
  },

  usedCount(slots) {
    return slots.filter(Boolean).length;
  },

  /* Returns true if the item was stored. */
  add(slots, itemId, qty = 1) {
    if (itemId === "looting_bag" && this.count(slots, "looting_bag") >= 1) return false;
    const existing = this.findStack(slots, itemId);
    if (existing !== -1) {
      slots[existing].qty += qty;
      Idle.state.seenItems = Idle.state.seenItems || {};
      Idle.state.seenItems[itemId] = true;
      return true;
    }
    const empty = this.firstEmpty(slots);
    if (empty === -1) return false;
    slots[empty] = { id: itemId, qty };
    Idle.state.seenItems = Idle.state.seenItems || {};
    Idle.state.seenItems[itemId] = true;
    return true;
  },

  count(slots, itemId) {
    return slots.reduce((total, slot) => total + (slot && slot.id === itemId ? slot.qty : 0), 0);
  },

  removeQty(slots, itemId, qty) {
    let left = qty;
    for (let i = 0; i < slots.length && left > 0; i += 1) {
      if (!slots[i] || slots[i].id !== itemId) continue;
      const take = Math.min(slots[i].qty, left);
      slots[i].qty -= take;
      left -= take;
      if (slots[i].qty <= 0) slots[i] = null;
    }
    return left === 0;
  },

  move(slots, from, to) {
    if (from === to || from < 0 || to < 0) return;
    const source = slots[from];
    const target = slots[to];
    if (!source) return;
    if (target && target.id === source.id) {
      target.qty += source.qty;
      slots[from] = null;
      return;
    }
    slots[from] = target;
    slots[to] = source;
  },

  removeSlot(slots, index) {
    const slot = slots[index];
    slots[index] = null;
    return slot;
  },

  catalog() {
    const map = {};
    for (const node of Idle.data.miningNodes) map[node.id] = node;
    for (const gem of Idle.data.gemTable || []) {
      if (gem.id !== "nothing") map[gem.id] = gem;
    }
    for (const bar of Idle.data.smithingBars || []) map[bar.id] = bar;
    for (const item of Idle.data.anvilItems || []) map[item.id] = item;
    for (const item of Idle.data.cookingItems || []) map[item.id] = item;
    for (const recipe of Idle.data.cookingRecipes || []) map[recipe.id] = recipe;
    for (const spot of Idle.data.fishingSpots || []) map[spot.id] = spot;
    for (const fish of Idle.data.fishingFish || []) map[fish.id] = fish;
    for (const tool of Idle.data.fishingTools || []) map[tool.id] = tool;
    for (const item of Idle.data.craftingItems || []) map[item.id] = item;
    for (const recipe of Idle.data.craftingRecipes || []) map[recipe.id] = recipe;
    for (const item of Idle.data.fletchingItems || []) map[item.id] = item;
    for (const recipe of Idle.data.fletchingRecipes || []) map[recipe.id] = recipe;
    for (const drop of Idle.data.combatDrops || []) map[drop.id] = drop;
    return map;
  },
};
