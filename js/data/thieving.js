Idle.data.thieving = {
  targets: [
    { id: "man", name: "Man", level: 1, xp: 8, time: 1.2, success: 0.7, perfect: 85, resist: [0.15, 0.25], stun: 5.4, damage: 1, loot: [{ id: "coins", qty: 3 }], pet: 1 / 257211 },
    { id: "woman", name: "Woman", level: 1, xp: 8, time: 1.2, success: 0.7, perfect: 85, resist: [0.15, 0.25], stun: 5.4, damage: 1, loot: [{ id: "coins", qty: 3 }], pet: 1 / 257211 },
    { id: "citizen", name: "Citizen", level: 1, xp: 8, time: 1.2, success: 0.7, perfect: 85, resist: [0.15, 0.25], stun: 5.4, damage: 1, loot: [{ id: "coins", qty: 3 }], pet: 1 / 257211 },
    { id: "varrock_guard", name: "Varrock Guard", level: 40, xp: 46, time: 1.2, success: 0.5, perfect: 100, resist: [0.15, 0.25], stun: 5, damage: 2, loot: [{ id: "coins", qty: 30 }], pet: 1 / 256211 },
  ],
  stalls: [
    { id: "tea_stall", name: "Tea stall", level: 5, xp: 16, time: 2.4, fail: 0.15, stun: 5, damage: 2, loot: [{ id: "cup_of_tea", qty: 1 }], pet: 1 / 68888 },
    { id: "silk_stall", name: "Silk stall", level: 20, xp: 24, time: 4.8, fail: 0.15, stun: 5, damage: 2, loot: [{ id: "silk", qty: 1 }], pet: 1 / 68444 },
  ],
};

Idle.data.agility = {
  courses: [
    {
      id: "varrock_rooftop",
      name: "Varrock rooftop",
      level: 30,
      total: 70,
      mark: 0.13,
      obstacles: [
        { name: "Rough wall", xp: 13.5 },
        { name: "Clothes line", xp: 23, fail: 0.25 },
        { name: "Gap", xp: 19 },
        { name: "Wall", xp: 28, fail: 0.25 },
        { name: "Gap", xp: 10 },
        { name: "Gap", xp: 24.5 },
        { name: "Gap", xp: 4.5 },
        { name: "Ledge", xp: 3.5 },
        { name: "Edge", xp: 143 },
      ],
    },
  ],
};

Idle.data.woodcutting = Idle.data.woodcutting || {};
Idle.data.woodcutting.trees = [
  { id: "tree", name: "Tree", level: 1, xp: 25, hp: 3 },
  { id: "oak", name: "Oak tree", level: 15, xp: 37.5, hp: 4 },
  { id: "willow", name: "Willow tree", level: 30, xp: 67.5, hp: 5 },
  { id: "yew", name: "Yew tree", level: 60, xp: 175, hp: 8 },
];
