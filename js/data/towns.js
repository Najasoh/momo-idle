/* Towns. Each town lists what you can do while you are there. */
window.Idle = window.Idle || {};
Idle.data = Idle.data || {};

Idle.data.towns = {
  lumbridge: {
    id: "lumbridge",
    name: "Lumbridge",
    start: true,
    professions: [
      { id: "mining", name: "Mining", note: "Clay, copper, tin" },
      { id: "smithing", name: "Smithing", note: "Smelt bars at the furnace" },
      { id: "anvil", name: "Anvil", note: "Hammer bars into gear" },
      { id: "cooking", name: "Cooking", note: "Cook meat" },
      { id: "fishing", name: "Fishing", note: "Shrimp and anchovies" },
      { id: "crafting", name: "Crafting", note: "Spinning wheel" },
      { id: "fletching", name: "Fletching", note: "Knife and logs" },
      { id: "woodcutting", name: "Woodcutting", note: "Chop trees" },
      { id: "firemaking", name: "Firemaking", note: "Light campfires" },
      { id: "farming", name: "Farming", note: "Hops patch" },
    ],
    mobs: [
      { id: "cow", name: "Cow", note: "milkable" },
      { id: "chicken", name: "Chicken", note: "eggs" },
      { id: "rat", name: "Rat", note: "" },
      { id: "goblin", name: "Goblin", note: "" },
      { id: "spider", name: "Spider", note: "" },
      { id: "imp", name: "Imp", note: "" },
    ],
    gather: [
      { id: "tree", name: "Tree", note: "Needs an axe · 3 hp · 25 xp" },
      { id: "hops", name: "Hops patch", note: "No seeds" },
    ],
    npcs: [
      { id: "cook", name: "Cook", quest: "cooks_assistant", note: "Cook's Assistant" },
      { id: "fred", name: "Fred", quest: "sheep_shearer", note: "Sheep Shearer" },
      { id: "cassius", name: "Cassius", quest: "ides_of_milk", note: "The Ides of Milk" },
      { id: "fisher_fred", name: "Fisher Fred", quest: "fishers_friend", note: "Fisher's Friend" },
      { id: "lumberjack_beave", name: "Lumberjack Beave", quest: "woodchuckers_wood", note: "Woodchucker's Wood" },
      { id: "talsy", name: "Talsy", quest: "cave_explorer", note: "Cave Explorer" },
      { id: "general_store", name: "General Store", note: "Buy and sell" },
    ],
    services: [
      { id: "mailbox", name: "Mailbox", note: "Collect orders" },
      { id: "bank", name: "Bank", note: "Store items" },
    ],
  },
  varrock: {
    id: "varrock",
    name: "Varrock",
    professions: [
      { id: "smithing", name: "Smithing", note: "Furnace" },
      { id: "anvil", name: "Anvil", note: "Hammer bars" },
      { id: "mining", name: "Mining", note: "Iron and coal" },
    ],
    mobs: [
      { id: "goblin", name: "Goblin", note: "" },
      { id: "rat", name: "Rat", note: "" },
    ],
    npcs: [
      { id: "doric", name: "Doric", quest: "dorics_quest", note: "Doric's Quest" },
    ],
    services: [
      { id: "exchange", name: "Grand Exchange", note: "Buy and sell" },
      { id: "mailbox", name: "Mailbox", note: "Collect orders" },
      { id: "bank", name: "Bank", note: "Store items" },
    ],
  },
  wizards_tower: {
    id: "wizards_tower",
    name: "Wizards' Tower",
    professions: [],
    mobs: [
      { id: "wizard", name: "Wizard", note: "magic" },
      { id: "imp", name: "Imp", note: "beads" },
    ],
    npcs: [
      { id: "wizard_mizgog", name: "Wizard Mizgog", quest: "imp_catcher", note: "Imp Catcher" },
    ],
    services: [],
  },
};

Idle.data.townTravel = {
  "lumbridge|varrock": 60,
  "varrock|lumbridge": 60,
  "lumbridge|wizards_tower": 15,
  "wizards_tower|lumbridge": 15,
  "varrock|wizards_tower": 45,
  "wizards_tower|varrock": 45,
};
