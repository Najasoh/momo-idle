/* Anvil recipes, grouped by metal page. cost is item id to quantity. respawn is craft seconds.
   Only bronze is filled in. Other pages stay empty until their items are added. */
window.Idle = window.Idle || {};
Idle.data = Idle.data || {};

Idle.data.anvilMetals = ["bronze", "iron", "steel", "silver", "gold", "mithril", "adamantite", "runite"];

Idle.data.anvilItems = [
  { id: "bronze_axe", name: "Bronze axe", metal: "bronze", level: 1, xp: 12.5, sell: 107, respawn: 3, cost: { bronze_bar: 1 }, swatch: "#b87333", equip: "weapon", hands: 1, wc: 1 },
  { id: "bronze_dagger", name: "Bronze dagger", metal: "bronze", level: 1, xp: 12.5, sell: 84, respawn: 3, cost: { bronze_bar: 1 }, swatch: "#b87333", equip: "weapon", hands: 1 },
  { id: "bronze_mace", name: "Bronze mace", metal: "bronze", level: 2, xp: 12.5, sell: 70, respawn: 3, cost: { bronze_bar: 1 }, swatch: "#b87333", equip: "weapon", hands: 1 },
  { id: "bronze_med_helm", name: "Bronze med helm", metal: "bronze", level: 3, xp: 12.5, sell: 96, respawn: 3, cost: { bronze_bar: 1 }, swatch: "#b87333", equip: "helm" },
  { id: "bronze_sword", name: "Bronze sword", metal: "bronze", level: 4, xp: 12.5, sell: 61, respawn: 3, cost: { bronze_bar: 1 }, swatch: "#b87333", equip: "weapon", hands: 1 },
  { id: "bronze_scimitar", name: "Bronze scimitar", metal: "bronze", level: 5, xp: 25, sell: 73, respawn: 3, cost: { bronze_bar: 2 }, swatch: "#b87333", equip: "weapon", hands: 1 },
  { id: "bronze_longsword", name: "Bronze longsword", metal: "bronze", level: 6, xp: 25, sell: 67, respawn: 3, cost: { bronze_bar: 2 }, swatch: "#b87333", equip: "weapon", hands: 1 },
  { id: "bronze_full_helm", name: "Bronze full helm", metal: "bronze", level: 7, xp: 25, sell: 83, respawn: 3, cost: { bronze_bar: 2 }, swatch: "#b87333", equip: "helm" },
  { id: "cobbled_guard_helm", name: "Cobbled Guard helm", metal: "bronze", level: 5, xp: 150, sell: 150, respawn: 3, cost: { bronze_full_helm: 1, goblin_mail_scrap: 2, leather: 1 }, swatch: "#b87333", equip: "helm", quest: "goblin_troubles" },
  { id: "bronze_sq_shield", name: "Bronze sq shield", metal: "bronze", level: 8, xp: 25, sell: 34, respawn: 3, cost: { bronze_bar: 2 }, swatch: "#b87333", equip: "shield" },
  { id: "bronze_warhammer", name: "Bronze warhammer", metal: "bronze", level: 9, xp: 37.5, sell: 42, respawn: 3, cost: { bronze_bar: 3 }, swatch: "#b87333", equip: "weapon", hands: 1 },
  { id: "bronze_battleaxe", name: "Bronze battleaxe", metal: "bronze", level: 10, xp: 37.5, sell: 76, respawn: 3, cost: { bronze_bar: 3 }, swatch: "#b87333", equip: "weapon", hands: 1 },
  { id: "bronze_chainbody", name: "Bronze chainbody", metal: "bronze", level: 11, xp: 37.5, sell: 45, respawn: 3, cost: { bronze_bar: 3 }, swatch: "#b87333", equip: "body" },
  { id: "bronze_kiteshield", name: "Bronze kiteshield", metal: "bronze", level: 12, xp: 37.5, sell: 126, respawn: 3, cost: { bronze_bar: 3 }, swatch: "#b87333", equip: "shield" },
  { id: "bronze_2h_sword", name: "Bronze 2h sword", metal: "bronze", level: 14, xp: 37.5, sell: 142, respawn: 3, cost: { bronze_bar: 3 }, swatch: "#b87333", equip: "weapon", hands: 2 },
  { id: "bronze_platelegs", name: "Bronze platelegs", metal: "bronze", level: 16, xp: 37.5, sell: 179, respawn: 3, cost: { bronze_bar: 3 }, swatch: "#b87333", equip: "legs" },
  { id: "bronze_plateskirt", name: "Bronze plateskirt", metal: "bronze", level: 16, xp: 37.5, sell: 74, respawn: 3, cost: { bronze_bar: 3 }, swatch: "#b87333", equip: "legs" },
  { id: "bronze_platebody", name: "Bronze platebody", metal: "bronze", level: 18, xp: 62.5, sell: 98, respawn: 3, cost: { bronze_bar: 5 }, swatch: "#b87333", equip: "body" },
];
