/* GM Wallet — wallet connection (read-only, never asks to sign or send) + GM holder gate. */
(function () {
  const CFG = window.GM_CONFIG;
  const KEY = "gmwallet.wallet";
  const evm = new Map();
  const SOL = [
    { key: "phantom", name: "Phantom", url: "https://phantom.app", get: () => window.phantom?.solana?.isPhantom ? window.phantom.solana : (window.solana?.isPhantom ? window.solana : null) },
    { key: "solflare", name: "Solflare", url: "https://solflare.com", get: () => window.solflare?.isSolflare ? window.solflare : null },
    { key: "backpack", name: "Backpack", url: "https://backpack.app", get: () => window.backpack?.solana || null },
  ];

  const W = {
    state: { connected: false, type: null, address: null, name: null, gate: { status: "idle", held: 0 } },

    init() {
      window.addEventListener("eip6963:announceProvider", (e) => {
        const { info, provider } = e.detail || {};
        if (info && provider) evm.set(info.rdns || info.uuid, { info, provider });
      });
      window.dispatchEvent(new Event("eip6963:requestProvider"));
      setTimeout(W.restore, 400);
    },

    /** Wallet options for the picker, limited to the active network types. */
    options() {
      const types = new Set(Chain.list().map((n) => n.type)), out = []; // wallets that can hold $GMW
      if (types.has("evm")) {
        const list = [...evm.values()];
        if (!list.length && window.ethereum) list.push({ info: { name: "Browser Wallet", rdns: "injected", icon: "" }, provider: window.ethereum });
        list.forEach((w) => out.push({ type: "evm", key: w.info.rdns || "injected", name: w.info.name, icon: w.info.icon, installed: true }));
        if (!list.length) out.push({ type: "evm", key: "metamask", name: "MetaMask", url: "https://metamask.io", installed: false });
      }
      if (types.has("solana")) SOL.forEach((s) => out.push({ type: "solana", key: s.key, name: s.name, url: s.url, icon: s.get()?.icon || "", installed: !!s.get() }));
      return out;
    },

    async connect(type, key) {
      if (type === "solana") {
        const d = SOL.find((s) => s.key === key), p = d && d.get();
        if (!p) throw new Error(`${d ? d.name : "Solana wallet"} not detected`);
        const r = await p.connect();
        W.set({ type, address: ((r && r.publicKey) || p.publicKey).toString(), name: d.name, key });
      } else {
        const e = evm.get(key) || [...evm.values()][0] || (window.ethereum && { info: { name: "Browser Wallet" }, provider: window.ethereum });
        if (!e) throw new Error("No EVM wallet detected");
        const acc = await e.provider.request({ method: "eth_requestAccounts" });
        W.set({ type, address: acc[0], name: e.info.name, key });
        if (e.provider.on && !e.provider._gmBound) {
          e.provider._gmBound = true;
          e.provider.on("accountsChanged", (a) => a.length ? W.set({ address: a[0] }) : W.disconnect());
        }
      }
    },

    async restore() {
      let s; try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch {}
      if (!s) return;
      try {
        if (s.type === "solana") {
          const d = SOL.find((x) => x.key === s.key), p = d && d.get();
          if (!p) return;
          const r = await p.connect({ onlyIfTrusted: true });
          const pk = (r && r.publicKey) || p.publicKey;
          if (pk) W.set({ type: "solana", address: pk.toString(), name: d.name, key: s.key });
        } else {
          const e = evm.get(s.key) || [...evm.values()][0] || (window.ethereum && { info: { name: "Browser Wallet" }, provider: window.ethereum });
          if (!e) return;
          const acc = await e.provider.request({ method: "eth_accounts" });
          if (acc.length) W.set({ type: "evm", address: acc[0], name: e.info.name, key: s.key });
        }
      } catch {}
    },

    set(patch) {
      Object.assign(W.state, patch, { connected: true });
      try { localStorage.setItem(KEY, JSON.stringify({ type: W.state.type, key: W.state.key })); } catch {}
      W.emit();
      W.checkGate();
    },

    async disconnect() {
      try { if (W.state.type === "solana") SOL.find((s) => s.key === W.state.key)?.get()?.disconnect?.(); } catch {}
      W.state = { connected: false, type: null, address: null, name: null, gate: { status: "idle", held: 0 } };
      try { localStorage.removeItem(KEY); } catch {}
      W.emit();
    },

    /**
     * Gate status: idle | off | tba (CA not set) | checking | locked | open | error
     * GMW is summed across every CA network matching the connected wallet type.
     */
    async checkGate() {
      const s = W.state, g = CFG.gate;
      if (!g.enabled) { s.gate = { status: "off", held: 0 }; return W.emit(); }
      if (!s.connected) { s.gate = { status: "idle", held: 0 }; return W.emit(); }
      const nets = Chain.caNetsFor(s.type).filter((n) => Chain.tokenAddress(n.id));
      if (!nets.length) { s.gate = { status: "tba", held: 0 }; return W.emit(); }
      s.gate = { status: "checking", held: 0 }; W.emit();
      const addr = s.address;
      try {
        const parts = await Promise.all(nets.map(async (n) => ({ net: n.id, amount: Number(await Chain.gmBalance(n.id, addr)) })));
        if (addr !== W.state.address) return;
        const held = parts.reduce((t, p) => t + p.amount, 0);
        s.gate = { status: held >= g.minHolding ? "open" : "locked", held, parts };
      } catch (e) { s.gate = { status: "error", held: 0, error: e.message }; }
      W.emit();
    },

    canMulti() { const st = W.state.gate.status; return st === "open" || st === "off"; },

    emit() { window.dispatchEvent(new CustomEvent("wallet:change", { detail: W.state })); },
  };

  window.Wallet = W;
})();
