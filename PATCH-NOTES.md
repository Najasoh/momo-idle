# Patch Notes

How to use this: each entry says what changed and which file to open if you want to edit it yourself. Open the zip, edit the file, save, refresh `index.html`.

## 2026-11-17

### Herblore
- New profession in Lumbridge. Mix potions at the herblore screen.
- Guam leaf (347 ge). Grimy guam leaf (271 ge).
- Clean button on any grimy item. Needs Herblore 1. Awards 2.5 XP and turns the grimy item into the clean version.
- Attack potion recipe: 1 guam + 1 eye of newt. Needs Herblore 1. 25 XP. 1.8s. Produces Attack potion (3).
- Files: `js/data/herblore.js`, `js/professions/herblore.js`, `js/data/towns.js` (Lumbridge professions), `js/ui.js` (`cleanHerb`, herblore screen).

### Attack potions
- Attack potion (3) 12 ge, (2) 11 ge, (1) 5 ge.
- Drinking (3) leaves (2), (2) leaves (1), (1) is consumed.
- Boost is floor(Attack × 0.1) + 3 for 60 seconds. Doses overwrite each other instead of stacking.
- Buff shows the potion icon with a live second countdown. Stats tab shows +N next to the boosted stat while active.
- Files: `js/data/combat.js` (potion items), `js/ui.js` (`drinkPotion`, `buffsPanel`, `combatStats`, `decayBuffs`).

### Potion sounds
- Crafting a potion randomly plays `sounds/bubble_goo.wav` or `sounds/bubble_brew.wav`.
- File: `js/professions/herblore.js` (`tick`).

### Hunter
- New profession in Lumbridge. Bird snares required. Consumed only on a successful catch.
- Trap limits: 2 at level 1, 3 at 40, 4 at 60, 5 at 80.
- Catch chance starts at 39% and scales toward 100% in the high 40s.
- Catch time is weighted toward 15–40 seconds.
- Successful catch gives a Crimson swift item. Select it in inventory and press the purple Gut button to get bones, raw bird meat, and 5–10 feathers.
- Files: `js/data/hunter.js`, `js/professions/hunter.js`, `js/data/towns.js`, `js/ui.js` (`gutBird`).

### Skill saves
- Herblore and Hunter experience now restore on load along with the other professions.
- File: `js/state.js` (boot skill restore list).

### Al Kharid
- New town. 20 second walk from Lumbridge or Varrock.
- Outpost Guard: pay 10 coins to cross. Same guard on both sides.
- Monk Fennec: sells cabbage, jug of water, body rune, leather boots, bucket, bronze mace, fire rune, water rune. 20 coins each. 50s restock. No sell button.
- Ali Morrisane: buys at 55% GE, sells at 100% GE. Stock includes pot, jug, waterskin(3), desert gear, fez, menaphite purple and red sets, runes.
- Kelso: starts Exquisite Goods quest. Needs 3 leather, 2 cowhide, 5 spools of wool. Rewards 150 Crafting XP, 1 quest point, and unlocks menaphite gear + runes at Ali's shop.
- Heat debuff: every 24–132 seconds in the gather or combat zones, a waterskin charge is used. No waterskin means 1–10 damage. Desert gear and fez have heat defense (12 each) that extends the timer. Max 132 seconds between drinks. Plays `sounds/waterskin.wav` on use.
- Files: `js/data/towns.js` (al_kharid), `js/ui.js` (heat timer, outpost guard, shops).

### Al Kharid combat and gather
- Mobs: Scorpion (lvl 14), Spider (lvl 1), Al Kharid Warrior (lvl 9), Man.
- Mining: copper, tin, iron, silver, coal, gold, mithril, adamantite. 5% chance a lvl 14 scorpion attacks while mining until combat level 28.
- Agility: Al Kharid rooftop course (level 20, 64s, 8 parts). Parts 2 and 4 can fail for 1–5 damage. 216 XP max. Does not auto-repeat.
- Files: `js/data/combat.js` (scorpion_14, spider1, alkharidwarrior9), `js/data/towns.js`, `js/data/thieving.js` (alkharid_rooftop).

### Crafting expansion
- New stations: Loom, Mouldings, Chisel, Glassblowing Pipe, Kiln.
- Spinning wheel: crossbow string (sinew), linen yarn (flax), magic string (magic roots), rope (hair).
- Loom: strip of cloth.
- Chisel: cut uncut opal, jade, red topaz.
- Moulding: opal/jade/red topaz rings and necklaces (needs mould + gem + silver bar).
- Glassblowing: beer glass, empty candle lantern, empty oil lamp, vial, empty fishbowl, unpowered orb, lantern lens, empty light orb. All cost molten glass.
- Kiln: unfired pot (clay + bucket of water), pot (clay).
- Files: `js/data/crafting.js`.

### Gem table
- Added uncut opal (53 ge), uncut jade (72 ge), uncut red topaz (761 ge).
- File: `js/data/gems.js`.

### Cooking additions
- Seaweed, swamp weed, giant seaweed.
- Sinew: cook raw meat (any of the cooked meat alternatives). Level 1, 3 XP, 0.6s, sells 138.
- Soda ash: cook seaweed / swamp weed / giant seaweed. Level 1, 1 XP, 0.6s, sells 19.
- Files: `js/data/cooking.js`.

### Smithing
- Molten glass: 1 bucket of sand + 1 soda ash. Level 1, 22 XP, 2.4s, sells 88.
- File: `js/data/smithing.js`.

### Anvil — Hedge mage set and iron
- Hedge mage: gloves, boots, hood, spellblade, tunic, focus, mantle. Mix of bronze bars and thread.
- Rusty dagger: craft from a bronze dagger.
- Full iron set: dagger, axe, mace, spit, med helm, bolt unf, sword, dart tip, nails, full helm, keel parts, limbs, chainbody, kiteshield, claws, 2h sword, platelegs, plateskirt, platebody.
- File: `js/data/anvil.js`.

### Combat items
- Hedge mage set stats (hood, tunic, trousers, gloves, boots, spellblade, focus, mantle).
- Iron weapon and armor stats (dagger, axe, mace, sword, dart, full helm, chainbody, kiteshield, claws, 2h sword).
- Files: `js/data/combat.js` (weaponStats).

### Woodcutting
- Needs an axe. Higher tier trees need a better axe (oak needs wc 2, willow wc 4, yew wc 8).
- 30% miss chance. After level 55 the miss rate drops toward 5%.
- Oak, willow, and yew can drop leaves (1/4), ent seed (1/400), loop half of key (1/2407), beaver pet (1/360000), or a bird nest (seeds / rings / egg) instead of logs. Yew can also drop a crystal shard (1/40).
- Respawn is 1–3 seconds after a successful chop.
- File: `js/professions/woodcutting.js`.

### Thieving
- Fail plays a gasp sound. Man uses male gasps, Woman uses female gasps, others use either.
- Success rate becomes 100% at the perfect level listed on the target.
- After a success there is a 1–3 second walk to the next target. Fail stuns for 5 seconds and deals damage.
- File: `js/professions/thieving.js`.

### Fishing sounds
- Each catch plays one of `fishing1.wav` through `fishing4.wav`.
- File: `js/professions/fishing.js`.

### Crafting thread
- Thread has 5 uses. Each needle craft consumes 1 use. When uses hit 0 the spool is removed.
- File: `js/professions/crafting.js`.

### Sailing
- Profession exists but stays locked until the Pandemonium quest is completed.
- File: `js/professions/sailing.js`.

### Combat formulas
- Melee, ranged, and magic use the same attack roll / defence roll / max hit structure.
- Magic damage % from gear multiplies spell max hit. Ranged strength is used for ranged max hit.
- Spell cast styles: Standard, Defensive, Accurate (+3 magic), Flicker (+1 magic, +3 defence, -0.2s).
- Files: `js/systems/combat.js` (`playerHit`, `maxHit`, `totals`).

### Level up sound
- Any profession or combat level up plays `sounds/levelup.wav`.
- File: `js/systems/xp.js` (`grant`).

### Looting bag
- Only one looting bag can be in the inventory at a time.
- File: `js/systems/inventory.js` (`add`).

### Save data
- Skills (including herblore and hunter), bank, hops, seen mobs, and seen items all save and load.
- File: `js/systems/save.js`.

### Images
- `images/` now has 436 icons.
- Added: hedge mage set (hood, tunic, trousers, gloves, boots, spellblade, focus, mantle), full iron set, desert gear, menaphite purple and red sets, fez, attack potion (3/2/1), guam / grimy guam, and many tree seeds.
- Item icons are named after the item id (example: `hedge_mage_hood.png`).

### Sounds
- `sounds/` now has 69 files.
- Categories: mining (pick_hit01–05), smithing, anvil, cooking, fishing1–4, bury, walk, teleport, grand exchange, coins, levelup, potion crafting (bubble_goo / bubble_brew), potion drink, waterskin, spell air element, bow draw / arrow hit, sawmill, bird ambience (bird01–10), bear death, player hit (gethit male/female 1–3), player death (death male/female), gasp (male/female).
- Volume is controlled in Settings. File: `js/systems/sound.js`.

## 2026-10-31

### Spell casting
- Spell button next to melee styles. Opens a list of known spells and casting styles (Standard, Defensive, Accurate, Flicker).
- Selecting a spell overrides melee, cancels the current swing, and starts the spell cast.
- Closing the Spell button clears the selected spell and returns to the last melee style.
- Wind Strike: buy "Spellbook: Wind Strike" from the general store (1 coin). Costs 1 air rune + 1 mind rune. 3s cast. Base max hit 2 (scales with magic level). Plays `sounds/spellairelement.wav`.
- Casting styles: Standard (+2 Magic XP + 1.33 HP XP per damage), Defensive (+1.33 Magic + 1 Defence + 1.33 HP XP per damage), Accurate (+3 Magic level), Flicker (+1 Magic + 3 Defence, -0.2s cast speed).
- Files: `js/data/combat.js` (`Idle.data.spells`), `js/systems/combat.js` (`playerHit`, `swingSeconds`), `js/ui.js` (`styleButtons`, `spellMenu`, `selectSpell`).

### Grand Exchange
- Buying an order now deducts coins from inventory. Plays a coin sound (`coins_cave01.wav` or `coins_cave02.wav`).
- Files: `js/systems/exchange.js` (`addOrder`).

### Equipment tooltips and Destroy
- Hovering gloves, boots, or ring no longer pushes the tooltip off the bottom of the screen. It flips above the cursor if needed.
- Destroy button is now light red so it is harder to confuse with Deposit.
- Files: `js/ui.js` (`showPreview`), `css/game.css` (`.destroy-btn`).

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
