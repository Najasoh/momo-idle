window.Idle = window.Idle || {};
Idle.systems = Idle.systems || {};

Idle.systems.exchange = {
  listed() {
    return Object.values(Idle.systems.inventory.catalog())
      .filter((item) => item && item.sell > 0 && item.name && !item.noGe)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  ensure(state) {
    if (!state.prices) state.prices = {};
    if (!state.orders) state.orders = [];
    if (!state.sales) state.sales = [];
    if (!state.mail) state.mail = [];
    this.listed().forEach((item) => {
      if (!state.prices[item.id]) state.prices[item.id] = item.sell;
    });
  },

  tickPrices(state, now) {
    this.ensure(state);
    if (!state.priceAt) state.priceAt = now;
    if (now - state.priceAt < 30000) return;
    state.priceAt = now;
    this.listed().forEach((item) => {
      const last = state.prices[item.id] || item.sell;
      const swing = 0.05 + Math.random() * 0.45;
      const next = Math.random() < 0.5 ? last * (1 + swing) : last * (1 - swing);
      const floor = item.sell * 0.75;
      state.prices[item.id] = Math.max(floor, Math.round(next));
    });
  },

  addOrder(state, id, qty) {
    this.ensure(state);
    const item = Idle.systems.inventory.catalog()[id];
    if (!item || qty < 1) return;
    const price = state.prices[id] || item.sell || 0;
    const total = price * qty;
    if (Idle.systems.inventory.count(state.slots, "coins") < total) return "Not enough coins.";
    Idle.systems.inventory.removeQty(state.slots, "coins", total);
    const coins = ["coins_cave01", "coins_cave02"];
    Idle.systems.sound.play(coins[Math.floor(Math.random() * coins.length)], false);
    const each = 1 + Math.floor(Math.random() * 30);
    state.orders.push({ id, qty, left: qty, each, startedAt: performance.now(), price });
  },

  sellSeconds(percent) {
    return Math.max(2, Math.round(15 + (percent / 50) * 165));
  },

  listSale(state, id, qty, percent) {
    this.ensure(state);
    if (state.sales.length >= 8) return "Eight listings already.";
    const item = Idle.systems.inventory.catalog()[id];
    if (!item || qty < 1) return "Pick an item.";
    if (Idle.systems.inventory.count(state.slots, id) < qty) return "Not enough in inventory.";
    Idle.systems.inventory.removeQty(state.slots, id, qty);
    const market = state.prices[id] || item.sell;
    const price = Math.max(1, Math.round(market * (1 + percent / 100)));
    state.sales.push({ id, qty, left: qty, percent, price, each: this.sellSeconds(percent), startedAt: performance.now() });
    return "";
  },

  tickSales(state, now) {
    this.ensure(state);
    state.sales.forEach((sale) => {
      const done = Math.floor((now - sale.startedAt) / (sale.each * 1000));
      const ready = Math.min(sale.qty, done);
      const deliver = ready - (sale.qty - sale.left);
      if (deliver > 0) {
        sale.left -= deliver;
        state.mail.push({ id: "coins", qty: deliver * sale.price, name: `${sale.id} sold` });
      }
    });
    state.sales = state.sales.filter((sale) => sale.left > 0);
  },

  tickOrders(state, now) {
    this.ensure(state);
    state.orders.forEach((order) => {
      const done = Math.floor((now - order.startedAt) / (order.each * 1000));
      const ready = Math.min(order.qty, done);
      const deliver = ready - (order.qty - order.left);
      if (deliver > 0) {
        order.left -= deliver;
        const existing = state.mail.find((entry) => entry.id === order.id);
        if (existing) existing.qty += deliver;
        else state.mail.push({ id: order.id, qty: deliver });
        const price = state.prices[order.id] || 0;
        state.ledger = state.ledger || [];
        state.ledger.unshift({ id: order.id, qty: deliver, gold: -deliver * price, kind: "buy", at: now });
      }
    });
    state.orders = state.orders.filter((order) => order.left > 0);
  },

  cancelSale(state, index) {
    const sale = state.sales[index];
    if (!sale) return;
    Idle.systems.inventory.add(state.slots, sale.id, sale.left);
    state.sales.splice(index, 1);
  },

  takeMail(state, index) {
    const entry = state.mail[index];
    if (!entry) return;
    if (entry.id === "coins") {
      if (Idle.systems.inventory.add(state.slots, "coins", entry.qty)) state.mail.splice(index, 1);
      const sounds = ["coins_cave01", "coins_cave02"];
      Idle.systems.sound.play(sounds[Math.floor(Math.random() * sounds.length)], false);
      return;
    }
    if (entry.id === "gold") {
      state.gold += entry.qty;
      state.mail.splice(index, 1);
      return;
    }
    if (Idle.systems.inventory.add(state.slots, entry.id, entry.qty)) state.mail.splice(index, 1);
  },
};
