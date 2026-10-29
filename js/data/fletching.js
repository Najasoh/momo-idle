/* Fletching recipes. */
window.Idle = window.Idle || {};
Idle.data = Idle.data || {};

Idle.data.fletchingItems = [
  { id: "arrow_shaft", name: "Arrow shaft", sell: 1, swatch: "#c9b18a" },
  { id: "headless_arrow", name: "Headless arrow", sell: 12, swatch: "#d7c4a8" },
  { id: "shortbow", name: "Shortbow", sell: 260, swatch: "#8a6a3b", equip: "weapon", hands: 2 },
];

Idle.data.fletchingRecipes = [
  {
    id: "arrow_shaft", name: "Arrow shaft",
    level: 1,
    xp: 5,
    seconds: 1.2,
    qty: 15,
    cost: { logs: 1 },
    sell: 1,
    swatch: "#c9b18a",
  },
  {
    id: "headless_arrow",
    name: "Headless arrow",
    level: 1,
    xp: 15,
    seconds: 1.2,
    qty: 15,
    cost: { arrow_shaft: 15, feather: 15 },
    sell: 12,
    swatch: "#d7c4a8",
  },
  {
    id: "shortbow",
    name: "Shortbow",
    level: 5,
    xp: 5,
    seconds: 1.8,
    qty: 1,
    cost: { logs: 1 },
    sell: 260,
    swatch: "#8a6a3b",
    equip: "weapon",
    hands: 2,
  },
];
