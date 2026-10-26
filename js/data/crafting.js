/* Crafting stations and recipes. */
window.Idle = window.Idle || {};
Idle.data = Idle.data || {};

Idle.data.craftingStations = [
  { id: "spinning_wheel", name: "Spinning wheel", note: "Spin wool into balls" },
  { id: "needle", name: "Needle", note: "Sew leather" },
];

Idle.data.craftingItems = [
  { id: "shears", name: "Shears", sell: 0, swatch: "#8a8f96" },
  { id: "wool", name: "Wool", sell: 15, swatch: "#e6e0d2" },
  { id: "ball_of_wool", name: "Ball of wool", sell: 60, swatch: "#d7c4a8" },
  { id: "flax", name: "Flax", sell: 2, swatch: "#c9b18a" },
  { id: "flax_seed", name: "Flax seed", sell: 11, swatch: "#8a6a3b" },
  { id: "bow_string", name: "Bow string", sell: 252, swatch: "#d7c4a8" },
  { id: "needle", name: "Needle", sell: 106, swatch: "#8a8f96" },
  { id: "thread", name: "Thread", sell: 7, swatch: "#d7c4a8", uses: 5 },
  { id: "bolt_of_linen", name: "Bolt of linen", sell: 377, swatch: "#e6e0d2" },
  { id: "leather_gloves", name: "Leather gloves", sell: 12, swatch: "#8a6a3b", equip: "gloves" },
  { id: "leather_cowl", name: "Leather cowl", sell: 16, swatch: "#8a6a3b", equip: "helm" },
  { id: "leather_vambraces", name: "Leather vambraces", sell: 21, swatch: "#8a6a3b", equip: "gloves" },
  { id: "gem_pouch", name: "Gem pouch", sell: 0, swatch: "#6a8f9a" },
  { id: "leather_body", name: "Leather body", sell: 19, swatch: "#8a6a3b", equip: "body" },
  { id: "leather_chaps", name: "Leather chaps", sell: 8, swatch: "#8a6a3b", equip: "legs" },
  { id: "leather_cape", name: "Leather cape", sell: 800, swatch: "#8a6a3b", equip: "legs" },
];

Idle.data.craftingRecipes = [
  {
    id: "ball_of_wool",
    station: "spinning_wheel",
    name: "Ball of wool",
    level: 1,
    xp: 2.5,
    seconds: 1.8,
    cost: { wool: 1 },
    sell: 60,
    swatch: "#d7c4a8",
  },
  {
    id: "bow_string",
    station: "spinning_wheel",
    name: "Bow string",
    level: 10,
    xp: 15,
    seconds: 1.8,
    cost: { flax: 1 },
    sell: 252,
    swatch: "#d7c4a8",
  },
  { id: "leather_gloves", station: "needle", name: "Leather gloves", level: 1, xp: 13.8, seconds: 1.8, cost: { leather: 1, thread: 1 }, sell: 12, swatch: "#8a6a3b", equip: "gloves" },
  { id: "leather_boots", station: "needle", name: "Leather boots", level: 7, xp: 16.3, seconds: 1.8, cost: { leather: 1, thread: 1 }, sell: 58, swatch: "#8a6a3b", equip: "boots" },
  { id: "leather_cowl", station: "needle", name: "Leather cowl", level: 9, xp: 18.5, seconds: 1.8, cost: { leather: 1, thread: 1 }, sell: 16, swatch: "#8a6a3b", equip: "helm" },
  { id: "leather_vambraces", station: "needle", name: "Leather vambraces", level: 11, xp: 22, seconds: 1.8, cost: { leather: 1, thread: 1 }, sell: 21, swatch: "#8a6a3b", equip: "gloves" },
  { id: "gem_pouch", station: "needle", name: "Gem pouch", level: 12, xp: 25, seconds: 1.8, cost: { bolt_of_linen: 1, silk: 1, thread: 1 }, sell: 0, swatch: "#6a8f9a" },
  { id: "leather_body", station: "needle", name: "Leather body", level: 14, xp: 25, seconds: 1.8, cost: { leather: 1, thread: 1 }, sell: 19, swatch: "#8a6a3b", equip: "body" },
  { id: "leather_chaps", station: "needle", name: "Leather chaps", level: 18, xp: 27, seconds: 1.8, cost: { leather: 1, thread: 1 }, sell: 8, swatch: "#8a6a3b", equip: "legs" },
  { id: "leather_cape", station: "needle", name: "Leather cape", level: 1, xp: 27, seconds: 1.8, cost: { leather: 1, thread: 1 }, sell: 8, swatch: "#8a6a3b", equip: "cape" },
];
