window.Idle = window.Idle || {};

Idle.ui = {
  root: null,
  timer: null,

  mount(root) {
    this.root = root;
    Idle.boot();
    this.render();
    this.start();
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.stop();
      else this.start();
    });
  },

  start() {
    if (this.frame) return;
    this.tickStartedAt = performance.now();
    const loop = (now) => {
      this.frame = requestAnimationFrame(loop);
      const wait = this.respawnMs();
      this.paintTick(now);
      Idle.systems.exchange.tickPrices(Idle.state, now);
      const before = Idle.state.sales.length + Idle.state.orders.length;
      Idle.systems.exchange.tickOrders(Idle.state, now);
      Idle.systems.exchange.tickSales(Idle.state, now);
      if (Idle.state.screen === "exchange" && before !== Idle.state.sales.length + Idle.state.orders.length) this.render();
      this.paintFight(now);
      this.paintBury(now);
      this.paintRecovery(now);
      this.paintLeave(now);
      this.paintAltar(now);
      this.paintExit(now);
      this.paintAggro(now);
      this.paintCast(now);
      this.paintFishTravel(now);
      this.paintQuestRun(now);
      this.paintCampfire(now);
      this.paintAmbience(now);
      this.syncGeSound();
      this.syncWalkSound();
      if (Idle.state.bury) return;
      if (Idle.state.fight || Idle.state.leave || Idle.state.exit || Idle.state.altar || Idle.state.questRun || (Idle.state.activity && Idle.state.activity.phase === "travel") || (Idle.state.grave && (Idle.state.grave.phase === "walk" || Idle.state.grave.phase === "home"))) return;
      if (!Idle.state.running || !Idle.state.activity) return;
      if (Idle.state.activity && Idle.state.activity.profession === "woodcutting" && Idle.state.activity.phase === "respawn" && Idle.state.activity.until) {
        if (now < Idle.state.activity.until) {
          const left = Math.ceil((Idle.state.activity.until - now) / 1000);
          const label = this.root && this.root.querySelector("[data-tick-label]");
          const fill = this.root && this.root.querySelector("[data-tick-fill]");
          if (label) label.textContent = `Next tree · ${left}s`;
          if (fill) fill.style.width = `${Math.min(100, ((now - (Idle.state.activity.until - 2000)) / 2000) * 100)}%`;
          return;
        }
        Idle.state.activity.phase = null;
        Idle.state.activity.until = null;
        this.tickStartedAt = now;
      }
      if (Idle.state.activity && Idle.state.activity.profession === "thieving" && Idle.state.activity.phase && Idle.state.activity.until) {
        if (now < Idle.state.activity.until) {
          const left = Math.ceil((Idle.state.activity.until - now) / 1000);
          const label = this.root && this.root.querySelector("[data-tick-label]");
          const fill = this.root && this.root.querySelector("[data-tick-fill]");
          if (label) label.textContent = Idle.state.activity.phase === "stun" ? `Stunned · ${left}s` : `Walking to next · ${left}s`;
          if (fill) fill.style.width = `${Math.min(100, ((now - (Idle.state.activity.until - (Idle.state.activity.phase === "stun" ? 5000 : 2000))) / (Idle.state.activity.phase === "stun" ? 5000 : 2000)) * 100)}%`;
          return;
        }
        Idle.state.activity.phase = null;
        Idle.state.activity.until = null;
        this.tickStartedAt = now;
      }
      if (wait > 0 && now - this.tickStartedAt < wait) return;
      this.tickStartedAt = now;
      this.catchMs = null;
      const job = Idle.professions[Idle.state.activity.profession];
      const result = job.tick(Idle.state);
      if (Idle.state.activity && Idle.state.activity.profession === "mining" && result.kind !== "idle" && result.kind !== "full" && result.kind !== "locked") {
        this.playPickHit();
      }
      if (result.kind !== "idle") Idle.state.pushLog(result);
      this.syncActivitySound();
      Idle.systems.save.write(Idle.state);
      this.refreshLive();
    };
    this.frame = requestAnimationFrame(loop);
  },

  stop() {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = null;
  },

  paintTick(now) {
    const fill = this.root && this.root.querySelector("[data-tick-fill]");
    const label = this.root && this.root.querySelector("[data-tick-label]");
    if (!fill) return;
    if (Idle.state.bury) return;
    if (Idle.state.fight || Idle.state.leave || Idle.state.questRun || (Idle.state.grave && (Idle.state.grave.phase === "walk" || Idle.state.grave.phase === "home"))) return;
    const job = Idle.state.activity;
    const profession = job ? Idle.professions[job.profession] : null;
    const node = profession ? profession.nodeById(job.id) : null;
    if (!node) {
      if (!Idle.state.fight && !(Idle.state.grave && (Idle.state.grave.phase === "walk" || Idle.state.grave.phase === "home"))) {
        fill.style.width = "0%";
        if (label) label.textContent = "";
      }
      return;
    }
    const wait = this.respawnMs(node);
    const pct = wait === 0 ? 100 : Math.max(0, Math.min(100, ((now - this.tickStartedAt) / wait) * 100));
    fill.style.width = pct.toFixed(1) + "%";
    const verb = { anvil: "Hammering", smithing: "Smelting", cooking: "Cooking", fishing: "Fishing", mining: "Mining", crafting: "Crafting", woodcutting: "Chopping" }[job.profession] || "Working";
    if (label) label.textContent = `${verb} ${node.name} · ${this.formatSeconds((wait / 1000))}`;
  },

  paintFight(now) {
    const fight = Idle.state.fight;
    if (!fight || Idle.state.bury) return;
    const mob = Idle.systems.combat.mobById(fight.mob);
    const elapsed = (now - fight.startedAt) / 1000;
    if (fight.phase === "travel") {
      const travel = fight.travelOverride || mob.travel;
      const pct = Math.min(100, (elapsed / travel) * 100);
      const place = fight.area === "vault" ? "Secured Stronghold" : fight.area === "catacomb" ? "Catacomb of Famine" : fight.area === "pestilence" ? "Pit of Pestilence" : fight.area === "sepulchre" ? "Sepulchre of Shadows" : mob.name;
      this.root.querySelectorAll("[data-tick-fill]").forEach((bar) => { bar.style.width = `${pct}%`; });
      this.root.querySelectorAll("[data-tick-label]").forEach((el) => { el.textContent = `Walking to ${place} · ${Math.max(0, Math.ceil(travel - elapsed))}s`; });
      if (elapsed >= travel) {
        if (fight.area === "vault") {
          this.arriveVault(fight, now);
          return;
        }
        if (fight.area === "catacomb") {
          Idle.state.area = "catacomb";
          const pick = Idle.systems.combat.catacombMobs()[Math.floor(Math.random() * 3)];
          fight.mob = pick.id;
          fight.phase = "fight";
          fight.startedAt = now;
          fight.mobHp = pick.hp;
          Idle.state.pushLog({ kind: "pick", text: `Catacomb of Famine. ${this.encounterText(pick)}` });
          this.render();
          return;
        }
        if (fight.area === "pestilence") {
          Idle.state.area = "pestilence";
          const pick = Idle.systems.combat.pestilenceMobs()[Math.floor(Math.random() * 4)];
          fight.mob = pick.id;
          fight.phase = "fight";
          fight.startedAt = now;
          fight.mobHp = pick.hp;
          Idle.state.pushLog({ kind: "pick", text: `Pit of Pestilence. ${this.encounterText(pick)}` });
          this.render();
          return;
        }
        if (fight.area === "sepulchre") {
          Idle.state.area = "sepulchre";
          const pick = Idle.systems.combat.weightedPick(Idle.systems.combat.sepulchreMobs());
          fight.mob = pick.id;
          fight.phase = "fight";
          fight.startedAt = now;
          fight.mobHp = pick.hp;
          Idle.state.pushLog({ kind: "pick", text: `Sepulchre of Shadows. ${this.encounterText(pick)}` });
          this.render();
          return;
        }
        if (fight.intent === "milk") {
          if (!Idle.systems.inventory.removeQty(Idle.state.slots, "bucket", 1)) {
            Idle.state.pushLog({ kind: "full", text: "No bucket left." });
            Idle.state.fight = null;
            this.render();
            return;
          }
          Idle.systems.inventory.add(Idle.state.slots, "bucket_of_milk", 1);
          Idle.state.fight = null;
          Idle.state.milkChoice = true;
          Idle.state.pushLog({ kind: "pick", text: "Milked the cow. 1 bucket of milk." });
          this.render();
          return;
        }
        fight.phase = "fight";
        fight.startedAt = now;
        this.render();
      }
      return;
    }
    const playerBars = this.root.querySelectorAll("[data-player-swing]");
    const monsterBars = this.root.querySelectorAll("[data-mob-swing]");
    const label = this.root && this.root.querySelector("[data-fight-label]");
    if (fight.phase === "respawn") {
      playerBars.forEach((bar) => { bar.style.width = "0%"; });
      monsterBars.forEach((bar) => { bar.style.width = "0%"; });
      this.root.querySelectorAll("[data-fight-label]").forEach((label) => {
        label.textContent = `Moving to next ${mob.name.toLowerCase()} · ${Math.max(0, Math.ceil(mob.respawn - elapsed))}s`;
      });
      if (elapsed >= mob.respawn) {
        const next = Idle.systems.combat.mobById(fight.mob);
        fight.phase = "fight";
        fight.startedAt = now;
        fight.playerSwings = 0;
        fight.mobSwings = 0;
        fight.mobHp = next.hp;
        this.render();
      }
      this.paintHp(fight, mob);
      return;
    }
    const playerWait = Idle.systems.combat.swingSeconds();
    const mobWait = mob.attackSpeed;
    const playerSwings = Math.floor(elapsed / playerWait);
    const mobSwings = Math.floor(elapsed / mobWait);
    if (playerSwings > (fight.playerSwings || 0)) {
      fight.playerSwings = playerSwings;
      const weapon = Idle.systems.combat.weapon();
      const isBow = weapon && Idle.state.equipment.weapon && /bow/i.test(Idle.state.equipment.weapon);
      if (isBow) Idle.systems.sound.play("bowdraw", false);
      const hit = Idle.systems.combat.playerHit(mob);
      fight.mobHp = Math.max(0, fight.mobHp - hit.damage);
      if (isBow && hit.damage > 0) Idle.systems.sound.play("arrowhit", false);
      if (hit.damage > 0 && (mob.id === "man" || mob.id === "woman")) {
        const male = ["gasp1m", "gasp1mb", "gasp1ml"];
        const female = ["gasp1f", "gasp1fb", "gasp1fl"];
        const gasps = mob.id === "woman" ? female : male;
        Idle.systems.sound.play(gasps[Math.floor(Math.random() * gasps.length)], false);
      }
      const xp = Idle.systems.combat.grantDamageXp(hit.damage);
      this.combatLine(`You hit ${hit.damage} (max ${hit.max}). ${xp}`);
      if (fight.mobHp <= 0) this.defeatMob(mob, fight, now);
    }
    if (fight.phase === "fight" && mobSwings > (fight.mobSwings || 0)) {
      fight.mobSwings = mobSwings;
      const hit = Idle.systems.combat.monsterHit(mob);
      fight.playerHp = Math.max(0, fight.playerHp - hit.damage);
      this.combatLine(`${mob.name} hits ${hit.damage}.`);
      if (hit.damage > 0) {
        const male = ["gethit1m", "gethit1mb", "gethit1ml", "gethit2m", "gethit2mb", "gethit2ml", "gethit3m", "gethit3mb", "gethit3ml"];
        const female = ["gethit1f", "gethit1fb", "gethit1fl", "gethit2f", "gethit2fb", "gethit2fl", "gethit3f", "gethit3fb", "gethit3fl"];
        const hits = Idle.state.gender === "female" ? female : male;
        Idle.systems.sound.play(hits[Math.floor(Math.random() * hits.length)], false);
      }
      if (Idle.state.cast) {
        Idle.state.cast = null;
        if (this.teleportSound) {
          this.teleportSound.pause();
          this.teleportSound = null;
        }
        Idle.state.pushLog({ kind: "full", text: "Teleport cancelled. You were hit." });
      }
      if (fight.playerHp <= 0) {
        this.die(mob);
        return;
      }
    }
    playerBars.forEach((bar) => { bar.style.width = `${((elapsed % playerWait) / playerWait) * 100}%`; });
    monsterBars.forEach((bar) => { bar.style.width = `${((elapsed % mobWait) / mobWait) * 100}%`; });
    if (label) label.textContent = `You ${fight.playerHp} · ${mob.name} ${fight.mobHp}`;
    this.paintHp(fight, mob);
  },

  paintHp(fight, mob) {
    const playerMax = Idle.state.combatSkills.hitpoints.level;
    this.root.querySelectorAll("[data-player-hp]").forEach((bar) => {
      bar.style.width = `${Math.max(0, (fight.playerHp / playerMax) * 100)}%`;
    });
    this.root.querySelectorAll("[data-mob-hp]").forEach((bar) => {
      bar.style.width = `${Math.max(0, (fight.mobHp / mob.hp) * 100)}%`;
    });
    this.root.querySelectorAll("[data-mob-name]").forEach((el) => {
      el.textContent = `${mob.name} ${Math.max(0, fight.mobHp)} hp`;
    });
  },

  defeatMob(mob, fight, now) {
    Idle.state.seenMobs = Idle.state.seenMobs || {};
    Idle.state.seenMobs[mob.id] = true;
    const names = Idle.systems.combat.rollLoot(mob);
    if (mob.prayerOnKill && Idle.systems.inventory.count(Idle.state.slots, "ectoplasmator")) {
      Idle.systems.xp.grant(Idle.state.combatSkills.prayer, mob.prayerOnKill);
      names.push(`+${mob.prayerOnKill} prayer`);
    }
    Idle.state.pushLog({ kind: "gem", text: `${mob.name} defeated. ${names.join(", ") || "No room for loot."}` });
    if (mob.id === "grizzly_bear") {
      const sounds = ["bear_dth", "bear_die"];
      Idle.systems.sound.play(sounds[Math.floor(Math.random() * sounds.length)], false);
    }
    if (mob.id === "brutus") Idle.state.brutusDefeated = true;
    if (mob.id === "goblin" || mob.id === "cave_goblin") Idle.state.goblinKills = (Idle.state.goblinKills || 0) + 1;
    if (Idle.state.questRun && Idle.state.questRun.phase === "explore_cave" && mob.id === "cave_goblin") {
      const run = Idle.state.questRun;
      run.spawnedLeft = (run.spawnedLeft || 1) - 1;
      if (run.spawnedLeft > 0) {
        fight.phase = "fight";
        fight.startedAt = now;
        fight.mobHp = mob.hp;
        fight.playerSwings = 0;
        fight.mobSwings = 0;
        Idle.state.pushLog({ kind: "pick", text: `${run.spawnedLeft} cave goblin left.` });
        this.render();
        return;
      }
      Idle.state.fight = null;
      Idle.state.pushLog({ kind: "pick", text: "Back to exploring." });
      Idle.systems.save.write(Idle.state);
      this.render();
      return;
    }
    if (mob.area === "vault" && fight.resumeExit !== undefined) {
      Idle.state.exit = { startedAt: now, travel: fight.resumeExit, checks: 0 };
      Idle.state.fight = null;
      Idle.state.pushLog({ kind: "pick", text: "You keep walking out." });
      return;
    }
    if ((mob.area === "vault" || mob.area === "catacomb" || mob.area === "pestilence" || mob.area === "sepulchre") && fight.nextTarget) {
      const intended = Idle.systems.combat.mobById(fight.nextTarget);
      const pool = mob.area === "sepulchre" ? Idle.systems.combat.sepulchreMobs() : mob.area === "pestilence" ? Idle.systems.combat.pestilenceMobs() : mob.area === "catacomb" ? Idle.systems.combat.catacombMobs() : Idle.systems.combat.vaultMobs();
      if (Math.random() < 0.25) {
        const ambush = pool[Math.floor(Math.random() * pool.length)];
        fight.mob = ambush.id;
        Idle.state.pushLog({ kind: "pick", text: this.encounterText(ambush) });
      } else {
        fight.mob = fight.nextTarget;
        fight.nextTarget = null;
        Idle.state.pushLog({ kind: "pick", text: this.encounterText(intended) });
      }
    }
    fight.phase = "respawn";
    fight.startedAt = now;
    fight.playerSwings = 0;
    fight.mobSwings = 0;
    Idle.systems.save.write(Idle.state);
    this.refreshLive();
  },

  die(mob) {
    const gear = {};
    Object.entries(Idle.state.equipment).forEach(([slot, id]) => {
      if (id) gear[slot] = id;
    });
    Idle.state.equipment = Idle.systems.equipment.empty();
    Idle.state.fight = null;
    Idle.state.activity = null;
    Idle.state.grave = {
      mob: mob.id,
      gear,
      expiresAt: Date.now() + 15 * 60 * 1000,
      phase: "down",
    };
    Idle.state.pushLog({ kind: "full", text: `You died at ${mob.name}. Retrieve your body within 15 minutes.` });
    const deaths = Idle.state.gender === "female" ? ["death_f", "death_fb", "death_fl"] : ["death_m", "death_mb", "death_ml"];
    Idle.systems.sound.play(deaths[Math.floor(Math.random() * deaths.length)], false);
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  paintAmbience(now) {
    const town = Idle.state.town;
    if (town !== "lumbridge" && town !== "varrock") return;
    if (!this.nextBird || now > this.nextBird) {
      const birds = ["bird01", "bird02", "bird03", "bird04", "bird05"];
      Idle.systems.sound.play(birds[Math.floor(Math.random() * birds.length)], false);
      this.nextBird = now + (8000 + Math.random() * 12000);
    }
  },

  paintRecovery(now) {
    const grave = Idle.state.grave;
    const label = this.root && this.root.querySelector("[data-death-label]");
    const fill = this.root && this.root.querySelector("[data-cast-fill]");
    if (grave && Date.now() > grave.expiresAt && grave.phase !== "home") {
      Idle.state.grave = null;
      Idle.state.pushLog({ kind: "full", text: "Your body expired. The gear is gone." });
      Idle.systems.save.write(Idle.state);
      this.render();
      return;
    }
    if (grave && grave.phase === "walk") {
      const mob = Idle.systems.combat.mobById(grave.mob);
      if (!mob) {
        Idle.state.grave = null;
        this.render();
        return;
      }
      const left = Math.max(0, Math.ceil(mob.travel - (now - grave.startedAt) / 1000));
      const pct = Math.min(100, ((now - grave.startedAt) / 1000 / mob.travel) * 100);
      this.root.querySelectorAll("[data-tick-fill]").forEach((bar) => { bar.style.width = `${pct}%`; });
      this.root.querySelectorAll("[data-tick-label]").forEach((el) => { el.textContent = `Walking to ${mob.name} · ${left}s`; });
      if (label) label.textContent = `Walking back to ${mob.name} · ${left}s · body ${this.graveLeft()} left`;
      if (left <= 0) {
        Object.entries(grave.gear).forEach(([slot, id]) => {
          Idle.state.equipment[slot] = id;
        });
        grave.phase = "choice";
        grave.gear = {};
        Idle.state.pushLog({ kind: "pick", text: "You retrieved your gear." });
        Idle.systems.save.write(Idle.state);
        this.render();
      }
      return;
    }
    if (grave && grave.phase === "home") {
      const left = Math.max(0, 8 - (now - grave.startedAt) / 1000);
      if (label) label.textContent = `Casting Teleport: Home · ${Math.ceil(left)}s`;
      if (fill) fill.style.width = `${Math.min(100, ((now - grave.startedAt) / 8000) * 100)}%`;
      if (left <= 0) {
        if (this.teleportSound) {
          this.teleportSound.pause();
          this.teleportSound = null;
        }
        Idle.state.grave = null;
        Idle.state.pushLog({ kind: "pick", text: "You are home." });
        Idle.systems.save.write(Idle.state);
        this.render();
      }
      return;
    }
    if (grave && label) {
      label.textContent = `Body at ${grave.mob} · ${this.graveLeft()} left to retrieve`;
      const btn = this.root.querySelector("[data-action='retrieve-body']");
      if (btn) btn.textContent = `Retrieve body · ${this.graveLeft()}`;
    }
  },

  graveLeft() {
    const grave = Idle.state.grave;
    if (!grave) return "0s";
    return this.formatSeconds(Math.max(0, Math.ceil((grave.expiresAt - Date.now()) / 1000)));
  },

  retrieveBody() {
    const grave = Idle.state.grave;
    if (!grave || grave.phase !== "down") return;
    grave.phase = "walk";
    grave.startedAt = performance.now();
    Idle.state.activity = null;
    this.render();
  },

  continueFarming(yes) {
    const grave = Idle.state.grave;
    if (!grave || grave.phase !== "choice") return;
    if (yes) {
      const mob = grave.mob;
      Idle.state.grave = null;
      Idle.state.fight = { mob, phase: "fight", startedAt: performance.now(), playerHp: Idle.state.combatSkills.hitpoints.level, mobHp: Idle.systems.combat.mobById(mob).hp, playerSwings: 0, mobSwings: 0 };
      this.render();
      return;
    }
    grave.phase = "home";
    grave.startedAt = performance.now();
    this.teleportSound = Idle.systems.sound.play("teleport", false);
    this.render();
  },

  paintBury(now) {
    const bury = Idle.state.bury;
    if (!bury) return;
    const elapsed = now - bury.startedAt;
    this.root.querySelectorAll("[data-tick-fill]").forEach((bar) => { bar.style.width = `${Math.min(100, (elapsed / 1500) * 100)}%`; });
    this.root.querySelectorAll("[data-tick-label]").forEach((el) => { el.textContent = `Burying ${bury.name} · ${Math.max(0, Math.ceil((1500 - elapsed) / 1000))}s`; });
    if (elapsed < 1500) return;
    const slot = Idle.state.slots[bury.index];
    const item = slot && Idle.systems.inventory.catalog()[slot.id];
    if (slot && item && /bones/i.test(item.name)) {
      slot.qty -= 1;
      if (slot.qty <= 0) Idle.state.slots[bury.index] = null;
      const levels = Idle.systems.xp.grant(Idle.state.combatSkills.prayer, 4.5);
      Idle.state.pushLog({ kind: "level", text: `Buried ${item.name} (+4.5 Prayer xp).${levels ? ` Prayer is now level ${Idle.state.combatSkills.prayer.level}.` : ""}` });
    }
    if (this.burySound) {
      this.burySound.pause();
      this.burySound = null;
    }
    const spent = now - bury.startedAt;
    if (Idle.state.fight) Idle.state.fight.startedAt += spent;
    if (Idle.state.altar) Idle.state.altar.startedAt += spent;
    if (Idle.state.leave) Idle.state.leave.startedAt += spent;
    this.tickStartedAt += spent;
    Idle.state.bury = null;
    Idle.systems.save.write(Idle.state);
    this.refreshLive();
  },

  respawnMs(node) {
    const job = Idle.state.activity;
    const current = node || (job ? Idle.professions[job.profession].nodeById(job.id) : null);
    if (!current) return Idle.config.tickMs;
    if (job && job.profession === "fishing") {
      const fish = Idle.professions.fishing.available(Idle.state.skills.fishing, current);
      const seconds = fish.length ? Idle.professions.fishing.catchSeconds(fish[fish.length - 1]) : 3;
      if (!this.catchMs) this.catchMs = seconds * 1000;
      return this.catchMs;
    }
    if (job && (job.profession === "thieving" || job.profession === "agility")) {
      const seconds = Number(current.time || current.seconds) || 1.2;
      return Math.max(1200, seconds * 1000);
    }
    return Math.max(0, Number(current.seconds || current.respawn) || 0) * 1000;
  },

  formatSeconds(seconds) {
    const n = Number(seconds) || 0;
    if (n === 0) return "0s";
    if (n % 60 === 0) return `${n / 60}m`;
    if (n > 60) {
      const mins = Math.floor(n / 60);
      const secs = Math.round(n % 60);
      return `${mins}m ${secs}s`;
    }
    return `${n}s`;
  },

  refreshLive() {
    const skill = this.shownSkill();
    const pct = Math.max(0, Math.min(100, (skill.xp / skill.xpToNext) * 100));
    const xpText = `${skill.name} ${skill.level} · ${this.formatXp(skill.xp)} / ${this.formatXp(skill.xpToNext)} xp`;
    const xpLabel = this.root.querySelector("[data-xp-label]");
    if (xpLabel) xpLabel.textContent = xpText;
    this.root.querySelectorAll("[data-xp-fill]").forEach((el) => {
      el.style.width = pct + "%";
    });
    const levelLabel = this.root.querySelector("[data-level-label]");
    if (levelLabel) levelLabel.textContent = `Level ${skill.level}`;
    const xpMeta = this.root.querySelector("[data-xp-meta]");
    if (xpMeta) xpMeta.innerHTML = `${this.formatXp(skill.xp)} / ${this.formatXp(skill.xpToNext)} xp <span class="xp-gain">${this.gainText(Idle.state.screen)}</span>`;
    const gold = this.root.querySelector("[data-gold]");
    if (gold) gold.textContent = `${this.format(Idle.state.gold)} gp`;
    const used = this.root.querySelector("[data-used]");
    if (used) used.textContent = `${Idle.systems.inventory.usedCount(Idle.state.slots)} / ${Idle.config.inventorySlots}`;
    const catalog = Idle.systems.inventory.catalog();
    this.root.querySelectorAll("[data-slot]").forEach((el) => {
      const index = Number(el.dataset.slot);
      const entry = Idle.state.slots[index];
      const known = entry ? catalog[entry.id] : null;
      el.classList.toggle("filled", Boolean(entry));
      el.classList.toggle("selected", Idle.state.selectedSlot === index);
      el.classList.toggle("holding", this.holdingSlot === index);
      el.draggable = Boolean(entry);
      el.title = known ? known.name : "Empty";
      el.innerHTML = entry
        ? `${this.iconHtml(entry.id, known)}<span class="qty">${entry.qty}</span>`
        : "";
    });
    const log = this.root.querySelector("[data-log]");
    if (log) {
      log.innerHTML = Idle.state.log.length
        ? Idle.state.log.map((line) => `<p class="log-${line.kind}">${line.text}</p>`).join("")
        : `<p class="log-idle">Select a rock on the wheel.</p>`;
    }
    const sell = this.root.querySelector("[data-sell-text]");
    if (sell) {
      const slot = Idle.state.selectedSlot === null ? null : Idle.state.slots[Idle.state.selectedSlot];
      const item = slot ? catalog[slot.id] : null;
      sell.textContent = item ? `${item.name} × ${slot.qty} · ${item.sell} gp each` : "Select a stack to sell it.";
    }
  },

  shownSkill() {
    const map = { fishing: "fishing", cooking: "cooking", smithing: "smithing", anvil: "smithing", crafting: "crafting", woodcutting: "woodcutting", thieving: "thieving", agility: "agility", farming: "farming", fletching: "fletching" };
    const profession = map[Idle.state.screen] || "mining";
    const names = { mining: "Mining", smithing: "Smithing", cooking: "Cooking", fishing: "Fishing", crafting: "Crafting", woodcutting: "Woodcutting", thieving: "Thieving", agility: "Agility", farming: "Farming", fletching: "Fletching" };
    return { name: names[profession], ...Idle.state.skills[profession] };
  },

  currentNode() {
    const job = Idle.state.activity;
    if (!job || !Idle.professions[job.profession]) return null;
    return Idle.professions[job.profession].nodeById(job.id);
  },

  goToMarket(screen) {
    if (Idle.state.place === "market") {
      this.setScreen(screen);
      return;
    }
    const inDungeon = Idle.state.area === "vault" || Idle.state.area === "catacomb" || Idle.state.area === "pestilence" || Idle.state.area === "sepulchre";
    if (inDungeon || Idle.state.fight) {
      this.queueAfterLeave({ place: "market", screen });
      this.render();
      return;
    }
    this.stopOther();
    Idle.state.place = "walking";
    Idle.state.leave = { steps: [{ label: "Walking to the Grand Exchange", travel: 15, town: true }], step: 0, startedAt: performance.now(), next: { place: "market", screen }, town: false };
    Idle.state.pushLog({ kind: "pick", text: "Walking to the Grand Exchange. 15 seconds." });
    this.render();
  },

  setScreen(screen) {
    Idle.state.screen = screen;
    this.render();
  },

  stopOther(except) {
    if (except !== "gather") {
      Idle.state.activity = null;
      Idle.state.active.mining = null;
      Idle.state.running = false;
    }
    if (except !== "fight") Idle.state.fight = null;
    if (except !== "travel" && Idle.state.grave && (Idle.state.grave.phase === "walk" || Idle.state.grave.phase === "home")) {
      Idle.state.grave.phase = "down";
    }
    Idle.state.bury = null;
    Idle.state.questRun = null;
    this.askedCampfire = false;
    this.syncActivitySound();
  },

  queueAfterLeave(next) {
    const fight = Idle.state.fight;
    const inDungeon = Idle.state.area === "vault" || Idle.state.area === "catacomb" || Idle.state.area === "pestilence" || Idle.state.area === "sepulchre";
    if (!fight && !inDungeon) return false;
    const steps = [];
    if (Idle.state.area === "sepulchre") steps.push({ label: "Walking out of Sepulchre of Shadows", travel: 9 });
    if (Idle.state.area === "pestilence" || Idle.state.area === "sepulchre") steps.push({ label: "Walking out of Pit of Pestilence", travel: 9 });
    if (Idle.state.area === "catacomb" || Idle.state.area === "pestilence" || Idle.state.area === "sepulchre") steps.push({ label: "Walking out of Catacomb of Famine", travel: 9 });
    if (inDungeon) steps.push({ label: "Exiting the entrance", travel: 9 });
    steps.push({ label: "Walking to the Grand Exchange", travel: 15, town: true });
    Idle.state.leave = { steps, step: 0, startedAt: performance.now(), next, town: false };
    Idle.state.fight = null;
    Idle.state.activity = null;
    Idle.state.running = false;
    Idle.state.pushLog({ kind: "pick", text: `${steps[0].label}. ${steps[0].travel} seconds.` });
    return true;
  },

  paintLeave(now) {
    const leave = Idle.state.leave;
    if (!leave || Idle.state.bury) return;
    const step = leave.steps ? leave.steps[leave.step || 0] : null;
    const travel = step ? step.travel : leave.travel;
    const elapsed = (now - leave.startedAt) / 1000;
    const left = Math.max(0, Math.ceil(travel - elapsed));
    this.root.querySelectorAll("[data-tick-fill]").forEach((bar) => { bar.style.width = `${Math.min(100, (elapsed / travel) * 100)}%`; });
    this.root.querySelectorAll("[data-tick-label]").forEach((el) => { el.textContent = `${step ? step.label : "Walking away"} · ${left}s`; });
    if (elapsed < travel) return;
    if (leave.steps && leave.step < leave.steps.length - 1) {
      leave.step += 1;
      leave.startedAt = now;
      if (leave.steps[leave.step - 1].label.includes("Sepulchre")) Idle.state.area = "pestilence";
      if (leave.steps[leave.step - 1].label.includes("Pestilence")) Idle.state.area = "catacomb";
      if (leave.steps[leave.step - 1].label.includes("Catacomb")) Idle.state.area = "vault";
      Idle.state.pushLog({ kind: "pick", text: `${leave.steps[leave.step].label}. ${leave.steps[leave.step].travel} seconds.` });
      return;
    }
    const next = leave.next;
    Idle.state.leave = null;
    Idle.state.area = null;
    if (next && next.place === "wizards_tower" && next.quest === "imp_catcher") {
      Idle.state.town = "wizards_tower";
      Idle.state.place = "wizards_tower";
      Idle.state.screen = "quests";
      Idle.state.questProgress = Idle.state.questProgress || {};
      Idle.state.questProgress.imp_catcher = true;
      if (next.turnIn) {
        Idle.state.depositOpen = true;
        Idle.state.depositQuest = "imp_catcher";
        Idle.state.deposit = Array.from({ length: 8 }, () => null);
        Idle.state.pushLog({ kind: "pick", text: "Wizard Mizgog: Deposit the beads." });
      } else {
        Idle.state.pushLog({ kind: "pick", text: "Wizard Mizgog: Bring me a black, yellow, red, and white bead." });
      }
      Idle.systems.save.write(Idle.state);
      this.render();
      return;
    }
    if (next && next.place === "varrock" && next.chest) {
      Idle.state.town = "varrock";
      Idle.state.place = "varrock";
      Idle.state.pushLog({ kind: "pick", text: "Pirate message: Go to Falador park and dig with a spade." });
      Idle.systems.save.write(Idle.state);
      this.render();
      return;
    }
    if (next && next.place === "falador" && next.dig) {
      Idle.state.town = "falador";
      Idle.state.place = "falador";
      Idle.state.pushLog({ kind: "pick", text: "You dug in Falador park. Fight the gardener for the treasure." });
      Idle.systems.save.write(Idle.state);
      this.render();
      return;
    }
    if (next && next.place === "port_sarim" && next.retrieve) {
      Idle.state.town = "port_sarim";
      Idle.state.place = "port_sarim";
      Idle.systems.inventory.add(Idle.state.slots, "karamjan_rum", 1);
      Idle.state.pushLog({ kind: "pick", text: "You found the Karamjan rum in the crate." });
      Idle.systems.save.write(Idle.state);
      this.render();
      return;
    }
    if (next && next.place === "rimmington" && next.quest === "witchs_potion") {
      Idle.state.town = "rimmington";
      Idle.state.place = "rimmington";
      Idle.state.screen = "quests";
      Idle.state.questProgress = Idle.state.questProgress || {};
      Idle.state.questProgress.witchs_potion = true;
      if (next.turnIn) {
        Idle.state.depositOpen = true;
        Idle.state.depositQuest = "witchs_potion";
        Idle.state.deposit = Array.from({ length: 8 }, () => null);
        Idle.state.pushLog({ kind: "pick", text: "Hetty: Deposit the ingredients." });
      } else {
        Idle.state.pushLog({ kind: "pick", text: "Hetty: Bring me burnt meat, an eye of newt, an onion, and a rat's tail." });
      }
      Idle.systems.save.write(Idle.state);
      this.render();
      return;
    }
    if (next && next.place === "quest") {
      Idle.state.place = "town";
      Idle.state.screen = "quests";
      const questId = next.quest || "cooks_assistant";
      Idle.state.depositOpen = true;
      Idle.state.depositQuest = questId;
      Idle.state.deposit = Array.from({ length: 8 }, () => null);
      Idle.state.pushLog({ kind: "pick", text: "You found the quest giver. Deposit the items." });
      Idle.systems.save.write(Idle.state);
      this.render();
      return;
    }
    if (next && next.place === "market") {
      Idle.state.place = "market";
      Idle.state.screen = next.screen || "exchange";
      Idle.state.pushLog({ kind: "pick", text: "Arrived at the Grand Exchange." });
      Idle.systems.save.write(Idle.state);
      this.render();
      return;
    }
    if (next && Idle.data.towns[next.place]) {
      Idle.state.town = next.place;
      Idle.state.place = next.place;
      Idle.state.screen = "town";
      Idle.state.pushLog({ kind: "pick", text: `Arrived in ${Idle.data.towns[next.place].name}.` });
      if (next.place === "varrock" && Idle.systems.inventory.count(Idle.state.slots, "hectors_chest_key") > 0 && !Idle.state.quests.pirates_treasure) {
        this.stopOther();
        Idle.state.place = "walking";
        Idle.state.leave = { steps: [{ label: "The key is pulling you to a chest", travel: 5 }], step: 0, startedAt: performance.now(), next: { place: "varrock", chest: true }, town: false };
      }
      if (next.place === "falador" && Idle.systems.inventory.count(Idle.state.slots, "spade") > 0 && Idle.state.questProgress && Idle.state.questProgress.pirates_treasure && !Idle.state.quests.pirates_treasure) {
        this.stopOther();
        Idle.state.place = "walking";
        Idle.state.leave = { steps: [{ label: "Digging in Falador park", travel: 5 }], step: 0, startedAt: performance.now(), next: { place: "falador", dig: true }, town: false };
      }
      Idle.systems.save.write(Idle.state);
      this.render();
      return;
    }
    if (next) {
      const job = Idle.professions[next.profession];
      const node = job && job.nodeById(next.id);
      const noMats = next.profession === "smithing" && !job.hasCost(Idle.state.slots, node)
        || next.profession === "cooking" && !job.meat(Idle.state.slots, node)
        || next.profession === "anvil" && Object.entries(node.cost).some(([id, qty]) => Idle.systems.inventory.count(Idle.state.slots, id) < qty);
      if (noMats) {
        Idle.state.pushLog({ kind: "full", text: `Arrived, but missing materials for ${node.name}.` });
      } else {
        Idle.state.activity = next;
        Idle.state.running = true;
        this.tickStartedAt = performance.now();
        Idle.state.pushLog({ kind: "pick", text: `Arrived. Now ${next.profession}.` });
        this.syncActivitySound();
      }
    }
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  startSheep() {
    if (Idle.state.quests && Idle.state.quests.sheep_shearer) return;
    this.stopOther();
    if (!Idle.systems.inventory.count(Idle.state.slots, "shears")) Idle.systems.inventory.add(Idle.state.slots, "shears", 1);
    Idle.state.questProgress = Idle.state.questProgress || {};
    Idle.state.questProgress.sheep_shearer = true;
    Idle.state.questRun = { id: "sheep_shearer", phase: "walk_fred", startedAt: performance.now(), count: 0 };
    Idle.state.place = "walking";
    Idle.state.pushLog({ kind: "pick", text: "Walking to Fred. 1 minute." });
    this.render();
  },

  startDoric() {
    if (Idle.state.quests && Idle.state.quests.dorics_quest) return;
    this.stopOther();
    Idle.state.questProgress = Idle.state.questProgress || {};
    Idle.state.questProgress.dorics_quest = true;
    Idle.state.questRun = { id: "dorics_quest", phase: "walk_falador", startedAt: performance.now() };
    Idle.state.place = "walking";
    Idle.state.screen = "quests";
    Idle.state.pushLog({ kind: "pick", text: "Walking to Falador. 30 seconds." });
    this.render();
  },

  startIdes() {
    if (Idle.state.quests && Idle.state.quests.ides_of_milk) return;
    this.stopOther();
    Idle.state.questProgress = Idle.state.questProgress || {};
    Idle.state.questProgress.ides_of_milk = true;
    Idle.state.questRun = { id: "ides_of_milk", phase: "walk_pond", startedAt: performance.now() };
    Idle.state.place = "walking";
    Idle.state.screen = "quests";
    Idle.state.pushLog({ kind: "pick", text: "Walking to the Lumbridge pond. 20 seconds." });
    this.render();
  },

  returnCassius() {
    this.stopOther();
    Idle.state.questRun = { id: "ides_of_milk", phase: "return_cassius", startedAt: performance.now() };
    Idle.state.place = "walking";
    Idle.state.screen = "quests";
    Idle.state.pushLog({ kind: "pick", text: "Walking back to Cassius. 20 seconds." });
    this.render();
  },

  startPandemonium() {
    if (Idle.state.quests && Idle.state.quests.pandemonium) return;
    this.stopOther();
    Idle.state.questProgress = Idle.state.questProgress || {};
    Idle.state.questProgress.pandemonium = true;
    Idle.state.questRun = { id: "pandemonium", phase: "talk_will", startedAt: performance.now() };
    Idle.state.place = "walking";
    Idle.state.screen = "quests";
    Idle.state.pushLog({ kind: "pick", text: "Talking to Will and Anne at the Port Sarim docks." });
    this.render();
  },

  paintQuestRun(now) {
    const run = Idle.state.questRun;
    if (!run) return;
    const elapsed = (now - run.startedAt) / 1000;
    const times = { walk_fred: 60, shear_look: 1, shear_walk: 1, shear_do: 1, walk_town: 60, climb: 5, spin: 3.5, walk_falador: 30, walk_gate: 15, spot_doric: 2, walk_doric: 5, walk_pond: 20, search_pond: 2, spot_cassius: 2, talk_cassius: 3, return_cassius: 20, walk_cave: 20, talk_will: 8, navigate_helm: 5, sail_south: 35, trim_sails: 3, unset_sails: 3, deploy_hook: 5, talk_steve: 5, talk_ribs: 5, talk_steve2: 5, talk_jim: 8, take_tools: 3, board_raft: 3, build_hold: 12, return_jim: 5, receive_log: 3, board_ne: 3, sail_port: 30, take_cargo: 5, store_cargo: 3, sail_back: 30, withdraw_cargo: 3, deposit_cargo: 5, talk_jim2: 5, talk_steve3: 5 };
    const labels = {
      walk_fred: "*walking to fred*",
      shear_look: "Looking for sheep",
      shear_walk: "Walk to sheep",
      shear_do: "Shear sheep",
      walk_town: "Walking back to town",
      climb: "Climbing to the second floor",
      spin: "Spinning wool",
      walk_falador: "Walking to Falador",
      walk_gate: "Walking outside the east gate",
      spot_doric: "Spotting Doric",
      walk_doric: "Walking to Doric",
      walk_pond: "Walking to the Lumbridge pond",
      search_pond: "Searching the pond",
      spot_cassius: "Spotting Cassius",
      talk_cassius: "Talking to Cassius",
      return_cassius: "Walking back to Cassius",
      talk_will: "Talking to Will and Anne at Port Sarim",
      navigate_helm: "Navigating the helm",
      sail_south: "Sailing south through the Bay of Sarim",
      trim_sails: "Trimming the sails on a gust",
      unset_sails: "Un-setting the sails",
      deploy_hook: "Deploying the salvaging hook",
      talk_steve: "Talking to Squawking Steve Beanie",
      talk_ribs: "Talking to Ribs about the map",
      talk_steve2: "Talking to Squawking Steve Beanie again",
      talk_jim: "Talking to Junior Jim for a raft",
      take_tools: "Taking a hammer and saw",
      board_raft: "Boarding the gangplank",
      build_hold: "Building a cargo hold",
      return_jim: "Talking to Junior Jim",
      receive_log: "Receiving the Captain's log",
      board_ne: "Boarding the gangplank north-east",
      sail_port: "Sailing north to Port Sarim",
      take_cargo: "Taking cargo from the ledger",
      store_cargo: "Storing cargo in the hold",
      sail_back: "Sailing back to the Pandemonium",
      withdraw_cargo: "Withdrawing the cargo",
      deposit_cargo: "Depositing cargo at the ledger",
      talk_jim2: "Talking to Junior Jim",
      talk_steve3: "Talking to Squawking Steve Beanie",
      walk_cave: "Walking to the cave",
      explore_cave: "Exploring the cave",
    };
    const next = { talk_will: "navigate_helm", navigate_helm: "sail_south", sail_south: "trim_sails", trim_sails: "unset_sails", unset_sails: "deploy_hook", deploy_hook: "talk_steve", talk_steve: "talk_ribs", talk_ribs: "talk_steve2", talk_steve2: "talk_jim", talk_jim: "take_tools", take_tools: "board_raft", board_raft: "build_hold", build_hold: "return_jim", return_jim: "receive_log", receive_log: "board_ne", board_ne: "sail_port", sail_port: "take_cargo", take_cargo: "store_cargo", store_cargo: "sail_back", sail_back: "withdraw_cargo", withdraw_cargo: "deposit_cargo", deposit_cargo: "talk_jim2", talk_jim2: "talk_steve3" };
    if (run.phase === "explore_cave") {
      const need = 45;
      const elapsed = run.explored || 0;
      const since = (now - (run.lastCheck || run.startedAt)) / 1000;
      if (since >= 1 && !Idle.state.fight) {
        run.explored = elapsed + 1;
        run.lastCheck = now;
        if (Math.random() < 0.1 && !run.spawnedLeft) {
          const count = Math.random() < 0.5 ? 1 : 2;
          run.spawnedLeft = count;
          const mob = Idle.systems.combat.mobById("cave_goblin");
          Idle.state.fight = { mob: "cave_goblin", phase: "fight", startedAt: now, playerHp: Idle.state.combatSkills.hitpoints.level, mobHp: mob.hp, playerSwings: 0, mobSwings: 0 };
          Idle.state.screen = "adventure";
          Idle.state.pushLog({ kind: "pick", text: `${count} cave goblin${count > 1 ? "s" : ""} jump out!` });
          this.render();
          return;
        }
      }
      this.root.querySelectorAll("[data-tick-fill]").forEach((bar) => { bar.style.width = `${Math.min(100, ((run.explored || 0) / need) * 100)}%`; });
      this.root.querySelectorAll("[data-tick-label]").forEach((el) => { el.textContent = `Exploring the cave · ${Math.max(0, need - (run.explored || 0))}s`; });
      if ((run.explored || 0) >= need) {
        Idle.state.quests.cave_explorer = true;
        Idle.state.questPoints = (Idle.state.questPoints || 0) + 1;
        Idle.state.questRun = null;
        Idle.state.pushLog({ kind: "level", text: "Cave Explorer complete. +1 quest point." });
        Idle.systems.save.write(Idle.state);
        this.render();
      }
      return;
    }
    const need = times[run.phase] || 1;
    this.root.querySelectorAll("[data-tick-fill]").forEach((bar) => { bar.style.width = `${Math.min(100, (elapsed / need) * 100)}%`; });
    this.root.querySelectorAll("[data-tick-label]").forEach((el) => { el.textContent = `${labels[run.phase]} · ${Math.max(0, Math.ceil(need - elapsed))}s`; });
    if (elapsed < need) return;
    if (run.phase === "walk_fred") {
      run.phase = "shear_look";
      run.startedAt = now;
      Idle.state.pushLog({ kind: "pick", text: "Fred hands you shears. Looking for sheep." });
      return;
    }
    if (run.phase === "shear_look") {
      run.phase = "shear_walk";
      run.startedAt = now;
      return;
    }
    if (run.phase === "shear_walk") {
      run.phase = "shear_do";
      run.startedAt = now;
      return;
    }
    if (run.phase === "shear_do") {
      Idle.systems.inventory.add(Idle.state.slots, "wool", 1);
      run.count += 1;
      if (run.count < 20) {
        run.phase = "shear_look";
        run.startedAt = now;
        return;
      }
      run.phase = "walk_town";
      run.startedAt = now;
      Idle.state.pushLog({ kind: "pick", text: "20 wool. Walking back to town." });
      return;
    }
    if (run.phase === "walk_town") {
      run.phase = "climb";
      run.startedAt = now;
      run.count = 0;
      return;
    }
    if (run.phase === "climb") {
      run.phase = "spin";
      run.startedAt = now;
      return;
    }
    if (run.phase === "spin") {
      if (Idle.systems.inventory.count(Idle.state.slots, "wool") > 0) {
        Idle.systems.inventory.removeQty(Idle.state.slots, "wool", 1);
        Idle.systems.inventory.add(Idle.state.slots, "ball_of_wool", 1);
      }
      run.count += 1;
      if (run.count < 20) {
        run.startedAt = now;
        return;
      }
      Idle.state.quests.sheep_shearer = true;
      Idle.state.questPoints = (Idle.state.questPoints || 0) + 1;
      Idle.state.gold = (Idle.state.gold || 0) + 60;
      const levels = Idle.systems.xp.grant(Idle.state.skills.crafting, 150);
      Idle.state.questRun = null;
      Idle.state.place = "town";
      Idle.state.pushLog({ kind: "level", text: `Sheep Shearer complete. +150 Crafting xp. +60 gp.${levels ? ` Crafting is now level ${Idle.state.skills.crafting.level}.` : ""}` });
      Idle.systems.save.write(Idle.state);
      this.render();
    }
    if (run.phase === "walk_falador") {
      run.phase = "walk_gate";
      run.startedAt = now;
      Idle.state.pushLog({ kind: "pick", text: "Falador. Walking outside the east gate." });
      return;
    }
    if (run.phase === "walk_gate") {
      run.phase = "spot_doric";
      run.startedAt = now;
      return;
    }
    if (run.phase === "spot_doric") {
      run.phase = "walk_doric";
      run.startedAt = now;
      Idle.state.pushLog({ kind: "pick", text: "You spot Doric." });
      return;
    }
    if (run.phase === "walk_doric") {
      Idle.state.questRun = null;
      Idle.state.place = "town";
      Idle.state.screen = "quests";
      Idle.state.depositOpen = true;
      Idle.state.depositQuest = "dorics_quest";
      Idle.state.deposit = Array.from({ length: 8 }, () => null);
      Idle.state.pushLog({ kind: "pick", text: "You found Doric. Deposit 6 clay, 4 copper ore, and 2 iron ore." });
      Idle.systems.save.write(Idle.state);
      this.render();
    }
    if (run.phase === "walk_pond") {
      run.phase = "search_pond";
      run.startedAt = now;
      return;
    }
    if (run.phase === "search_pond") {
      run.phase = "spot_cassius";
      run.startedAt = now;
      Idle.state.pushLog({ kind: "pick", text: "You spot Cassius by the pond." });
      return;
    }
    if (run.phase === "spot_cassius") {
      run.phase = "talk_cassius";
      run.startedAt = now;
      return;
    }
    if (run.phase === "talk_cassius") {
      Idle.state.questRun = null;
      Idle.state.brutusUnlocked = true;
      Idle.state.place = "town";
      Idle.state.screen = "adventure";
      Idle.state.pushLog({ kind: "pick", text: "Cassius sends you to defeat Brutus at the cow pen." });
      Idle.systems.save.write(Idle.state);
      this.render();
      return;
    }
    if (run.phase === "return_cassius") {
      Idle.state.questRun = null;
      Idle.state.quests.ides_of_milk = true;
      Idle.state.questPoints = (Idle.state.questPoints || 0) + 1;
      Idle.state.place = "town";
      Idle.state.screen = "quests";
      Idle.state.pushLog({ kind: "level", text: "The Ides of Milk complete. +1 quest point." });
      Idle.systems.save.write(Idle.state);
      this.render();
      return;
    }
    if (run.phase === "walk_cave") {
      run.phase = "explore_cave";
      run.startedAt = now;
      run.lastCheck = now;
      run.explored = 0;
      Idle.state.pushLog({ kind: "pick", text: "Exploring the cave. 45 seconds." });
      return;
    }
    if (next[run.phase]) {
      run.phase = next[run.phase];
      run.startedAt = now;
      return;
    }
    if (run.phase === "talk_steve3") {
      Idle.state.quests.pandemonium = true;
      Idle.state.questPoints = (Idle.state.questPoints || 0) + 1;
      Idle.state.sailingUnlocked = true;
      Idle.state.pandemoniumAccess = true;
      Idle.professions.sailing.available = true;
      if (Idle.state.skills.sailing) Idle.systems.xp.grant(Idle.state.skills.sailing, 300);
      Idle.systems.inventory.add(Idle.state.slots, "raft", 1);
      Idle.systems.inventory.add(Idle.state.slots, "sawmill_coupon", 25);
      Idle.state.questRun = null;
      Idle.state.place = "town";
      Idle.state.screen = "quests";
      Idle.state.pushLog({ kind: "level", text: "Pandemonium complete. +1 quest point, 300 Sailing xp, a Raft, and 25 sawmill coupons." });
      Idle.systems.save.write(Idle.state);
      this.render();
    }
  },

  woodcutting() {
    const skill = Idle.state.skills.woodcutting;
    const pct = Math.max(0, Math.min(100, (skill.xp / skill.xpToNext) * 100));
    const trees = Idle.data.woodcutting.trees;
    return `
      <section class="panel">
        <div class="screen-head">
          <div><p class="kicker">Woodcutting</p></div>
          <button class="text-btn" data-action="hub">Back</button>
        </div>
        <div class="level-block">
          <div class="xp-meta" data-xp-meta>${this.formatXp(skill.xp)} / ${this.formatXp(skill.xpToNext)} xp <span class="xp-gain">${this.gainText("woodcutting")}</span></div>
          <div class="bar xp-track" aria-hidden="true"><span data-xp-fill style="width:${pct}%"></span></div>
        </div>
        <div class="bubbles">
          ${trees.map((t) => `<button class="bubble ${skill.level < t.level ? "locked" : ""}" data-gather="${t.id}">Lvl ${t.level} ${t.name}</button>`).join("")}
        </div>
      </section>
    `;
  },

  sailing() {
    const skill = Idle.state.skills.sailing || { level: 1, xp: 0, xpToNext: Idle.config.baseXpToLevel };
    const pct = Math.max(0, Math.min(100, (skill.xp / skill.xpToNext) * 100));
    return `
      <section class="panel">
        <div class="screen-head">
          <div>
            <p class="kicker">Sailing</p>
            <h1>Sailing</h1>
          </div>
          <button class="text-btn" data-action="hub">Back to menu</button>
        </div>
        <div class="level-block">
          <div class="level-label">Sailing ${skill.level}</div>
          <div class="xp-meta">${this.formatXp(skill.xp)} / ${this.formatXp(skill.xpToNext)} xp</div>
          <div class="bar xp-track" aria-hidden="true"><span style="width:${pct}%"></span></div>
        </div>
        <p class="hint">Unlocked by Pandemonium. Raft in inventory.</p>
      </section>
    `;
  },

  crafting() {
    const skill = Idle.state.skills.crafting;
    const station = this.craftStation || "spinning_wheel";
    const pct = Math.max(0, Math.min(100, (skill.xp / skill.xpToNext) * 100));
    const recipes = Idle.data.craftingRecipes.filter((recipe) => recipe.station === station);
    return `
      <section class="panel">
        <div class="screen-head">
          <div>
            <p class="kicker">Stations</p>
            <h1>Crafting</h1>
          </div>
          <button class="text-btn" data-action="hub">Back to menu</button>
        </div>
        <div class="level-block">
          <div class="level-label" data-level-label>Crafting ${skill.level}</div>
          <div class="xp-meta" data-xp-meta>${this.formatXp(skill.xp)} / ${this.formatXp(skill.xpToNext)} xp</div>
          <div class="bar xp-track" aria-hidden="true"><span data-xp-fill style="width:${pct}%"></span></div>
        </div>
        <div class="metal-tabs">
          ${Idle.data.craftingStations.map((entry) => `<button class="tab ${station === entry.id ? "on" : ""}" data-action="craft-${entry.id}">${entry.name}</button>`).join("")}
        </div>
        <div class="wheel" data-wheel>
          ${recipes.map((recipe) => {
            const active = Idle.state.activity && Idle.state.activity.profession === "crafting" && Idle.state.activity.id === recipe.id;
            return `<button class="node wheel-item ${active ? "active" : ""}" data-craft="${recipe.id}"><span class="swatch">${this.iconHtml(recipe.id, recipe)}</span><span class="node-copy"><span class="node-name">${recipe.name}</span><span class="node-stat">Crafting ${recipe.level} · ${Object.entries(recipe.cost).map(([id, qty]) => `${id.replaceAll("_", " ")} +${qty}`).join(" · ")}</span></span></button>`;
          }).join("")}
        </div>
      </section>
    `;
  },

  selectCraft(id) {
    const skill = Idle.state.skills.crafting;
    const recipe = Idle.professions.crafting.nodeById(id);
    if (!Idle.professions.crafting.canMake(skill, recipe)) return;
    if (!Idle.professions.crafting.hasCost(Idle.state.slots, recipe)) {
      Idle.state.pushLog({ kind: "full", text: `Missing materials for ${recipe.name}.` });
      this.render();
      return;
    }
    const on = Idle.state.activity && Idle.state.activity.profession === "crafting" && Idle.state.activity.id === id;
    this.stopOther("gather");
    Idle.state.activity = on ? null : { profession: "crafting", id };
    Idle.state.running = Boolean(Idle.state.activity);
    this.tickStartedAt = performance.now();
    this.render();
  },

  selectNode(id) {
    const skill = Idle.state.skills.mining;
    const node = Idle.professions.mining.nodeById(id);
    if (!Idle.professions.mining.canMine(skill, node)) return;
    const on = Idle.state.activity && Idle.state.activity.profession === "mining" && Idle.state.activity.id === id;
    if (!on && Idle.state.place === "market") {
      this.stopOther();
      Idle.state.place = "walking";
      Idle.state.leave = { steps: [{ label: "Walking to the mine", travel: 15 }], step: 0, startedAt: performance.now(), next: { profession: "mining", id }, town: false };
      Idle.state.pushLog({ kind: "pick", text: "Walking to the mine. 15 seconds." });
      this.render();
      return;
    }
    if (!on && this.queueAfterLeave({ profession: "mining", id })) {
      this.render();
      return;
    }
    this.stopOther("gather");
    Idle.state.activity = on ? null : { profession: "mining", id };
    Idle.state.place = Idle.state.activity ? "mining" : "town";
    Idle.state.active.mining = Idle.state.activity ? id : null;
    Idle.state.running = true;
    this.tickStartedAt = performance.now();
    Idle.state.pushLog({
      kind: "pick",
      text: Idle.state.activity ? `Now mining ${node.name}.` : "Mining paused.",
    });
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  selectRecipe(id) {
    const skill = Idle.state.skills.smithing;
    const bar = Idle.professions.smithing.nodeById(id);
    if (!Idle.professions.smithing.canMake(skill, bar)) return;
    if (!Idle.professions.smithing.hasCost(Idle.state.slots, bar)) {
      Idle.state.pushLog({ kind: "full", text: `Missing ingredients for ${bar.name}.` });
      this.render();
      return;
    }
    const on = Idle.state.activity && Idle.state.activity.profession === "smithing" && Idle.state.activity.id === id;
    if (!on && this.queueAfterLeave({ profession: "smithing", id })) {
      this.render();
      return;
    }
    this.stopOther("gather");
    Idle.state.activity = on ? null : { profession: "smithing", id };
    Idle.state.place = Idle.state.activity ? "smithing" : "town";
    Idle.state.active.mining = null;
    Idle.state.running = true;
    this.tickStartedAt = performance.now();
    Idle.state.pushLog({
      kind: "pick",
      text: Idle.state.activity ? `Now smelting ${bar.name}.` : "Smithing paused.",
    });
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  playPickHit() {
    const n = 1 + Math.floor(Math.random() * 5);
    Idle.systems.sound.play(`pick_hit0${n}`, false);
  },

  syncGeSound() {
    const browsing = Idle.state.screen === "exchange";
    if (browsing && !this.geSound) this.geSound = Idle.systems.sound.play("grand_exchange", true);
    if (!browsing && this.geSound) {
      this.geSound.pause();
      this.geSound = null;
    }
  },

  syncWalkSound() {
    const walking = Boolean(
      (Idle.state.fight && Idle.state.fight.phase === "travel")
      || Idle.state.exit
      || Idle.state.activity && Idle.state.activity.phase === "travel"
      || Idle.state.leave
      || (Idle.state.grave && Idle.state.grave.phase === "walk")
      || (Idle.state.altar && Idle.state.altar.phase === "travel")
      || (Idle.state.questRun && (Idle.state.questRun.id === "pandemonium" || Idle.state.questRun.phase === "walk_fred" || Idle.state.questRun.phase === "walk_town" || Idle.state.questRun.phase === "shear_walk" || Idle.state.questRun.phase === "walk_falador" || Idle.state.questRun.phase === "walk_gate" || Idle.state.questRun.phase === "walk_doric" || Idle.state.questRun.phase === "walk_pond" || Idle.state.questRun.phase === "return_cassius"))
    );
    if (walking && !this.walkSound) this.walkSound = Idle.systems.sound.play("walk", true);
    if (!walking && this.walkSound) {
      this.walkSound.pause();
      this.walkSound = null;
    }
  },

  syncActivitySound() {
    const cooking = Idle.state.activity && Idle.state.activity.profession === "cooking";
    const anvil = Idle.state.activity && Idle.state.activity.profession === "anvil";
    if (cooking && !this.cookingSound) this.cookingSound = Idle.systems.sound.play("cooking", true);
    if (!cooking && this.cookingSound) {
      this.cookingSound.pause();
      this.cookingSound = null;
    }
    if (anvil && !this.anvilSound) this.anvilSound = Idle.systems.sound.play("anvil", true);
    if (!anvil && this.anvilSound) {
      this.anvilSound.pause();
      this.anvilSound = null;
    }
  },

  startBury() {
    const slot = Idle.state.slots[Idle.state.selectedSlot];
    const item = slot && Idle.systems.inventory.catalog()[slot.id];
    if (!item || !/bones/i.test(item.name)) return;
    Idle.state.activity = null;
    Idle.state.running = false;
    this.syncActivitySound();
    Idle.state.bury = { index: Idle.state.selectedSlot, startedAt: performance.now(), name: item.name };
    this.burySound = Idle.systems.sound.play("bury", true);
    Idle.state.pushLog({ kind: "pick", text: `Burying ${item.name}.` });
    this.render();
  },

  eatSelected() {
    const slot = Idle.state.slots[Idle.state.selectedSlot];
    const item = slot && Idle.systems.inventory.catalog()[slot.id];
    if (!item || !item.heal) return;
    const max = Idle.state.combatSkills.hitpoints.level;
    const current = Idle.state.fight ? Idle.state.fight.playerHp : (Idle.state.hp || max);
    const healed = Math.min(item.heal, max - current);
    if (Idle.state.fight) Idle.state.fight.playerHp = current + healed;
    else Idle.state.hp = current + healed;
    Idle.systems.inventory.removeQty(Idle.state.slots, item.id, 1);
    Idle.state.pushLog({ kind: "pick", text: `Ate ${item.name}. Healed ${healed}.` });
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  startAltar(id) {
    const rite = Idle.data.altarFish[id];
    if (!rite) return;
    if (Idle.systems.inventory.count(Idle.state.slots, id) < 1) {
      Idle.state.pushLog({ kind: "full", text: `No ${id.replaceAll("_", " ")} to sacrifice.` });
      this.render();
      return;
    }
    this.stopOther("gather");
    Idle.state.activity = null;
    Idle.state.altar = { phase: "travel", startedAt: performance.now(), travel: 30, fish: id };
    Idle.state.pushLog({ kind: "pick", text: `Walking to the mysterious altar. 30 seconds.` });
    this.render();
  },

  altar() {
    const catalog = Idle.systems.inventory.catalog();
    const fish = Object.entries(Idle.data.altarFish);
    return `
      <section class="panel">
        <div class="screen-head">
          <div>
            <p class="kicker">Mysterious altar</p>
            <h1>Altar</h1>
          </div>
          <button class="text-btn" data-action="hub">Back to menu</button>
        </div>
        <p class="hint">30 second walk. Pick a fish to sacrifice for Prayer.</p>
        <div class="wheel" data-wheel>
          ${fish.map(([id, rite]) => {
            const item = catalog[id] || { name: id, swatch: "#888" };
            const active = Idle.state.altar && Idle.state.altar.fish === id;
            return `<button class="node wheel-item ${active ? "active" : ""}" data-altar="${id}"><span class="swatch">${this.iconHtml(id, item)}</span><span class="node-copy"><span class="node-name">${item.name}</span><span class="node-stat">${rite.prayer} Prayer · ${rite.seconds}s sacrifice</span></span></button>`;
          }).join("")}
        </div>
      </section>
    `;
  },

  paintAltar(now) {
    const altar = Idle.state.altar;
    if (!altar || Idle.state.bury) return;
    const elapsed = (now - altar.startedAt) / 1000;
    if (altar.phase === "travel") {
      this.root.querySelectorAll("[data-tick-fill]").forEach((bar) => { bar.style.width = `${Math.min(100, (elapsed / altar.travel) * 100)}%`; });
      this.root.querySelectorAll("[data-tick-label]").forEach((el) => { el.textContent = `Walking to the altar · ${Math.max(0, Math.ceil(altar.travel - elapsed))}s`; });
      if (elapsed >= altar.travel) {
        altar.phase = "sacrifice";
        altar.startedAt = now;
      }
      return;
    }
    const offer = Idle.state.slots.find((slot) => slot && slot.id === altar.fish);
    if (!offer) {
      Idle.state.altar = null;
      Idle.state.pushLog({ kind: "full", text: "No altar fish left." });
      this.render();
      return;
    }
    const rite = Idle.data.altarFish[offer.id];
    this.root.querySelectorAll("[data-tick-fill]").forEach((bar) => { bar.style.width = `${Math.min(100, (elapsed / rite.seconds) * 100)}%`; });
    this.root.querySelectorAll("[data-tick-label]").forEach((el) => { el.textContent = `Sacrificing ${offer.id.replaceAll("_", " ")} · ${rite.prayer} Prayer`; });
    if (elapsed < rite.seconds) return;
    Idle.systems.inventory.removeQty(Idle.state.slots, offer.id, 1);
    const levels = Idle.systems.xp.grant(Idle.state.combatSkills.prayer, rite.prayer);
    Idle.state.pushLog({ kind: "level", text: `Sacrificed ${offer.id.replaceAll("_", " ")} (+${rite.prayer} Prayer).${levels ? ` Prayer is now level ${Idle.state.combatSkills.prayer.level}.` : ""}` });
    altar.startedAt = now;
    Idle.systems.save.write(Idle.state);
    this.refreshLive();
  },

  paintFishTravel(now) {
    const job = Idle.state.activity;
    if (!job || job.profession !== "fishing" || job.phase !== "travel") return;
    const elapsed = (now - job.startedAt) / 1000;
    const left = Math.max(0, Math.ceil(job.travel - elapsed));
    this.root.querySelectorAll("[data-tick-fill]").forEach((bar) => { bar.style.width = `${Math.min(100, (elapsed / job.travel) * 100)}%`; });
    this.root.querySelectorAll("[data-tick-label]").forEach((el) => { el.textContent = `Walking to ${Idle.professions.fishing.nodeById(job.id).name} · ${left}s`; });
    if (elapsed < job.travel) return;
    job.phase = "fish";
    this.tickStartedAt = now;
    Idle.state.pushLog({ kind: "pick", text: `Fishing at ${Idle.professions.fishing.nodeById(job.id).name}.` });
    this.render();
  },

  selectFish(id) {
    const skill = Idle.state.skills.fishing;
    const spot = Idle.professions.fishing.nodeById(id);
    if (!Idle.professions.fishing.canFish(skill, spot)) return;
    if (!Idle.professions.fishing.hasTool(Idle.state, spot)) {
      Idle.state.pushLog({ kind: "full", text: `Need a ${spot.tool.replaceAll("_", " ")}.` });
      this.render();
      return;
    }
    if (!Idle.professions.fishing.hasBait(Idle.state, spot)) {
      Idle.state.pushLog({ kind: "full", text: `Need ${spot.consume.replaceAll("_", " ")}.` });
      this.render();
      return;
    }
    const on = Idle.state.activity && Idle.state.activity.profession === "fishing" && Idle.state.activity.id === id;
    if (!on && this.queueAfterLeave({ profession: "fishing", id })) {
      this.render();
      return;
    }
    this.stopOther("gather");
    const travel = 15 + Math.floor(Math.random() * 21);
    Idle.state.activity = { profession: "fishing", id, phase: "travel", travel, startedAt: performance.now() };
    Idle.state.area = spot.area === "cave" ? "cave" : Idle.state.area;
    Idle.state.running = true;
    Idle.state.pushLog({ kind: "pick", text: `Walking to ${spot.name}. ${travel} seconds.` });
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  fishing() {
    const skill = Idle.state.skills.fishing;
    const pct = Math.max(0, Math.min(100, (skill.xp / skill.xpToNext) * 100));
    const spots = Idle.professions.fishing.nodes();
    return `
      <section class="panel">
        <div class="screen-head">
          <div>
            <p class="kicker">Spot</p>
            <h1>Fishing</h1>
          </div>
          <button class="text-btn" data-action="hub">Back to menu</button>
        </div>
        <div class="level-block">
          <div class="level-label">Fishing ${skill.level}</div>
          <div class="xp-meta">${this.formatXp(skill.xp)} / ${this.formatXp(skill.xpToNext)} xp</div>
          <div class="bar xp-track"><span data-xp-fill style="width:${pct}%"></span></div>
        </div>
        <div class="wheel" data-wheel>
          ${spots.map((spot) => {
            const active = Idle.state.activity && Idle.state.activity.profession === "fishing" && Idle.state.activity.id === spot.id;
            const fish = Idle.professions.fishing.available(skill, spot);
            const locked = fish.length === 0;
            const bait = spot.consume ? ` · uses ${spot.consume.replaceAll("_", " ")}` : "";
            return `<button class="node wheel-item ${active ? "active" : ""} ${locked ? "locked" : ""}" data-fish="${spot.id}" ${locked ? "disabled" : ""}>
              <span class="node-copy">
                <span class="node-name">${spot.name}</span>
                <span class="node-stat">${spot.fish.map((id) => Idle.professions.fishing.fishById(id).name.replace("Raw ", "")).join(" · ")}</span>
              </span>
            </button>`;
          }).join("")}
        </div>
      </section>
    `;
  },

  selectCook(id) {
    const skill = Idle.state.skills.cooking;
    const recipe = Idle.professions.cooking.nodeById(id);
    if (!Idle.professions.cooking.canMake(skill, recipe)) return;
    if (!Idle.professions.cooking.meat(Idle.state.slots, recipe)) {
      Idle.state.pushLog({ kind: "full", text: `Missing raw food for ${recipe.name}.` });
      this.render();
      return;
    }
    const on = Idle.state.activity && Idle.state.activity.profession === "cooking" && Idle.state.activity.id === id;
    if (!on && this.queueAfterLeave({ profession: "cooking", id })) {
      this.render();
      return;
    }
    this.stopOther("gather");
    Idle.state.activity = on ? null : { profession: "cooking", id };
    Idle.state.running = true;
    this.tickStartedAt = performance.now();
    this.syncActivitySound();
    Idle.state.pushLog({ kind: "pick", text: Idle.state.activity ? `Now cooking ${recipe.name}.` : "Cooking paused." });
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  cooking() {
    const skill = Idle.state.skills.cooking;
    const pct = Math.max(0, Math.min(100, (skill.xp / skill.xpToNext) * 100));
    const recipes = Idle.professions.cooking.nodes();
    return `
      <section class="panel">
        <div class="screen-head">
          <div>
            <p class="kicker">Range</p>
            <h1>Cooking</h1>
          </div>
          <button class="text-btn" data-action="hub">Back to menu</button>
        </div>
        <div class="level-block">
          <div class="level-label" data-level-label>Cooking ${skill.level}</div>
          <div class="xp-meta" data-xp-meta>${this.formatXp(skill.xp)} / ${this.formatXp(skill.xpToNext)} xp <span class="xp-gain">${this.gainText("cooking")}</span></div>
          <div class="bar xp-track" aria-hidden="true"><span data-xp-fill style="width:${pct}%"></span></div>
        </div>
        <p class="hint">Cooked meat takes any one raw meat. Burns give 0 xp and burnt meat. Burn chance is 40% at level 1 and gone at level 35.</p>
        <div class="wheel" data-wheel>
          ${recipes.map((recipe) => {
            const active = Idle.state.activity && Idle.state.activity.profession === "cooking" && Idle.state.activity.id === recipe.id;
            return `<button class="node wheel-item cook-row ${active ? "active" : ""}" data-cook="${recipe.id}"><span class="swatch">${this.iconHtml(recipe.id, recipe)}</span><span class="cook-copy"><span class="node-name">${recipe.name}</span><span class="ingredient-row">${recipe.alternatives.map((id) => `<span>${id.replaceAll("_", " ")} +1</span>`).join("")}</span></span></button>`;
          }).join("")}
        </div>
      </section>
    `;
  },

  gainText(profession) {
    const job = Idle.state.activity;
    if (!job || job.profession !== profession) return "";
    const node = Idle.professions[profession] && Idle.professions[profession].nodeById(job.id);
    return node ? `+${this.formatXp(node.xp)} xp` : "";
  },

  takeFromBag(index) {
    const entry = Idle.state.bag[index];
    if (!entry) return;
    if (Idle.systems.inventory.add(Idle.state.slots, entry.id, entry.qty)) Idle.state.bag[index] = null;
    this.render();
  },

  storeSelectedInBag() {
    if (!Idle.systems.inventory.count(Idle.state.slots, "looting_bag")) return;
    const index = Idle.state.selectedSlot;
    const entry = Idle.state.slots[index];
    if (!entry || entry.id === "looting_bag") return;
    if (!Idle.systems.inventory.add(Idle.state.bag, entry.id, entry.qty)) return;
    Idle.state.slots[index] = null;
    this.render();
  },

  openNest(id) {
    const seeds = [
      { id: "acorn", chance: 1 / 4.724, sell: 88 },
      { id: "apple_tree_seed", chance: 1 / 5.947, sell: 18 },
      { id: "willow_seed", chance: 1 / 7.489, sell: 44 },
      { id: "banana_tree_seed", chance: 1 / 9.361, sell: 30 },
      { id: "orange_tree_seed", chance: 1 / 11.89, sell: 34 },
      { id: "curry_tree_seed", chance: 1 / 14.87, sell: 57 },
      { id: "maple_seed", chance: 1 / 18.72, sell: 2247 },
      { id: "pineapple_seed", chance: 1 / 24.07, sell: 64 },
      { id: "papaya_tree_seed", chance: 1 / 29.74, sell: 1040 },
      { id: "yew_seed", chance: 1 / 37.44, sell: 16258 },
      { id: "palm_tree_seed", chance: 1 / 45.95, sell: 10611 },
      { id: "calquat_tree_seed", chance: 1 / 59.47, sell: 313 },
      { id: "spirit_seed", chance: 1 / 91.91, sell: 0 },
      { id: "dragonfruit_tree_seed", chance: 1 / 168.5, sell: 129710 },
      { id: "magic_seed", chance: 1 / 202.2, sell: 59570 },
      { id: "teak_seed", chance: 1 / 252.8, sell: 82 },
      { id: "mahogany_seed", chance: 1 / 252.8, sell: 66 },
      { id: "celastrus_seed", chance: 1 / 337, sell: 12810 },
      { id: "redwood_tree_seed", chance: 1 / 505.5, sell: 13057 },
    ];
    const rings = [
      { id: "sapphire_ring", chance: 1 / 2.5, sell: 372 },
      { id: "gold_ring", chance: 1 / 2.857, sell: 141 },
      { id: "emerald_ring", chance: 1 / 6.667, sell: 555 },
      { id: "ruby_ring", chance: 1 / 11.11, sell: 951 },
      { id: "diamond_ring", chance: 1 / 100, sell: 1786 },
    ];
    const eggs = ["red_bird_egg", "blue_bird_egg", "green_bird_egg"];
    if (!Idle.systems.inventory.removeQty(Idle.state.slots, id, 1)) return;
    let drop = null;
    if (id === "bird_nest_seeds") {
      const total = seeds.reduce((sum, s) => sum + 1 / s.chance, 0);
      let roll = Math.random() * total;
      for (const seed of seeds) {
        roll -= 1 / seed.chance;
        if (roll < 0) { drop = seed.id; break; }
      }
    } else if (id === "bird_nest_rings") {
      const total = rings.reduce((sum, r) => sum + 1 / r.chance, 0);
      let roll = Math.random() * total;
      for (const ring of rings) {
        roll -= 1 / ring.chance;
        if (roll < 0) { drop = ring.id; break; }
      }
    } else {
      drop = eggs[Math.floor(Math.random() * eggs.length)];
    }
    if (drop) Idle.systems.inventory.add(Idle.state.slots, drop, 1);
    Idle.state.pushLog({ kind: "pick", text: `Opened nest. Got ${drop.replaceAll("_", " ")}.` });
  },

  selectSlot(index) {
    if (this.holdingSlot === index) {
      this.holdingSlot = null;
      Idle.state.selectedSlot = null;
      this.render();
      return;
    }
    if (this.holdingSlot === null || this.holdingSlot === undefined) {
      if (!Idle.state.slots[index]) {
        Idle.state.selectedSlot = null;
        this.render();
        return;
      }
      this.holdingSlot = index;
      Idle.state.selectedSlot = index;
      this.render();
      return;
    }
    Idle.systems.inventory.move(Idle.state.slots, this.holdingSlot, index);
    this.holdingSlot = null;
    Idle.state.selectedSlot = null;
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  reset() {
    if (!window.confirm("Wipe gold, ore, and Mining level?")) return;
    Idle.systems.save.clear();
    Idle.state.gold = 0;
    Idle.state.slots = Idle.systems.inventory.emptySlots();
    Idle.state.skills.mining = Idle.professions.mining.createSkill();
    Idle.state.skills.smithing = Idle.professions.smithing.createSkill();
    Idle.state.active.mining = null;
    Idle.state.activity = null;
    Idle.state.selectedSlot = null;
    Idle.state.selectedEquip = null;
    Idle.state.log = [];
    this.render();
  },

  render() {
    const screen = Idle.state.screen;
    this.root.innerHTML = `
      <div class="shell">
        ${this.topbar()}
        <div class="layout ${screen === "adventure" ? "solo" : ""}">
          <main class="stage">${this.stage()}</main>
          ${screen === "adventure" ? "" : `<aside class="bag">${this.inventory()}</aside>`}
        </div>
        <div class="settings">
          ${screen === "adventure" ? this.milkButton() : ""}
          <button class="settings-btn" data-action="settings">Settings</button>
          <div class="settings-panel" ${this.settingsOpen ? "" : "hidden"}>
            <label>Sound <input type="range" min="0" max="100" value="${Math.round(Idle.systems.sound.volume * 100)}" data-volume></label>
            <button class="btn gender ${Idle.state.gender === "female" ? "female" : "male"}" data-action="gender">${Idle.state.gender === "female" ? "Female" : "Male"}</button>
            <button class="btn danger" data-action="reset">Reset save</button>
          </div>
        </div>
        ${this.questCompleteOverlay()}
        ${this.choiceOverlay()}
      </div>
    `;
    this.bind();
  },

  choiceOverlay() {
    const choice = Idle.state.choice;
    if (!choice) return "";
    return `
      <div class="choice-overlay">
        <div class="choice-box">
          <p>${choice.text}</p>
          ${choice.options.map((opt) => `<button class="btn" data-choice="${opt.id}">${opt.label}</button>`).join("")}
        </div>
      </div>
    `;
  },

  questCompleteOverlay() {
    const done = Idle.state.questComplete;
    if (!done) return "";
    return `
      <div class="quest-complete" data-action="close-quest-complete">
        <img src="images/questcomplete.png" alt="">
        <div class="quest-complete-text">
          <p>Congratulations!</p>
          <p>${done.name}</p>
          ${done.lines.map((line) => `<p>${line}</p>`).join("")}
        </div>
      </div>
    `;
  },

  styleButtons() {
    const attack = Idle.systems.combat.attackName();
    return `<div class="metal-tabs style-tabs">${Idle.systems.combat.styles().map((name) => `<button class="tab ${Idle.state.style === name ? "on" : ""}" data-style="${name}">${attack}; ${name}</button>`).join("")}<button class="tab" data-action="flee" ${Idle.state.fleeUntil && Date.now() < Idle.state.fleeUntil ? "disabled" : ""}>Flee</button></div>`;
  },

  combatBars(mob) {
    const skills = Idle.state.combatSkills;
    return `
      <div class="fight">
        <div class="hp-col"><div class="hp-track"><span class="hp-fill" data-player-hp style="width:100%"></span></div></div>
        <div class="hp-col right"><div class="hp-track"><span class="hp-fill mob" data-mob-hp style="width:100%"></span></div></div>
        <div class="swing-track"><span class="swing player" data-player-swing></span></div>
        <div class="swing-track from-right"><span class="swing monster" data-mob-swing></span></div>
      </div>`;
  },

  topbar() {
    const skill = this.shownSkill();
    const node = this.currentNode();
    const pct = Math.max(0, Math.min(100, (skill.xp / skill.xpToNext) * 100));
    const fight = Idle.state.fight;
    const grave = Idle.state.grave;
    const mob = fight ? Idle.systems.combat.mobById(fight.mob) : grave ? Idle.systems.combat.mobById(grave.mob) : null;
    const action = node
      ? `${{ anvil: "Hammering", smithing: "Smelting", cooking: "Cooking", fishing: "Fishing", mining: "Mining" }[Idle.state.activity.profession] || "Working"} ${node.name} · +${this.formatXp(node.xp)} xp`
      : "";
    let tracker = `<div class="tickbar"><div class="tickbar-label"><span data-tick-label>${action}</span></div><div class="tickbar-track" aria-hidden="true"><span data-tick-fill style="width:0%"></span></div></div>`;
    if (fight && fight.phase !== "travel") tracker = `${this.combatBars(mob)}<p data-fight-label></p>`;
    if (fight && fight.phase === "travel") tracker = `<div class="tickbar"><div class="tickbar-label"><span data-tick-label>${fight.area === "vault" ? "Walking to Secured Stronghold" : `Walking to ${mob.name}`}</span></div><div class="tickbar-track"><span data-tick-fill style="width:0%"></span></div></div>`;
    if (grave && grave.phase === "walk") tracker = `<div class="tickbar"><div class="tickbar-label"><span data-tick-label>Walking to ${mob ? mob.name : "body"}</span></div><div class="tickbar-track"><span data-tick-fill style="width:0%"></span></div></div>`;
    if (grave && grave.phase === "choice") tracker = `<div class="tickbar"><div class="tickbar-label"><span data-tick-label>Gear recovered · continue farming?</span></div><div class="tickbar-track"><span data-tick-fill style="width:100%"></span></div></div>`;
    if (Idle.state.cast) tracker = `<div class="tickbar"><div class="tickbar-label"><span data-tick-label>Casting Teleport: Home</span></div><div class="tickbar-track"><span data-tick-fill data-cast-fill style="width:0%"></span></div></div>`;
    if (Idle.state.exit) tracker = `<div class="tickbar"><div class="tickbar-label"><span data-tick-label>Exiting the entrance</span></div><div class="tickbar-track"><span data-tick-fill style="width:0%"></span></div></div>`;
    if (Idle.state.leave && Idle.state.leave.town) tracker = `<div class="tickbar"><div class="tickbar-label"><span data-tick-label>Walking back to town</span></div><div class="tickbar-track"><span data-tick-fill style="width:0%"></span></div></div>`;
    if (Idle.state.bury) tracker = `<div class="tickbar"><div class="tickbar-label"><span data-tick-label>Burying bones</span></div><div class="tickbar-track"><span data-tick-fill style="width:0%"></span></div></div>`;
    if (!Idle.state.fight && !Idle.state.activity && Idle.state.orders && Idle.state.orders.length) {
      const order = Idle.state.orders[0];
      const elapsed = (performance.now() - order.startedAt) / 1000;
      const left = Math.max(0, Math.ceil(order.each - (elapsed % order.each)));
      tracker = `<div class="tickbar"><div class="tickbar-label"><span data-tick-label>Haggling · ${left}s</span></div><div class="tickbar-track"><span data-tick-fill style="width:${Math.min(100, ((elapsed % order.each) / order.each) * 100)}%"></span></div></div>`;
    }
    if (Idle.state.altar) tracker = `<div class="tickbar"><div class="tickbar-label"><span data-tick-label>Altar</span></div><div class="tickbar-track"><span data-tick-fill style="width:0%"></span></div></div>`;
    if (Idle.state.campfire) {
      const fire = Idle.state.campfire;
      const fireElapsed = (performance.now() - fire.startedAt) / 1000;
      const fireLeft = fire.phase === "cook" ? Math.max(0, 30 - fireElapsed) : fire.phase === "light" ? Math.max(0, 2.4 - fireElapsed) : 0;
      const fireLabel = fire.phase === "light" ? "Lighting campfire" : fire.phase === "cook" ? `Campfire · ${Math.ceil(fireLeft)}s` : "Campfire";
      const cook = fire.cooking;
      const cookLabel = cook ? `Cooking · ${Math.max(0, Math.ceil(cook.seconds - (performance.now() - cook.startedAt) / 1000))}s` : "";
      tracker = `<div class="tickbar"><div class="tickbar-label"><span data-tick-label>${fireLabel}</span></div><div class="tickbar-track"><span data-tick-fill data-fire-fill style="width:0%"></span></div></div>${cook ? `<div class="tickbar"><div class="tickbar-label"><span data-cook-label>${cookLabel}</span></div><div class="tickbar-track"><span data-cook-fill style="width:0%"></span></div></div>` : ""}`;
    }
    const hpMax = Idle.state.combatSkills.hitpoints.level;
    const hpNow = Idle.state.fight ? Idle.state.fight.playerHp : (Idle.state.hp || hpMax);
    const hpPct = Math.max(0, Math.min(100, (hpNow / hpMax) * 100));
    return `
      <header class="topbar">
        <div class="topbar-row">
          <div class="hp-bar-wrap">
            <div class="bar hp-track"><span data-hp-fill style="width:${hpPct}%"></span></div>
            <span data-hp-label>${hpNow} / ${hpMax} hp</span>
          </div>
          <div class="status">
            <span class="pill" data-xp-label>${skill.name} ${skill.level} · ${this.formatXp(skill.xp)} / ${this.formatXp(skill.xpToNext)} xp</span>
          </div>
        </div>
        ${this.styleButtons()}
        ${tracker}
      </header>
    `;
  },

  hub() {
    const cards = [
      { id: "equipment", name: "Equipment", note: "Wear weapons and armor" },
      { id: "town", name: "Town", note: "Where you are and what is here" },
      { id: "adventure", name: "Adventure", note: "Walk out and fight" },
      { id: "spellbook", name: "Spellbook", note: "Teleport and spells" },
      { id: "stats", name: "Stats", note: "Combat and profession levels" },
      { id: "quests", name: "Quest Journal", note: "Available, in progress, completed" },
      { id: "bestiary", name: "Bestiary", note: "Mobs you have seen" },
    ];
    return `
      <section class="panel">
        <div class="menu-grid">
          ${cards.map((card) => `
            <button class="menu-card" data-action="open-${card.id}">
              <span class="menu-name">${card.name}</span>
              <span class="menu-note">${card.note}</span>
            </button>`).join("")}
        </div>
      </section>
    `;
  },

  bestiary() {
    const seen = Idle.state.seenMobs || {};
    const picked = Idle.state.seenItems || {};
    const catalog = Idle.systems.inventory.catalog();
    const mobs = Idle.data.mobs.filter((mob) => seen[mob.id]);
    const dropNames = (mob) => {
      const ids = [...(mob.drops || []).map((drop) => drop.id), ...(mob.table || []).map((drop) => drop.id)];
      const unique = [...new Set(ids)].filter((id) => picked[id]);
      return unique.map((id) => catalog[id] ? catalog[id].name : id.replaceAll("_", " ")).join(", ") || "No drops picked up yet.";
    };
    return `
      <section class="panel">
        <div class="screen-head">
          <p class="kicker">Bestiary</p>
          <button class="text-btn" data-action="hub">Back</button>
        </div>
        <div class="wheel">
          ${mobs.map((mob) => `<div class="node wheel-item"><span class="node-copy" style="display:flex;gap:8px;white-space:nowrap"><span class="node-name" style="display:inline">${mob.name}</span><span class="node-stat" style="display:inline">${dropNames(mob)}</span></span></div>`).join("") || `<p class="hint">You have not seen any creatures yet.</p>`}
        </div>
      </section>
    `;
  },

  townScreen() {
    const town = Idle.data.towns[Idle.state.town] || Idle.data.towns.lumbridge;
    const others = Object.values(Idle.data.towns).filter((entry) => entry.id !== town.id);
    const open = this.townOpen || {};
    const section = (id, title, body) => `<button class="kicker" data-action="toggle-${id}" style="background:none;border:none;cursor:pointer;text-align:left">${open[id] ? "▾" : "▸"} ${title}</button>${open[id] ? body : ""}`;
    const npcLine = (npc) => {
      const done = Idle.state.quests && Idle.state.quests[npc.quest];
      const progress = Idle.state.questProgress && Idle.state.questProgress[npc.quest];
      const color = done ? "#6a8f4a" : progress ? "#c9a24a" : "#d7c4a8";
      return `<button class="node wheel-item" data-action="talk-${npc.id}"><span class="node-copy" style="display:flex;gap:8px;white-space:nowrap"><span class="node-name" style="display:inline;color:${color}">${npc.name}</span><span class="node-stat" style="display:inline">${done ? "Finished" : npc.note}</span></span></button>`;
    };
    return `
      <section class="panel">
        <div class="screen-head">
          <div>
            <p class="kicker">You are in</p>
            <h1>${town.name}</h1>
          </div>
          <button class="text-btn" data-action="hub">Back</button>
        </div>
        <p class="hint">Stay here until you travel. Local walks are 10 seconds. No walk back while you are in town.</p>
        ${town.professions.length ? section("professions", "Professions", `<div class="wheel">${town.professions.map((entry) => `<button class="node wheel-item" data-action="open-${entry.id}"><span class="node-copy" style="display:flex;gap:8px;white-space:nowrap"><span class="node-name" style="display:inline">${entry.name}</span><span class="node-stat" style="display:inline">${entry.note}</span></span></button>`).join("")}</div>`) : ""}
        ${town.mobs.length ? section("creatures", "Creatures", `<div class="wheel">${town.mobs.map((entry) => {
          const mob = Idle.systems.combat.mobById(entry.id);
          const level = mob ? mob.level : "";
          return `<button class="node wheel-item" data-town-mob="${entry.id}"><span class="node-copy" style="display:flex;gap:8px;white-space:nowrap"><span class="node-name" style="display:inline">${entry.name}</span><span class="node-stat" style="display:inline">lvl ${level}${entry.note ? ` · ${entry.note}` : ""}</span></span></button>`;
        }).join("")}</div>`) : ""}
        ${town.gather && town.gather.length ? section("gather", "Gather", `<div class="wheel">${town.gather.map((entry) => {
          const hops = Idle.state.hops || {};
          const seeds = Idle.systems.inventory.count(Idle.state.slots, "flax_seed");
          const note = entry.id === "hops" ? (hops.crop ? "Flax patch" : seeds >= 3 ? "Flax patch" : "No seeds") : entry.note;
          return `<button class="node wheel-item" data-gather="${entry.id}"><span class="node-copy" style="display:flex;gap:8px;white-space:nowrap"><span class="node-name" style="display:inline">${entry.name}</span><span class="node-stat" style="display:inline">${note}</span></span></button>`;
        }).join("")}</div>`) : ""}
        ${town.npcs.length ? section("people", "People", `<div class="wheel">${town.npcs.map(npcLine).join("")}</div>`) : ""}
        ${town.services.length ? section("services", "Services", `<div class="wheel">${town.services.map((entry) => `<button class="node wheel-item" data-action="open-${entry.id}"><span class="node-copy" style="display:flex;gap:8px;white-space:nowrap"><span class="node-name" style="display:inline">${entry.name}</span><span class="node-stat" style="display:inline">${entry.note}</span></span></button>`).join("")}</div>`) : ""}
        ${section("travel", "Travel", `<div class="bubbles">${others.filter((entry) => {
          const key = `${town.id}|${entry.id}`;
          if (Idle.data.townTravel[key] === undefined) return false;
          if (entry.id === "karamja" && !Idle.state.karamjaUnlocked) return false;
          if (town.id === "karamja") return false;
          return true;
        }).map((entry) => {
          const label = entry.id === "karamja" ? "Sail to Karamja" : entry.name;
          return `<button class="bubble" data-travel="${entry.id}">${label}</button>`;
        }).join("")}</div>`)}
      </section>
    `;
  },

    turnInSimple(questId, itemId, qty, starter) {
    if (Idle.state.quests[questId]) return;
    if (starter && !Idle.systems.inventory.count(Idle.state.slots, starter)) {
      Idle.systems.inventory.add(Idle.state.slots, starter, 1);
      Idle.state.pushLog({ kind: "pick", text: `Given a ${starter.replaceAll("_", " ")}.` });
    }
    if (Idle.systems.inventory.count(Idle.state.slots, itemId) < qty) {
      this.render();
      return;
    }
    Idle.systems.inventory.removeQty(Idle.state.slots, itemId, qty);
    Idle.state.quests[questId] = true;
    Idle.state.questPoints = (Idle.state.questPoints || 0) + 1;
    const quest = Idle.data.quests[questId];
    if (quest.rewardXp) {
      Object.entries(quest.rewardXp).forEach(([skill, amount]) => {
        if (Idle.state.skills[skill]) Idle.systems.xp.grant(Idle.state.skills[skill], amount);
      });
    }
    if (quest.gold) Idle.state.gold = (Idle.state.gold || 0) + quest.gold;
    Idle.state.pushLog({ kind: "level", text: `${quest.name} complete. +1 quest point.` });
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  startCave() {
    if (Idle.state.quests && Idle.state.quests.cave_explorer) return;
    this.stopOther();
    Idle.state.questProgress = Idle.state.questProgress || {};
    Idle.state.questProgress.cave_explorer = true;
    Idle.state.questRun = { id: "cave_explorer", phase: "walk_cave", startedAt: performance.now(), explored: 0, lastCheck: 0 };
    Idle.state.place = "walking";
    Idle.state.screen = "quests";
    Idle.state.pushLog({ kind: "pick", text: "Walking to the cave. 20 seconds." });
    this.render();
  },

  turnInSlayer() {
    if (Idle.state.quests.goblin_slayer) return;
    if ((Idle.state.goblinKills || 0) < 100) return;
    Idle.state.quests.goblin_slayer = true;
    Idle.state.questPoints = (Idle.state.questPoints || 0) + 2;
    Idle.systems.xp.grant(Idle.state.skills.slayer, 300);
    Idle.state.pushLog({ kind: "level", text: "Goblin Slayer complete. +300 Slayer xp. +2 quest points." });
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  startCampfire() {
    if (!Idle.systems.inventory.count(Idle.state.slots, "tinderbox")) {
      Idle.state.pushLog({ kind: "full", text: "You need a tinderbox." });
      this.render();
      return;
    }
    if (!Idle.systems.inventory.count(Idle.state.slots, "logs")) {
      Idle.state.pushLog({ kind: "full", text: "You need a log." });
      this.render();
      return;
    }
    this.stopOther();
    Idle.state.campfire = { phase: "light", startedAt: performance.now() };
    Idle.state.screen = "firemaking";
    Idle.state.pushLog({ kind: "pick", text: "Lighting a campfire." });
    this.render();
  },

  cookOnFire(id) {
    const fire = Idle.state.campfire;
    if (!fire || fire.phase !== "cook") return;
    const recipe = Idle.professions.firemaking.cookables().find((entry) => entry.id === id);
    if (!recipe) return;
    const raw = (recipe.alternatives || []).find((item) => Idle.systems.inventory.count(Idle.state.slots, item) > 0);
    if (!raw) {
      Idle.state.pushLog({ kind: "full", text: `No ${recipe.name.replace("Cooked ", "raw ")} to cook.` });
      this.render();
      return;
    }
    fire.cooking = { id, raw, seconds: recipe.respawn || 2.4, startedAt: performance.now() };
    Idle.state.pushLog({ kind: "pick", text: `Cooking ${recipe.name}.` });
    this.render();
  },

  paintCampfire(now) {
    const fire = Idle.state.campfire;
    if (!fire) return;
    const elapsed = (now - fire.startedAt) / 1000;
    if (fire.phase === "light") {
      this.root.querySelectorAll("[data-fire-fill]").forEach((bar) => { bar.style.width = `${Math.min(100, (elapsed / 2.4) * 100)}%`; });
      this.root.querySelectorAll("[data-tick-label]").forEach((el) => { el.textContent = "Lighting campfire"; });
      if (elapsed < 2.4) return;
      const skill = Idle.state.skills.firemaking;
      if (Math.random() < Idle.professions.firemaking.failRate(skill.level)) {
        fire.startedAt = now;
        return;
      }
      Idle.systems.inventory.removeQty(Idle.state.slots, "logs", 1);
      Idle.systems.xp.grant(skill, 40);
      fire.phase = "cook";
      fire.startedAt = now;
      Idle.state.pushLog({ kind: "level", text: "Campfire lit. +40 Firemaking xp. 30 seconds to cook." });
      Idle.systems.save.write(Idle.state);
      this.render();
      return;
    }
    if (fire.cooking) {
      const cook = fire.cooking;
      const cookElapsed = (now - cook.startedAt) / 1000;
      this.root.querySelectorAll("[data-cook-fill]").forEach((bar) => { bar.style.width = `${Math.min(100, (cookElapsed / cook.seconds) * 100)}%`; });
      this.root.querySelectorAll("[data-cook-label]").forEach((el) => { el.textContent = `Cooking · ${Math.max(0, Math.ceil(cook.seconds - cookElapsed))}s`; });
      const fireElapsed = (now - fire.startedAt) / 1000;
      this.root.querySelectorAll("[data-fire-fill]").forEach((bar) => { bar.style.width = `${Math.min(100, (fireElapsed / 30) * 100)}%`; });
      this.root.querySelectorAll("[data-tick-label]").forEach((el) => { el.textContent = `Campfire · ${Math.max(0, Math.ceil(30 - fireElapsed))}s`; });
      if (cookElapsed >= cook.seconds) {
        const recipe = Idle.professions.firemaking.cookables().find((entry) => entry.id === cook.id);
        if (recipe && Idle.systems.inventory.removeQty(Idle.state.slots, cook.raw, 1)) {
          const skill = Idle.state.skills.cooking;
          const burn = skill.level < (recipe.stopBurn || 35) && Math.random() < (recipe.burn || 0);
          const made = burn ? recipe.burnt : recipe.id;
          Idle.systems.inventory.add(Idle.state.slots, made, 1);
          if (!burn) Idle.systems.xp.grant(skill, recipe.xp);
          Idle.state.pushLog({ kind: burn ? "full" : "pick", text: burn ? `Burnt the ${recipe.name}.` : `Cooked ${recipe.name} (+${recipe.xp} Cooking xp).` });
        }
        fire.cooking = null;
        Idle.systems.save.write(Idle.state);
        this.render();
      }
      return;
    }
    if (fire.phase === "cook") {
      const left = Math.max(0, 30 - elapsed);
      this.root.querySelectorAll("[data-fire-fill]").forEach((bar) => { bar.style.width = `${Math.min(100, (elapsed / 30) * 100)}%`; });
      this.root.querySelectorAll("[data-tick-label]").forEach((el) => { el.textContent = `Campfire · ${Math.ceil(left)}s`; });
      if (left <= 0) {
        if (!this.askedCampfire) {
          this.askedCampfire = true;
          fire.phase = "ask";
          Idle.state.pushLog({ kind: "pick", text: "Continue lighting campfires?" });
          this.render();
          return;
        }
        Idle.state.campfire = null;
        Idle.state.pushLog({ kind: "pick", text: "The campfire dies out." });
        this.render();
      }
    }
  },

  firemaking() {
    const skill = Idle.state.skills.firemaking;
    const pct = Math.max(0, Math.min(100, (skill.xp / skill.xpToNext) * 100));
    const fire = Idle.state.campfire;
    const recipes = Idle.professions.firemaking.cookables();
    return `
      <section class="panel">
        <div class="screen-head">
          <div>
            <p class="kicker">Firemaking</p>
            <h1>Firemaking</h1>
          </div>
          <button class="text-btn" data-action="hub">Back</button>
        </div>
        <div class="level-block">
          <div class="level-label">Firemaking ${skill.level}</div>
          <div class="xp-meta">${this.formatXp(skill.xp)} / ${this.formatXp(skill.xpToNext)} xp</div>
          <div class="bar xp-track" aria-hidden="true"><span style="width:${pct}%"></span></div>
        </div>
        <p class="hint">${fire && fire.phase === "cook" ? "Campfire is lit. Cook what you have." : fire && fire.phase === "ask" ? "Continue lighting campfires?" : "Select a log and light a campfire."}</p>
        ${fire && fire.phase === "ask" ? `<div class="choice-row"><button class="btn" data-action="camp-yes">Yes</button><button class="btn" data-action="camp-no">No</button></div>` : ""}
        ${fire && fire.phase === "cook" ? `<div class="wheel">${recipes.map((recipe) => {
          const have = (recipe.alternatives || []).some((id) => Idle.systems.inventory.count(Idle.state.slots, id) > 0);
          return `<button class="node wheel-item ${have ? "" : "locked"}" data-firecook="${recipe.id}" ${have ? "" : "disabled"}><span class="node-copy"><span class="node-name">${recipe.name}</span><span class="node-stat">Cooking ${recipe.level}</span></span></button>`;
        }).join("")}</div>` : ""}
      </section>
    `;
  },

  openStore() {
    Idle.state.screen = "store";
    this.render();
  },

  openWydinShop() {
    Idle.state.screen = "wydin";
    this.render();
  },

  wydinShop() {
    Idle.state.wydin = Idle.state.wydin || {};
    const stock = [
      { id: "pot_of_flour", stock: 3, restock: 60, price: 10 },
      { id: "raw_beef", stock: 1, restock: 60, price: 1 },
      { id: "raw_chicken", stock: 1, restock: 60, price: 1 },
      { id: "cabbage", stock: 3, restock: 60, price: 1 },
      { id: "banana", stock: 3, restock: 60, price: 2 },
      { id: "redberries", stock: 1, restock: 60, price: 3 },
      { id: "bread", stock: 0, restock: 60, price: 12 },
      { id: "chocolate_bar", stock: 1, restock: 60, price: 10 },
      { id: "cheese", stock: 3, restock: 60, price: 4 },
      { id: "tomato", stock: 3, restock: 60, price: 4 },
      { id: "potato", stock: 1, restock: 60, price: 1 },
      { id: "white_apron", stock: 2, restock: 60, price: 5 },
    ];
    const catalog = Idle.systems.inventory.catalog();
    const now = Date.now();
    stock.forEach((item) => {
      const entry = Idle.state.wydin[item.id] || { left: item.stock, next: 0, pct: 0 };
      if (entry.left < item.stock && entry.next > 0 && now >= entry.next) {
        entry.left += 1;
        entry.next = now + item.restock * 1000;
      }
      Idle.state.wydin[item.id] = entry;
    });
    return `
      <section class="panel">
        <div class="screen-head">
          <p class="kicker">Wydin's shop</p>
          <button class="text-btn" data-action="hub">Back</button>
        </div>
        <div class="bubbles">
          ${stock.map((item) => {
            const entry = Idle.state.wydin[item.id];
            const name = catalog[item.id] ? catalog[item.id].name : item.id.replaceAll("_", " ");
            const price = Math.max(1, Math.round(item.price * (1 + entry.pct)));
            return `<button class="bubble" data-action="buy-wydin" data-item="${item.id}" ${entry.left > 0 ? "" : "disabled"}>${name} · ${price} gp · ${entry.left}</button>`;
          }).join("")}
        </div>
      </section>
    `;
  },

  buyWydin(id) {
    const prices = { pot_of_flour: 10, raw_beef: 1, raw_chicken: 1, cabbage: 1, banana: 2, redberries: 3, bread: 12, chocolate_bar: 10, cheese: 4, tomato: 4, potato: 1, white_apron: 5 };
    const entry = Idle.state.wydin[id];
    if (!entry || entry.left <= 0) return;
    const price = Math.max(1, Math.round(prices[id] * (1 + (entry.pct || 0))));
    if (Idle.state.gold < price) {
      Idle.state.pushLog({ kind: "full", text: "Not enough gold." });
      this.render();
      return;
    }
    Idle.state.gold -= price;
    entry.left -= 1;
    if (!entry.next || entry.next < Date.now()) entry.next = Date.now() + 60 * 1000;
    entry.pct = Math.max(-0.25, Math.min(0.25, (entry.pct || 0) + (Math.random() * 0.04 - 0.02)));
    Idle.systems.inventory.add(Idle.state.slots, id, 1);
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  store() {
    Idle.state.store = Idle.state.store || {};
    const stock = [
      { id: "pot", stock: 5, restock: 6, price: 1 },
      { id: "jug", stock: 2, restock: 60, price: 1 },
      { id: "shears", stock: 2, restock: 100, price: 1 },
      { id: "knife", stock: 5, restock: 60, price: 7 },
      { id: "bucket", stock: 3, restock: 6, price: 2 },
      { id: "bowl", stock: 2, restock: 30, price: 5 },
      { id: "cake_tin", stock: 2, restock: 30, price: 13 },
      { id: "tinderbox", stock: 2, restock: 60, price: 1 },
      { id: "chisel", stock: 2, restock: 60, price: 1 },
      { id: "spade", stock: 5, restock: 60, price: 3 },
      { id: "hammer", stock: 5, restock: 60, price: 1 },
      { id: "flax_seed", stock: 10, restock: 30, price: 11 },
    ];
    const catalog = Idle.systems.inventory.catalog();
    const now = Date.now();
    stock.forEach((item) => {
      const entry = Idle.state.store[item.id] || { left: item.stock, next: 0, pct: 0 };
      if (entry.left < item.stock && entry.next > 0 && now >= entry.next) {
        entry.left += 1;
        entry.next = now + item.restock * 1000;
      }
      Idle.state.store[item.id] = entry;
    });
    return `
      <section class="panel">
        <div class="screen-head">
          <p class="kicker">Lumbridge General Store</p>
          <button class="text-btn" data-action="hub">Back</button>
        </div>
        <p class="hint">Buys at 40% of market price.</p>
        <div class="bubbles">
          ${stock.map((item) => {
            const entry = Idle.state.store[item.id];
            const name = catalog[item.id] ? catalog[item.id].name : item.id.replaceAll("_", " ");
            const price = Math.max(1, Math.round(item.price * (1 + entry.pct)));
            return `<button class="bubble" data-action="buy-store" data-item="${item.id}" ${entry.left > 0 ? "" : "disabled"}>${name} · ${price} gp · ${entry.left}</button>`;
          }).join("")}
        </div>
        <p class="kicker">Sell</p>
        <div class="wheel">
          ${Idle.state.slots.filter(Boolean).map((slot) => {
            const item = catalog[slot.id];
    if (slot.id === "bird_nest_seeds" || slot.id === "bird_nest_rings" || slot.id === "bird_nest_egg") {
      this.openNest(slot.id);
      Idle.state.selectedSlot = null;
      this.render();
      return;
    }
            const price = Math.floor((Idle.state.prices[slot.id] || (item && item.sell) || 0) * 0.4);
            return `<button class="node wheel-item" data-action="sell-store" data-item="${slot.id}"><span class="node-copy" style="display:flex;gap:8px;white-space:nowrap"><span class="node-name" style="display:inline">${item ? item.name : slot.id}</span><span class="node-stat" style="display:inline">${price} gp</span></span></button>`;
          }).join("") || `<p class="hint">Nothing to sell.</p>`}
        </div>
      </section>
    `;
  },

  buyStore(id) {
    const prices = { pot: 1, jug: 1, shears: 1, knife: 7, bucket: 2, bowl: 5, cake_tin: 13, tinderbox: 1, chisel: 1, spade: 3, hammer: 1, flax_seed: 11 };
    const entry = Idle.state.store[id];
    if (!entry || entry.left <= 0) return;
    const pct = entry.pct || 0;
    const price = Math.max(1, Math.round(prices[id] * (1 + pct)));
    if (Idle.state.gold < price) {
      Idle.state.pushLog({ kind: "full", text: "Not enough gold." });
      this.render();
      return;
    }
    if (!Idle.systems.inventory.add(Idle.state.slots, id, 1)) {
      Idle.state.pushLog({ kind: "full", text: "Inventory full." });
      this.render();
      return;
    }
    Idle.state.gold -= price;
    entry.left -= 1;
    const swing = (Math.floor(Math.random() * 3) + 1) / 100;
    entry.pct = Math.max(-0.25, Math.min(0.25, (entry.pct || 0) + (Math.random() < 0.5 ? swing : -swing)));
    if (!entry.next) entry.next = Date.now() + (id === "pot" || id === "bucket" ? 6 : id === "bowl" || id === "cake_tin" ? 30 : id === "shears" ? 100 : 60) * 1000;
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  sellStore(id) {
    const catalog = Idle.systems.inventory.catalog();
    const item = catalog[id];
    const price = Math.floor((Idle.state.prices[id] || (item && item.sell) || 0) * 0.4);
    if (!Idle.systems.inventory.removeQty(Idle.state.slots, id, 1)) return;
    Idle.state.gold += price;
    Idle.state.pushLog({ kind: "pick", text: `Sold for ${price} gp.` });
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  openBank() {
    const town = Idle.data.towns[Idle.state.town];
    if (!town || !town.services.some((entry) => entry.id === "bank")) {
      Idle.state.pushLog({ kind: "full", text: "No bank here." });
      this.render();
      return;
    }
    Idle.state.screen = "bank";
    this.render();
  },

  bank() {
    Idle.state.bank = Idle.state.bank || [];
    const catalog = Idle.systems.inventory.catalog();
    const used = Idle.state.bank.length;
    const slots = Array.from({ length: Math.max(used, 28) }, (_, index) => Idle.state.bank[index] || null);
    return `
      <section class="panel">
        <div class="screen-head">
          <p class="kicker">Bank</p>
          <span class="pill">${used} / 400</span>
          <button class="text-btn" data-action="hub">Back</button>
        </div>
        <p class="hint">Click an inventory stack, then Deposit. Click a bank icon to withdraw.</p>
        <div class="slots">
          ${slots.map((entry, index) => entry ? `<button class="slot filled" data-action="withdraw" data-bank="${index}" data-item="${entry.id}">${this.iconHtml(entry.id, catalog[entry.id])}<span class="qty">${entry.qty}</span></button>` : `<button class="slot" disabled></button>`).join("")}
        </div>
      </section>
    `;
  },

  depositSelected() {
    const index = Idle.state.selectedSlot;
    if (index === null || !Idle.state.slots[index]) return;
    const slot = Idle.state.slots[index];
    Idle.state.bank = Idle.state.bank || [];
    const existing = Idle.state.bank.find((entry) => entry.id === slot.id);
    if (existing) existing.qty += slot.qty;
    else {
      if (Idle.state.bank.length >= 400) {
        Idle.state.pushLog({ kind: "full", text: "Bank is full." });
        this.render();
        return;
      }
      Idle.state.bank.push({ id: slot.id, qty: slot.qty });
    }
    Idle.state.slots[index] = null;
    Idle.state.selectedSlot = null;
    this.holdingSlot = null;
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  withdraw(index) {
    const entry = Idle.state.bank[index];
    if (!entry) return;
    if (!Idle.systems.inventory.add(Idle.state.slots, entry.id, entry.qty)) {
      Idle.state.pushLog({ kind: "full", text: "Inventory full." });
      this.render();
      return;
    }
    Idle.state.bank.splice(index, 1);
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  talkAubury() {
    if (Idle.state.quests && Idle.state.quests.rune_mysteries) {
      Idle.state.pushLog({ kind: "pick", text: "Aubury has nothing more." });
      this.render();
      return;
    }
    if (Idle.state.questProgress && Idle.state.questProgress.rune_mysteries) {
      this.stopOther();
      Idle.state.place = "walking";
      Idle.state.leave = { steps: [{ label: "Talking to Aubury", travel: 10 }], step: 0, startedAt: performance.now(), next: { place: "varrock", rune: true }, town: false };
      Idle.state.pushLog({ kind: "pick", text: "Talking to Aubury. 10 seconds." });
    } else {
      Idle.state.questProgress = Idle.state.questProgress || {};
      Idle.state.questProgress.rune_mysteries = true;
      Idle.state.pushLog({ kind: "pick", text: "Aubury: Talk to me again." });
    }
    this.render();
  },

  thieving() {
    Idle.state.skills.thieving = Idle.state.skills.thieving || Idle.professions.thieving.createSkill();
    const skill = Idle.state.skills.thieving;
    const pct = Math.max(0, Math.min(100, (skill.xp / skill.xpToNext) * 100));
    const targets = Idle.data.thieving.targets;
    const stalls = Idle.data.thieving.stalls;
    return `
      <section class="panel">
        <div class="screen-head">
          <div><p class="kicker">Thieving</p></div>
          <button class="text-btn" data-action="hub">Back</button>
        </div>
        <div class="level-block">
          <div class="level-label">Thieving ${skill.level}</div>
          <div class="xp-meta">${this.formatXp(skill.xp)} / ${this.formatXp(skill.xpToNext)} xp</div>
          <div class="bar xp-track"><span style="width:${pct}%"></span></div>
          <div class="bar hp-track"><span data-hp-fill style="width:${Math.max(0, ((Idle.state.hp || Idle.state.combatSkills.hitpoints.level) / Idle.state.combatSkills.hitpoints.level) * 100)}%"></span></div>
          <div class="xp-meta" data-hp-label>${Idle.state.hp || Idle.state.combatSkills.hitpoints.level} / ${Idle.state.combatSkills.hitpoints.level} hp</div>
        </div>
        <div class="bubbles">
          ${targets.map((t) => `<button class="bubble ${skill.level < t.level ? "locked" : ""}" data-thieve="${t.id}">Lvl ${t.level} ${t.name}</button>`).join("")}
          ${stalls.map((s) => `<button class="bubble ${skill.level < s.level ? "locked" : ""}" data-stall="${s.id}">Lvl ${s.level} ${s.name}</button>`).join("")}
        </div>
      </section>
    `;
  },

  agility() {
    Idle.state.skills.agility = Idle.state.skills.agility || Idle.professions.agility.createSkill();
    const skill = Idle.state.skills.agility;
    const pct = Math.max(0, Math.min(100, (skill.xp / skill.xpToNext) * 100));
    const courses = Idle.data.agility.courses;
    return `
      <section class="panel">
        <div class="screen-head">
          <div><p class="kicker">Agility</p></div>
          <button class="text-btn" data-action="hub">Back</button>
        </div>
        <div class="level-block">
          <div class="xp-meta">${this.formatXp(skill.xp)} / ${this.formatXp(skill.xpToNext)} xp</div>
          <div class="bar xp-track"><span style="width:${pct}%"></span></div>
        </div>
        <div class="bubbles">
          ${courses.map((c) => `<button class="bubble ${skill.level < c.level ? "locked" : ""}" data-course="${c.id}">Lvl ${c.level} ${c.name}</button>`).join("")}
        </div>
      </section>
    `;
  },

  startThieve(id) {
    const target = Idle.data.thieving.targets.find((t) => t.id === id);
    if (!target) return;
    if ((Idle.state.skills.thieving.level || 1) < target.level) {
      Idle.state.pushLog({ kind: "full", text: `Need Thieving ${target.level}.` });
      this.render();
      return;
    }
    this.stopOther();
    Idle.state.activity = { profession: "thieving", id, kind: "pick" };
    Idle.state.running = true;
    this.tickStartedAt = performance.now();
    Idle.state.pushLog({ kind: "pick", text: `Pickpocketing ${target.name}.` });
    this.render();
  },

  startStall(id) {
    const stall = Idle.data.thieving.stalls.find((s) => s.id === id);
    if (!stall) return;
    if ((Idle.state.skills.thieving.level || 1) < stall.level) {
      Idle.state.pushLog({ kind: "full", text: `Need Thieving ${stall.level}.` });
      this.render();
      return;
    }
    this.stopOther();
    Idle.state.activity = { profession: "thieving", id, kind: "stall" };
    Idle.state.running = true;
    this.tickStartedAt = performance.now();
    Idle.state.pushLog({ kind: "pick", text: `Stealing from ${stall.name}.` });
    this.render();
  },

  startCourse(id) {
    const course = Idle.data.agility.courses.find((c) => c.id === id);
    if (!course) return;
    if ((Idle.state.skills.agility.level || 1) < course.level) {
      Idle.state.pushLog({ kind: "full", text: `Need Agility ${course.level}.` });
      this.render();
      return;
    }
    this.stopOther();
    Idle.state.activity = { profession: "agility", id, step: 0 };
    Idle.state.running = true;
    this.tickStartedAt = performance.now();
    Idle.state.pushLog({ kind: "pick", text: `Starting ${course.name}.` });
    this.render();
  },

  fletching() {
    const skill = Idle.state.skills.fletching;
    const pct = Math.max(0, Math.min(100, (skill.xp / skill.xpToNext) * 100));
    const recipes = Idle.professions.fletching.nodes();
    return `
      <section class="panel">
        <div class="screen-head">
          <p class="kicker">Fletching</p>
          <button class="text-btn" data-action="hub">Back</button>
        </div>
        <div class="level-block">
          <div class="level-label">Fletching ${skill.level}</div>
          <div class="xp-meta">${this.formatXp(skill.xp)} / ${this.formatXp(skill.xpToNext)} xp</div>
          <div class="bar xp-track"><span style="width:${pct}%"></span></div>
        </div>
        <div class="wheel">
          ${recipes.map((recipe) => {
            const locked = skill.level < recipe.level;
            const active = Idle.state.activity && Idle.state.activity.profession === "fletching" && Idle.state.activity.id === recipe.id;
            const cost = Object.entries(recipe.cost).map(([id, qty]) => `${id.replaceAll("_", " ")} +${qty}`).join(" · ");
            return `<button class="node wheel-item ${active ? "active" : ""} ${locked ? "locked" : ""}" data-fletch="${recipe.id}" ${locked ? "disabled" : ""}><span class="node-copy" style="display:flex;gap:8px;white-space:nowrap"><span class="node-name" style="display:inline">${recipe.name}</span><span class="node-stat" style="display:inline">Fletching ${recipe.level} · ${cost}</span></span></button>`;
          }).join("")}
        </div>
      </section>
    `;
  },

  selectFletch(id) {
    const skill = Idle.state.skills.fletching;
    const recipe = Idle.professions.fletching.nodeById(id);
    if (!recipe || !Idle.professions.fletching.canMake(skill, recipe)) return;
    if (!Idle.professions.fletching.hasCost(Idle.state.slots, recipe)) {
      Idle.state.pushLog({ kind: "full", text: `Missing materials for ${recipe.name}.` });
      this.render();
      return;
    }
    const on = Idle.state.activity && Idle.state.activity.profession === "fletching" && Idle.state.activity.id === id;
    this.stopOther("gather");
    Idle.state.activity = on ? null : { profession: "fletching", id };
    Idle.state.running = true;
    this.tickStartedAt = performance.now();
    this.render();
  },

  openHops() {
    Idle.state.screen = "farming";
    this.render();
  },

  farming() {
    const skill = Idle.state.skills.farming;
    const pct = Math.max(0, Math.min(100, (skill.xp / skill.xpToNext) * 100));
    const hops = Idle.state.hops || { crop: null, plantedAt: 0 };
    const seeds = Idle.systems.inventory.count(Idle.state.slots, "flax_seed");
    const ready = hops.crop && Date.now() - hops.plantedAt >= 120000;
    const left = hops.crop ? Math.max(0, Math.ceil((120000 - (Date.now() - hops.plantedAt)) / 1000)) : 0;
    const label = hops.crop ? (ready ? "Flax patch · ready" : `Flax patch · ${left}s`) : seeds >= 3 ? "Flax patch" : "No seeds";
    return `
      <section class="panel">
        <div class="screen-head">
          <p class="kicker">Farming</p>
          <button class="text-btn" data-action="hub">Back</button>
        </div>
        <div class="level-block">
          <div class="level-label">Farming ${skill.level}</div>
          <div class="xp-meta">${this.formatXp(skill.xp)} / ${this.formatXp(skill.xpToNext)} xp</div>
          <div class="bar xp-track"><span style="width:${pct}%"></span></div>
        </div>
        <p class="hint">${label}</p>
        ${!hops.crop && seeds >= 3 ? `<button class="btn" data-action="plant-flax">Plant 3 flax seeds</button>` : ""}
        ${ready ? `<button class="btn" data-action="harvest-flax">Harvest</button>` : ""}
      </section>
    `;
  },

  plantFlax() {
    if (!Idle.systems.inventory.removeQty(Idle.state.slots, "flax_seed", 3)) {
      Idle.state.pushLog({ kind: "full", text: "You need 3 flax seeds." });
      this.render();
      return;
    }
    Idle.state.hops = { crop: "flax", plantedAt: Date.now() };
    Idle.systems.xp.grant(Idle.state.skills.farming, 48);
    Idle.state.pushLog({ kind: "level", text: "Planted flax. +48 Farming xp." });
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  harvestFlax() {
    const hops = Idle.state.hops;
    if (!hops || hops.crop !== "flax" || Date.now() - hops.plantedAt < 120000) return;
    const qty = Idle.professions.farming.rollYield(Idle.state.skills.farming.level);
    if (!Idle.systems.inventory.add(Idle.state.slots, "flax", qty)) {
      Idle.state.pushLog({ kind: "full", text: "Inventory full." });
      this.render();
      return;
    }
    Idle.systems.xp.grant(Idle.state.skills.farming, 52.5);
    Idle.state.hops = { crop: null, plantedAt: 0 };
    Idle.state.pushLog({ kind: "level", text: `Harvested ${qty} flax. +52.5 Farming xp.` });
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  startTownTravel(id) {
    const from = Idle.state.town || "lumbridge";
    if (id === from) return;
    if (id === "karamja") {
      if ((Idle.state.gold || 0) < 30) {
        Idle.state.pushLog({ kind: "full", text: "Sailing to Karamja costs 30 gp." });
        this.render();
        return;
      }
      Idle.state.gold -= 30;
      this.stopOther();
      Idle.state.place = "walking";
      Idle.state.leave = { steps: [{ label: "Sailing to Karamja", travel: 10 }], step: 0, startedAt: performance.now(), next: { place: "karamja" }, town: false };
      Idle.state.pushLog({ kind: "pick", text: "Paid 30 gp. Sailing to Karamja. 10 seconds." });
      this.render();
      return;
    }
    const seconds = Idle.data.townTravel[`${from}|${id}`] || 15;
    const dest = Idle.data.towns[id];
    this.stopOther();
    Idle.state.place = "walking";
    Idle.state.leave = { steps: [{ label: `Walking to ${dest.name}`, travel: seconds }], step: 0, startedAt: performance.now(), next: { place: id, screen: "town" }, town: false };
    Idle.state.screen = "town";
    Idle.state.pushLog({ kind: "pick", text: `Walking to ${dest.name}. ${seconds} seconds.` });
    this.render();
  },

  startTownMob(id) {
    const town = Idle.data.towns[Idle.state.town];
    if (!town || !town.mobs.some((entry) => entry.id === id)) return;
    if (Idle.state.grave && Idle.state.grave.phase !== "choice") return;
    Idle.state.area = null;
    this.stopOther("fight");
    Idle.state.leave = null;
    Idle.state.running = false;
    const mob = Idle.systems.combat.mobById(id);
    if (!mob) return;
    Idle.state.fight = { mob: id, phase: "travel", startedAt: performance.now(), playerHp: Idle.state.combatSkills.hitpoints.level, mobHp: mob.hp, playerSwings: 0, mobSwings: 0, travelOverride: 10, local: true };
    Idle.state.screen = "adventure";
    Idle.state.pushLog({ kind: "pick", text: `Searching for ${mob.name} in ${town.name}. 10 seconds.` });
    this.render();
  },

  startGather(id) {
    if (id === "hops") {
      this.openHops();
      return;
    }
    const tree = Idle.data.woodcutting.trees.find((t) => t.id === id);
    if (!tree) return;
    if ((Idle.state.skills.woodcutting.level || 1) < tree.level) {
      Idle.state.pushLog({ kind: "full", text: `Need Woodcutting ${tree.level}.` });
      this.render();
      return;
    }
    if (!Idle.professions.woodcutting.hasAxe(Idle.state.slots)) {
      Idle.state.pushLog({ kind: "full", text: "You need an axe to chop trees." });
      this.render();
      return;
    }
    this.stopOther("gather");
    Idle.state.tree = { hp: tree.hp };
    Idle.state.activity = { profession: "woodcutting", id };
    Idle.state.running = true;
    Idle.state.screen = "woodcutting";
    this.tickStartedAt = performance.now();
    Idle.state.pushLog({ kind: "pick", text: `Chopping ${tree.name}.` });
    this.render();
  },

  talkNpc(id) {
    const town = Idle.data.towns[Idle.state.town];
    const npc = town && town.npcs.find((entry) => entry.id === id);
    if (!npc) return;
    Idle.state.questProgress = Idle.state.questProgress || {};
    Idle.state.questProgress[npc.quest] = true;
    Idle.state.questOpen = npc.quest;
    Idle.state.screen = "quests";
    Idle.state.pushLog({ kind: "pick", text: `${npc.name}: ${npc.note}.` });
    this.render();
  },

  professions() {
    const cards = [
      { id: "mining", name: "Mining", note: "Rocks, ore, and essence" },
      { id: "smithing", name: "Smithing", note: "Smelt bars at the furnace" },
      { id: "anvil", name: "Anvil", note: "Hammer bars into gear" },
      { id: "cooking", name: "Cooking", note: "Cook meat at the range" },
      { id: "fishing", name: "Fishing", note: "Catch fish at a spot" },
      { id: "crafting", name: "Crafting", note: "Spinning wheel and stations" },
      { id: "thieving", name: "Thieving", note: "Pickpocket and stalls" },
      { id: "agility", name: "Agility", note: "Rooftop courses" },
      ...(Idle.state.quests && Idle.state.quests.pandemonium ? [{ id: "sailing", name: "Sailing", note: "Rafts and the Pandemonium" }] : []),
      { id: "altar", name: "Altar", note: "Sacrifice fish for Prayer" },
    ];
    return `
      <section class="panel">
        <div class="screen-head">
          <p class="kicker">Professions</p>
          <button class="text-btn" data-action="hub">Back</button>
        </div>
        <div class="menu-grid">
          ${cards.map((card) => `
            <button class="menu-card" data-action="open-${card.id}">
              <span class="menu-name">${card.name}</span>
              <span class="menu-note">${card.note}</span>
            </button>`).join("")}
        </div>
      </section>
    `;
  },

  weaponLine() {
    const weapon = Idle.systems.combat.weapon();
    if (!weapon || !weapon.bonuses) return "<p class=\"hint\">Unarmed · crush · 2.4s</p>";
    const bonus = weapon.bonuses;
    const parts = [];
    const add = (label, value) => { if (value !== undefined && value !== null) parts.push(`${label} ${value}`); };
    add("stab", bonus.stab);
    add("slash", bonus.slash);
    add("crush", bonus.crush);
    add("magic", bonus.magic);
    add("mdef", bonus.magicDefence);
    add("str", bonus.strength);
    return `<p class="hint">${Idle.systems.combat.attackName()} · ${weapon.speed}s${parts.length ? ` · ${parts.join(" · ")}` : ""}</p>`;
  },

  adventure() {
    const fight = Idle.state.fight;
    const mob = fight ? Idle.systems.combat.mobById(fight.mob) : null;
    const skills = Idle.state.combatSkills;
    const agg = mob ? mob.aggressive : null;
    const melee = mob ? mob.meleeDefence : null;
    const ranged = mob ? mob.rangedDefence : null;
    return `
      <section class="panel wide">
        <div class="screen-head">
          <p class="kicker">Adventure</p>
          <button class="text-btn" data-action="hub">Back</button>
        </div>
        <p data-death-label>${Idle.state.grave ? `Body at ${Idle.state.grave.mob}` : fight ? "" : "Select a mob to walk there."}</p>
        ${Idle.state.grave && Idle.state.grave.phase === "down" ? `<button class="btn" data-action="retrieve-body">Retrieve body · ${this.graveLeft()}</button>` : ""}
        ${Idle.state.grave && Idle.state.grave.phase === "choice" ? `<div class="choice-row"><span>Continue farming?</span><button class="btn" data-action="farm-yes">Yes</button><button class="btn" data-action="farm-no">No</button></div>` : ""}
        ${Idle.state.milkChoice ? `<div class="choice-row"><span>Start grinding cows?</span><button class="btn" data-action="milk-yes">Yes</button><button class="btn" data-action="milk-no">No</button></div>` : ""}
        <div class="adventure-layout" style="display:flex;flex-direction:row;flex-wrap:nowrap;align-items:flex-start;gap:16px;width:100%">
          <div class="adv-left" style="width:340px;flex:0 0 340px">${this.inventory()}</div>
          <div class="adv-mid" style="width:280px;flex:0 0 280px">${this.wornGear()}<div class="combat-log" data-combat-log></div></div>
          <div class="adv-stats" style="width:260px;flex:0 0 260px;display:flex;flex-direction:column;gap:16px">
            <div class="mob-sheet">
              <p class="kicker">${mob ? `${mob.name} combat stats` : "Monster stats"}</p>
              ${mob ? `<p>${mob.hp} hp / ${mob.attack} atk / ${mob.strength} str / ${mob.defence} def / ${mob.magic} matk / ${mob.ranged} rng</p>
              <p>stab ${agg.stab} · slash ${agg.slash} · crush ${agg.crush} · magic ${agg.magic} · ranged ${agg.ranged}</p>
              <p>def ${melee.stab} / ${melee.slash} / ${melee.crush} · mdef ${mob.magicDefence} · rdf ${ranged.light}/${ranged.standard}/${ranged.heavy}</p>
              <p>Poison ${mob.poisonImmune * 100}% · venom ${mob.venomImmune * 100}%${mob.fireWeakness ? ` · fire weakness ${mob.fireWeakness * 100}%` : ""}</p>` : `<p class="hint">No fight yet.</p>`}
            </div>
            <div class="player-sheet">
              <p class="kicker">Your stats</p>
              <p>${skills.hitpoints.level} hp / ${skills.attack.level} atk / ${skills.strength.level} str / ${skills.defence.level} def / ${skills.magic.level} matk / ${skills.ranged.level} rng</p>
              ${this.weaponLine()}
            </div>
            ${this.milkButton()}
          </div>
        </div>
      </section>
    `;
  },

    targetChoices() {
    const fight = Idle.state.fight;
    const locked = Idle.systems.combat.locked();
    const button = (action, name, note, extra = "") => `<button class="node wheel-item" data-action="${action}" ${extra}><span class="node-copy"><span class="node-name">${name}</span><span class="node-stat">${note}</span></span></button>`;
    const mob = (entry) => `<button class="node wheel-item ${fight && fight.mob === entry.id ? "active" : ""} ${fight && fight.nextTarget === entry.id ? "queued" : ""}" data-mob="${entry.id}"><span class="node-copy"><span class="node-name">${entry.name}</span><span class="node-stat">${fight && fight.nextTarget === entry.id ? "Next · after this kill" : `Lvl ${entry.level}`}</span></span></button>`;
    if (Idle.state.area === "vault") return `${button("exit-entrance", "Exit the entrance", "9s walk")}${Idle.systems.combat.vaultMobs().map(mob).join("")}${button("enter-catacomb", "Catacomb of Famine", "floor 2")}`;
    if (Idle.state.area === "catacomb") return `${button("exit-floor", "Back to Vault of War", "floor 1")}${Idle.systems.combat.catacombMobs().map(mob).join("")}${button("enter-pestilence", "Pit of Pestilence", "floor 3")}`;
    if (Idle.state.area === "pestilence") return `${button("exit-floor", "Back to Catacomb of Famine", "floor 2")}${Idle.systems.combat.pestilenceMobs().map(mob).join("")}${button("enter-sepulchre", "Sepulchre of Shadows", "floor 4")}`;
    if (Idle.state.area === "sepulchre") return `${button("exit-floor", "Back to Pit of Pestilence", "floor 3")}${Idle.systems.combat.sepulchreMobs().map(mob).join("")}`;
    return `${button("fight-cow", "Cow", "30s walk", locked ? "disabled" : "")}${Idle.systems.inventory.count(Idle.state.slots, "bucket") ? button("milk-cow", "Milk cow", "uses 1 bucket") : ""}${button("fight-chicken", "Chicken", "30s walk", locked ? "disabled" : "")}${Idle.state.brutusUnlocked ? button("fight-brutus", "Brutus", "30s walk · boss", locked ? "disabled" : "") : ""}${button("fight-stronghold", "Secured Stronghold", "35s walk", locked ? "disabled" : "")}`;
  },

  wornGear() {
    const gear = Idle.state.equipment;
    const cell = (id, file) => {
      const itemId = gear[id];
      const item = itemId ? Idle.systems.inventory.catalog()[itemId] : null;
      return `<button class="equip-slot ${Idle.state.selectedEquip === id ? "picked" : ""}" data-equip="${id}" data-item="${itemId || ""}" style="background:#241c16 url('images/gui/${file}') center / cover no-repeat">${item ? `<span class="equip-item">${this.iconHtml(item.id, item)}</span>` : ""}</button>`;
    };
    return `<div class="doll">
      <div class="doll-gap"></div>${cell("helm", "equip_helm.png")}<div class="doll-gap"></div>
      ${cell("cape", "equip_cape.png")}${cell("neck", "equip_neck.png")}${cell("ammo", "equip_ammo.png")}
      ${cell("weapon", "equip_mainh.png")}${cell("body", "equip_body.png")}${cell("shield", "equip_offh.png")}
      <div class="doll-gap"></div>${cell("legs", "equip_legs.png")}<div class="doll-gap"></div>
      ${cell("gloves", "equip_gloves.png")}${cell("boots", "equip_boots.png")}${cell("ring", "equip_ring.png")}
    </div>`;
  },

  milkButton() {
    if (!Idle.systems.inventory.count(Idle.state.slots, "bucket")) return "";
    return `<button class="settings-btn" data-action="milk-cow">Milk cow</button>`;
  },

  questJournal() {
    const tab = this.questTab || "available";
    const statusOf = (id) => {
      if (Idle.state.quests && Idle.state.quests[id]) return "completed";
      if (Idle.state.questProgress && Idle.state.questProgress[id]) return "progress";
      if (Idle.state.questRun && Idle.state.questRun.id === id) return "progress";
      return "available";
    };
    const quests = [
      { id: "cooks_assistant", title: "Cook's Assistant" },
      { id: "sheep_shearer", title: "Sheep Shearer" },
      { id: "dorics_quest", title: "Doric's Quest" },
      { id: "ides_of_milk", title: "The Ides of Milk" },
      { id: "pandemonium", title: "Pandemonium" },
      { id: "fishers_friend", title: "Fisher's Friend" },
      { id: "woodchuckers_wood", title: "Woodchucker's Wood" },
      { id: "cave_explorer", title: "Cave Explorer" },
      { id: "goblin_slayer", title: "Goblin Slayer" },
      { id: "imp_catcher", title: "Imp Catcher" },
      { id: "witchs_potion", title: "Witch's Potion" },
      { id: "pirates_treasure", title: "Pirate's Treasure" },
    ].filter((quest) => statusOf(quest.id) === tab);
    const open = this.questOpen;
    const cooks = Idle.data.quests.cooks_assistant;
    const cooksDone = Idle.state.quests.cooks_assistant;
    const cooksReady = cooks.needs.every((need) => Idle.systems.inventory.count(Idle.state.slots, need.id) >= need.qty);
    const cooksLine = (need) => {
      const have = Idle.systems.inventory.count(Idle.state.slots, need.id) >= need.qty;
      return `<p class="${have ? "have" : "need"}">${need.qty} ${need.name}</p>`;
    };
    const card = (quest) => {
      const opened = open === quest.id;
      const done = Idle.state.quests && Idle.state.quests[quest.id];
      const gold = done ? "gold" : "";
      if (quest.id === "cooks_assistant") {
        return `<button class="pill ${gold}" data-action="open-cooks">Cook's Assistant</button>
          ${opened ? `<div class="quest-sheet">
            ${cooks.needs.map(cooksLine).join("")}
            ${cooksDone ? "" : cooksReady ? `<button class="btn" data-action="return-cook">Return to quest giver · 4 minutes</button>` : ""}
          </div>` : ""}`;
      }
      if (quest.id === "sheep_shearer") {
        return `<button class="pill ${gold}" data-action="open-sheep">Sheep Shearer</button>
        ${opened ? `<div class="quest-sheet">
          <p>Talk to Fred, shear 20 sheep, then spin the wool.</p>
          ${Idle.state.quests.sheep_shearer ? `<p class="hint">Finished. +1 quest point, 150 Crafting xp, 60 gp.</p>` : `<button class="btn" data-action="start-sheep">Start · walk to Fred · 1 minute</button>`}
        </div>` : ""}`;
      }
      if (quest.id === "dorics_quest") {
        const doric = Idle.data.quests.dorics_quest;
        const doricDone = Idle.state.quests.dorics_quest;
        const doricLine = (need) => {
          const have = Idle.systems.inventory.count(Idle.state.slots, need.id) >= need.qty;
          return `<p class="${have ? "have" : "need"}">${need.qty} ${need.name}</p>`;
        };
        return `<button class="pill ${gold}" data-action="open-doric">Doric's Quest</button>
          ${opened ? `<div class="quest-sheet">
            <p>Bring Doric 6 clay, 4 copper ore, and 2 iron ore.</p>
            ${doric.needs.map(doricLine).join("")}
            ${doricDone ? `<p class="hint">Finished. +1 quest point, 1300 Mining xp, 180 gp.</p>` : `<button class="btn" data-action="start-doric">Start · walk to Falador · 30 seconds</button>`}
          </div>` : ""}`;
      }
      if (quest.id === "ides_of_milk") {
        const idesDone = Idle.state.quests.ides_of_milk;
        const idesReady = Idle.state.brutusDefeated;
        return `<button class="pill ${gold}" data-action="open-ides">The Ides of Milk</button>
          ${opened ? `<div class="quest-sheet">
            <p>Meet Cassius at the Lumbridge pond, then defeat Brutus at the cow pen.</p>
            ${idesDone ? `<p class="hint">Finished. Brutus stays farmable.</p>` : idesReady ? `<button class="btn" data-action="return-cassius">Return to Cassius · 20 seconds</button>` : `<button class="btn" data-action="start-ides">Start · walk to Lumbridge pond · 20 seconds</button>`}
          </div>` : ""}`;
      }
      if (quest.id === "pandemonium") {
        const pandeDone = Idle.state.quests.pandemonium;
        return `<button class="pill ${gold}" data-action="open-pande">Pandemonium</button>
          ${opened ? `<div class="quest-sheet">
            <p>Salvage a shipwreck, set up the Pandemonium, and deliver cargo.</p>
            ${pandeDone ? `<p class="hint">Finished. Sailing unlocked. Raft and 25 sawmill coupons granted.</p>` : `<button class="btn" data-action="start-pande">Start · Port Sarim docks</button>`}
          </div>` : ""}`;
      }
      if (quest.id === "fishers_friend") {
        const done = Idle.state.quests.fishers_friend;
        const ready = Idle.systems.inventory.count(Idle.state.slots, "raw_shrimp") >= 20;
        return `<button class="pill ${gold}" data-action="open-fishers">Fisher's Friend</button>
          ${opened ? `<div class="quest-sheet">
            <p class="${ready ? "have" : "need"}">20 Raw shrimp</p>
            ${done ? `<p class="hint">Finished. +100 Fishing xp, 10 gp.</p>` : `<button class="btn" data-action="turnin-fishers">${ready ? "Give 20 raw shrimp" : "Talk to Fisher Fred"}</button>`}
          </div>` : ""}`;
      }
      if (quest.id === "woodchuckers_wood") {
        const done = Idle.state.quests.woodchuckers_wood;
        const ready = Idle.systems.inventory.count(Idle.state.slots, "logs") >= 20;
        return `<button class="pill ${gold}" data-action="open-wood">Woodchucker's Wood</button>
          ${opened ? `<div class="quest-sheet">
            <p class="${ready ? "have" : "need"}">20 Logs</p>
            ${done ? `<p class="hint">Finished. +100 Woodcutting xp, 10 gp.</p>` : `<button class="btn" data-action="turnin-wood">${ready ? "Give 20 logs" : "Talk to Lumberjack Beave"}</button>`}
          </div>` : ""}`;
      }
      if (quest.id === "cave_explorer") {
        const done = Idle.state.quests.cave_explorer;
        return `<button class="pill ${gold}" data-action="open-cave">Cave Explorer</button>
          ${opened ? `<div class="quest-sheet">
            <p>Walk to the cave and explore for 45 seconds. Goblins may appear.</p>
            ${done ? `<p class="hint">Finished. +1 quest point.</p>` : `<button class="btn" data-action="start-cave">Start · walk to cave</button>`}
          </div>` : ""}`;
      }
      if (quest.id === "goblin_slayer") {
        const slayerDone = Idle.state.quests.goblin_slayer;
        const slayerReady = (Idle.state.goblinKills || 0) >= 100;
        const caveDone = Idle.state.quests.cave_explorer;
        return `<button class="pill ${gold}" data-action="open-slayer">Goblin Slayer</button>
          ${opened ? `<div class="quest-sheet">
            <p class="${slayerReady ? "have" : "need"}">${Idle.state.goblinKills || 0} / 100 goblins</p>
            ${slayerDone ? `<p class="hint">Finished. +300 Slayer xp, 2 quest points.</p>` : caveDone ? `<button class="btn" data-action="turnin-slayer"${slayerReady ? "" : " disabled"}>Turn in</button>` : `<p class="hint">Finish Cave Explorer first.</p>`}
          </div>` : ""}`;
      }
      if (quest.id === "imp_catcher") {
        const done = Idle.state.quests.imp_catcher;
        const beads = ["black_bead", "yellow_bead", "red_bead", "white_bead"];
        const have = beads.map((id) => Idle.systems.inventory.count(Idle.state.slots, id) >= 1);
        return `<button class="pill ${gold}" data-action="open-imp">Imp Catcher</button>
          ${opened ? `<div class="quest-sheet">
            <p class="${have[0] ? "have" : "need"}">Black bead</p>
            <p class="${have[1] ? "have" : "need"}">Yellow bead</p>
            <p class="${have[2] ? "have" : "need"}">Red bead</p>
            <p class="${have[3] ? "have" : "need"}">White bead</p>
            ${done ? `<p class="hint">Finished. +875 Magic xp. Amulet of accuracy.</p>` : `<button class="btn" data-action="start-imp">Return to Wizard Mizgog</button>`}
          </div>` : ""}`;
      }
      if (quest.id === "witchs_potion") {
        const done = Idle.state.quests.witchs_potion;
        const needs = Idle.data.quests.witchs_potion.needs;
        const lines = needs.map((need) => {
          const have = Idle.systems.inventory.count(Idle.state.slots, need.id) >= need.qty;
          return `<p class="${have ? "have" : "need"}">${need.qty} ${need.name}</p>`;
        }).join("");
        return `<button class="pill ${gold}" data-action="open-witch">Witch's Potion</button>
          ${opened ? `<div class="quest-sheet">
            <p>Become one with your darker side. Bring Hetty the ingredients.</p>
            ${lines}
            ${done ? `<p class="hint">Finished. +325 Magic xp.</p>` : `<button class="btn" data-action="talk-hetty">Return to Hetty</button>`}
          </div>` : ""}`;
      }
      return "";
    };
    return `
      <section class="panel">
        <div class="screen-head">
          <p class="kicker">Quest Journal</p>
          <button class="text-btn" data-action="hub">Back</button>
        </div>
        <div class="metal-tabs">
          <button class="tab ${tab === "available" ? "on" : ""}" data-action="quest-available">Available Quests</button>
          <button class="tab ${tab === "progress" ? "on" : ""}" data-action="quest-progress">In Progress</button>
          <button class="tab ${tab === "completed" ? "on" : ""}" data-action="quest-completed">Completed</button>
        </div>
        ${quests.map(card).join("") || `<p class="hint">None.</p>`}
        ${Idle.state.depositOpen ? `<div class="quest-sheet">
          <p class="kicker">Deposit</p>
          <div class="slots">${(Idle.state.deposit || []).map((entry, index) => `<button class="slot ${entry ? "filled" : ""}" data-deposit="${index}">${entry ? `${this.iconHtml(entry.id)}<span class="qty">${entry.qty}</span>` : ""}</button>`).join("")}</div>
          <p class="hint">Click a stack, then a deposit slot. Click a filled slot to take it back.</p>
          <button class="btn" data-action="give-quest">Give</button>
        </div>` : ""}
      </section>`;
  },

  combatLine(text) {
    Idle.state.fightLog = Idle.state.fightLog || [];
    Idle.state.fightLog.unshift(text);
    Idle.state.fightLog = Idle.state.fightLog.slice(0, 8);
    const box = this.root && this.root.querySelector("[data-combat-log]");
    if (box) box.innerHTML = Idle.state.fightLog.map((line) => `<p>${line}</p>`).join("");
  },

  combatStats() {
    const skills = Idle.state.combatSkills;
    const names = ["attack", "strength", "defence", "ranged", "magic", "prayer", "hitpoints"];
    const professions = ["mining", "smithing", "cooking", "fishing", "crafting", "fletching", "sailing", "woodcutting", "slayer", "firemaking", "farming", "thieving", "agility"];
    return `
      <section class="panel">
        <div class="screen-head">
          <p class="kicker">Stats</p>
          <button class="text-btn" data-action="hub">Back</button>
        </div>
        <div class="stats-layout">
          <div>
            <p class="kicker">Combat ${Idle.systems.combat.level(skills)}</p>
            <div class="stat-bubbles">${names.map((name) => `<span class="pill">${name} ${skills[name].level}</span>`).join("")}</div>
          </div>
          <div>
            <p class="kicker">Professions</p>
            <div class="stat-bubbles">${professions.map((name) => {
              const skill = Idle.state.skills[name];
              return `<span class="pill">${name} ${skill.level}</span>`;
            }).join("")}</div>
            <div class="stat-bubbles"><span class="pill">Quest points ${Idle.state.questPoints || 0}</span></div>
          </div>
        </div>
      </section>
    `;
  },

  putDeposit(index) {
    const selected = Idle.state.selectedSlot;
    if (selected === null || !Idle.state.slots[selected]) {
      const entry = Idle.state.deposit[index];
      if (entry) {
        if (!Idle.systems.inventory.add(Idle.state.slots, entry.id, entry.qty)) {
          Idle.state.pushLog({ kind: "full", text: "Inventory is full." });
          this.render();
          return;
        }
        Idle.state.deposit[index] = null;
        this.render();
      }
      return;
    }
    const slot = Idle.state.slots[selected];
    const existing = Idle.state.deposit.findIndex((entry) => entry && entry.id === slot.id);
    if (existing >= 0) {
      Idle.state.deposit[existing].qty += 1;
      Idle.systems.inventory.removeQty(Idle.state.slots, slot.id, 1);
      Idle.state.selectedSlot = null;
      this.render();
      return;
    }
    if (Idle.state.deposit[index]) {
      if (!Idle.systems.inventory.add(Idle.state.slots, Idle.state.deposit[index].id, Idle.state.deposit[index].qty)) {
        Idle.state.pushLog({ kind: "full", text: "Inventory is full." });
        this.render();
        return;
      }
    }
    Idle.state.deposit[index] = { id: slot.id, qty: 1 };
    Idle.systems.inventory.removeQty(Idle.state.slots, slot.id, 1);
    Idle.state.selectedSlot = null;
    this.render();
  },

  putCombine(index) {
    const selected = Idle.state.selectedSlot;
    if (selected === null || !Idle.state.slots[selected]) {
      const entry = Idle.state.combine[index];
      if (entry) {
        Idle.systems.inventory.add(Idle.state.slots, entry.id, entry.qty);
        Idle.state.combine[index] = null;
        this.render();
      }
      return;
    }
    const slot = Idle.state.slots[selected];
    Idle.state.combine[index] = { id: slot.id, qty: 1 };
    Idle.systems.inventory.removeQty(Idle.state.slots, slot.id, 1);
    Idle.state.selectedSlot = null;
    this.render();
  },

  startChicken() {
    if (Idle.state.grave && Idle.state.grave.phase !== "choice") return;
    Idle.state.area = null;
    this.stopOther("fight");
    Idle.state.leave = null;
    Idle.state.running = false;
    Idle.state.fight = { mob: "chicken", phase: "travel", startedAt: performance.now(), playerHp: Idle.state.combatSkills.hitpoints.level, mobHp: 3, playerSwings: 0, mobSwings: 0 };
    Idle.state.pushLog({ kind: "pick", text: "Walking to the chicken. 30 seconds." });
    this.render();
  },

  startMilk() {
    if (!Idle.systems.inventory.count(Idle.state.slots, "bucket")) return;
    if (Idle.state.grave && Idle.state.grave.phase !== "choice") return;
    Idle.state.area = null;
    this.stopOther("fight");
    Idle.state.leave = null;
    Idle.state.running = false;
    Idle.state.fight = { mob: "cow", phase: "travel", startedAt: performance.now(), playerHp: Idle.state.combatSkills.hitpoints.level, mobHp: 8, playerSwings: 0, mobSwings: 0, intent: "milk" };
    Idle.state.pushLog({ kind: "pick", text: "Walking to the cow to milk it. 30 seconds." });
    this.render();
  },

  talkRedbeard() {
    Idle.state.choice = {
      text: "Redbeard Frank: What do you want?",
      options: [
        { id: "redbeard-walk", label: "Walk away" },
        { id: "redbeard-ask", label: "Ask about treasure" },
      ],
    };
    this.render();
  },

  talkSailor() {
    Idle.state.choice = {
      text: "Sailor: Get lost, or give me some coin.",
      options: [
        { id: "sailor-walk", label: "Get lost" },
        { id: "sailor-pay", label: "Give me some coin (30 gp)" },
      ],
    };
    this.render();
  },

  talkLuthas() {
    Idle.state.choice = {
      text: "Luthas: What do you need?",
      options: [
        { id: "luthas-walk", label: "Walk away" },
        { id: "luthas-job", label: "I want a job" },
      ],
    };
    this.render();
  },

  talkWydin() {
    const apron = Idle.state.equipment && Idle.state.equipment.body === "white_apron";
    Idle.state.choice = {
      text: apron ? "Wydin: Looking for work?" : "Wydin: Shop or leave.",
      options: [
        { id: "wydin-shop", label: "Shop" },
        { id: "wydin-walk", label: "Walk away" },
        ...(apron ? [{ id: "wydin-job", label: "Ask for a job" }] : []),
      ],
    };
    this.render();
  },

  talkCustoms() {
    const hasRum = Idle.systems.inventory.count(Idle.state.slots, "karamjan_rum") > 0;
    if (hasRum) {
      Idle.state.pushLog({ kind: "full", text: "Customs Officer: That is not permitted." });
      this.render();
      return;
    }
    Idle.state.choice = {
      text: "Customs Officer: 30 gp to return to Port Sarim.",
      options: [
        { id: "customs-walk", label: "Walk away" },
        { id: "customs-pay", label: "Pay 30 gp" },
      ],
    };
    this.render();
  },

  talkZembo() {
    Idle.state.choice = {
      text: "Zembo: Karamjan rum, 30 gp.",
      options: [
        { id: "zembo-walk", label: "Walk away" },
        { id: "zembo-buy", label: "Buy 1 Karamjan rum" },
      ],
    };
    this.render();
  },

  choose(id) {
    Idle.state.choice = null;
    if (id === "redbeard-walk" || id === "sailor-walk" || id === "luthas-walk" || id === "wydin-walk" || id === "customs-walk" || id === "zembo-walk") {
      this.render();
      return;
    }
    if (id === "redbeard-ask") {
      const hasRum = Idle.systems.inventory.count(Idle.state.slots, "karamjan_rum") > 0;
      if (hasRum) {
        Idle.systems.inventory.removeQty(Idle.state.slots, "karamjan_rum", 1);
        Idle.systems.inventory.add(Idle.state.slots, "hectors_chest_key", 1);
        Idle.state.questProgress = Idle.state.questProgress || {};
        Idle.state.questProgress.pirates_treasure = true;
        Idle.state.pushLog({ kind: "pick", text: "Redbeard Frank: Here is Hector's chest key." });
      } else {
        Idle.state.pushLog({ kind: "pick", text: "Redbeard Frank: Bring me Karamjan rum." });
        Idle.state.questProgress = Idle.state.questProgress || {};
        Idle.state.questProgress.pirates_treasure = true;
      }
      this.render();
      return;
    }
    if (id === "sailor-pay") {
      Idle.state.karamjaUnlocked = true;
      Idle.state.pushLog({ kind: "pick", text: "Sailor: I can take you to Karamja. 30 gp each trip." });
      this.render();
      return;
    }
    if (id === "luthas-job") {
      const bananas = Idle.systems.inventory.count(Idle.state.slots, "banana");
      if (bananas >= 10) {
        Idle.systems.inventory.removeQty(Idle.state.slots, "banana", 10);
        Idle.state.choice = {
          text: "Luthas: 30 gp and the shipment goes to Wydin.",
          options: [
            { id: "luthas-pay", label: "Pay 30 gp" },
            { id: "luthas-walk", label: "Walk away" },
          ],
        };
      } else {
        this.stopOther();
        Idle.state.place = "walking";
        Idle.state.leave = { steps: [{ label: "Hiding rum in crate", travel: 3 }], step: 0, startedAt: performance.now(), next: { place: "karamja" }, town: false };
        Idle.state.pushLog({ kind: "pick", text: "Hiding rum in crate. 3 seconds." });
      }
      this.render();
      return;
    }
    if (id === "luthas-pay") {
      if ((Idle.state.gold || 0) < 30) {
        Idle.state.pushLog({ kind: "full", text: "You need 30 gp." });
        this.render();
        return;
      }
      Idle.state.gold -= 30;
      Idle.state.pushLog({ kind: "pick", text: "Luthas: The shipment is going to Wydin." });
      this.render();
      return;
    }
    if (id === "wydin-shop") {
      this.openWydinShop();
      return;
    }
    if (id === "wydin-job") {
      Idle.state.pushLog({ kind: "pick", text: "Wydin: You're hired!" });
      this.stopOther();
      Idle.state.place = "walking";
      Idle.state.leave = { steps: [{ label: "Searching for a banana crate", travel: 5 }], step: 0, startedAt: performance.now(), next: { place: "port_sarim", retrieve: true }, town: false };
      this.render();
      return;
    }
    if (id === "customs-pay") {
      if ((Idle.state.gold || 0) < 30) {
        Idle.state.pushLog({ kind: "full", text: "You need 30 gp." });
        this.render();
        return;
      }
      Idle.state.gold -= 30;
      this.stopOther();
      Idle.state.place = "walking";
      Idle.state.leave = { steps: [{ label: "Returning to Port Sarim", travel: 20 }], step: 0, startedAt: performance.now(), next: { place: "port_sarim" }, town: false };
      Idle.state.pushLog({ kind: "pick", text: "Returning to Port Sarim. 20 seconds." });
      this.render();
      return;
    }
    if (id === "zembo-buy") {
      if ((Idle.state.gold || 0) < 30) {
        Idle.state.pushLog({ kind: "full", text: "You need 30 gp." });
        this.render();
        return;
      }
      Idle.state.gold -= 30;
      Idle.systems.inventory.add(Idle.state.slots, "karamjan_rum", 1);
      Idle.state.pushLog({ kind: "pick", text: "Bought Karamjan rum." });
      this.render();
      return;
    }
    this.render();
  },

  startWitchsPotion() {
    if (Idle.state.quests.witchs_potion) {
      Idle.state.pushLog({ kind: "pick", text: "Hetty has her potion." });
      this.render();
      return;
    }
    const here = Idle.state.town === "rimmington";
    const have = Idle.data.quests.witchs_potion.needs.every((need) => Idle.systems.inventory.count(Idle.state.slots, need.id) >= need.qty);
    this.stopOther();
    Idle.state.place = "walking";
    Idle.state.leave = { steps: here ? [] : [{ label: "Walking to Rimmington", travel: 15 }], step: 0, startedAt: performance.now(), next: { place: "rimmington", quest: "witchs_potion", turnIn: have }, town: false };
    Idle.state.questProgress = Idle.state.questProgress || {};
    Idle.state.questProgress.witchs_potion = true;
    Idle.state.screen = "town";
    Idle.state.pushLog({ kind: "pick", text: here ? "Talking to Hetty." : "Walking to Rimmington. 15 seconds." });
    this.render();
  },

  startImpCatcher() {
    if (Idle.state.quests.imp_catcher) {
      Idle.state.pushLog({ kind: "pick", text: "Wizard Mizgog has his beads." });
      this.render();
      return;
    }
    const here = Idle.state.town === "wizards_tower";
    const steps = here
      ? [{ label: "Climbing to the top", travel: 10 }]
      : [{ label: "Walking to the Wizards' Tower", travel: 15 }, { label: "Climbing to the top", travel: 10 }];
    const have = ["black_bead", "yellow_bead", "red_bead", "white_bead"].every((id) => Idle.systems.inventory.count(Idle.state.slots, id) >= 1);
    this.stopOther();
    Idle.state.place = "walking";
    Idle.state.leave = { steps, step: 0, startedAt: performance.now(), next: { place: "wizards_tower", quest: "imp_catcher", turnIn: have }, town: false };
    Idle.state.questProgress = Idle.state.questProgress || {};
    Idle.state.questProgress.imp_catcher = true;
    Idle.state.screen = "town";
    Idle.state.pushLog({ kind: "pick", text: here ? "Climbing to Wizard Mizgog. 10 seconds." : "Walking to the Wizards' Tower. 15 seconds." });
    this.render();
  },

  returnToCook() {
    this.stopOther();
    Idle.state.place = "walking";
    Idle.state.leave = { steps: [{ label: "Walking to the Cook", travel: 240 }], step: 0, startedAt: performance.now(), next: { place: "quest", quest: "cooks_assistant" }, town: false };
    Idle.state.screen = "quests";
    Idle.state.pushLog({ kind: "pick", text: "Walking to the Cook. 4 minutes." });
    this.render();
  },

  giveQuest() {
    const questId = Idle.state.depositQuest || "cooks_assistant";
    const quest = Idle.data.quests[questId];
    const tray = Idle.state.deposit || [];
    const total = (id) => tray.reduce((sum, entry) => sum + (entry && entry.id === id ? entry.qty : 0), 0);
    const ok = quest.needs.every((need) => total(need.id) >= need.qty);
    if (!ok) {
      Idle.state.pushLog({ kind: "full", text: `Deposit ${quest.needs.map((need) => `${need.qty} ${need.name}`).join(", ")}.` });
      this.render();
      return;
    }
    quest.needs.forEach((need) => {
      let left = need.qty;
      tray.forEach((entry, index) => {
        if (!entry || entry.id !== need.id || left <= 0) return;
        const take = Math.min(entry.qty, left);
        entry.qty -= take;
        left -= take;
        if (entry.qty <= 0) tray[index] = null;
      });
    });
    Idle.state.depositOpen = false;
    Idle.state.depositQuest = null;
    Idle.state.quests[questId] = true;
    Idle.state.questPoints = (Idle.state.questPoints || 0) + 1;
    if (quest.passive && !Idle.state.passives.includes(quest.passive)) Idle.state.passives.push(quest.passive);
    if (quest.rewardXp) {
      Object.entries(quest.rewardXp).forEach(([skill, amount]) => {
        if (Idle.state.skills[skill]) Idle.systems.xp.grant(Idle.state.skills[skill], amount);
        if (Idle.state.combatSkills[skill]) Idle.systems.xp.grant(Idle.state.combatSkills[skill], amount);
      });
    }
    if (quest.rewardItem) Idle.systems.inventory.add(Idle.state.slots, quest.rewardItem, 1);
    if (quest.gold) Idle.state.gold = (Idle.state.gold || 0) + quest.gold;
    const points = quest.points || 1;
    const lines = [`${points} Quest Point${points > 1 ? "s" : ""}`];
    if (quest.rewardXp) Object.entries(quest.rewardXp).forEach(([skill, amount]) => lines.push(`${amount} ${skill} xp`));
    if (quest.gold) lines.push(`${quest.gold} gp`);
    if (quest.rewardItem) lines.push(quest.rewardItem.replaceAll("_", " "));
    if (quest.passive) lines.push("Cook-o-matic 100");
    Idle.state.questComplete = { name: quest.name, lines };
    Idle.state.pushLog({ kind: "level", text: `${quest.name} complete.` });
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  doCombine() {
    const tray = Idle.state.combine || [];
    const ids = tray.filter(Boolean).map((entry) => entry.id);
    const recipe = Idle.data.combines.find((entry) => entry.needs.every((id) => ids.includes(id)));
    if (!recipe) {
      Idle.state.pushLog({ kind: "full", text: "Those items do not combine." });
      this.render();
      return;
    }
    recipe.needs.forEach((id) => {
      const index = tray.findIndex((entry) => entry && entry.id === id);
      if (index >= 0) {
        tray[index].qty -= 1;
        if (tray[index].qty <= 0) tray[index] = null;
      }
    });
    if (recipe.xp) {
      Object.entries(recipe.xp).forEach(([skill, amount]) => {
        if (Idle.state.skills[skill]) Idle.systems.xp.grant(Idle.state.skills[skill], amount);
      });
    }
    const empty = tray.findIndex((entry) => !entry);
    if (empty >= 0) tray[empty] = { id: recipe.result, qty: 1 };
    else Idle.systems.inventory.add(Idle.state.slots, recipe.result, 1);
    Idle.state.pushLog({ kind: "pick", text: `Combined ${recipe.result.replaceAll("_", " ")}.` });
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  startBrutus() {
    if (!Idle.state.brutusUnlocked) return;
    if (Idle.state.grave && Idle.state.grave.phase !== "choice") return;
    Idle.state.area = null;
    this.stopOther("fight");
    Idle.state.leave = null;
    Idle.state.running = false;
    const mob = Idle.systems.combat.mobById("brutus");
    Idle.state.fight = { mob: "brutus", phase: "travel", startedAt: performance.now(), playerHp: Idle.state.combatSkills.hitpoints.level, mobHp: mob.hp, playerSwings: 0, mobSwings: 0 };
    Idle.state.pushLog({ kind: "pick", text: "Walking to Brutus at the cow pen. 30 seconds." });
    this.render();
  },

  startCow() {
    if (Idle.state.grave && Idle.state.grave.phase !== "choice") return;
    Idle.state.area = null;
    this.stopOther("fight");
    Idle.state.leave = null;
    Idle.state.running = false;
    Idle.state.fight = { mob: "cow", phase: "travel", startedAt: performance.now(), playerHp: Idle.state.combatSkills.hitpoints.level, mobHp: 8, playerSwings: 0, mobSwings: 0 };
    Idle.state.pushLog({ kind: "pick", text: "Walking to the cow. 30 seconds." });
    this.render();
  },

  startExit() {
    if (Idle.state.area !== "vault") return;
    Idle.state.fight = null;
    Idle.state.exit = { startedAt: performance.now(), travel: 9, checks: 0 };
    Idle.state.pushLog({ kind: "pick", text: "Exiting the entrance. 9 seconds." });
    this.render();
  },

  paintExit(now) {
    const exit = Idle.state.exit;
    if (!exit || Idle.state.bury || Idle.state.fight) return;
    const elapsed = (now - exit.startedAt) / 1000;
    const due = Math.min(3, Math.floor(elapsed / 3));
    while (exit.checks < due) {
      exit.checks += 1;
      if (Math.random() < 0.25) {
        const pool = Idle.systems.combat.vaultMobs();
        const ambush = pool[Math.floor(Math.random() * pool.length)];
        const left = Math.max(0, exit.travel - elapsed);
        Idle.state.exit = null;
        Idle.state.fight = {
          mob: ambush.id,
          phase: "fight",
          startedAt: now,
          playerHp: Idle.state.combatSkills.hitpoints.level,
          mobHp: ambush.hp,
          playerSwings: 0,
          mobSwings: 0,
          resumeExit: left,
        };
        Idle.state.pushLog({ kind: "pick", text: this.encounterText(ambush) });
        this.render();
        return;
      }
    }
    this.root.querySelectorAll("[data-tick-fill]").forEach((bar) => { bar.style.width = `${Math.min(100, (elapsed / exit.travel) * 100)}%`; });
    this.root.querySelectorAll("[data-tick-label]").forEach((el) => { el.textContent = `Exiting the entrance · ${Math.max(0, Math.ceil(exit.travel - elapsed))}s`; });
    if (elapsed < exit.travel) return;
    Idle.state.exit = null;
    Idle.state.area = null;
    Idle.state.leave = { town: true, travel: 35, startedAt: now, next: null };
    Idle.state.pushLog({ kind: "pick", text: "You are outside. Walking back to town. 35 seconds." });
    this.render();
  },

  startStronghold() {
    if (Idle.state.grave && Idle.state.grave.phase !== "choice") return;
    if (Idle.state.area === "vault") return;
    this.stopOther("fight");
    Idle.state.leave = null;
    Idle.state.running = false;
    Idle.state.fight = { mob: "goblin", phase: "travel", startedAt: performance.now(), playerHp: Idle.state.combatSkills.hitpoints.level, mobHp: 5, playerSwings: 0, mobSwings: 0, area: "vault" };
    Idle.state.pushLog({ kind: "pick", text: "Walking to Secured Stronghold. 35 seconds." });
    this.render();
  },

  pickVaultMob(id) {
    if ((Idle.state.area !== "vault" && Idle.state.area !== "catacomb" && Idle.state.area !== "pestilence") || !Idle.state.fight) return;
    const intended = Idle.systems.combat.mobById(id);
    if (!intended || intended.locked) return;
    if (Idle.state.fight.mob === id) {
      Idle.state.fight.nextTarget = null;
      Idle.state.pushLog({ kind: "pick", text: `Staying on ${intended.name}.` });
      this.render();
      return;
    }
    Idle.state.fight.nextTarget = id;
    Idle.state.pushLog({ kind: "pick", text: `Next target: ${intended.name}. Finish this fight first.` });
    this.render();
  },

  encounterText(mob) {
    const line = Math.random() < 0.5
      ? `You ran into an angry ${mob.name}.`
      : `You were spotted by an angry ${mob.name}.`;
    return `${line} ${mob.name} starts to fight you.`;
  },

  paintAggro(now) {
    if (!Idle.state.fight || Idle.state.fight.phase !== "fight") return;
    const pool = Idle.state.area === "pestilence" ? Idle.systems.combat.pestilenceMobs() : Idle.state.area === "catacomb" ? Idle.systems.combat.catacombMobs() : [];
    const aggressive = pool.filter((mob) => mob.aggro);
    if (!aggressive.length) return;
    if (!this.aggroAt) this.aggroAt = now;
    if (now - this.aggroAt < 2000) return;
    this.aggroAt = now;
    if (Math.random() >= 0.05) return;
    const mob = aggressive[Math.floor(Math.random() * aggressive.length)];
    if (Idle.state.fight.mob === mob.id) return;
    Idle.state.fight.mob = mob.id;
    Idle.state.fight.startedAt = now;
    Idle.state.fight.mobHp = mob.hp;
    Idle.state.fight.playerSwings = 0;
    Idle.state.fight.mobSwings = 0;
    Idle.state.pushLog({ kind: "pick", text: `An aggressive ${mob.name} attacks you.` });
    this.render();
  },

  paintCast(now) {
    const cast = Idle.state.cast;
    if (!cast) return;
    const left = Math.max(0, 8 - (now - cast.startedAt) / 1000);
    this.root.querySelectorAll("[data-tick-label]").forEach((el) => { el.textContent = `Casting Teleport: Home · ${Math.ceil(left)}s`; });
    this.root.querySelectorAll("[data-tick-fill]").forEach((bar) => { bar.style.width = `${Math.min(100, ((now - cast.startedAt) / 8000) * 100)}%`; });
    if (left > 0) return;
    if (this.teleportSound) {
      this.teleportSound.pause();
      this.teleportSound = null;
    }
    Idle.state.cast = null;
    Idle.state.homeUntil = Date.now() + 180000;
    Idle.state.fight = null;
    Idle.state.area = null;
    Idle.state.town = "lumbridge";
    Idle.state.place = "lumbridge";
    Idle.state.screen = "town";
    Idle.state.pushLog({ kind: "pick", text: "You are home in Lumbridge." });
    this.render();
  },

  flee() {
    if (!Idle.state.fight || Idle.state.fight.phase !== "fight") return;
    if (Idle.state.fleeUntil && Date.now() < Idle.state.fleeUntil) return;
    Idle.state.fleeUntil = Date.now() + 4000;
    Idle.state.fight = null;
    Idle.state.activity = null;
    Idle.state.running = false;
    Idle.state.pushLog({ kind: "pick", text: "You fled. 4 seconds before you can fight again." });
    this.render();
  },

  castHome() {
    if (Idle.state.cast && Idle.state.cast.spell === "home") {
      Idle.state.cast = null;
      if (this.teleportSound) {
        this.teleportSound.pause();
        this.teleportSound = null;
      }
      Idle.state.pushLog({ kind: "pick", text: "Teleport cancelled." });
      this.render();
      return;
    }
    if (Idle.state.homeUntil && Date.now() < Idle.state.homeUntil) return;
    Idle.state.cast = { spell: "home", startedAt: performance.now() };
    this.teleportSound = Idle.systems.sound.play("teleport", false);
    Idle.state.pushLog({ kind: "pick", text: "Casting Teleport: Home. 8 seconds." });
    this.render();
  },

  exchange() {
    Idle.systems.exchange.ensure(Idle.state);
    const mode = this.marketMode || "buy";
    const items = Idle.systems.exchange.listed();
    const catalog = Idle.systems.inventory.catalog();
    const sellable = Idle.state.slots.filter(Boolean).filter((slot) => catalog[slot.id] && catalog[slot.id].sell > 0);
    return `
      <section class="panel market-panel">
        <div class="screen-head">
          <p class="kicker">Market</p>
          <button class="tab ${mode === "buy" ? "on" : ""}" data-action="market-buy">Purchase</button>
          <button class="tab ${mode === "sell" ? "on" : ""}" data-action="market-sell">Sell</button>
          <button class="text-btn" data-action="hub">Back</button>
        </div>
        ${mode === "buy" ? `
        <div class="wheel" data-wheel>
          ${items.map((item) => `
            <div class="node wheel-item market-row">
              <span class="market-line">${item.name} · ${Idle.state.prices[item.id]} gp</span>
              <span class="offer">
                <button class="btn small" data-action="add-cart" data-item="${item.id}">Add</button>
                <input class="qty" type="number" min="1" value="1" data-qty="${item.id}">
              </span>
            </div>`).join("")}
        </div>
        <div class="cart">
          ${Idle.state.orders.map((order, index) => `
            <button class="pill" data-action="edit-order" data-order="${index}" title="Right click to remove">${order.id.replaceAll("_", " ")} × ${order.left}</button>
          `).join("") || `<p class="hint">Cart is empty.</p>`}
        </div>` : `
        <div class="wheel" data-wheel>
          ${sellable.map((slot, index) => `
            <button class="node wheel-item ${this.sellPick === slot.id ? "active" : ""}" data-action="pick-sell" data-item="${slot.id}" data-qty="${slot.qty}">
              <span class="node-copy"><span class="node-name">${catalog[slot.id].name}</span></span>
            </button>`).join("") || `<p class="hint">Nothing to sell.</p>`}
        </div>
        ${this.sellPick ? `<div class="offer-row">
          <input class="qty" type="number" min="1" value="1" data-sell-qty>
          <input type="range" min="-50" max="50" value="0" data-sell-percent>
          <span data-sell-label>0% · market</span>
          <button class="btn small" data-action="list-sale">List</button>
        </div>` : ""}
        <div class="cart">
          ${Idle.state.sales.map((sale, index) => `
            <div class="sale">
              <span>${sale.id.replaceAll("_", " ")} × ${sale.left} · ${sale.price} gp · ${sale.percent}%</span>
              <input type="range" min="-50" max="50" value="${sale.percent}" data-sale="${index}">
              <button class="btn small" data-action="cancel-sale" data-sale="${index}">Delist</button>
            </div>`).join("")}
        </div>`}
      </section>`;
  },

  mailbox() {
    Idle.systems.exchange.ensure(Idle.state);
    const catalog = Idle.systems.inventory.catalog();
    const tab = this.mailTab || "mail";
    const ledger = Idle.state.ledger || [];
    return `
      <section class="panel">
        <div class="screen-head">
          <div style="display:flex;gap:8px">
            <button class="tab ${tab === "mail" ? "on" : ""}" data-action="mail-tab">Mailbox</button>
            <button class="tab ${tab === "ledger" ? "on" : ""}" data-action="ledger-tab">Ledger</button>
          </div>
          <button class="text-btn" data-action="hub">Back</button>
        </div>
        ${tab === "mail" ? `
        <div class="wheel" data-wheel>
          ${Idle.state.mail.map((entry, index) => `
            <button class="node wheel-item" data-action="take-mail" data-mail="${index}">
              <span class="node-copy">
                <span class="node-name">${entry.id === "gold" ? "Gold" : catalog[entry.id] ? catalog[entry.id].name : entry.id}</span>
                <span class="node-stat">× ${entry.qty} · take</span>
              </span>
            </button>`).join("") || `<p class="hint">Mailbox is empty.</p>`}
        </div>` : `
        <div class="wheel" data-wheel>
          ${ledger.map((line) => {
            const name = catalog[line.id] ? catalog[line.id].name : line.id.replaceAll("_", " ");
            const color = line.gold >= 0 ? "#6a8f4a" : "#b33b4a";
            const sign = line.gold >= 0 ? "+" : "";
            return `<div class="node wheel-item"><span class="node-copy"><span class="node-name">${name} × ${line.qty}</span><span class="node-stat" style="color:${color}">${sign}${line.gold}</span></span></div>`;
          }).join("") || `<p class="hint">No transactions yet.</p>`}
        </div>`}
      </section>`;
  },

  spellbook() {
    const left = Idle.state.homeUntil && Date.now() < Idle.state.homeUntil ? Math.ceil((Idle.state.homeUntil - Date.now()) / 1000) : 0;
    return `
      <section class="panel">
        <div class="screen-head">
          <p class="kicker">Spellbook</p>
          <button class="text-btn" data-action="hub">Back</button>
        </div>
        <button class="node wheel-item" data-action="cast-home" ${left ? "disabled" : ""}>
          <span class="node-copy">
            <span class="node-name">Teleport: Home</span>
            <span class="node-stat">${left ? `Cooldown ${left}s` : "8s cast · 3 minute cooldown"}</span>
          </span>
        </button>
        ${Idle.state.passives && Idle.state.passives.includes("cook_o_matic") ? `<button class="node wheel-item active"><span class="node-copy"><span class="node-name">Cook-o-matic 100</span><span class="node-stat">Passive · 5-15% less burn</span></span></button>` : ""}
        <p class="hint">Can be cast in combat. A hit cancels the cast.</p>
      </section>`;
  },

  enterPestilence() {
    if (Idle.state.area !== "catacomb") return;
    Idle.state.fight = { mob: "spider", phase: "travel", startedAt: performance.now(), playerHp: Idle.state.combatSkills.hitpoints.level, mobHp: 22, playerSwings: 0, mobSwings: 0, area: "pestilence", travelOverride: 9 };
    Idle.state.pushLog({ kind: "pick", text: "Walking to Pit of Pestilence. 9 seconds." });
    this.render();
  },

  enterSepulchre() {
    if (Idle.state.area !== "pestilence") return;
    Idle.state.fight = { mob: "ankou", phase: "travel", startedAt: performance.now(), playerHp: Idle.state.combatSkills.hitpoints.level, mobHp: 60, playerSwings: 0, mobSwings: 0, area: "sepulchre", travelOverride: 9 };
    Idle.state.pushLog({ kind: "pick", text: "Walking to Sepulchre of Shadows. 9 seconds." });
    this.render();
  },

  enterCatacomb() {
    if (Idle.state.area !== "vault") return;
    Idle.state.fight = { mob: "giant_rat", phase: "travel", startedAt: performance.now(), playerHp: Idle.state.combatSkills.hitpoints.level, mobHp: 25, playerSwings: 0, mobSwings: 0, area: "catacomb", travelOverride: 9 };
    Idle.state.pushLog({ kind: "pick", text: "Walking to Catacomb of Famine. 9 seconds." });
    this.render();
  },

  arriveVault(fight, now) {
    const pick = Idle.systems.combat.vaultMobs()[Math.floor(Math.random() * 4)];
    Idle.state.area = "vault";
    fight.mob = pick.id;
    fight.phase = "fight";
    fight.startedAt = now;
    fight.mobHp = pick.hp;
    fight.playerSwings = 0;
    fight.mobSwings = 0;
    Idle.state.pushLog({ kind: "pick", text: `Vault of War. ${this.encounterText(pick)}` });
    this.render();
  },

  stage() {
    if (Idle.state.screen === "mining") return this.mining();
    if (Idle.state.screen === "smithing") return this.smithing();
    if (Idle.state.screen === "anvil") return this.anvil();
    if (Idle.state.screen === "cooking") return this.cooking();
    if (Idle.state.screen === "crafting") return this.crafting();
    if (Idle.state.screen === "sailing") return this.sailing();
    if (Idle.state.screen === "woodcutting") return this.woodcutting();
    if (Idle.state.screen === "firemaking") return this.firemaking();
    if (Idle.state.screen === "farming") return this.farming();
    if (Idle.state.screen === "fletching") return this.fletching();
    if (Idle.state.screen === "thieving") return this.thieving();
    if (Idle.state.screen === "agility") return this.agility();
    if (Idle.state.screen === "fishing") return this.fishing();
    if (Idle.state.screen === "altar") return this.altar();
    if (Idle.state.screen === "equipment") return this.equipment();
    if (Idle.state.screen === "professions") return this.professions();
    if (Idle.state.screen === "adventure") return this.adventure();
    if (Idle.state.screen === "stats") return this.combatStats();
    if (Idle.state.screen === "bestiary") return this.bestiary();
    if (Idle.state.screen === "store") return this.store();
    if (Idle.state.screen === "wydin") return this.wydinShop();
    if (Idle.state.screen === "bank") return this.bank();
    if (Idle.state.screen === "spellbook") return this.spellbook();
    if (Idle.state.screen === "exchange") return this.exchange();
    if (Idle.state.screen === "mailbox") return this.mailbox();
    if (Idle.state.screen === "quests") return this.questJournal();
    if (Idle.state.screen === "town") return this.townScreen();
    return this.hub();
  },

  mining() {
    const skill = Idle.state.skills.mining;
    const pct = Math.max(0, Math.min(100, (skill.xp / skill.xpToNext) * 100));
    const nodes = Idle.professions.mining.nodes();
    return `
      <section class="panel">
        <div class="screen-head">
          <div>
            <p class="kicker">Profession</p>
            <h1>Mining</h1>
          </div>
          <button class="text-btn" data-action="hub">Back to menu</button>
        </div>
        <div class="level-block">
          <div class="level-label" data-level-label>Level ${skill.level}</div>
          <div class="xp-meta" data-xp-meta>${this.formatXp(skill.xp)} / ${this.formatXp(skill.xpToNext)} xp</div>
          <div class="bar xp-track" aria-hidden="true"><span data-xp-fill style="width:${pct}%"></span></div>
        </div>
        <p class="hint">Scroll the wheel for later rocks. Locked ones stay visible until your Mining level reaches them. Next level costs 133% of this requirement.</p>
        <div class="wheel" data-wheel>
          <div class="wheel-fade wheel-fade-top"></div>
          ${nodes.map((node) => this.nodeCard(node, skill)).join("")}
          <div class="wheel-fade wheel-fade-bottom"></div>
        </div>
        <div class="log" data-log>
          ${
            Idle.state.log.length
              ? Idle.state.log.map((line) => `<p class="log-${line.kind}">${line.text}</p>`).join("")
              : `<p class="log-idle">Select clay, essence, copper, or tin.</p>`
          }
        </div>
      </section>
    `;
  },

  nodeCard(node, skill) {
    const locked = skill.level < node.level;
    const active = Idle.state.activity && Idle.state.activity.profession === "mining" && Idle.state.activity.id === node.id;
    return `
      <button class="node wheel-item ${active ? "active" : ""} ${locked ? "locked" : ""}" data-node="${node.id}">
        <span class="swatch">${this.iconHtml(node.id, node)}</span>
        <span class="node-copy">
          <span class="node-name">${node.name}</span>
          <span class="node-stat">Requires Mining ${node.level} · ${this.formatXp(node.xp)} xp · ${node.sell} gp · ${this.formatSeconds(node.respawn)} respawn</span>
          <span class="node-blurb">${locked ? `Locked until level ${node.level}` : node.blurb}</span>
        </span>
        <span class="node-state">${active ? "Farming" : locked ? "Locked" : "Mine"}</span>
      </button>
    `;
  },

  equipment() {
    const gear = Idle.state.equipment;
    const twoHand = Idle.systems.equipment.twoHanded(gear);
    const selected = Idle.state.selectedEquip;
    const cell = (id, label, file) => {
      const itemId = gear[id];
      const item = itemId ? Idle.systems.inventory.catalog()[itemId] : null;
      const locked = id === "shield" && twoHand;
      return `
        <button class="equip-slot ${selected === id ? "picked" : ""} ${locked ? "blocked" : ""}" data-equip="${id}" data-item="${itemId || ""}" style="background:#241c16 url('images/gui/${file}') center / cover no-repeat">
          ${item ? `<span class="equip-item">${this.iconHtml(item.id, item)}</span>` : ""}
        </button>`;
    };
    return `
      <section class="panel">
        <div class="screen-head">
          <div>
            <p class="kicker">Worn</p>
            <h1>Equipment</h1>
          </div>
          <button class="text-btn" data-action="hub">Back to menu</button>
        </div>
        <p class="hint">Select a slot, then click a matching stack. The slot clears after the item is worn.</p>
        <div class="equip-layout">
          <div class="doll">
            <div class="doll-gap"></div>${cell("helm", "Helmet", "equip_helm.png")}<div class="doll-gap"></div>
            ${cell("cape", "Cape", "equip_cape.png")}${cell("neck", "Neck", "equip_neck.png")}${cell("ammo", "Ammo", "equip_ammo.png")}
            ${cell("weapon", "Main hand", "equip_mainh.png")}${cell("body", "Chest", "equip_body.png")}${cell("shield", "Offhand", "equip_offh.png")}
            <div class="doll-gap"></div>${cell("legs", "Legs", "equip_legs.png")}<div class="doll-gap"></div>
            ${cell("gloves", "Gloves", "equip_gloves.png")}${cell("boots", "Boots", "equip_boots.png")}${cell("ring", "Ring", "equip_ring.png")}
          </div>
          ${this.bonusSheet()}
        </div>
        <p class="log-idle">${twoHand ? "Offhand is locked by a two-handed weapon." : "Ammo takes arrows, bolts, or rocks."}</p>
      </section>
    `;
  },

  bonusSheet() {
    const bonus = Idle.systems.combat.totals();
    const speed = Idle.systems.combat.swingSeconds();
    const sign = (value) => `${value >= 0 ? "+" : ""}${value}`;
    return `
      <div class="bonus-sheet">
        <p class="kicker">Attack bonus</p>
        <p>Stab: ${sign(bonus.stab)} · Slash: ${sign(bonus.slash)} · Crush: ${sign(bonus.crush)}</p>
        <p>Magic: ${sign(bonus.magic)} · Range: ${sign(bonus.range)}</p>
        <p class="kicker">Defence bonus</p>
        <p>Stab: ${sign(bonus.dstab)} · Slash: ${sign(bonus.dslash)} · Crush: ${sign(bonus.dcrush)}</p>
        <p>Magic: ${sign(bonus.dmagic)} · Range: ${sign(bonus.drange)}</p>
        <p class="kicker">Other bonuses</p>
        <p>Melee str: ${sign(bonus.strength)} · Ranged str: ${sign(bonus.rangedStrength)}</p>
        <p>Magic dmg: ${bonus.magicDamage}% · Prayer: ${sign(bonus.prayer)}</p>
        <p class="kicker">Target-specific</p>
        <p>Undead: ${bonus.undead}% · Slayer: ${bonus.slayer}%</p>
        <p class="kicker">Weapon speed</p>
        <p>Base: ${speed}s · Actual: ${speed}s</p>
      </div>
    `;
  },

  selectEquip(slotId) {
    if (slotId === "shield" && Idle.systems.equipment.twoHanded(Idle.state.equipment)) return;
    Idle.state.selectedEquip = Idle.state.selectedEquip === slotId ? null : slotId;
    this.render();
  },

  tryEquipFromInventory(index) {
    const slotId = Idle.state.selectedEquip;
    if (!slotId || !Idle.state.slots[index]) return false;
    const error = Idle.systems.equipment.equip(Idle.state, slotId, index);
    if (!error) Idle.state.selectedEquip = null;
    Idle.state.pushLog({ kind: error ? "full" : "pick", text: error || `Equipped ${Idle.systems.inventory.catalog()[Idle.state.equipment[slotId]].name}.` });
    Idle.systems.save.write(Idle.state);
    this.render();
    return true;
  },

  anvil() {
    const skill = Idle.state.skills.smithing;
    const pct = Math.max(0, Math.min(100, (skill.xp / skill.xpToNext) * 100));
    const metal = this.anvilMetal || "bronze";
    const items = Idle.professions.anvil.forMetal(metal);
    return `
      <section class="panel">
        <div class="screen-head">
          <div>
            <p class="kicker">Anvil</p>
            <h1>${metal[0].toUpperCase()}${metal.slice(1)}</h1>
          </div>
          <button class="text-btn" data-action="hub">Back to menu</button>
        </div>
        <div class="level-block">
          <div class="level-label" data-level-label>Smithing ${skill.level}</div>
          <div class="xp-meta" data-xp-meta>${this.formatXp(skill.xp)} / ${this.formatXp(skill.xpToNext)} xp <span class="xp-gain">${this.gainText("anvil")}</span></div>
          <div class="bar xp-track" aria-hidden="true"><span data-xp-fill style="width:${pct}%"></span></div>
        </div>
        <div class="metal-tabs">
          ${Idle.data.anvilMetals.map((name) => `<button class="tab ${name === metal ? "on" : ""}" data-metal="${name}">${name}</button>`).join("")}
        </div>
        <p class="hint">${items.length ? "Bronze items use bronze bars and Smithing level. Other metal pages are ready for their lists." : "No items on this page yet."}</p>
        <div class="wheel" data-wheel>
          <div class="wheel-fade wheel-fade-top"></div>
          ${items.map((item) => this.anvilCard(item, skill)).join("")}
          <div class="wheel-fade wheel-fade-bottom"></div>
        </div>
        <div class="log" data-log>
          ${
            Idle.state.log.length
              ? Idle.state.log.map((line) => `<p class="log-${line.kind}">${line.text}</p>`).join("")
              : `<p class="log-idle">Select a bronze item to hammer.</p>`
          }
        </div>
      </section>
    `;
  },

  anvilCard(item, skill) {
    const locked = skill.level < item.level;
    const active = Idle.state.activity && Idle.state.activity.profession === "anvil" && Idle.state.activity.id === item.id;
    const cost = Object.entries(item.cost).map(([id, qty]) => `<span>${id.replaceAll("_", " ")} +${qty}</span>`).join("");
    return `
      <button class="node wheel-item cook-row ${active ? "active" : ""} ${locked ? "locked" : ""}" data-anvil="${item.id}">
        <span class="swatch">${this.iconHtml(item.id, item)}</span>
        <span class="cook-copy">
          <span class="node-name">${item.name}</span>
          <span class="ingredient-row">${locked ? `Locked until Smithing ${item.level}` : `Smithing ${item.level} · ${cost}`}</span>
        </span>
      </button>`;
  },

  selectAnvil(id) {
    const skill = Idle.state.skills.smithing;
    const item = Idle.professions.anvil.nodeById(id);
    if (!Idle.professions.anvil.canMake(skill, item)) return;
    const missing = Object.entries(item.cost).some(([id, qty]) => Idle.systems.inventory.count(Idle.state.slots, id) < qty);
    if (missing) {
      Idle.state.pushLog({ kind: "full", text: `Missing bars for ${item.name}.` });
      this.render();
      return;
    }
    const on = Idle.state.activity && Idle.state.activity.profession === "anvil" && Idle.state.activity.id === id;
    this.stopOther("gather");
    Idle.state.activity = on ? null : { profession: "anvil", id };
    Idle.state.active.mining = null;
    Idle.state.running = true;
    this.tickStartedAt = performance.now();
    this.syncActivitySound();
    Idle.state.pushLog({
      kind: "pick",
      text: Idle.state.activity ? `Now hammering ${item.name}.` : "Anvil paused.",
    });
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  smithing() {
    const skill = Idle.state.skills.smithing;
    const pct = Math.max(0, Math.min(100, (skill.xp / skill.xpToNext) * 100));
    const bars = Idle.professions.smithing.nodes();
    return `
      <section class="panel">
        <div class="screen-head">
          <div>
            <p class="kicker">Profession</p>
            <h1>Smithing</h1>
          </div>
          <button class="text-btn" data-action="hub">Back to menu</button>
        </div>
        <div class="level-block">
          <div class="level-label" data-level-label>Level ${skill.level}</div>
          <div class="xp-meta" data-xp-meta>${this.formatXp(skill.xp)} / ${this.formatXp(skill.xpToNext)} xp <span class="xp-gain">${this.gainText("smithing")}</span></div>
          <div class="bar xp-track" aria-hidden="true"><span data-xp-fill style="width:${pct}%"></span></div>
        </div>
        <p class="hint">Pick a bar to smelt. Ingredients are taken from the inventory. Iron has a 50% chance to fail and still uses the ore.</p>
        <div class="wheel" data-wheel>
          <div class="wheel-fade wheel-fade-top"></div>
          ${bars.map((bar) => this.barCard(bar, skill)).join("")}
          <div class="wheel-fade wheel-fade-bottom"></div>
        </div>
        <div class="log" data-log>
          ${
            Idle.state.log.length
              ? Idle.state.log.map((line) => `<p class="log-${line.kind}">${line.text}</p>`).join("")
              : `<p class="log-idle">Select a bar to smelt.</p>`
          }
        </div>
      </section>
    `;
  },

  barCard(bar, skill) {
    const locked = skill.level < bar.level;
    const active = Idle.state.activity && Idle.state.activity.profession === "smithing" && Idle.state.activity.id === bar.id;
    const cost = Object.entries(bar.cost).map(([id, qty]) => `<span>${id.replaceAll("_", " ")} +${qty}</span>`).join("");
    return `
      <button class="node wheel-item cook-row ${active ? "active" : ""} ${locked ? "locked" : ""}" data-recipe="${bar.id}">
        <span class="swatch">${this.iconHtml(bar.id, bar)}</span>
        <span class="cook-copy">
          <span class="node-name">${bar.name}</span>
          <span class="ingredient-row">${locked ? `Locked until Smithing ${bar.level}` : `Smithing ${bar.level} · ${cost}`}</span>
        </span>
      </button>`;
  },

  openTreasure() {
    const selected = Idle.state.selectedSlot;
    const slot = selected === null ? null : Idle.state.slots[selected];
    if (!slot || slot.id !== "one_eyed_hectors_treasure") return;
    Idle.systems.inventory.removeQty(Idle.state.slots, "one_eyed_hectors_treasure", 1);
    Idle.state.gold = (Idle.state.gold || 0) + 450;
    Idle.systems.inventory.add(Idle.state.slots, "gold_ring", 1);
    Idle.systems.inventory.add(Idle.state.slots, "emerald", 1);
    Idle.state.pushLog({ kind: "pick", text: "Opened the treasure: 450 gp, gold ring, emerald." });
    Idle.systems.save.write(Idle.state);
    this.render();
  },

  inventory() {
    const catalog = Idle.systems.inventory.catalog();
    const used = Idle.systems.inventory.usedCount(Idle.state.slots);
    const selected = Idle.state.selectedSlot;
    const slot = selected === null ? null : Idle.state.slots[selected];
    const item = slot ? catalog[slot.id] : null;
    return `
      <section class="panel bag-panel">
        <div class="screen-head">
          <div>
            <p class="kicker">Pack</p>
            <h2>Inventory</h2>
          </div>
          <span class="pill" data-used>${used} / ${Idle.config.inventorySlots}</span>
        </div>
        <div class="slots">
          ${Idle.state.slots
            .map((entry, index) => {
              const known = entry ? catalog[entry.id] : null;
              const on = selected === index ? "selected" : "";
              return `
              <button class="slot ${on} ${entry ? "filled" : ""}" data-slot="${index}" data-item="${entry ? entry.id : ""}" data-qty="${entry ? entry.qty : ""}" draggable="${entry ? "true" : "false"}">
                ${
                  entry
                    ? `${this.iconHtml(entry.id, known)}<span class="qty">${entry.qty}</span>`
                    : ""
                }
              </button>`;
            })
            .join("")}
        </div>
        <div class="sell-box">
          <p class="hint">Click a stack, then click a slot to move it. Or drag it. Matching items combine.</p>
          <p data-sell-text>${item ? `${item.name} × ${slot.qty} · ${item.sell} gp each` : "Select a stack to sell it."}</p>
          ${this.bagOpen ? `<div class="slots">${Idle.state.bag.map((entry, index) => `<button class="slot ${entry ? "filled" : ""}" data-bag="${index}">${entry ? `${this.iconHtml(entry.id)}<span class="qty">${entry.qty}</span>` : ""}</button>`).join("")}</div><p class="hint">Looting bag · 28 stacks. Click a bag slot to take it out.</p>` : ""}
          ${this.combineOpen ? `<div class="slots">${Idle.state.combine.map((entry, index) => `<button class="slot ${entry ? "filled" : ""}" data-combine="${index}">${entry ? `${this.iconHtml(entry.id)}<span class="qty">${entry.qty}</span>` : ""}</button>`).join("")}</div><button class="btn" data-action="do-combine">Combine tray</button>` : ""}
            <button class="btn" data-action="open-bag" ${item && item.id === "looting_bag" ? "" : "hidden"}>Open bag</button>
            <button class="btn" data-action="bury" ${item && /bones/i.test(item.name) ? "" : "hidden"}>Bury</button>
            <button class="btn" data-action="eat" ${item && item.heal ? "" : "hidden"}>Eat · +${item && item.heal ? item.heal : 0}</button>
            <button class="btn" data-action="light-fire" ${item && item.id === "logs" ? "" : "hidden"}>Light campfire</button>
            <button class="btn" data-action="open-fletching" ${item && item.id === "knife" ? "" : "hidden"}>Fletching</button>
            <button class="btn" data-action="open-treasure" ${item && item.id === "one_eyed_hectors_treasure" ? "" : "hidden"}>Open</button>
            <button class="btn" data-action="destroy" ${item ? "" : "hidden"}>Destroy</button>
            <button class="btn" data-action="deposit" ${item && Idle.state.screen === "bank" ? "" : "hidden"}>Deposit</button>
            <button class="btn" data-action="open-combine">Combine</button>
          </div>
        </div>
      </section>
    `;
  },

  bind() {
    this.root.querySelectorAll("[data-travel]").forEach((el) => {
      el.addEventListener("click", () => this.startTownTravel(el.dataset.travel));
    });
    this.root.querySelectorAll("[data-choice]").forEach((el) => {
      el.addEventListener("click", () => this.choose(el.dataset.choice));
    });
    this.root.querySelectorAll("[data-town-mob]").forEach((el) => {
      el.addEventListener("click", () => this.startTownMob(el.dataset.townMob));
    });
    this.root.querySelectorAll("[data-fletch]").forEach((el) => {
      el.addEventListener("click", () => this.selectFletch(el.dataset.fletch));
    });
    this.root.querySelectorAll("[data-thieve]").forEach((el) => {
      el.addEventListener("click", () => this.startThieve(el.dataset.thieve));
    });
    this.root.querySelectorAll("[data-stall]").forEach((el) => {
      el.addEventListener("click", () => this.startStall(el.dataset.stall));
    });
    this.root.querySelectorAll("[data-course]").forEach((el) => {
      el.addEventListener("click", () => this.startCourse(el.dataset.course));
    });
    this.root.querySelectorAll("[data-firecook]").forEach((el) => {
      el.addEventListener("click", () => this.cookOnFire(el.dataset.firecook));
    });
    this.root.querySelectorAll("[data-gather]").forEach((el) => {
      el.addEventListener("click", () => this.startGather(el.dataset.gather));
    });
    this.root.querySelectorAll("[data-action]").forEach((el) => {
      el.addEventListener("click", () => {
        const action = el.dataset.action;
        if (action === "hub") this.setScreen("hub");
        if (action && action.startsWith("toggle-")) {
          const key = action.replace("toggle-", "");
          this.townOpen = this.townOpen || {};
          this.townOpen[key] = !this.townOpen[key];
          this.render();
        }
        if (action === "open-mining") this.setScreen("mining");
        if (action === "open-smithing") this.setScreen("smithing");
        if (action === "open-anvil") this.setScreen("anvil");
        if (action === "open-cooking") this.setScreen("cooking");
        if (action === "open-crafting") this.setScreen("crafting");
        if (action === "open-sailing") this.setScreen("sailing");
        if (action === "open-firemaking") this.setScreen("firemaking");
        if (action === "open-farming") this.setScreen("farming");
        if (action === "open-fletching") this.setScreen("fletching");
        if (action === "open-thieving") this.setScreen("thieving");
        if (action === "open-agility") this.setScreen("agility");
        if (action === "talk-aubury") this.talkAubury();
        if (action === "plant-flax") this.plantFlax();
        if (action === "harvest-flax") this.harvestFlax();
        if (action === "open-fishing") this.setScreen("fishing");
        if (action === "open-altar") this.setScreen("altar");
        if (action === "open-stats") this.setScreen("stats");
        if (action === "open-bestiary") this.setScreen("bestiary");
        if (action === "open-quests") this.setScreen("quests");
        if (action === "open-exchange") this.goToMarket("exchange");
        if (action === "open-mailbox") this.setScreen("mailbox");
        if (action === "open-bank") this.openBank();
        if (action === "deposit") this.depositSelected();
        if (action === "withdraw") this.withdraw(Number(el.dataset.bank));
        if (action === "market-buy") { this.marketMode = "buy"; this.render(); }
        if (action === "market-sell") { this.marketMode = "sell"; this.render(); }
        if (action === "pick-sell") { this.sellPick = el.dataset.item; this.render(); }
        if (action === "cancel-sale") {
          Idle.systems.exchange.cancelSale(Idle.state, Number(el.dataset.sale));
          Idle.systems.save.write(Idle.state);
          this.render();
        }
        if (action === "list-sale") {
          const qty = Number(this.root.querySelector("[data-sell-qty]").value) || 1;
          const percent = Number(this.root.querySelector("[data-sell-percent]").value) || 0;
          const error = Idle.systems.exchange.listSale(Idle.state, this.sellPick, qty, percent);
          if (error) Idle.state.pushLog({ kind: "full", text: error });
          Idle.systems.save.write(Idle.state);
          this.render();
        }
        if (action === "add-cart") {
          const input = this.root.querySelector(`[data-qty="${el.dataset.item}"]`);
          Idle.systems.exchange.addOrder(Idle.state, el.dataset.item, Number(input && input.value) || 1);
          Idle.systems.save.write(Idle.state);
          this.render();
        }
        if (action === "edit-order") {
          const order = Idle.state.orders[Number(el.dataset.order)];
          const next = Number(window.prompt("Quantity", order.left));
          if (next > 0) order.left = next;
          Idle.systems.save.write(Idle.state);
          this.render();
        }
        if (action === "take-mail") {
          Idle.systems.exchange.takeMail(Idle.state, Number(el.dataset.mail));
          Idle.systems.save.write(Idle.state);
          this.render();
        }
        if (action === "open-professions") this.setScreen("professions");
        if (action === "open-adventure") this.setScreen("adventure");
        if (action === "open-equipment") this.setScreen("equipment");
        if (action === "fight-cow") this.startCow();
        if (action === "fight-chicken") this.startChicken();
        if (action === "milk-cow") this.startMilk();
        if (action === "open-quests") this.setScreen("quests");
        if (action === "open-town") this.setScreen("town");
        if (action === "talk-cook") this.talkNpc("cook");
        if (action === "talk-fred") this.talkNpc("fred");
        if (action === "talk-cassius") this.talkNpc("cassius");
        if (action === "talk-doric") this.talkNpc("doric");
        if (action === "talk-fisher_fred") this.talkNpc("fisher_fred");
        if (action === "talk-lumberjack_beave") this.talkNpc("lumberjack_beave");
        if (action === "talk-talsy") this.talkNpc("talsy");
        if (action === "talk-wizard_mizgog") this.startImpCatcher();
        if (action === "talk-hetty") this.startWitchsPotion();
        if (action === "talk-redbeard") this.talkRedbeard();
        if (action === "talk-sailor") this.talkSailor();
        if (action === "talk-luthas") this.talkLuthas();
        if (action === "talk-wydin") this.talkWydin();
        if (action === "open-wydin-shop") this.openWydinShop();
        if (action === "talk-customs") this.talkCustoms();
        if (action === "talk-zembo") this.talkZembo();
        if (action === "open-witch") { this.questOpen = this.questOpen === "witchs_potion" ? null : "witchs_potion"; this.render(); }
        if (action === "talk-lumberjack_beave") this.talkNpc("lumberjack_beave");
    if (action === "talk-talsy") this.talkNpc("talsy");
    if (action === "talk-general_store") this.openStore();
    if (action === "buy-store") this.buyStore(el.dataset.item);
    if (action === "buy-wydin") this.buyWydin(el.dataset.item);
    if (action === "sell-store") this.sellStore(el.dataset.item);
    if (action === "start-cave") this.startCave();
    if (action === "turnin-slayer") this.turnInSlayer();
        if (action === "open-fishers") { this.questOpen = this.questOpen === "fishers_friend" ? null : "fishers_friend"; this.render(); }
        if (action === "open-wood") { this.questOpen = this.questOpen === "woodchuckers_wood" ? null : "woodchuckers_wood"; this.render(); }
        if (action === "open-cave") { this.questOpen = this.questOpen === "cave_explorer" ? null : "cave_explorer"; this.render(); }
        if (action === "open-slayer") { this.questOpen = this.questOpen === "goblin_slayer" ? null : "goblin_slayer"; this.render(); }
        if (action === "open-imp") { this.questOpen = this.questOpen === "imp_catcher" ? null : "imp_catcher"; this.render(); }
        if (action === "start-imp") this.startImpCatcher();
        if (action === "turnin-fishers") this.turnInSimple("fishers_friend", "raw_shrimp", 20, "small_fishing_net");
        if (action === "turnin-wood") this.turnInSimple("woodchuckers_wood", "logs", 20);
        if (action === "open-cooks") { this.questOpen = this.questOpen === "cooks_assistant" ? null : "cooks_assistant"; this.render(); }
        if (action === "open-sheep") { this.questOpen = this.questOpen === "sheep_shearer" ? null : "sheep_shearer"; this.render(); }
        if (action === "start-sheep") this.startSheep();
        if (action === "open-doric") { this.questOpen = this.questOpen === "dorics_quest" ? null : "dorics_quest"; this.render(); }
        if (action === "start-doric") this.startDoric();
        if (action === "open-ides") { this.questOpen = this.questOpen === "ides_of_milk" ? null : "ides_of_milk"; this.render(); }
        if (action === "start-ides") this.startIdes();
        if (action === "return-cassius") this.returnCassius();
        if (action === "open-pande") { this.questOpen = this.questOpen === "pandemonium" ? null : "pandemonium"; this.render(); }
        if (action === "start-pande") this.startPandemonium();
        if (action === "fight-brutus") this.startBrutus();
        if (action === "quest-available") { this.questTab = "available"; this.render(); }
        if (action === "quest-progress") { this.questTab = "progress"; this.render(); }
        if (action === "quest-completed") { this.questTab = "completed"; this.render(); }
        if (action === "return-cook") this.returnToCook();
        if (action === "give-quest") this.giveQuest();
        if (action === "close-quest-complete") { Idle.state.questComplete = null; this.render(); }
        if (action === "open-combine") { this.combineOpen = !this.combineOpen; this.render(); }
        if (action === "do-combine") this.doCombine();
        if (action.startsWith("craft-")) { this.craftStation = action.slice(6); this.render(); }
        if (action === "fight-stronghold") this.startStronghold();
        if (action === "exit-entrance") this.startExit();
        if (action === "enter-catacomb") this.enterCatacomb();
        if (action === "enter-pestilence") this.enterPestilence();
        if (action === "enter-sepulchre") this.enterSepulchre();
        if (action === "flee") this.flee();
        if (action === "open-spellbook") this.setScreen("spellbook");
        if (action === "cast-home") this.castHome();
        if (action === "retrieve-body") this.retrieveBody();
        if (action === "milk-yes") { Idle.state.milkChoice = false; this.startCow(); }
        if (action === "milk-no") { Idle.state.milkChoice = false; this.render(); }
        if (action === "farm-yes") this.continueFarming(true);
        if (action === "farm-no") this.continueFarming(false);
        if (action === "bury" && Idle.state.selectedSlot !== null) this.startBury();
        if (action === "eat" && Idle.state.selectedSlot !== null) this.eatSelected();
        if (action === "light-fire" && Idle.state.selectedSlot !== null) this.startCampfire();
        if (action === "open-treasure") this.openTreasure();
        if (action === "destroy" && Idle.state.selectedSlot !== null) {
          const index = Idle.state.selectedSlot;
          const gone = Idle.state.slots[index];
          if (gone) {
            Idle.state.slots[index] = null;
            Idle.state.selectedSlot = null;
            Idle.state.pushLog({ kind: "pick", text: `Destroyed ${gone.qty} ${gone.id.replaceAll("_", " ")}.` });
            Idle.systems.save.write(Idle.state);
            this.render();
          }
        }
        if (action === "camp-yes") { this.askedCampfire = true; Idle.state.campfire = { phase: "light", startedAt: performance.now() }; this.render(); }
        if (action === "camp-no") { Idle.state.campfire = null; this.askedCampfire = false; this.render(); }
        if (action === "open-bag") this.bagOpen = !this.bagOpen;
        if (action === "sell-one" && Idle.state.selectedSlot !== null) {
          Idle.state.sellSlot(Idle.state.selectedSlot);
          Idle.systems.save.write(Idle.state);
          this.render();
        }
        if (action === "gender") {
          Idle.state.gender = Idle.state.gender === "female" ? "male" : "female";
          Idle.systems.save.write(Idle.state);
          this.render();
        }
        if (action === "settings") {
          this.settingsOpen = !this.settingsOpen;
          this.render();
        }
        if (action === "reset") this.reset();
      });
    });
    const wheel = this.root.querySelector("[data-wheel]");
    if (wheel) {
      wheel.scrollTop = this.wheelScroll || 0;
      wheel.addEventListener("scroll", () => {
        this.wheelScroll = wheel.scrollTop;
      });
    }
    this.root.querySelectorAll("[data-order]").forEach((el) => {
      el.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        Idle.state.orders.splice(Number(el.dataset.order), 1);
        Idle.systems.save.write(Idle.state);
        this.render();
      });
    });
    this.root.querySelectorAll("[data-deposit]").forEach((el) => {
      el.addEventListener("click", () => this.putDeposit(Number(el.dataset.deposit)));
    });
    this.root.querySelectorAll("[data-combine]").forEach((el) => {
      el.addEventListener("click", () => this.putCombine(Number(el.dataset.combine)));
    });
    this.root.querySelectorAll("[data-mob]").forEach((el) => {
      el.addEventListener("click", () => this.pickVaultMob(el.dataset.mob));
    });
    this.root.querySelectorAll("[data-bag]").forEach((el) => {
      el.addEventListener("click", () => {
        const index = Number(el.dataset.bag);
        if (Idle.state.selectedSlot !== null && Idle.state.slots[Idle.state.selectedSlot]) this.storeSelectedInBag();
        else this.takeFromBag(index);
      });
    });
    this.root.querySelectorAll("[data-node]").forEach((el) => {
      el.addEventListener("click", () => this.selectNode(el.dataset.node));
    });
    this.root.querySelectorAll("[data-recipe]").forEach((el) => {
      el.addEventListener("click", () => this.selectRecipe(el.dataset.recipe));
    });
    this.root.querySelectorAll("[data-cook]").forEach((el) => {
      el.addEventListener("click", () => this.selectCook(el.dataset.cook));
    });
    this.root.querySelectorAll("[data-craft]").forEach((el) => {
      el.addEventListener("click", () => this.selectCraft(el.dataset.craft));
    });
    this.root.querySelectorAll("[data-fish]").forEach((el) => {
      el.addEventListener("click", () => this.selectFish(el.dataset.fish));
    });
    this.root.querySelectorAll("[data-altar]").forEach((el) => {
      el.addEventListener("click", () => this.startAltar(el.dataset.altar));
    });
    this.root.querySelectorAll("[data-metal]").forEach((el) => {
      el.addEventListener("click", () => {
        this.anvilMetal = el.dataset.metal;
        this.render();
      });
    });
    this.root.querySelectorAll("[data-style]").forEach((el) => {
      el.addEventListener("click", () => {
        Idle.state.style = el.dataset.style;
        Idle.systems.save.write(Idle.state);
        this.render();
      });
    });
    this.root.querySelectorAll("[data-anvil]").forEach((el) => {
      el.addEventListener("click", () => this.selectAnvil(el.dataset.anvil));
    });
    this.root.querySelectorAll("[data-equip]").forEach((el) => {
      el.addEventListener("click", () => {
        const slotId = el.dataset.equip;
        if (Idle.state.equipment[slotId] && Idle.state.selectedEquip === slotId) {
          const error = Idle.systems.equipment.unequip(Idle.state, slotId);
          if (error) Idle.state.pushLog({ kind: "full", text: error });
          Idle.systems.save.write(Idle.state);
        }
        this.selectEquip(slotId);
      });
    });
    this.root.querySelectorAll("[data-slot]").forEach((el) => {
      el.addEventListener("dragstart", (event) => {
        this.dragged = true;
        this.holdingSlot = Number(el.dataset.slot);
        event.dataTransfer.setData("text/plain", el.dataset.slot);
      });
      el.addEventListener("dragover", (event) => event.preventDefault());
      el.addEventListener("drop", (event) => {
        event.preventDefault();
        const from = Number(event.dataTransfer.getData("text/plain"));
        Idle.systems.inventory.move(Idle.state.slots, from, Number(el.dataset.slot));
        this.holdingSlot = null;
        this.dragged = false;
        Idle.systems.save.write(Idle.state);
        this.render();
      });
      el.addEventListener("click", () => {
        if (this.dragged) {
          this.dragged = false;
          return;
        }
        const index = Number(el.dataset.slot);
        if (Idle.state.selectedEquip && Idle.state.slots[index]) {
          this.tryEquipFromInventory(index);
          return;
        }
        this.selectSlot(index);
      });
    });
    const volume = this.root.querySelector("[data-volume]");
    if (volume) {
      volume.addEventListener("input", () => Idle.systems.sound.setVolume(volume.value / 100));
    }
    const sellPercent = this.root.querySelector("[data-sell-percent]");
    if (sellPercent) {
      sellPercent.addEventListener("input", () => {
        const label = this.root.querySelector("[data-sell-label]");
        const item = Idle.systems.inventory.catalog()[this.sellPick];
        const market = Idle.state.prices[this.sellPick] || (item && item.sell) || 0;
        const price = Math.max(1, Math.round(market * (1 + Number(sellPercent.value) / 100)));
        if (label) label.textContent = `${sellPercent.value}% · ${price} gp · ${Idle.systems.exchange.sellSeconds(Number(sellPercent.value))}s`;
      });
    }
    this.root.querySelectorAll("[data-sale]").forEach((el) => {
      el.addEventListener("input", () => {
        const sale = Idle.state.sales[Number(el.dataset.sale)];
        if (!sale) return;
        sale.percent = Number(el.value);
        const item = Idle.systems.inventory.catalog()[sale.id];
        const market = Idle.state.prices[sale.id] || (item && item.sell) || sale.price;
        sale.price = Math.max(1, Math.round(market * (1 + sale.percent / 100)));
        sale.each = Idle.systems.exchange.sellSeconds(sale.percent);
        const label = el.parentElement.querySelector("span");
        if (label) label.textContent = `${sale.id.replaceAll("_", " ")} × ${sale.left} · ${sale.price} gp · ${sale.percent}%`;
      });
    });
    this.root.querySelectorAll("[data-item]").forEach((el) => {
      el.addEventListener("mouseenter", (event) => {
        if (el.dataset.item) this.showPreview(event, el.dataset.item, el.dataset.qty);
      });
      el.addEventListener("mousemove", (event) => {
        const box = document.querySelector("[data-preview]");
        if (box && !box.hidden) {
          box.style.left = `${event.clientX + 16}px`;
          box.style.top = `${event.clientY + 16}px`;
        }
      });
      el.addEventListener("mouseleave", () => this.hidePreview());
    });
  },

  showPreview(event, id, qty) {
    const item = Idle.systems.inventory.catalog()[id];
    if (!item) return;
    let box = document.querySelector("[data-preview]");
    if (!box) {
      box = document.createElement("div");
      box.className = "item-preview";
      box.dataset.preview = "1";
      document.body.appendChild(box);
    }
    const weapon = Idle.data.weaponStats[id];
    const lines = [`<strong>${item.name}</strong>`];
    if (qty) lines.push(`Stack ${qty}`);
    if (item.sell !== undefined) lines.push(`Sell ${item.sell} gp`);
    if (item.heal) lines.push(`Heals ${item.heal}`);
    if (Idle.data.altarFish[id]) lines.push(`Altar ${Idle.data.altarFish[id].prayer} Prayer · ${Idle.data.altarFish[id].seconds}s`);
    if (item.equip) lines.push(`Worn: ${item.equip}${item.hands === 2 ? " · two-handed" : ""}`);
    if (weapon) {
      if (weapon.speed) lines.push(`${weapon.attack || ""} · ${weapon.speed}s${weapon.styles && weapon.styles.length ? ` · ${weapon.styles.join(", ")}` : ""}`.trim());
      if (weapon.bonuses) {
        const b = weapon.bonuses;
        const order = [
          ["stab", "Stab dmg"], ["slash", "Slash dmg"], ["crush", "Crush dmg"], ["magic", "Magic atk"], ["range", "Ranged atk"],
          ["dstab", "Stab def"], ["dslash", "Slash def"], ["dcrush", "Crush def"], ["magicDefence", "Magic def"], ["drange", "Ranged def"],
          ["strength", "Strength"], ["magicDamage", "Magic dmg %"], ["rangedStrength", "Ranged str"], ["prayer", "Prayer"], ["weight", "Weight"],
        ];
        order.forEach(([key, label]) => {
          if (b[key] !== undefined && b[key] !== 0) lines.push(`${label}: ${b[key]}`);
        });
      }
    }
    box.innerHTML = `<img src="images/${id}.png" alt="">${lines.map((line) => `<p>${line}</p>`).join("")}`;
    box.style.left = `${event.clientX + 16}px`;
    box.style.top = `${event.clientY + 16}px`;
    box.hidden = false;
  },

  hidePreview() {
    const box = document.querySelector("[data-preview]");
    if (box) box.hidden = true;
  },

  iconHtml(id, item) {
    const color = item && item.swatch ? item.swatch : "#888";
    return `<span class="icon-wrap" style="background:${color}"><img class="item-icon" src="images/${id}.png" alt="" onerror="this.remove()"></span>`;
  },

  format(n) {
    return Math.round(n).toLocaleString();
  },

  formatXp(n) {
    const rounded = Math.round(n * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  },
};
