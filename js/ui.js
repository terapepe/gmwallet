/* GM Wallet — small UI helpers. */
(function () {
  const CFG = window.GM_CONFIG;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const UI = {
    esc,
    $: (s, r = document) => r.querySelector(s),
    $$: (s, r = document) => [...r.querySelectorAll(s)],

    short(a, n = 4) { return a && a.length > 2 * n + 3 ? `${a.slice(0, n + (a.startsWith("0x") ? 2 : 0))}…${a.slice(-n)}` : a || ""; },

    /** Token amount: compact for big numbers, precise for small ones. */
    amt(v) {
      const x = Number(v);
      if (!isFinite(x) || x === 0) return "0";
      if (x >= 1e9) return (x / 1e9).toFixed(2) + "B";
      if (x >= 1e6) return (x / 1e6).toFixed(2) + "M";
      if (x >= 1e4) return x.toLocaleString("en-US", { maximumFractionDigits: 0 });
      if (x >= 1) return x.toLocaleString("en-US", { maximumFractionDigits: 4 });
      return x.toPrecision(4).replace(/\.?0+$/, "");
    },
    usd(v) {
      if (v == null || !isFinite(v)) return "—";
      if (v === 0) return "$0.00";
      if (v < 0.01) return "<$0.01";
      return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    netIcon(n, size = 16) { return `<img class="net-ic" src="${esc(n.icon)}" width="${size}" height="${size}" alt="${esc(n.short)}" title="${esc(n.name)}">`; },

    /** Signal-bars icon (like the priority bars in the reference UI): level 0..3 */
    bars(level) {
      return `<svg class="bars" viewBox="0 0 16 16" aria-hidden="true">${[0, 1, 2].map((i) =>
        `<rect x="${1 + i * 5}" y="${10 - i * 4}" width="3.4" height="${5 + i * 4}" rx="1" class="${i < level ? "on" : ""}"/>`).join("")}</svg>`;
    },

    async copy(text, label = "Copied") {
      try { await navigator.clipboard.writeText(text); }
      catch {
        const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); } catch {} t.remove();
      }
      UI.toast(label);
    },

    toast(msg) {
      const t = document.createElement("div");
      t.className = "toast"; t.textContent = "> " + msg;
      document.body.appendChild(t);
      setTimeout(() => t.classList.add("out"), 1800);
      setTimeout(() => t.remove(), 2300);
    },

    /** CA block: network icons + address + copy. variant: "pill" | "card" */
    caBlock(variant = "card") {
      return Chain.caGroups().map((g) => {
        const icons = g.nets.map((n) => UI.netIcon(n, variant === "pill" ? 14 : 18)).join("");
        const names = g.nets.length > 1 ? g.nets.map((n) => n.short).join(" · ") : g.nets[0].name;
        const ca = g.ca;
        if (variant === "pill") {
          return `<button class="ca-pill${ca ? "" : " tba"}" ${ca ? `data-copy="${esc(ca)}" data-copy-label="CA copied"` : "disabled"} title="${ca ? "Copy CA (" + esc(names) + ")" : "CA coming soon"}">
            <span class="ca-icons">${icons}</span><span class="ca-txt">${ca ? esc(UI.short(ca, 4)) : "CA: TBA"}</span>${ca ? `<span class="ca-cp">copy</span>` : ""}</button>`;
        }
        return `<div class="ca-card${ca ? "" : " tba"}">
          <div class="ca-head"><span class="ca-icons">${icons}</span><span class="ca-nets">${esc(names)}</span></div>
          <div class="ca-row"><code class="ca-addr">${ca ? esc(ca) : "CA will be announced on " + esc(CFG.social.xHandle)}</code>
          ${ca ? `<button class="btn sm" data-copy="${esc(ca)}" data-copy-label="CA copied">Copy CA</button>` : `<span class="tag">soon</span>`}</div>
        </div>`;
      }).join("");
    },

    xIcon: `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M18.9 2H22l-6.8 7.8L23 22h-6.2l-4.8-6.3L6.4 22H3.3l7.3-8.3L1 2h6.3l4.4 5.8L18.9 2zm-1.1 18h1.7L6.3 3.9H4.5L17.8 20z"/></svg>`,
  };

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-copy]");
    if (b) { e.preventDefault(); UI.copy(b.dataset.copy, b.dataset.copyLabel || "Copied"); }
  });

  window.UI = UI;
})();
