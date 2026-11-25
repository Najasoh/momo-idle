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
  { id: "trainee_slayer_scimitar", name: "Trainee slayer scimitar", sell: 0, noGe: true, swatch: "#8a7a4a", equip: "weapon", req: { attack: 10, slayer: 5 }, desc: "+5% accuracy on your slayer task." },
  { id: "trainee_slayer_hood", name: "Trainee slayer hood", sell: 0, noGe: true, swatch: "#6a7a5a", equip: "helm", req: { defence: 5 }, desc: "A trainee slayer hood." },
  { id: "trainee_slayer_jerkin", name: "Trainee slayer jerkin", sell: 0, noGe: true, swatch: "#6a7a5a", equip: "body", req: { defence: 5 }, desc: "A trainee slayer jerkin." },
  { id: "trainee_slayer_buckler", name: "Trainee slayer buckler", sell: 0, noGe: true, swatch: "#6a7a5a", equip: "shield", req: { defence: 5 }, desc: "A trainee slayer buckler." },
];