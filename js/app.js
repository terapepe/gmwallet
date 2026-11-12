/* GM Wallet — app shell: router, sidebar, theme, wallet button, filters, shortcuts. */
(function () {
  const CFG = window.GM_CONFIG;
  const { $, $$, esc } = UI;
  const RECENT = "gmwallet.recent", SEL = "gmwallet.nets";

  const App = {
    route: "home", arg: "",
    selected: new Set(),

    init() {
      document.title = `${CFG.brand.name} — multi-chain wallet balance checker`;
      $("#brandName").textContent = CFG.brand.name;
      App.theme();
      let saved; try { saved = JSON.parse(localStorage.getItem(SEL) || "null"); } catch {}
      const ids = Chain.checkList().map((n) => n.id);
      App.selected = new Set((saved || ids).filter((id) => ids.includes(id)));
      if (!App.selected.size) App.selected = new Set(ids);

      App.renderShell();
      Wallet.init();
      window.addEventListener("wallet:change", App.onWallet);
      window.addEventListener("hashchange", App.go);
      $("#walletBtn").onclick = App.walletClick;
      $("#searchBtn").onclick = () => App.quick();
      $("#menuBtn").onclick = () => document.body.classList.toggle("nav-open");
      document.addEventListener("keydown", App.keys);
      App.go();
    },

    /** Per-network theme in single mode; terminal green in multi mode. */
    theme() {
      const r = document.documentElement;
      if (Chain.isSingle()) {
        const n = Chain.list()[0];
        r.style.setProperty("--net", n.color);
        r.style.setProperty("--net2", n.color2 || n.color);
        document.body.dataset.net = n.id;
      } else document.body.dataset.net = "multi";
      document.body.dataset.mode = Chain.isSingle() ? "single" : "multi";
    },

    renderShell() {
      $("#netList").innerHTML = Chain.checkList().map((n) => `
        <li><a href="#/docs/networks" title="${esc(n.tagline)}">
          <span class="caret">▸</span>${UI.netIcon(n, 16)}<span>${esc(n.name)}</span>
          <span class="net-type">${n.type === "solana" ? "SVM" : "EVM"}</span></a></li>`).join("");
      $("#sideCA").innerHTML = UI.caBlock("pill");
      $("#tbCA").innerHTML = UI.caBlock("pill");
      const x = $("#xLink"); x.href = CFG.social.x; x.innerHTML = `${UI.xIcon} ${esc(CFG.social.xHandle)}`;
      $("#foot").innerHTML = `
        <span>© ${new Date().getFullYear()} ${esc(CFG.brand.name)} · $${esc(CFG.token.symbol)}</span>
        <span class="muted">read-only · no keys · no tracking</span>
        <a href="${esc(CFG.social.x)}" target="_blank" rel="noopener">${UI.xIcon} ${esc(CFG.social.xHandle)}</a>`;
      App.renderRecent();
    },

    go() {
      const [, r = "", ...rest] = (location.hash || "#/").split("/");
      App.route = ({ "": "home", check: "check", multi: "multi", docs: "docs" })[r] || "home";
      App.arg = decodeURIComponent(rest.join("/") || "");
      $$("#nav a").forEach((a) => a.classList.toggle("on", a.dataset.r === App.route));
      document.body.classList.remove("nav-open");
      App.renderFilter();
      Views[App.route]($("#view"), App.arg);
      $(".main").scrollTop = 0; window.scrollTo(0, 0);
    },

    setTitle(title, count) {
      $("#tbTitle").textContent = title;
      $("#tbCount").innerHTML = count != null && count !== "" ? `<span class="tri">▲</span> ${esc(count)}` : "";
    },

    /** Network filter chips on check views (same 5 networks in every mode). */
    renderFilter() {
      const box = $("#tbFilter");
      if (!["check", "multi"].includes(App.route)) { box.innerHTML = ""; return; }
      box.innerHTML = `<span class="chip ghost">+ Filter</span>` + Chain.checkList().map((n) =>
        `<button class="chip${App.selected.has(n.id) ? " on" : ""}" data-net="${n.id}" style="--c:${n.color}">${UI.netIcon(n, 14)} ${esc(n.short)}</button>`).join("");
      $$("[data-net]", box).forEach((b) => b.onclick = () => {
        const id = b.dataset.net;
        if (App.selected.has(id) && App.selected.size > 1) App.selected.delete(id); else App.selected.add(id);
        try { localStorage.setItem(SEL, JSON.stringify([...App.selected])); } catch {}
        App.renderFilter();
        window.dispatchEvent(new Event("nets:change"));
      });
    },
    selectedIds() { return [...App.selected]; },

    /* ---------- wallet ---------- */
    onWallet() {
      const s = Wallet.state, b = $("#walletBtn"), dot = $("#statusDot");
      b.textContent = s.connected ? UI.short(s.address, 4) : "Connect";
      b.classList.toggle("on", s.connected);
      dot.classList.toggle("on", s.connected);
      dot.title = s.connected ? `${s.name}: ${s.address}` : "Wallet not connected";
      $("#navLock").textContent = Wallet.canMulti() ? "✓" : "🔒";
      window.dispatchEvent(new Event("gate:change"));
    },
    walletClick() {
      if (Wallet.state.connected) {
        if (confirm(`Disconnect ${Wallet.state.name} (${UI.short(Wallet.state.address)})?`)) Wallet.disconnect();
        return;
      }
      App.openWallets();
    },
    openWallets() {
      const box = $("#walletOptions");
      box.innerHTML = Wallet.options().map((o) => `
        <button class="wallet-opt" data-type="${o.type}" data-key="${esc(o.key)}" ${o.installed ? "" : `data-url="${esc(o.url)}"`}>
          ${o.icon ? `<img src="${esc(o.icon)}" width="22" height="22" alt="">` : `<span class="wo-ph">${esc(o.name[0])}</span>`}
          <span>${esc(o.name)}</span>
          <span class="wo-type">${o.type === "solana" ? "Solana" : "EVM"}</span>
          <span class="wo-st">${o.installed ? "detected" : "install ↗"}</span>
        </button>`).join("") || `<p class="muted">No supported wallet found.</p>`;
      $$(".wallet-opt", box).forEach((b) => b.onclick = async () => {
        if (b.dataset.url) return window.open(b.dataset.url, "_blank", "noopener");
        try { await Wallet.connect(b.dataset.type, b.dataset.key); $("#walletModal").close(); UI.toast("wallet connected"); }
        catch (e) { UI.toast(e.message || "connection rejected"); }
      });
      $("#walletModal").showModal();
    },

    /* ---------- recent checks (stored in this browser only) ---------- */
    addRecent(addr) {
      let r = []; try { r = JSON.parse(localStorage.getItem(RECENT) || "[]"); } catch {}
      r = [addr, ...r.filter((a) => a !== addr)].slice(0, 5);
      try { localStorage.setItem(RECENT, JSON.stringify(r)); } catch {}
      App.renderRecent();
    },
    renderRecent() {
      let r = []; try { r = JSON.parse(localStorage.getItem(RECENT) || "[]"); } catch {}
      $("#recentTitle").hidden = !r.length;
      $("#recentList").innerHTML = r.map((a) => `<li><a href="#/check/${encodeURIComponent(a)}"><span class="caret">▸</span><span class="mono-dim">${esc(UI.short(a, 5))}</span></a></li>`).join("");
    },

    quick() {
      if (App.route === "check" && $("#addr")) return $("#addr").focus();
      location.hash = "#/check";
      setTimeout(() => $("#addr") && $("#addr").focus(), 50);
    },

    keys(e) {
      if (/input|textarea/i.test(document.activeElement.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "/") { e.preventDefault(); App.quick(); }
      else if (e.key === "n") location.hash = "#/check";
      else if (e.key === "m") location.hash = "#/multi";
      else if (e.key === "d") location.hash = "#/docs";
      else if (e.key === "h") location.hash = "#/";
    },
  };

  window.App = App;
  document.addEventListener("DOMContentLoaded", App.init);
})();
