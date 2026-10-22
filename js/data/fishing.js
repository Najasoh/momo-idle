/* Fishing spots. Catch time scales with fish level from 3s to 8s. */
window.Idle = window.Idle || {};
Idle.data = Idle.data || {};

Idle.data.fishingTools = [
  { id: "small_fishing_net", name: "Small fishing net", sell: 25, swatch: "#8a6a3b" },
  { id: "cave_small_fishing_net", name: "Cave small fishing net", sell: 25, swatch: "#6e7d92" },
  { id: "lobster_pot", name: "Lobster pot", sell: 181, swatch: "#b4483a" },
  { id: "harpoon", name: "Harpoon", sell: 97, swatch: "#8d9aa8" },
  { id: "fly_fishing_rod", name: "Fly fishing rod", sell: 99, swatch: "#8a6a3b" },
  { id: "feather", name: "Feather", sell: 0, swatch: "#e6e0d2" },
  { id: "fishing_rod", name: "Fishing rod", sell: 99, swatch: "#8a6a3b" },
];

const fish = (id, name, level, xp, sell, swatch) => ({ id, name, level, xp, sell, swatch });

Idle.data.fishingFish = [
  fish("raw_shrimp", "Raw shrimp", 1, 10, 26, "#e07a6a"),
  fish("raw_sardine", "Raw sardine", 5, 20, 27, "#b7c4ce"),
  fish("raw_guppy", "Raw guppy", 7, 12, 0, "#7d9a6a"),
  fish("raw_herring", "Raw herring", 10, 30, 213, "#8fa7b5"),
  fish("raw_anchovies", "Raw anchovies", 15, 15, 19, "#c9b18a"),
  fish("raw_trout", "Raw trout", 20, 50, 53, "#d2a679"),
  fish("raw_cavefish", "Raw cavefish", 20, 23, 0, "#6e7d92"),
  fish("raw_pike", "Raw pike", 25, 60, 96, "#8aa0b5"),
  fish("raw_salmon", "Raw salmon", 30, 70, 32, "#d07a62"),
  fish("raw_tetra", "Raw tetra", 33, 31, 0, "#c9a24a"),
  fish("raw_tuna", "Raw tuna", 35, 80, 42, "#c45b5b"),
  fish("raw_lobster", "Raw lobster", 40, 90, 124, "#b4483a"),
  fish("raw_swordfish", "Raw swordfish", 50, 100, 215, "#8d9aa8"),
];

Idle.data.fishingSpots = [
  {
    id: "net",
    name: "Small fishing net",
    tool: "small_fishing_net",
    area: "shore",
    fish: ["raw_shrimp", "raw_guppy", "raw_anchovies"],
  },
  {
    id: "cave_net",
    name: "Cave small fishing net",
    tool: "cave_small_fishing_net",
    area: "cave",
    fish: ["raw_cavefish", "raw_tetra"],
  },
  {
    id: "lobster",
    name: "Lobster pot",
    tool: "lobster_pot",
    area: "shore",
    fish: ["raw_lobster"],
  },
  {
    id: "harpoon",
    name: "Harpoon",
    tool: "harpoon",
    area: "shore",
    barbarian: true,
    fish: ["raw_tuna", "raw_swordfish"],
  },
  {
    id: "fly",
    name: "Fly fishing",
    tool: "fly_fishing_rod",
    consume: "feather",
    area: "shore",
    fish: ["raw_trout", "raw_salmon"],
  },
  {
    id: "rod",
    name: "Fishing rod",
    tool: "fishing_rod",
    consume: "fishing_bait",
    area: "shore",
    fish: ["raw_sardine", "raw_herring", "raw_pike"],
  },
];
