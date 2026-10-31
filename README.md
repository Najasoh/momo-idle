# Reincarnated as a Guild Innkeeper

Tick-based idle RPG. You pick what to farm, craft, or fight. Progress saves in localStorage.

Open `index.html` from this folder in a browser. Do not open it from inside the zip window.

## How to play

- Main menu: Equipment, Town, Adventure, Spellbook, Stats, Quest Journal, Bestiary.
- Town shows professions, creatures, gather spots, NPCs, services, and travel for the town you are in.
- Select a target and it ticks until you stop or inventory is full. One activity at a time.
- Inventory is 31 stacks. Same item stacks. Click a slot to select, click another to move, or drag.
- Currency is Coins (1 Coins = 1). Sell through the Grand Exchange in Varrock.
- Combat styles sit at the top. Press Spell to switch to spell casting. Selecting a spell overrides melee. Closing Spell returns to your last melee style.
- Wind Strike is bought as "Spellbook: Wind Strike" from the general store. Costs 1 air rune + 1 mind rune.

## Towns

All towns are a 15 second walk except Karamja (sail only from Port Sarim after talking to the Sailor, 30 Coins).

- **Lumbridge** — mining, smithing, anvil, cooking, fishing, crafting, fletching, woodcutting, firemaking, farming. Cow, chicken, rat, goblin, spider, imp. Bank and mailbox.
- **Varrock** — mining, smithing (up to steel), anvil (bronze/iron/steel), woodcutting, cooking, thieving, agility. Man, woman, mugger, barbarian, thief, Varrock Guard, outlaw, black knight, grizzly bear. Grand Exchange, bank, mailbox, altar.
- **Wizards' Tower** — wizard, imp. Wizard Mizgog (Imp Catcher).
- **Rimmington** — rat. Hetty (Witch's Potion).
- **Port Sarim** — Redbeard Frank, Sailor, Wydin. Sail to Karamja.
- **Karamja** — Zembo, Luthas, Customs Officer.
- **Falador** — gardener.

Dungeons: Secured Stronghold, Catacomb of Famine, Pit of Pestilence, Sepulchre.

## Professions

- **Mining** — rocks with individual respawn times. Gem drop 1/256.
- **Smithing** — smelt bars. Varrock limited to bronze, iron, steel.
- **Anvil** — hammer bars into gear. Varrock limited to bronze, iron, steel.
- **Cooking** — cook raw food. Burn chance.
- **Fishing** — spots with tools. Catch time varies.
- **Crafting** — spinning wheel.
- **Fletching** — select a knife in inventory.
- **Woodcutting** — needs an axe. Tree, oak, willow, yew.
- **Firemaking** — light logs with a tinderbox. Campfire enables cooking.
- **Farming** — hops patch for flax.
- **Thieving** — pickpocket NPCs and stalls. 1.2s minimum.
- **Agility** — rooftop courses. Varrock (level 30), Al Kharid (level 20).
- **Runecrafting** — Water Altar in Lumbridge. Needs water talisman and rune/pure essence.

## Combat

- Melee styles: Accurate, Aggressive, Defensive, Controlled. Weapon determines options.
- Spell casting: Standard, Defensive, Accurate, Flicker. Flicker reduces cast speed by 0.2s.
- XP is granted per damage dealt based on the active style. Spell casts also grant the spell's base XP.
- Flee is a 2.4s tick with a 10% fail chance. On fail you swing and the monster hits back.

## Grand Exchange

- Buy orders deduct coins immediately and play a coin sound. Orders take 1–30 seconds per item and arrive in the mailbox.
- Sell listings use a price slider. Overpriced items take longer. Up to 8 listings.
- Prices move every 30 seconds. Never drop below 75% of base sell price.
- **Thieving** — pickpocket (1.2s) and stalls. Resist stuns 5s and damages.
- **Agility** — Varrock rooftop course (level 30, 70s).
- **Prayer** — bury bones, sacrifice at altar, recharge.
- **Sailing** — unlocked by the Pandemonium quest.
- **Slayer** — xp from combat kills.

## Where to edit

| What | File |
|---|---|
| Rocks, ore, essence | `js/data/mining.js` |
| Bars and anvil items | `js/data/smithing.js`, `js/data/anvil.js` |
| Cooking recipes | `js/data/cooking.js` |
| Fishing spots | `js/data/fishing.js` |
| Crafting and fletching | `js/data/crafting.js`, `js/data/fletching.js` |
| Thieving targets and stalls | `js/data/thieving.js` |
| Agility courses | `js/data/thieving.js` (agility object) |
| Mobs, drops, quests | `js/data/combat.js` |
| Towns and travel | `js/data/towns.js` |
| Screens and UI | `js/ui.js` |
| Tick timing and XP scale | `js/config.js` |
| Item icons | `images/<item_id>.png` |
| Equipment slot backgrounds | `images/gui/equip_*.png` |
| Sounds | `sounds/*.wav` |
| Patch notes | `PATCH-NOTES.md` |
| Full lists | `DOCUMENTATION.md` |

## Adding content

- **New rock** — add a row in `js/data/mining.js`. Icon is `images/<id>.png`.
- **New mob** — add to `Idle.data.mobs` in `js/data/combat.js`, then list it in the town in `js/data/towns.js`.
- **New profession** — add `js/professions/<name>.js` with `createSkill`, `nodeById`, and `tick`. Add a card in `professions()` in `js/ui.js`. Add the skill to `js/state.js`.
- **New town** — add an entry in `js/data/towns.js` and a travel time in `townTravel`.
- **New sound** — drop the `.wav` in `sounds/` and call `Idle.systems.sound.play("name", false)` from `js/ui.js`.
