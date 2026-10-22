/* Rolled after a successful mine. 1/256 to open the table, then one outcome.
   Weights are the usual mining gem table: 64 sapphire, 32 emerald, 16 ruby, 8 diamond, 8 nothing. */
window.Idle = window.Idle || {};
Idle.data = Idle.data || {};

Idle.data.runeTable = [
  { id: "air_rune", weight: 64 },
  { id: "water_rune", weight: 32 },
  { id: "earth_rune", weight: 32 },
  { id: "fire_rune", weight: 32 },
  { id: "mind_rune", weight: 16 },
  { id: "body_rune", weight: 16 },
  { id: "chaos_rune", weight: 8 },
  { id: "nature_rune", weight: 4 },
  { id: "law_rune", weight: 4 },
  { id: "cosmic_rune", weight: 2 },
  { id: "death_rune", weight: 2 },
  { id: "blood_rune", weight: 1 },
];

Idle.data.coinTable = [
  { qty: 3, weight: 64 },
  { qty: 5, weight: 32 },
  { qty: 10, weight: 16 },
  { qty: 15, weight: 8 },
  { qty: 25, weight: 4 },
  { qty: 50, weight: 2 },
];

Idle.data.gemTable = [
  {
    id: "uncut_sapphire",
    name: "Uncut sapphire",
    sell: 196,
    weight: 64,
    swatch: "#3d6fbf",
    blurb: "Gem drop.",
  },
  {
    id: "uncut_emerald",
    name: "Uncut emerald",
    sell: 394,
    weight: 32,
    swatch: "#3e9a55",
    blurb: "Gem drop.",
  },
  {
    id: "uncut_ruby",
    name: "Uncut ruby",
    sell: 975,
    weight: 16,
    swatch: "#b33b4a",
    blurb: "Gem drop.",
  },
  {
    id: "uncut_diamond",
    name: "Uncut diamond",
    sell: 2245,
    weight: 8,
    swatch: "#e8eef5",
    blurb: "Gem drop.",
  },
  {
    id: "nothing",
    name: "Nothing",
    weight: 8,
  },
];
