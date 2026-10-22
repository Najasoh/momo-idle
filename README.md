# Menu RPG

Tick-based idle menu game. Mining is the first profession module.

Open `index.html` in a browser. Progress saves in localStorage.

## Loop

- Menu picks a profession screen.
- Mining lists rocks the current level can use.
- Selecting a rock farms 1 item per tick (1.2s) into the inventory.
- Inventory holds 31 stacks. Same item stacks in one slot. A full pack with no matching stack stops mining.
- Sell a stack or sell everything from the inventory panel.

## Level 1 rocks

| Rock | XP | Sell |
| --- | --- | --- |
| Clay | 5 | 74 |
| Rune essence | 5 | 14 |
| Copper ore | 17.5 | 24 |
| Tin ore | 17.5 | 20 |

Level 1 to 2 costs 100 XP. Each later level costs 133% of the previous requirement (`xpScale` in `js/config.js`). Change `xpScale` to `2.33` if that should mean a +133% increase instead.

## Where to extend

- New rock: add a row in `js/data/mining.js`.
- New profession: add `js/professions/<name>.js` with `createSkill`, `tick`, and a menu card in `js/ui.js`.
- Shared systems live in `js/systems/`.
