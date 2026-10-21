/* Crafting stations and recipes. */
window.Idle = window.Idle || {};
Idle.data = Idle.data || {};

Idle.data.craftingStations = [
  { id: "spinning_wheel", name: "Spinning wheel", note: "Spin wool into balls" },
];

Idle.data.craftingItems = [
  { id: "shears", name: "Shears", sell: 0, swatch: "#8a8f96" },
  { id: "wool", name: "Wool", sell: 15, swatch: "#e6e0d2" },
  { id: "ball_of_wool", name: "Ball of wool", sell: 60, swatch: "#d7c4a8" },
  { id: "flax", name: "Flax", sell: 2, swatch: "#c9b18a" },
  { id: "flax_seed", name: "Flax seed", sell: 11, swatch: "#8a6a3b" },
  { id: "bow_string", name: "Bow string", sell: 252, swatch: "#d7c4a8" },
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
];
