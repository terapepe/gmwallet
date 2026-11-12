/* GM Wallet — views: overview, single check, multi check, docs. */
(function () {
  const CFG = window.GM_CONFIG;
  const { $, $$, esc } = UI;
  const SYM = CFG.token.symbol;
  const MIN = CFG.gate.minHolding;

  /* ================= shared result rendering ================= */

  function level(usd, total) {
    if (!usd || !total) return 0;
    const s = usd / total;
    return s > 0.5 ? 3 : s > 0.1 ? 2 : 1;
  }

  function row(n, t, total) {
    const priced = t.usd != null;
    const link = t.address ? Chain.explorerToken(n.id, t.address) : Chain.explorerAddr(n.id, "");
    return `<div class="row${t.gm ? " gm" : ""}${t.native ? " native" : ""}">
      ${UI.bars(level(t.usd, total))}
      <span class="r-sym">${esc((t.symbol || UI.short(t.address, 3)).slice(0, 12))}</span>
      <span class="r-st ${priced ? "ok" : ""}" title="${priced ? "Live price" : "No price found"}"></span>
      <span class="r-name">${t.address && !t.native ? `<a href="${esc(link)}" target="_blank" rel="noopener">${esc(t.name || t.symbol || t.address)}</a>` : esc(t.name || t.symbol)}
        ${t.gm ? `<span class="tag gm-tag">$${esc(SYM)}</span>` : ""}${t.native ? `<span class="tag">native</span>` : ""}</span>
      <span class="r-amt" title="${esc(t.amount)}">${UI.amt(t.amount)}</span>
      <span class="r-usd">${UI.usd(t.usd)}</span>
    </div>`;
  }

  function netGroup(r, showAll) {
    const n = Chain.get(r.net);
    const list = [r.native, r.gm, ...r.tokens].filter(Boolean);
    const visible = list.filter((t) => showAll || t.native || t.gm || t.usd != null);
    const hidden = list.length - visible.length;
    return `<div class="group" style="--c:${n.color}">
      <div class="g-head">
        ${UI.netIcon(n, 18)}<span class="g-name">${esc(n.name)}</span>
        <span class="g-count"><span class="tri">▲</span> ${list.length}</span>
        <a class="g-link" href="${esc(Chain.explorerAddr(n.id, r.address))}" target="_blank" rel="noopener">explorer ↗</a>
        <span class="g-total">${UI.usd(r.totalUsd)}</span>
      </div>
      ${visible.map((t) => row(n, t, r.totalUsd)).join("") || `<div class="row empty">no assets found</div>`}
      ${hidden ? `<button class="row more" data-showall>+ ${hidden} unpriced token${hidden > 1 ? "s" : ""} hidden (possible spam) — show</button>` : ""}
      ${r.errors.length ? `<div class="row err">! ${esc(r.errors.join(" · "))}</div>` : ""}
    </div>`;
  }

  function walletSummary(s) {
    const gmLine = s.gmKnown ? `${UI.amt(s.gm)} ${esc(SYM)}` : `<span class="muted">CA TBA</span>`;
    return `<div class="summary">
      <div class="s-cell wide"><span class="lbl">wallet</span>
        <span class="val addr"><code>${esc(s.address)}</code><button class="btn xs" data-copy="${esc(s.address)}">copy</button></span></div>
      <div class="s-cell"><span class="lbl">total value</span><span class="val big">${s.results.every((r) => !r.native && r.errors.length) ? `<span class="err-t">unavailable</span>` : UI.usd(s.totalUsd)}</span></div>
      <div class="s-cell"><span class="lbl">$${esc(SYM)} held</span><span class="val">${gmLine}</span></div>
      <div class="s-cell"><span class="lbl">networks</span><span class="val">${s.results.map((r) => UI.netIcon(Chain.get(r.net), 16)).join(" ")}</span></div>
    </div>`;
  }

  function renderScan(box, s) {
    let showAll = false;
    const draw = () => {
      box.innerHTML = walletSummary(s) + s.results.map((r) => netGroup(r, showAll)).join("") +
        `<p class="note">Prices: DexScreener (highest-liquidity pair). Tokens without a market price are hidden by default because most of them are airdropped spam. Values are estimates, not financial advice.</p>`;
      $$("[data-showall]", box).forEach((b) => b.onclick = () => { showAll = true; draw(); });
    };
    draw();
  }

  function logger(box) {
    box.innerHTML = `<div class="term-log"></div>`;
    const el = $(".term-log", box);
    return (msg, cls = "") => {
      const l = document.createElement("div");
      l.className = "ll " + cls; l.textContent = "> " + msg;
      el.appendChild(l); el.scrollTop = el.scrollHeight;
    };
  }

  const netNames = (type) => Chain.netsFor(type).filter((n) => App.selectedIds().includes(n.id)).map((n) => n.short).join(", ");

  /* ================= overview ================= */

  function home(v) {
    const nets = Chain.checkList(), single = Chain.isSingle(), n0 = Chain.list()[0];
    App.setTitle("Overview", nets.length + " networks");
    v.innerHTML = `
      ${single ? `<div class="net-banner">${UI.netIcon(n0, 22)}<div><b>${esc(n0.name)}</b> edition<span class="muted"> · ${esc(n0.tagline)}${n0.chainId ? " · chain id " + n0.chainId : ""}</span></div></div>` : ""}

      <section class="hero">
        <div class="term">
          <div class="term-bar"><span class="dots"><i></i><i></i><i></i></span><span>gm@wallet: ~</span></div>
          <div class="term-body" id="boot"></div>
        </div>
        <div class="hero-copy">
          <img class="hero-logo" src="assets/logo.svg" alt="" width="64" height="64">
          <h2>${esc(CFG.brand.tagline)}</h2>
          <p class="lead">${esc(CFG.brand.description)} Checks ${nets.map((n) => esc(n.name)).join(", ").replace(/, ([^,]*)$/, " and $1")} in one go. Built for the <b>$${esc(SYM)}</b> community.</p>
          <form class="qform" id="qform">
            <span class="pr">$</span>
            <input id="qaddr" placeholder="paste a 0x… or Solana wallet address" autocomplete="off" spellcheck="false">
            <button class="btn primary">Check</button>
          </form>
          <div class="hero-links">
            <a href="#/multi">Multi check →</a><a href="#/docs">Read the docs →</a>
            <a href="${esc(CFG.social.x)}" target="_blank" rel="noopener">${UI.xIcon} ${esc(CFG.social.xHandle)}</a>
          </div>
        </div>
      </section>

      <section class="block">
        <h3><span class="h-pr">01</span> Contract address</h3>
        <p class="muted">${single ? `$${esc(SYM)} lives on ${esc(n0.name)}.` : `One CA for every EVM network (Robinhood, Base, BSC) and a separate mint on Solana.`} Always verify the CA here or on ${esc(CFG.social.xHandle)} before you trade.</p>
        <div class="ca-grid">${UI.caBlock("card")}</div>
      </section>

      <section class="block">
        <h3><span class="h-pr">02</span> What you get</h3>
        <div class="features">
          ${[
            ["$", "Single check", `Any wallet, any time. Free for everyone — no ${SYM} needed.`],
            ["#", "Multi check", `Up to ${CFG.limits.maxWallets} wallets in one run. For holders of ${UI.amt(MIN)} $${SYM}.`],
            ["◎", "Multi-chain", `${nets.map((n) => n.short).join(", ")} in one view. One 0x address is checked on every EVM chain at once.`],
            ["$", "Live USD value", "Prices from DexScreener, picked from the most liquid pair."],
            ["⛨", "Read-only & private", "No sign-ups, no signatures, no keys. Everything runs in your browser."],
            ["⇩", "CSV export", "Export multi-check results for spreadsheets, airdrops or tax notes."],
          ].map(([i, t, d]) => `<div class="feat"><span class="fi">${i}</span><b>${esc(t)}</b><p>${esc(d)}</p></div>`).join("")}
        </div>
      </section>

      <section class="block">
        <h3><span class="h-pr">03</span> How it works</h3>
        <ol class="steps">
          <li><b>Paste</b> a public wallet address — never a seed phrase or private key.</li>
          <li><b>Press check.</b> GM Wallet reads balances straight from public RPC nodes and explorers.</li>
          <li><b>Read</b> native coin, $${esc(SYM)} and token holdings with USD values, grouped by network.</li>
        </ol>
      </section>

      <section class="block">
        <h3><span class="h-pr">04</span> Access</h3>
        <div class="tiers">
          <div class="tier"><div class="t-h">Everyone <span class="tag">free</span></div>
            <ul><li>Single wallet check</li><li>All active networks</li><li>Live prices</li><li>Shareable result link</li></ul></div>
          <div class="tier hot"><div class="t-h">${esc(SYM)} holder <span class="tag gm-tag">≥ ${UI.amt(MIN)} ${esc(SYM)}</span></div>
            <ul><li>Everything in Free</li><li>Multi check — up to ${CFG.limits.maxWallets} wallets</li><li>Portfolio totals across wallets</li><li>CSV export</li></ul></div>
        </div>
      </section>

      <section class="block">
        <h3><span class="h-pr">05</span> Networks</h3>
        <div class="nets">
          ${nets.map((n) => `<div class="net-card" style="--c:${n.color};--c2:${n.color2 || n.color}">
            <div class="nc-h">${UI.netIcon(n, 26)}<div><b>${esc(n.name)}</b><span class="muted small">${esc(n.tagline)}</span></div></div>
            <dl><dt>type</dt><dd>${n.type === "solana" ? "SVM" : "EVM"}${n.chainId ? " · " + n.chainId : ""}</dd>
            <dt>native</dt><dd>${esc(n.native.symbol)}</dd>
            <dt>tokens</dt><dd>${n.type === "solana" ? "all SPL + Token-2022" : n.tokenApi ? "all ERC-20 (Blockscout)" : (n.tokens || []).length ? "major tokens (on-chain)" : "native only"}</dd>
            <dt>explorer</dt><dd><a href="${esc(n.explorer)}" target="_blank" rel="noopener">${esc(n.explorer.replace(/^https?:\/\//, ""))}</a></dd></dl>
          </div>`).join("")}
        </div>
      </section>

      ${(CFG.comingSoon || []).length ? `<section class="block">
        <h3><span class="h-pr">06</span> Coming soon</h3>
        <div class="soon-grid">${CFG.comingSoon.map(soonCard).join("")}</div>
      </section>` : ""}

      <section class="block cta">
        <div><b>gm.</b> Follow ${esc(CFG.social.xHandle)} for the CA, updates and new networks.</div>
        <a class="btn primary" href="${esc(CFG.social.x)}" target="_blank" rel="noopener">${UI.xIcon} Follow on X</a>
      </section>`;

    $("#qform").onsubmit = (e) => { e.preventDefault(); const a = $("#qaddr").value.trim(); if (a) location.hash = "#/check/" + encodeURIComponent(a); };
    boot($("#boot"), nets);
  }

  function boot(el, nets) {
    const lines = [
      ["$ gm --version", ""], [`${CFG.brand.name} v1.0 · token $${SYM}`, "dim"],
      [`$ gm networks`, ""],
      ...nets.map((n) => [`  ✓ ${n.name.padEnd(16)} ${n.type === "solana" ? "svm" : "evm:" + n.chainId}`, "ok"]),
      [`$ gm ca --mode ${CFG.mode}`, ""], ...Chain.list().map((n) => [`  ${n.short.padEnd(10)} ${Chain.tokenAddress(n.id) ? UI.short(Chain.tokenAddress(n.id), 6) : "TBA"}`, "dim"]),
      [`$ gm access`, ""], ["  single check ........ free", "dim"], [`  multi check ......... ≥ ${UI.amt(MIN)} ${SYM}`, "dim"],
      ["$ gm", ""], ["gm ☀  ready.", "ok"],
    ];
    let i = 0;
    const tick = () => {
      if (!document.body.contains(el) || i >= lines.length) { if (document.body.contains(el)) el.insertAdjacentHTML("beforeend", `<span class="cursor">█</span>`); return; }
      const [t, c] = lines[i++];
      el.insertAdjacentHTML("beforeend", `<div class="${c}">${esc(t)}</div>`);
      setTimeout(tick, t.startsWith("$") ? 260 : 90);
    };
    tick();
  }

  /* ================= single check ================= */

  function check(v, arg) {
    App.setTitle("Single check", "");
    v.innerHTML = `
      <form class="check-form" id="cform">
        <span class="pr">$ gm check</span>
        <input id="addr" value="${esc(arg)}" placeholder="0x… (EVM) or Solana address" autocomplete="off" spellcheck="false">
        <button class="btn primary">Check</button>
      </form>
      <p class="hint" id="hint"></p>
      <div id="out"></div>`;
    const hint = () => {
      const a = $("#addr").value.trim(), t = Chain.addrType(a);
      $("#hint").innerHTML = !a ? `Free · no $${esc(SYM)} required · press <kbd>/</kbd> anywhere to jump here`
        : !t ? `<span class="err-t">not a valid address</span>`
        : !Chain.netsFor(t).length ? `<span class="err-t">${t === "solana" ? "Solana" : "EVM"} addresses are not supported</span>`
        : `${t === "solana" ? "Solana" : "EVM"} address → will check: ${esc(netNames(t) || "—")}`;
    };
    $("#addr").oninput = hint; hint();
    $("#cform").onsubmit = (e) => {
      e.preventDefault();
      const a = $("#addr").value.trim();
      if (!a) return;
      if (location.hash !== "#/check/" + encodeURIComponent(a)) location.hash = "#/check/" + encodeURIComponent(a);
      else run(a);
    };
    const onNets = () => { if (App.route === "check" && $("#addr")) { hint(); if (arg) run(arg); } };
    window.addEventListener("nets:change", onNets, { once: true });
    if (arg) run(arg);

    async function run(a) {
      const out = $("#out"), t = Chain.addrType(a);
      if (!t) { out.innerHTML = `<div class="callout err">! "${esc(UI.short(a, 8))}" is not a valid EVM or Solana address.</div>`; return; }
      const ids = App.selectedIds().filter((id) => Chain.get(id).type === t);
      if (!ids.length) { out.innerHTML = `<div class="callout err">! No active ${t === "solana" ? "Solana" : "EVM"} network selected for this address.</div>`; return; }
      const log = logger(out);
      log(`scanning ${UI.short(a, 6)} on ${ids.length} network${ids.length > 1 ? "s" : ""}`);
      try {
        const s = await Chain.scan(a, ids, (m) => log(m, "dim"));
        if ($("#addr")?.value.trim() !== a) return;
        App.addRecent(a);
        App.setTitle("Single check", s.results.reduce((c, r) => c + [r.native, r.gm, ...r.tokens].filter(Boolean).length, 0) + " assets");
        renderScan(out, s);
      } catch (e) { log("error: " + e.message, "err"); }
    }
  }

  /* ================= multi check ================= */

  function gatePanel() {
    const s = Wallet.state, g = s.gate;
    const need = `${UI.amt(MIN)} $${esc(SYM)}`;
    const body = {
      idle: `<p>Multi check is for $${esc(SYM)} holders. Connect the wallet that holds at least <b>${need}</b>.</p><button class="btn primary" id="gConnect">Connect wallet</button>`,
      tba: `<p>The $${esc(SYM)} contract is not live yet, so holdings can't be verified. Multi check unlocks after launch — watch <a href="${esc(CFG.social.x)}" target="_blank" rel="noopener">${esc(CFG.social.xHandle)}</a>.</p>`,
      checking: `<p class="blink">> verifying $${esc(SYM)} balance of ${esc(UI.short(s.address))}…</p>`,
      locked: `<p>${esc(UI.short(s.address))} holds <b>${UI.amt(g.held)} $${esc(SYM)}</b>. You need <b>${need}</b>.</p>
        <div class="progress"><i style="width:${Math.min(100, (g.held / MIN) * 100).toFixed(1)}%"></i></div>
        <p class="muted small">${(g.parts || []).map((p) => `${esc(Chain.get(p.net).short)}: ${UI.amt(p.amount)}`).join(" · ")}</p>
        <button class="btn" id="gRecheck">Re-check</button> <button class="btn" id="gSwitch">Use another wallet</button>`,
      error: `<p class="err-t">Could not read your balance: ${esc(g.error || "")}</p><button class="btn" id="gRecheck">Retry</button>`,
    }[g.status] || "";
    return `<div class="gate"><div class="gate-h"><span class="lock-big">🔒</span> Holder access</div>${body}</div>`;
  }

  function multi(v) {
    const max = CFG.limits.maxWallets;
    const draw = () => {
      if (App.route !== "multi") return window.removeEventListener("gate:change", draw);
      const open = Wallet.canMulti();
      App.setTitle("Multi check", "");
      const keep = $("#mlist")?.value || "";
      v.innerHTML = `
        ${open ? `<div class="callout ok">✓ Holder access${Wallet.state.gate.status === "open" ? ` · ${esc(UI.short(Wallet.state.address))} holds ${UI.amt(Wallet.state.gate.held)} $${esc(SYM)}` : ""}</div>` : gatePanel()}
        <div class="multi${open ? "" : " locked"}">
          <label class="lbl" for="mlist">wallets — one per line, EVM and Solana can be mixed (max ${max})</label>
          <textarea id="mlist" rows="7" spellcheck="false" ${open ? "" : "disabled"} placeholder="0x…&#10;0x…&#10;So1ana…">${esc(keep)}</textarea>
          <div class="m-bar">
            <span id="mcount" class="muted small"></span>
            <button class="btn primary" id="mrun" ${open ? "" : "disabled"}>Check all</button>
          </div>
        </div>
        <div id="mout"></div>`;
      const count = () => {
        const { ok, bad } = parse($("#mlist").value);
        $("#mcount").innerHTML = `${ok.length} valid${bad.length ? ` · <span class="err-t">${bad.length} invalid</span>` : ""}${ok.length > max ? ` · <span class="err-t">max ${max}</span>` : ""}`;
      };
      $("#mlist").oninput = count; count();
      $("#mrun").onclick = () => runMulti();
      $("#gConnect") && ($("#gConnect").onclick = App.openWallets);
      $("#gRecheck") && ($("#gRecheck").onclick = () => Wallet.checkGate());
      $("#gSwitch") && ($("#gSwitch").onclick = async () => { await Wallet.disconnect(); App.openWallets(); });
    };
    window.addEventListener("gate:change", draw);
    draw();
  }

  function parse(text) {
    const items = [...new Set(text.split(/[\s,;]+/).map((x) => x.trim()).filter(Boolean))];
    const ok = [], bad = [];
    for (const a of items) {
      const t = Chain.addrType(a);
      (t && Chain.netsFor(t).length ? ok : bad).push(a);
    }
    return { ok, bad };
  }

  async function runMulti() {
    if (!Wallet.canMulti()) return;
    const { ok } = parse($("#mlist").value);
    const list = ok.slice(0, CFG.limits.maxWallets);
    if (!list.length) return UI.toast("add at least one valid address");
    const out = $("#mout"), ids = App.selectedIds(), results = new Array(list.length);
    $("#mrun").disabled = true;
    out.innerHTML = `<div class="m-progress"><span id="mp">0 / ${list.length}</span><div class="progress"><i id="mpb" style="width:0"></i></div></div><div class="m-table" id="mtable"></div>`;
    let done = 0, next = 0;
    const worker = async () => {
      while (next < list.length) {
        const i = next++;
        try { results[i] = await Chain.scan(list[i], ids); }
        catch (e) { results[i] = { address: list[i], error: e.message, results: [], totalUsd: 0, gm: 0 }; }
        done++;
        $("#mp") && ($("#mp").textContent = `${done} / ${list.length}`);
        $("#mpb") && ($("#mpb").style.width = (done / list.length) * 100 + "%");
        drawTable(results);
      }
    };
    await Promise.all(Array.from({ length: Math.min(CFG.limits.concurrency, list.length) }, worker));
    $("#mrun") && ($("#mrun").disabled = false);
    App.setTitle("Multi check", list.length + " wallets");
    drawTable(results, true);
  }

  function drawTable(results, final) {
    const box = $("#mtable");
    if (!box) return;
    const rows = results.map((s, i) => ({ s, i })).filter((x) => x.s);
    const tot = rows.reduce((t, { s }) => t + (s.totalUsd || 0), 0);
    const gm = rows.reduce((t, { s }) => t + (s.gm || 0), 0);
    const nets = Chain.checkList().filter((n) => App.selectedIds().includes(n.id));
    box.style.setProperty("--nn", nets.length);
    box.innerHTML = `
      <div class="summary">
        <div class="s-cell"><span class="lbl">wallets</span><span class="val big">${rows.length}</span></div>
        <div class="s-cell"><span class="lbl">combined value</span><span class="val big">${UI.usd(tot)}</span></div>
        <div class="s-cell"><span class="lbl">combined $${esc(SYM)}</span><span class="val">${Chain.caLive() ? UI.amt(gm) : `<span class="muted">CA TBA</span>`}</span></div>
        <div class="s-cell"><span class="lbl">export</span><span class="val">${final ? `<button class="btn xs" id="csv">CSV ⇩</button> <button class="btn xs" id="cpy">copy summary</button>` : `<span class="muted">running…</span>`}</span></div>
      </div>
      <div class="mt-head"><span>#</span><span>wallet</span>${nets.map((n) => `<span class="mt-n">${UI.netIcon(n, 14)}</span>`).join("")}<span>${esc(SYM)}</span><span class="r">value</span></div>
      ${rows.map(({ s, i }) => `
        <details class="mt-row">
          <summary><span class="muted">${i + 1}</span><span class="mono-w">${esc(UI.short(s.address, 6))}</span>
            ${nets.map((n) => { const r = s.results.find((x) => x.net === n.id); return `<span class="mt-n">${r ? (r.errors.length ? `<span class="err-t" title="${esc(r.errors.join(" · "))}">!</span>` : UI.usd(r.totalUsd)) : `<span class="muted">·</span>`}</span>`; }).join("")}
            <span>${s.error ? "" : UI.amt(s.gm)}</span><span class="r">${s.error ? `<span class="err-t">${esc(s.error)}</span>` : UI.usd(s.totalUsd)}</span></summary>
          <div class="mt-detail"></div>
        </details>`).join("")}`;
    $$(".mt-row", box).forEach((d, k) => d.addEventListener("toggle", () => {
      const s = rows[k].s;
      if (d.open && !s.error) renderScan($(".mt-detail", d), s);
    }));
    if (final) {
      $("#csv").onclick = () => csv(rows.map((x) => x.s));
      $("#cpy").onclick = () => UI.copy(rows.map(({ s }) => `${s.address}\t${(s.totalUsd || 0).toFixed(2)} USD\t${s.gm || 0} ${SYM}`).join("\n") + `\nTOTAL\t${tot.toFixed(2)} USD\t${gm} ${SYM}`, "summary copied");
    }
  }

  function csv(scans) {
    const q = (x) => `"${String(x ?? "").replace(/"/g, '""')}"`;
    const lines = [["wallet", "network", "symbol", "name", "token_address", "amount", "price_usd", "value_usd"].join(",")];
    for (const s of scans) for (const r of s.results || []) {
      for (const t of [r.native, r.gm, ...r.tokens].filter(Boolean)) {
        lines.push([s.address, Chain.get(r.net).name, t.symbol, t.name, t.native ? "native" : t.address, t.amount, t.price ?? "", t.usd != null ? t.usd.toFixed(2) : ""].map(q).join(","));
      }
    }
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `gmwallet-multi-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ================= docs ================= */

  function docs(v, arg) {
    App.setTitle("Docs", "");
    const nets = Chain.checkList(), cas = Chain.list();
    const S = [
      ["intro", "Introduction", `
        <p><b>${esc(CFG.brand.name)}</b> is a read-only wallet balance checker for ${nets.map((n) => esc(n.name)).join(", ")}. Paste any public wallet address and see its native coin, $${esc(SYM)} and token holdings with live USD values — grouped by network, in one terminal-style screen.</p>
        <p>No account, no email, no signatures. ${esc(CFG.brand.name)} runs entirely in your browser and reads public blockchain data.</p>`],
      ["token", `The $${esc(SYM)} token`, `
        <p><b>$${esc(SYM)}</b> (${esc(CFG.token.name)}) is the community token behind ${esc(CFG.brand.name)}. Holding it unlocks power-user features — starting with Multi check.</p>
        <table class="kv"><tr><td>Name</td><td>${esc(CFG.token.name)}</td></tr><tr><td>Symbol</td><td>${esc(SYM)}</td></tr>
        <tr><td>Networks</td><td>${cas.map((n) => UI.netIcon(n, 14) + " " + esc(n.short)).join(" &nbsp; ")}</td></tr>
        <tr><td>Multi check access</td><td>≥ ${MIN.toLocaleString("en-US")} ${esc(SYM)}</td></tr></table>
        <div class="ca-grid">${UI.caBlock("card")}</div>
        <p class="note">Only trust the CA shown on this site and on <a href="${esc(CFG.social.x)}" target="_blank" rel="noopener">${esc(CFG.social.xHandle)}</a>. Anyone can deploy a token called "${esc(SYM)}".</p>`],
      ["start", "Quick start", `
        <ol class="steps"><li>Open <a href="#/check">Single check</a> (or press <kbd>/</kbd>).</li>
        <li>Paste a public address — 0x… for EVM or a base58 Solana address.</li>
        <li>Press <b>Check</b>. Results stream in network by network.</li></ol>
        <p>Every result has its own link (<code>#/check/&lt;address&gt;</code>) so you can bookmark or share it.</p>`],
      ["single", "Single check (free)", `
        <p>Single check is free for everyone and does not require holding $${esc(SYM)}.</p>
        <ul><li><b>EVM address</b> (0x…) → checked on every EVM network at once (${esc(Chain.netsFor("evm").map((n) => n.name).join(", "))}).</li>
        <li><b>Solana address</b> → checked on Solana.</li>
        <li>Use the network chips in the top bar to include or exclude networks.</li></ul>`],
      ["multi", "Multi check & holder access", `
        <p>Multi check scans up to <b>${CFG.limits.maxWallets} wallets</b> in one run and shows per-network values, combined totals and a CSV export.</p>
        <p><b>Requirement:</b> the connected wallet must hold at least <b>${MIN.toLocaleString("en-US")} $${esc(SYM)}</b>. Balances are added up across the $${esc(SYM)} networks of the same wallet type (EVM wallets: ${esc(Chain.caNetsFor("evm").map((n) => n.short).join(" + ") || "—")}; Solana wallets: ${esc(Chain.caNetsFor("solana").map((n) => n.short).join(" + ") || "—")}).</p>
        <ol class="steps"><li>Click <b>Connect</b> (top right) and pick your wallet.</li><li>${esc(CFG.brand.name)} reads your $${esc(SYM)} balance — no signature, no transaction.</li>
        <li>Paste wallets (one per line, EVM and Solana can be mixed) and press <b>Check all</b>.</li><li>Click a row to expand its full breakdown. Export with <b>CSV ⇩</b>.</li></ol>`],
      ["networks", "Supported networks", `
        <table class="kv wide"><tr><th>Network</th><th>Type</th><th>Native</th><th>Token coverage</th><th>Explorer</th></tr>
        ${nets.map((n) => `<tr><td>${UI.netIcon(n, 14)} ${esc(n.name)}</td><td>${n.type === "solana" ? "SVM" : "EVM · " + n.chainId}</td><td>${esc(n.native.symbol)}</td>
        <td>${n.type === "solana" ? "All SPL & Token-2022 accounts" : n.tokenApi ? "All ERC-20 via Blockscout" : (n.tokens || []).length ? "Major tokens: " + esc(n.tokens.map((t) => t.symbol).join(", ")) : "Native balance (" + esc(n.native.symbol) + ")"}</td>
        <td><a href="${esc(n.explorer)}" target="_blank" rel="noopener">${esc(n.explorer.replace(/^https?:\/\//, ""))}</a></td></tr>`).join("")}</table>`],
      ["read", "Reading results", `
        <div class="legend">
          <div>${UI.bars(3)} <span>share of the wallet's value on that network (3 bars &gt; 50%, 2 bars &gt; 10%)</span></div>
          <div><span class="r-st ok"></span> <span>live market price found</span></div>
          <div><span class="r-st"></span> <span>no market price — value unknown</span></div>
          <div><span class="tag gm-tag">$${esc(SYM)}</span> <span>your $${esc(SYM)} position, always pinned on top</span></div>
          <div><span class="tag">native</span> <span>gas coin of the network</span></div>
        </div>
        <p>Unpriced tokens are hidden by default — wallets often receive spam airdrops. Click "show" in a network group to reveal them. Never interact with tokens you don't recognise.</p>`],
      ["data", "Data sources", `
        <ul><li><b>Balances:</b> public JSON-RPC nodes of each network.</li>
        <li><b>Token lists:</b> Solana RPC (SPL + Token-2022), Blockscout for Ethereum, Base, Robinhood Chain, Arbitrum and OP, direct on-chain reads for major BSC tokens.</li>
        <li><b>Prices:</b> DexScreener public API — the most liquid pair of each token.</li></ul>
        <p>Public endpoints can be slow or rate-limited. If a network shows "!", wait a moment and check again.</p>`],
      ["safety", "Security & privacy", `
        <ul><li>${esc(CFG.brand.name)} <b>never</b> asks for a seed phrase or private key. Anyone who does is a scammer.</li>
        <li>Connecting a wallet only shares your public address. We never request signatures or transactions.</li>
        <li>Recent checks and settings are stored only in your browser (localStorage).</li>
        <li>No backend, no analytics, no cookies.</li></ul>`],
      ["faq", "FAQ", [
        ["Is it free?", `Single check is free forever. Multi check needs ${MIN.toLocaleString("en-US")} $${SYM} in the connected wallet.`],
        ["Why is a token missing?", "BSC uses a curated list of major tokens because there is no free, keyless indexer. Very new tokens may also not be indexed yet on Blockscout."],
        ["Why is the USD value \"—\"?", "No DEX pair with a price was found for that token, so its value can't be estimated."],
        ["Can I check an exchange or contract address?", "Yes — any public address works. Very large wallets may take longer."],
        [`Do I need ${SYM} on every network?`, "No. Your balance is summed across all active networks of your wallet type."],
        ["My balance changed but the gate still says locked.", "Press Re-check. Balances are read live, but RPC nodes can lag by a few seconds."],
        ["Is this financial advice?", "No. Prices are estimates from public markets. Always do your own research."],
      ].map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")],
      ["roadmap", "Coming soon", `
        <p>New tools are on the way. They will follow the same rules as today: read-only, no keys, no signatures.</p>
        ${(CFG.comingSoon || []).map((f) => `<p><b>${esc(f.icon || "")} ${esc(f.name)}</b> <span class="soon">soon</span><br>${esc(f.summary)}</p>
        <ul>${f.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>`).join("")}
        <p class="muted">Launch dates will be announced on <a href="${esc(CFG.social.x)}" target="_blank" rel="noopener">${esc(CFG.social.xHandle)}</a>.</p>`],
      ["links", "Links", `
        <ul><li>X: <a href="${esc(CFG.social.x)}" target="_blank" rel="noopener">${esc(CFG.social.xHandle)}</a></li><li>Website: ${esc(CFG.brand.domain)}</li></ul>
        <p class="muted">Keyboard: <kbd>/</kbd> quick check · <kbd>n</kbd> new check · <kbd>m</kbd> multi · <kbd>d</kbd> docs · <kbd>h</kbd> home</p>`],
    ];
    v.innerHTML = `<div class="docs">
      <nav class="toc">${S.map(([id, t], i) => `<a data-to="${id}"><span class="muted">${String(i + 1).padStart(2, "0")}</span> ${t}</a>`).join("")}</nav>
      <article>${S.map(([id, t, b], i) => `<section id="d-${id}"><h3><span class="h-pr">${String(i + 1).padStart(2, "0")}</span> ${t}</h3>${b}</section>`).join("")}</article>
    </div>`;
    $$(".toc a", v).forEach((a) => a.onclick = () => $("#d-" + a.dataset.to).scrollIntoView({ behavior: "smooth", block: "start" }));
    if (arg && $("#d-" + arg)) setTimeout(() => $("#d-" + arg).scrollIntoView(), 30);
  }

  /* ================= coming soon ================= */

  function soonCard(f) {
    return `<a class="soon-card" href="#/soon/${esc(f.id)}">
      <div class="sc-h"><span class="fi">${esc(f.icon || "+")}</span><b>${esc(f.name)}</b><span class="soon">soon</span></div>
      <p>${esc(f.summary)}</p></a>`;
  }

  function soon(v, arg) {
    const list = CFG.comingSoon || [], f = list.find((x) => x.id === arg) || list[0];
    if (!f) { location.hash = "#/"; return; }
    App.setTitle(f.name, "");
    v.innerHTML = `
      <div class="soon-hero">
        <div class="term">
          <div class="term-bar"><span class="dots"><i></i><i></i><i></i></span><span>gm@wallet: ~</span></div>
          <div class="term-body"><div>$ gm ${esc(f.id)} --status</div><div class="dim">${esc(f.name)}</div><div class="ok">status: in development</div><div class="dim">eta: announced on ${esc(CFG.social.xHandle)}</div><div>$ <span class="cursor">█</span></div></div>
        </div>
        <div>
          <span class="soon big">coming soon</span>
          <h2>${esc(f.name)}</h2>
          <p class="lead">${esc(f.summary)}</p>
          <ul class="soon-list">${f.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
          <div class="hero-links">
            <a class="btn primary" href="${esc(CFG.social.x)}" target="_blank" rel="noopener">${UI.xIcon} Get notified on X</a>
            <a href="#/check">Use Single check now →</a>
          </div>
        </div>
      </div>
      ${list.length > 1 ? `<section class="block"><h3><span class="h-pr">+</span> Also coming</h3>
        <div class="soon-grid">${list.filter((x) => x !== f).map(soonCard).join("")}</div></section>` : ""}`;
  }

  window.Views = { home, check, multi, docs, soon };
})();
