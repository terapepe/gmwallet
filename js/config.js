window.GM_CONFIG = {
  brand: {
    name: "GM Wallet",
    tagline: "Say GM to your balances.",
    description:
      "A fast, read-only, multi-chain wallet balance checker. Paste a wallet, press check, see everything it holds.",
    domain: "gmwallet.fun",
  },

  token: {
    name: "GM Wallet",
    symbol: "WGM",
    address: "",
    sol: "",
  },

  social: {
    x: "https://x.com/GMwalletfun",
    xHandle: "@GMwalletfun",
  },

  checkNetworks: ["solana", "ethereum", "base", "robinhood", "bsc", "arbitrum", "optimism", "arc"],
  mode: "single",
  singleNetwork: "robinhood",
  multiOrder: ["solana", "robinhood", "base", "bsc"],

  comingSoon: [
    {
      id: "airdrop",
      name: "Airdrop Check",
      icon: "✦",
      summary: "See which airdrops a wallet can claim — across every supported network, in one scan.",
      points: [
        "Eligibility check for live and upcoming airdrops",
        "Claimable amounts with live USD value",
        "Claim deadlines so nothing expires unnoticed",
        "Works with EVM and Solana wallets, multi-wallet for holders",
      ],
    },
    {
      id: "deploy",
      name: "Token Deploy Check",
      icon: "⌁",
      summary: "Paste a token CA and see who deployed it, when, and what else that deployer launched.",
      points: [
        "Deployer wallet, deploy time and funding source",
        "Every other token launched by the same deployer",
        "Contract flags: mint authority, ownership, freeze, taxes",
        "Quick risk summary before you ape in",
      ],
    },
  ],

  /** Multi-wallet check access rule. */
  gate: {
    enabled: true,
    minHolding: 1000000, // GMW required (summed across the CA networks of the connected wallet type)
  },

  limits: {
    maxWallets: 50,  // max wallets per multi check
    concurrency: 3,  // wallets checked in parallel
  },

  /** Price source (DexScreener public API, no key). */
  prices: {
    dexscreener: "https://api.dexscreener.com/tokens/v1",
  },

  networks: {
    solana: {
      name: "Solana",
      short: "SOL",
      type: "solana",
      rpcUrls: ["https://solana-rpc.publicnode.com", "https://api.mainnet-beta.solana.com"],
      explorer: "https://solscan.io",
      explorerAddr: "/account/",
      explorerToken: "/token/",
      native: { symbol: "SOL", name: "Solana", decimals: 9 },
      nativePrice: { chain: "solana", address: "So11111111111111111111111111111111111111112" },
      dexChain: "solana",
      color: "#14F195",
      color2: "#9945FF",
      tagline: "Lightning-fast and meme-native",
      icon: "assets/networks/solana.svg",
      ca: "", // overrides token.sol when set
    },
    ethereum: {
      name: "Ethereum",
      short: "ETH",
      type: "evm",
      chainId: 1,
      checkOnly: true, // balance checks only — no $GMW CA on this network
      rpcUrls: ["https://ethereum-rpc.publicnode.com", "https://eth.llamarpc.com"],
      explorer: "https://etherscan.io",
      explorerAddr: "/address/",
      explorerToken: "/token/",
      native: { symbol: "ETH", name: "Ether", decimals: 18 },
      nativePrice: { chain: "ethereum", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" },
      dexChain: "ethereum",
      tokenApi: { type: "blockscout", url: "https://eth.blockscout.com" },
      color: "#8EA2FF",
      color2: "#627EEA",
      tagline: "The original smart-contract chain",
      icon: "assets/networks/ethereum.svg",
    },
    robinhood: {
      name: "Robinhood Chain",
      short: "Robinhood",
      type: "evm",
      chainId: 4663,
      rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"],
      explorer: "https://robinhoodchain.blockscout.com",
      explorerAddr: "/address/",
      explorerToken: "/token/",
      native: { symbol: "ETH", name: "Ether", decimals: 18 },
      nativePrice: { chain: "base", address: "0x4200000000000000000000000000000000000006" },
      dexChain: "robinhood",
      tokenApi: { type: "blockscout", url: "https://robinhoodchain.blockscout.com" },
      color: "#CCFF00",
      color2: "#7AE000",
      tagline: "Arbitrum Orbit L2 built for trading",
      icon: "assets/networks/robinhood.svg",
      ca: "", // overrides token.address when set
    },
    base: {
      name: "Base",
      short: "Base",
      type: "evm",
      chainId: 8453,
      rpcUrls: ["https://mainnet.base.org", "https://base-rpc.publicnode.com"],
      explorer: "https://basescan.org",
      explorerAddr: "/address/",
      explorerToken: "/token/",
      native: { symbol: "ETH", name: "Ether", decimals: 18 },
      nativePrice: { chain: "base", address: "0x4200000000000000000000000000000000000006" },
      dexChain: "base",
      tokenApi: { type: "blockscout", url: "https://base.blockscout.com" },
      color: "#3B7BFF",
      color2: "#0052FF",
      tagline: "Onchain with the Base community",
      icon: "assets/networks/base.svg",
      ca: "",
    },
    bsc: {
      name: "BNB Smart Chain",
      short: "BSC",
      type: "evm",
      chainId: 56,
      rpcUrls: ["https://bsc-dataseed.bnbchain.org", "https://bsc-rpc.publicnode.com"],
      explorer: "https://bscscan.com",
      explorerAddr: "/address/",
      explorerToken: "/token/",
      native: { symbol: "BNB", name: "BNB", decimals: 18 },
      nativePrice: { chain: "bsc", address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" },
      dexChain: "bsc",
      /** No free keyless token indexer for BSC: these tokens are read on-chain with balanceOf. */
      tokens: [
        { address: "0x55d398326f99059fF775485246999027B3197955", symbol: "USDT", name: "Tether USD", decimals: 18 },
        { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", symbol: "USDC", name: "USD Coin", decimals: 18 },
        { address: "0xc5f0f7b66764F6ec8C8Dff7BA683102295E16409", symbol: "FDUSD", name: "First Digital USD", decimals: 18 },
        { address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", symbol: "WBNB", name: "Wrapped BNB", decimals: 18 },
        { address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", symbol: "ETH", name: "Binance-Peg Ether", decimals: 18 },
        { address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", symbol: "BTCB", name: "Binance-Peg BTCB", decimals: 18 },
        { address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", symbol: "CAKE", name: "PancakeSwap", decimals: 18 },
      ],
      color: "#F0B90B",
      color2: "#C99400",
      tagline: "Degen energy on BNB Smart Chain",
      icon: "assets/networks/bsc.svg",
      ca: "",
    },
    arbitrum: {
      name: "Arbitrum One",
      short: "Arbitrum",
      type: "evm",
      chainId: 42161,
      checkOnly: true,
      rpcUrls: ["https://arb1.arbitrum.io/rpc", "https://arbitrum-one-rpc.publicnode.com"],
      explorer: "https://arbiscan.io",
      explorerAddr: "/address/",
      explorerToken: "/token/",
      native: { symbol: "ETH", name: "Ether", decimals: 18 },
      nativePrice: { chain: "arbitrum", address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1" },
      dexChain: "arbitrum",
      tokenApi: { type: "blockscout", url: "https://arbitrum.blockscout.com" },
      color: "#28A0F0",
      color2: "#12AAFF",
      tagline: "Ethereum's largest optimistic rollup",
      icon: "assets/networks/arbitrum.svg",
    },
    optimism: {
      name: "OP Mainnet",
      short: "OP",
      type: "evm",
      chainId: 10,
      checkOnly: true,
      rpcUrls: ["https://mainnet.optimism.io", "https://optimism-rpc.publicnode.com"],
      explorer: "https://optimistic.etherscan.io",
      explorerAddr: "/address/",
      explorerToken: "/token/",
      native: { symbol: "ETH", name: "Ether", decimals: 18 },
      nativePrice: { chain: "optimism", address: "0x4200000000000000000000000000000000000006" },
      dexChain: "optimism",
      tokenApi: { type: "blockscout", url: "https://optimism.blockscout.com" },
      color: "#FF3B4A",
      color2: "#FF0420",
      tagline: "The home of the Superchain",
      icon: "assets/networks/optimism.svg",
    },
    arc: {
      name: "Arc",
      short: "Arc",
      type: "evm",
      chainId: 5042,
      checkOnly: true,
      rpcUrls: ["https://rpc.mainnet.arc.io", "https://arc.drpc.org"],
      explorer: "https://explorer.arc.io",
      explorerAddr: "/address/",
      explorerToken: "/token/",
      native: { symbol: "USDC", name: "USD Coin (gas)", decimals: 18 },
      nativeUsd: 1, // gas token is USDC → fixed $1
      dexChain: "arc",
      tokens: [], // add { address, symbol, name, decimals } to read more Arc tokens on-chain
      color: "#7FB2FF",
      color2: "#2775CA",
      tagline: "Circle's stablecoin-native L1, gas in USDC",
      icon: "assets/networks/arc.svg",
    },
  },
};

/* ---- hybot sync: CA, token name, symbol, X and Telegram follow the newest token hybot launched for this site ----
   https://hybot.xyz/api/site-token?site=<domain> · values above are the fallback when hybot has none / is unreachable.
   Links in the page that point to the old X / Telegram are updated, or hidden when the launched token has none. */
(function (C) {
  if (!C || typeof window === "undefined") return;
  var DOMAIN = "gmwallet.fun";
  var host = String(location.hostname || "").replace(/^www\./, "");
  var site = /\./.test(host) && !/(^|\.)(vercel\.app|localhost|127\.0\.0\.1)$/.test(host) ? host : DOMAIN;
  if (!site) return;
  var d = null, key = "hybot:" + site;
  try { var c = JSON.parse(localStorage.getItem(key) || "null"); if (c && Date.now() - c.t < 60000) d = c.d; } catch (e) {}
  if (!d) {
    try {
      var x = new XMLHttpRequest();
      x.open("GET", "https://hybot.xyz/api/site-token?site=" + encodeURIComponent(site), false); // sync: config must be ready before the app scripts run
      x.send();
      if (x.status === 200) { d = JSON.parse(x.responseText); try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {} }
    } catch (e) {}
  }
  if (!d || !d.found || !/^0x[0-9a-fA-F]{40}$/.test(d.ca || "")) return;
  var handle = function (u) { var m = String(u || "").match(/(?:x|twitter)\.com\/@?([A-Za-z0-9_]{1,15})|^@?([A-Za-z0-9_]{1,15})$/); return m ? (m[1] || m[2]) : ""; };
  var tgName = function (u) { var m = String(u || "").match(/t\.me\/([\w+/-]+)/); return m ? m[1].replace(/\/+$/, "") : String(u || "").replace(/^@/, ""); };
  var X0 = C.social && C.social.x || "", TG0 = C.social && C.social.telegram || "";
  var oldX = handle(X0), oldTg = tgName(TG0);
  var X = d.x || "", TG = d.telegram || "", SYM = d.symbol, NAME = d.name, CA = d.ca;
  // no X / Telegram on the launched token → config keeps the old link so the app renders as usual, and the link fixer below hides it
  var XV = X || X0, TGV = TG || TG0, XH = handle(XV);
  // single-network per-chain CA overrides would win over the shared address → clear them
  var net = C.singleNetwork || C.singleChain || (C.token && C.token.singleNetwork);
  [C.networks, C.chains, C.token && C.token.chains].forEach(function (m) { if (m && net && m[net] && "ca" in m[net]) m[net].ca = ""; });
  C.token.name = NAME; C.token.symbol = SYM; C.token.address = CA;
  C.social.x = XV; C.social.xHandle = XH ? "@" + XH : ""; C.social.telegram = TGV;
  // page links still pointing to the old X / Telegram (hard-coded or rendered later)
  var fix = function (root) {
    var as = root.querySelectorAll ? root.querySelectorAll("a[href]") : [];
    for (var i = 0; i < as.length; i++) {
      var a = as[i], h = a.getAttribute("href") || "";
      if (oldX && new RegExp("(x|twitter)\\.com/@?" + oldX + "(?![A-Za-z0-9_])", "i").test(h) && !/intent|share/i.test(h)) {
        if (X) { if (h !== X) { a.href = X; if (XH && oldX !== XH) a.innerHTML = a.innerHTML.split("@" + oldX).join("@" + XH); } }
        else a.style.display = "none";
      } else if (oldTg && /t\.me\//i.test(h) && tgName(h).toLowerCase() === oldTg.toLowerCase()) {
        if (TG) { if (h !== TG) a.href = TG; } else a.style.display = "none";
      }
    }
  };
  var start = function () { fix(document); new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) { fix(n); if (n.matches && n.matches("a[href]")) fix(n.parentNode || n); } }); }); }).observe(document.documentElement, { childList: true, subtree: true }); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})(window.GM_CONFIG);
