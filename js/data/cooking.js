/* Cooking recipes. heal is hitpoints restored on consume. burnt items sell for 0. */
window.Idle = window.Idle || {};
Idle.data = Idle.data || {};

Idle.data.cookingItems = [
  { id: "cooked_meat", name: "Cooked meat", sell: 61, heal: 3, swatch: "#8a4b32" },
  { id: "burnt_meat", name: "Burnt meat", sell: 1, swatch: "#3a3532" },
  { id: "cooked_shrimp", name: "Cooked shrimp", sell: 30, heal: 3, swatch: "#d07a62" },
  { id: "burnt_shrimp", name: "Burnt shrimp", sell: 0, swatch: "#3a3532" },
  { id: "raw_bear_meat", name: "Raw bear meat", sell: 172, swatch: "#7a4038" },
  { id: "raw_boar_meat", name: "Raw boar meat", sell: 723, swatch: "#8d4e46" },
  { id: "raw_rat_meat", name: "Raw rat meat", sell: 47, swatch: "#a56a62" },
  { id: "raw_yak_meat", name: "Raw yak meat", sell: 234, swatch: "#6e5348" },
  { id: "raw_impaler_meat", name: "Raw impaler meat", sell: 113, swatch: "#9a5c4c" },
  { id: "raw_chicken", name: "Raw chicken", sell: 42, swatch: "#d7c4a8" },
  { id: "raw_anchovies", name: "Raw anchovies", sell: 19, swatch: "#c9b18a" },
  { id: "raw_sardine", name: "Raw sardine", sell: 27, swatch: "#b7c4ce" },
  { id: "raw_herring", name: "Raw herring", sell: 213, swatch: "#8fa7b5" },
  { id: "raw_guppy", name: "Raw guppy", sell: 5, swatch: "#7d9a6a", blurb: "Can be skinned for altars." },
  { id: "raw_t_bone_steak", name: "Raw t-bone steak", sell: 181, swatch: "#c45b5b" },
  { id: "raw_trout", name: "Raw trout", sell: 53, swatch: "#d2a679" },
  { id: "raw_pike", name: "Raw pike", sell: 96, swatch: "#8aa0b5" },
  { id: "raw_cavefish", name: "Raw cavefish", sell: 5, swatch: "#6e7d92", blurb: "Used for altars." },
  { id: "raw_salmon", name: "Raw salmon", sell: 32, swatch: "#d07a62" },
  { id: "raw_tuna", name: "Raw tuna", sell: 42, swatch: "#c45b5b" },
  { id: "raw_tetra", name: "Raw tetra", sell: 10, swatch: "#c9a24a", blurb: "Used for altars." },
  { id: "raw_lobster", name: "Raw lobster", sell: 124, swatch: "#b4483a" },
  { id: "raw_swordfish", name: "Raw swordfish", sell: 215, swatch: "#8d9aa8" },
];

Idle.data.altarFish = {
  raw_guppy: { seconds: 2.4, prayer: 4 },
  cooked_guppy: { seconds: 2.4, prayer: 4 },
  raw_cavefish: { seconds: 1.2, prayer: 7 },
  cooked_cavefish: { seconds: 1.2, prayer: 7 },
  raw_tetra: { seconds: 2.3, prayer: 10 },
  cooked_tetra: { seconds: 2.3, prayer: 10 },
  red_bird_egg: { seconds: 2.3, prayer: 100 },
  blue_bird_egg: { seconds: 2.3, prayer: 100 },
  green_bird_egg: { seconds: 2.3, prayer: 100 },
};

function food(id, name, level, xp, heal, sell, seconds, raw) {
  return {
    id, name, level, xp, heal, sell, respawn: seconds, burn: 0.4, stopBurn: 35,
    burnt: id.replace("cooked_", "burnt_"),
    swatch: "#8a4b32",
    alternatives: [raw],
    blurb: heal ? `Heals ${heal}.` : "Used for altars. Does not heal.",
  };
}

Idle.data.cookingRecipes = [
  {
    id: "cooked_meat", name: "Cooked meat", level: 1, xp: 30, heal: 3, sell: 61, respawn: 2.4,
    burn: 0.4, stopBurn: 35, burnt: "burnt_meat", swatch: "#8a4b32",
    alternatives: ["raw_beef", "raw_bear_meat", "raw_boar_meat", "raw_rat_meat", "raw_yak_meat", "raw_impaler_meat"],
    blurb: "Heals 3.",
  },
  food("cooked_shrimp", "Cooked shrimp", 1, 30, 3, 30, 2.4, "raw_shrimp"),
  food("cooked_chicken", "Cooked chicken", 1, 30, 3, 63, 0.6, "raw_chicken"),
  food("cooked_anchovies", "Cooked anchovies", 1, 30, 1, 34, 2.4, "raw_anchovies"),
  food("cooked_sardine", "Cooked sardine", 1, 40, 4, 18, 0.6, "raw_sardine"),
  food("cooked_herring", "Cooked herring", 5, 50, 5, 20, 2.4, "raw_herring"),
  food("cooked_guppy", "Cooked guppy", 7, 12, 0, 0, 2.4, "raw_guppy"),
  food("cooked_t_bone_steak", "Cooked t-bone steak", 13, 90, 9, 82, 2.4, "raw_t_bone_steak"),
  food("cooked_trout", "Cooked trout", 15, 70, 7, 21, 2.4, "raw_trout"),
  food("cooked_pike", "Cooked pike", 20, 80, 8, 49, 0.6, "raw_pike"),
  food("cooked_cavefish", "Cooked cavefish", 20, 23, 0, 0, 2.4, "raw_cavefish"),
  food("cooked_salmon", "Cooked salmon", 25, 90, 9, 33, 0.6, "raw_salmon"),
  food("cooked_tuna", "Cooked tuna", 30, 100, 10, 43, 2.4, "raw_tuna"),
  food("cooked_tetra", "Cooked tetra", 33, 31, 0, 0, 2.4, "raw_tetra"),
  food("cooked_lobster", "Cooked lobster", 40, 120, 12, 101, 2.4, "raw_lobster"),
  food("cooked_swordfish", "Cooked swordfish", 45, 140, 14, 216, 2.4, "raw_swordfish"),
];

Idle.data.cookingRecipes.forEach((recipe) => {
  if (!recipe.burnt) return;
  Idle.data.cookingItems.push({ id: recipe.burnt, name: recipe.name.replace("Cooked", "Burnt"), sell: 0, swatch: "#3a3532" });
});
