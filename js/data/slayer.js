/* Slayer tasks. Add a mob id from combat.js to unlock it here. level is the bracket. */
window.Idle = window.Idle || {};
Idle.data = Idle.data || {};

Idle.data.slayerTasks = [
  { id: "cow", level: 1 },
  { id: "chicken", level: 1 },
  { id: "goblin", level: 1 },
  { id: "rat", level: 1 },
  { id: "giant_rat", level: 1 },
  { id: "goblin_lvl2", level: 1 },
  { id: "scorpion_14", level: 10 },
];

Idle.data.slayerItems = [
  { id: "slayer_task_1", name: "Slayer Task Level 1", sell: 0, noGe: true, swatch: "#c9a24a", desc: "Accept a random level 1 slayer task." },
  { id: "slayer_coin", name: "Slayer coin", sell: 0, noGe: true, swatch: "#e6c24a", desc: "Reward for finishing a slayer task." },
  { id: "apprentice_slayer_cap", name: "Apprentice's slayer cap", sell: 0, noGe: true, swatch: "#6a8a6a", equip: "helm", req: { slayer: 10, defence: 10 }, desc: "A starter slayer helm." },
];