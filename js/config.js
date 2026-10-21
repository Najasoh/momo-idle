/* Global tuning. Change SCALE here if "up by 133%" should mean ×2.33 instead of ×1.33. */
window.Idle = window.Idle || {};

Idle.config = {
  tickMs: 1200,
  inventorySlots: 31,
  baseXpToLevel: 100,
  /* Each next level costs 1.104 times the previous requirement. */
  xpScale: 1.104,
  saveKey: "idle-menu-rpg-v1",
};
