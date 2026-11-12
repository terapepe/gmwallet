/* GM Wallet — networks, RPC and live balance reads (no libraries, no demo data). */
(function () {
  const CFG = window.GM_CONFIG;
  const SPL = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
  const SPL22 = "TokenzQdBNbLqP5VEhdkAS6EjFLtWQLPPHDXq5GRMVw";
  const RE_EVM = /^0x[a-fA-F0-9]{40}$/;
  const RE_SOL = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  const Chain = {
    isSingle() { return CFG.mode !== "multi"; },

    /** Active networks: single → 1, multi → all (ordered by multiOrder). */
    list() {
      if (Chain.isSingle()) return [Chain.get(CFG.networks[CFG.singleNetwork] ? CFG.singleNetwork : Object.keys(CFG.networks)[0])];
      return [...new Set([...(CFG.multiOrder || []), ...Object.keys(CFG.networks)])].filter((id) => CFG.networks[id]).map(Chain.get);
    },
    get(id) { const n = CFG.networks[id]; return n ? { id, ...n } : null; },

    tokenAddress(id) {
      const n = CFG.networks[id];
      if (!n) return "";
      return (n.ca || (n.type === "solana" ? CFG.token.sol : CFG.token.address) || "").trim();
    },
    /** Networks sharing the same CA grouped together (multi: Robinhood/Base/BSC + Solana). */
    caGroups() {
      return Chain.list().reduce((acc, n) => {
        const ca = Chain.tokenAddress(n.id);
        const key = ca ? ca.toLowerCase() : "tba-" + n.type;
        const g = acc.find((x) => x.key === key);
        g ? g.nets.push(n) : acc.push({ key, ca, nets: [n] });
        return acc;
      }, []);
    },
    caLive() { return Chain.list().some((n) => Chain.tokenAddress(n.id)); },

    addrType(a) {
      a = (a || "").trim();
      if (RE_EVM.test(a)) return "evm";
      if (RE_SOL.test(a)) return "solana";
      return null;
    },
    /** Active networks that can hold this address type. */
    netsFor(type) { return Chain.list().filter((n) => n.type === type); },

    explorerAddr(id, a) { const n = CFG.networks[id]; return n.explorer + (n.explorerAddr || "/address/") + a; },
    explorerToken(id, a) { const n = CFG.networks[id]; return n.explorer + (n.explorerToken || "/token/") + a; },

    /** JSON-RPC with fail-over across rpcUrls. */
    async rpc(id, method, params) {
      const urls = CFG.networks[id].rpcUrls;
      let err;
      for (const url of urls) {
        try {
          const res = await fetch(url, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
          });
          if (!res.ok) throw new Error("HTTP " + res.status);
          const j = await res.json();
          if (j.error) throw new Error(j.error.message || "RPC error");
          return j.result;
        } catch (e) { err = e; }
      }
      throw err || new Error("RPC unreachable");
    },

    /** Raw integer (string/BigInt/hex) → decimal string. */
    format(raw, dec) {
      const b = BigInt(raw || 0), d = 10n ** BigInt(dec);
      const f = (b % d).toString().padStart(dec, "0").replace(/0+$/, "");
      return (b / d).toString() + (f ? "." + f : "");
    },

    async erc20Balance(id, token, owner) {
      const data = "0x70a08231" + owner.toLowerCase().replace(/^0x/, "").padStart(64, "0");
      const r = await Chain.rpc(id, "eth_call", [{ to: token, data }, "latest"]);
      return r && r !== "0x" ? BigInt(r) : 0n;
    },
    async erc20Decimals(id, token) {
      try { return Number(BigInt(await Chain.rpc(id, "eth_call", [{ to: token, data: "0x313ce567" }, "latest"]))); }
      catch { return 18; }
    },

    /** GM balance (number of whole tokens as decimal string) or null if CA not set. */
    async gmBalance(id, owner) {
      const n = CFG.networks[id], ca = Chain.tokenAddress(id);
      if (!ca) return null;
      if (n.type === "solana") {
        const r = await Chain.rpc(id, "getTokenAccountsByOwner", [owner, { mint: ca }, { encoding: "jsonParsed" }]);
        let raw = 0n, dec = 0;
        for (const a of r.value || []) { const t = a.account.data.parsed.info.tokenAmount; raw += BigInt(t.amount); dec = t.decimals; }
        return Chain.format(raw, dec);
      }
      const [raw, dec] = await Promise.all([Chain.erc20Balance(id, ca, owner), Chain.erc20Decimals(id, ca)]);
      return Chain.format(raw, dec);
    },

    /* ---------- prices (DexScreener) ---------- */
    _priceCache: new Map(),
    async prices(chain, addrs) {
      const out = {}, need = [];
      for (const a of addrs) {
        const k = chain + ":" + a.toLowerCase();
        if (Chain._priceCache.has(k)) out[a.toLowerCase()] = Chain._priceCache.get(k);
        else need.push(a);
      }
      for (let i = 0; i < need.length; i += 30) {
        const chunk = need.slice(i, i + 30);
        try {
          const res = await fetch(`${CFG.prices.dexscreener}/${chain}/${chunk.join(",")}`);
          const pairs = res.ok ? await res.json() : [];
          const best = {};
          for (const p of Array.isArray(pairs) ? pairs : []) {
            const k = (p.baseToken?.address || "").toLowerCase(), liq = p.liquidity?.usd || 0;
            if (!k || !p.priceUsd) continue;
            if (!best[k] || liq > best[k].liq) best[k] = { liq, price: Number(p.priceUsd), symbol: p.baseToken.symbol, name: p.baseToken.name };
          }
          for (const a of chunk) {
            const k = a.toLowerCase(), v = best[k] || null;
            Chain._priceCache.set(chain + ":" + k, v);
            out[k] = v;
          }
        } catch { /* prices are best-effort */ }
      }
      return out;
    },

    /* ---------- full wallet snapshot on one network ---------- */
    async portfolio(id, address, log = () => {}) {
      const n = Chain.get(id), gmCa = Chain.tokenAddress(id).toLowerCase();
      const out = { net: id, address, native: null, tokens: [], gm: null, totalUsd: 0, errors: [] };
      const dec = n.native.decimals;

      // 1) native
      try {
        log(`${n.short}: native ${n.native.symbol} balance`);
        const raw = n.type === "solana"
          ? BigInt((await Chain.rpc(id, "getBalance", [address])).value)
          : BigInt(await Chain.rpc(id, "eth_getBalance", [address, "latest"]));
        out.native = { symbol: n.native.symbol, name: n.native.name, amount: Chain.format(raw, dec), native: true };
      } catch (e) { out.errors.push(`native: ${e.message}`); }

      // 2) tokens
      try {
        log(`${n.short}: token holdings`);
        if (n.type === "solana") {
          const map = new Map();
          for (const programId of [SPL, SPL22]) {
            const r = await Chain.rpc(id, "getTokenAccountsByOwner", [address, { programId }, { encoding: "jsonParsed" }]);
            for (const a of r.value || []) {
              const info = a.account.data.parsed.info, t = info.tokenAmount;
              if (t.amount === "0") continue;
              const cur = map.get(info.mint) || { address: info.mint, raw: 0n, decimals: t.decimals };
              cur.raw += BigInt(t.amount); map.set(info.mint, cur);
            }
          }
          out.tokens = [...map.values()].map((t) => ({ address: t.address, symbol: "", name: "", amount: Chain.format(t.raw, t.decimals) }));
        } else if (n.tokenApi?.type === "blockscout") {
          const res = await fetch(`${n.tokenApi.url}/api/v2/addresses/${address}/tokens?type=ERC-20`);
          if (res.status === 404) out.tokens = [];
          else {
            if (!res.ok) throw new Error("indexer HTTP " + res.status);
            const j = await res.json();
            out.tokens = (j.items || []).filter((it) => it.value && it.value !== "0").map((it) => {
              const t = it.token || {};
              return {
                address: t.address_hash || t.address || "", symbol: t.symbol || "", name: t.name || "",
                amount: Chain.format(it.value, Number(t.decimals || 0)),
                indexerPrice: t.exchange_rate ? Number(t.exchange_rate) : null,
              };
            });
          }
        } else {
          const list = [...(n.tokens || [])];
          const rows = await Promise.all(list.map(async (t) => {
            try { return { ...t, raw: await Chain.erc20Balance(id, t.address, address) }; } catch { return null; }
          }));
          out.tokens = rows.filter((t) => t && t.raw > 0n).map((t) => ({ address: t.address, symbol: t.symbol, name: t.name, amount: Chain.format(t.raw, t.decimals) }));
        }
      } catch (e) { out.errors.push(`tokens: ${e.message}`); }

      // 3) GM (always read directly so it shows even when the indexer misses it)
      if (gmCa) {
        try {
          log(`${n.short}: ${CFG.token.symbol} balance`);
          const amt = await Chain.gmBalance(id, address);
          out.tokens = out.tokens.filter((t) => t.address.toLowerCase() !== gmCa);
          out.gm = { address: Chain.tokenAddress(id), symbol: CFG.token.symbol, name: CFG.token.name, amount: amt, gm: true };
        } catch (e) { out.errors.push(`${CFG.token.symbol}: ${e.message}`); }
      }

      // 4) prices
      log(`${n.short}: live prices`);
      const all = [...out.tokens, ...(out.gm ? [out.gm] : [])];
      const px = all.length ? await Chain.prices(n.dexChain, all.map((t) => t.address)) : {};
      for (const t of all) {
        const p = px[t.address.toLowerCase()];
        if (p) { t.price = p.price; t.symbol = t.symbol || p.symbol; t.name = t.name || p.name; }
        else if (t.indexerPrice) t.price = t.indexerPrice;
        t.usd = t.price != null ? Number(t.amount) * t.price : null;
      }
      if (out.native && n.nativePrice) {
        const p = (await Chain.prices(n.nativePrice.chain, [n.nativePrice.address]))[n.nativePrice.address.toLowerCase()];
        out.native.price = p ? p.price : null;
        out.native.usd = p ? Number(out.native.amount) * p.price : null;
      }
      out.tokens.sort((a, b) => (b.usd || 0) - (a.usd || 0));
      out.totalUsd = [out.native, out.gm, ...out.tokens].reduce((s, t) => s + ((t && t.usd) || 0), 0);
      return out;
    },

    /** Snapshot of one wallet across every active network it can live on. */
    async scan(address, netIds, log) {
      const type = Chain.addrType(address);
      if (!type) throw new Error("Not a valid EVM or Solana address");
      const nets = Chain.netsFor(type).filter((n) => !netIds || netIds.includes(n.id));
      const results = await Promise.all(nets.map((n) => Chain.portfolio(n.id, address, log).catch((e) => ({ net: n.id, address, native: null, tokens: [], gm: null, totalUsd: 0, errors: [e.message] }))));
      const gm = results.reduce((s, r) => s + (r.gm ? Number(r.gm.amount) : 0), 0);
      return { address, type, results, totalUsd: results.reduce((s, r) => s + r.totalUsd, 0), gm, gmKnown: results.some((r) => r.gm) };
    },
  };

  window.Chain = Chain;
})();
