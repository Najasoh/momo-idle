window.Idle = window.Idle || {};
Idle.data = Idle.data || {};

Idle.data.hunterTraps = [
  { id: "crimson_swift", name: "Crimson Swift", level: 1, xp: 34, tool: "bird_snare", sell: 0,
    drops: [
      { id: "bones", qty: 1 },
      { id: "raw_bird_meat", qty: 1 },
      { id: "feather", qty: [5, 10] },
    ],
  },
  { id: "white_cinderella_bovine", name: "White Cinderella Bovine", level: 1, xp: 30, tool: "noose_wand", sell: 0,
    chance: [0.93, 1, 3], seconds: [10, 15],
    drops: [
      { id: "bones", qty: 1 },
      { id: "white_cinderella_fur", qty: 1 },
      { id: "raw_beast_meat", qty: 1 },
    ],
  },
  { id: "barbecue_pig", name: "Barbecue pig", level: 3, xp: 36, tool: "noose_wand", hurt: 3, sell: 0,
    chance: [0.87, 1, 7], seconds: [10, 15],
    drops: [
      { id: "bones", qty: 1 },
      { id: "barbecue_pig_fur", qty: 1 },
      { id: "raw_beast_meat", qty: 1 },
    ],
  },
  { id: "feathered_friday_monkey", name: "Feathered Friday monkey", level: 5, xp: 47, tool: "bird_snare", sell: 0,
    scale: [5, 0.41, 53, 1],
    drops: [
      { id: "bones", qty: 1 },
      { id: "raw_bird_meat", qty: 1 },
      { id: "friday_feather", qty: [5, 10] },
    ],
  },
  { id: "hallowtail_bat", name: "Hallowtail bat", level: 6, xp: 115, tool: "bird_snare", cost: 150, screech: 5, sell: 0,
    scale: [5, 0.15, 99, 0.99], seconds: [10, 15],
    drops: [
      { id: "bones", qty: 1 },
      { id: "raw_bird_meat", qty: 1 },
      { id: "coins", qty: [1, 25] },
      { id: "hallowtail_bat_wing", qty: 1 },
    ],
  },
  { id: "uni_horn_bear", name: "Uni-horn bear", level: 7, xp: 48, tool: "noose_wand", failHurt: 7, sell: 0,
    scale: [7, 0.33, 99, 0.80], seconds: [13, 18],
    drops: [
      { id: "bones", qty: 1 },
      { id: "uni_horn_bear_fur", qty: 1 },
      { id: "raw_beast_meat", qty: 1 },
    ],
  },
];
