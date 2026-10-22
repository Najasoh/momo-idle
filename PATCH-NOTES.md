# Patch Notes

How to use this: each entry says what changed and which file to open if you want to edit it yourself. Open the zip, edit the file, save, refresh `index.html`.

## 2026-10-21

### Varrock combat
- New mobs: Man, Woman, Mugger, Barbarian, Thief, Varrock Guard, Outlaw, Black Knight, Grizzly bear. Giant rat can drop Jerry the rat.
- Rune table and coin table added. Outlaw and Black Knight drop both plus the gem table.
- Altar service in Varrock for prayer recharge and fish/ensouled sacrifices.
- Files: `js/data/combat.js`, `js/data/gems.js`, `js/data/towns.js`, `js/systems/combat.js`.

### Varrock expansion
- Mining: copper, tin, iron, clay, silver. Smithing and anvil limited to bronze, iron, steel. Woodcutting: tree, oak, willow, yew. Cooking added.
- Thieving: Man/Woman/Citizen (1.2s, 8xp, 70% success, 1 dmg resist), Varrock Guard (46xp, 50%, 30 coins), Tea stall (16xp, cup of tea), Silk stall (24xp, silk).
- Cup of tea: drink restores 3 hp, attack boost, leaves empty cup.
- Agility: Varrock rooftop course (level 30, 70s, mark of grace).
- Aubury starts Rune Mysteries. Talk twice, 10s, 1 quest point.
- Files: `js/data/towns.js`, `js/data/thieving.js`, `js/data/combat.js`, `js/professions/thieving.js`, `js/professions/agility.js`, `js/ui.js`.

### Item prices and icons
- Added icons: blue_wizard_robe, water_talisman, redberries, chocolate_bar, cheese, tomato, potato, captains_log, spinning_wheel.
- Updated GE prices for bronze weapons/armor, beads, fishing tools, food, and materials. Top/bottom of sceptre and skull halves stay quest items.
- Files: `js/data/combat.js`, `js/data/fishing.js`, `js/data/cooking.js`, `images/`.

### Town walks
- Every town-to-town walk is 15 seconds.
- Karamja only appears in Port Sarim after talking to the Sailor. Sailing always costs 30 gp.
- Customs Officer is in Karamja. He denies return if you have Karamjan rum. With no rum, pay 30 gp to sail back to Port Sarim. There is no automatic Port Sarim button in Karamja.
- Files: `js/data/towns.js`, `js/ui.js`.

### Wydin's shop
- Wydin in Port Sarim is now a vendor. Stock includes pot of flour, raw beef, raw chicken, cabbage, banana, redberries, bread, chocolate bar, cheese, tomato, potato, and white apron (5 gp).
- Files: `js/ui.js` (wydinShop, buyWydin), `js/data/combat.js` (new food items).

### Pirate's Treasure
- New towns: Port Sarim, Karamja, Falador.
- Quest flow: Redbeard Frank → Sailor (30gp) → Karamja → Zembo (buy rum) → Luthas (10 bananas + 30gp) → Customs Officer (no rum) → Wydin (white apron) → retrieve rum → return to Redbeard for Hector's chest key → Varrock chest → Falador park with spade → fight Gardener for One-eyed Hector's treasure.
- Gardener only drops the treasure while the quest is active. Opening it gives 450gp, gold ring, emerald.
- Files: `js/data/towns.js`, `js/data/combat.js` (quest, items, gardener), `js/ui.js` (talk handlers, choice overlay), `js/systems/combat.js` (treasure drop).

### Rimmington and Witch's Potion
- New town: Rimmington. 15 second walk from Lumbridge.
- NPC: Hetty. Quest: Witch's Potion. Needs 1 Burnt meat, 1 Eye of newt, 1 Onion, 1 Rat's tail.
- Rat's tail only drops from rats while the quest is active.
- File: `js/data/towns.js` (rimmington block and `townTravel`), `js/data/combat.js` (`witchs_potion` in `Idle.data.quests`, onion and rats_tail in `combatDrops`), `js/systems/combat.js` (`rollLoot`, the rat check).

### Quest complete scroll
- Finishing any quest now shows `images/questcomplete.png` with the rewards in the middle. Click to close.
- File: `js/ui.js` — `giveQuest` sets `Idle.state.questComplete`, `questCompleteOverlay` draws it. CSS in `css/game.css` under `.quest-complete`.

### Already at the Wizards' Tower only climbs
- Talking to Wizard Mizgog while you are already in the tower only climbs (10s). From anywhere else it still walks (15s) then climbs.
- File: `js/ui.js` — function `startImpCatcher`. Look for `Idle.state.town === "wizards_tower"`.

### Quest Journal on the main menu
- Main menu now has a Quest Journal button next to Stats and Bestiary.
- File: `js/ui.js` — function `hub()`, the `cards` array. Add `{ id: "quests", name: "Quest Journal", note: "..." }`.

## 2026-10-20

### Wizards' Tower is its own area
- New town: Wizards' Tower. Travel from Lumbridge is 15s. Has Wizard (lvl 9), Imp, and Wizard Mizgog.
- Files: `js/data/towns.js` (town block and `townTravel`), `js/data/combat.js` (Wizard mob).

### Imp Catcher quest
- Wizard Mizgog asks for black, yellow, red, and white beads. Reward: 1 quest point, 875 Magic xp, Amulet of accuracy.
- Files: `js/data/combat.js` (`Idle.data.quests.imp_catcher`), `js/data/towns.js` (NPC entry), `js/ui.js` (`startImpCatcher`, quest card in `questJournal`).

### Staffs and Amulet of accuracy
- Staff, Magic staff, Staff of air/water/earth/fire with crush/magic/defence/strength bonuses.
- Amulet of accuracy: +4 stab/slash/crush/magic/ranged, sell 2606.
- File: `js/data/combat.js` — `Idle.data.weaponStats` and `Idle.data.combatDrops`.

### Imp
- Level 2 demon, stab, 2.4s, 30s respawn. Always drops Fiendish ashes. Beads are 1/25.
- File: `js/data/combat.js` — mob with `id: "imp"`.

## Where to edit common things

| What you want | File | Look for |
|---|---|---|
| Add a rock or ore | `js/data/mining.js` | `Idle.data.miningNodes` |
| Add a bar | `js/data/smithing.js` | `Idle.data.smithingBars` |
| Add anvil gear | `js/data/anvil.js` | `Idle.data.anvilItems` |
| Add a cooked food | `js/data/cooking.js` | `Idle.data.cookingRecipes` |
| Add a fish | `js/data/fishing.js` | `Idle.data.fishingFish` |
| Add a craft | `js/data/crafting.js` | `Idle.data.craftingRecipes` |
| Add a fletch recipe | `js/data/fletching.js` | `Idle.data.fletchingRecipes` |
| Add a mob | `js/data/combat.js` | `Idle.data.mobs` |
| Add a weapon's stats | `js/data/combat.js` | `Idle.data.weaponStats` |
| Add a drop item | `js/data/combat.js` | `Idle.data.combatDrops` |
| Add a town or travel time | `js/data/towns.js` | `Idle.data.towns`, `Idle.data.townTravel` |
| Add a quest | `js/data/combat.js` | `Idle.data.quests` |
| Change the main menu buttons | `js/ui.js` | `hub()` |
| Change how a screen looks | `js/ui.js` | the matching function (`townScreen`, `questJournal`, etc.) |
| Add an item icon | `images/` | file must be named `{item id}.png` |
| Add a sound | `sounds/` | file must be named `{sound name}.wav` |

## Notes
- Item icons use the item id. `id: "staff"` needs `images/staff.png`.
- Sell price of 0 means the item is not sold and is not listed on the Grand Exchange.
- Quest points, bank, and bestiary are saved in localStorage. A fresh zip does not wipe them unless the save key changes.
