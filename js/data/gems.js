/* Rolled after a successful mine. 1/256 to open the table, then one outcome.
   Weights are the usual mining gem table: 64 sapphire, 32 emerald, 16 ruby, 8 diamond, 8 nothing. */
window.Idle = window.Idle || {};
Idle.data = Idle.data || {};

Idle.data.gemChance = 1 / 256;

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
