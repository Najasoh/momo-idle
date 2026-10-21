/* Equipment slots. A selected slot glows red. Weapons may dual wield.
   A shield only fits the offhand. A 2h weapon locks the offhand. */
window.Idle = window.Idle || {};
Idle.systems = Idle.systems || {};

Idle.systems.equipment = {
  slots: [
    { id: "helm", name: "Helmet", accepts: ["helm"] },
    { id: "cape", name: "Cape", accepts: ["cape"] },
    { id: "neck", name: "Neck", accepts: ["neck"] },
    { id: "ammo", name: "Ammo", accepts: ["ammo"] },
    { id: "weapon", name: "Main hand", accepts: ["weapon"] },
    { id: "body", name: "Chest", accepts: ["body"] },
    { id: "shield", name: "Offhand", accepts: ["weapon", "shield"] },
    { id: "legs", name: "Legs", accepts: ["legs"] },
    { id: "gloves", name: "Gloves", accepts: ["gloves"] },
    { id: "boots", name: "Boots", accepts: ["boots"] },
    { id: "ring", name: "Ring", accepts: ["ring"] },
  ],

  empty() {
    return {
      helm: null, cape: null, neck: null, ammo: null, weapon: null,
      body: null, shield: null, legs: null, gloves: null, boots: null, ring: null,
    };
  },

  item(id) {
    return Idle.systems.inventory.catalog()[id] || null;
  },

  twoHanded(gear) {
    const weapon = gear.weapon ? this.item(gear.weapon) : null;
    return Boolean(weapon && weapon.hands === 2);
  },

  canEquip(gear, slotId, item) {
    const slot = this.slots.find((entry) => entry.id === slotId);
    if (!slot || !item || !item.equip) return false;
    if (!slot.accepts.includes(item.equip)) return false;
    if (slotId === "shield" && item.equip === "shield" && gear.shield && gear.shield !== item.id) return true;
    if (slotId === "shield" && this.twoHanded(gear)) return false;
    if (item.equip === "weapon" && item.hands === 2 && slotId !== "weapon") return false;
    return true;
  },

  /* Moves one item from an inventory stack into the slot. Returns an error string or "". */
  equip(state, slotId, inventoryIndex) {
    const stack = state.slots[inventoryIndex];
    const item = stack ? this.item(stack.id) : null;
    if (!this.canEquip(state.equipment, slotId, item)) return "That does not fit this slot.";
    if (item.hands === 2 && state.equipment.shield) {
      if (!Idle.systems.inventory.add(state.slots, state.equipment.shield, 1)) return "No room to remove the offhand.";
      state.equipment.shield = null;
    }
    if (slotId === "shield" && item.equip === "shield" && state.equipment.shield) {
      /* only one shield; the old one returns to the pack */
    }
    const previous = state.equipment[slotId];
    if (previous) {
      if (!Idle.systems.inventory.add(state.slots, previous, 1)) return "No room to swap that piece.";
    }
    stack.qty -= 1;
    if (stack.qty <= 0) state.slots[inventoryIndex] = null;
    state.equipment[slotId] = item.id;
    return "";
  },

  unequip(state, slotId) {
    const id = state.equipment[slotId];
    if (!id) return "";
    if (!Idle.systems.inventory.add(state.slots, id, 1)) return "Inventory is full.";
    state.equipment[slotId] = null;
    return "";
  },
};
