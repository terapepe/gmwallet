/**
 * GM Wallet — site configuration.
 * Everything brand / token / network related lives here. Edit this file only;
 * no build step is needed (static site).
 */
window.GM_CONFIG = {
  brand: {
    name: "GM Wallet",
    tagline: "Say GM to your balances.",
    description:
      "A fast, read-only, multi-chain wallet balance checker. Paste a wallet, press check, see everything it holds.",
    domain: "gmwallet.fun",
  },

  token: {
    name: "GM",
    symbol: "GM",
    /** CA shared by all EVM networks (Robinhood, Base, BSC). Leave "" until launch. */
    address: "",
    /** Mint address on Solana. Leave "" until launch. */
    sol: "",
  },

  social: {
    x: "https://x.com/GMwallet",
    xHandle: "@GMwallet",
  },

  /**
   * Site mode:
   *  "single" = only `singleNetwork` is shown and the whole site is themed for it
   *  "multi"  = always all 4 networks (Solana, Robinhood, Base, BSC), ordered by `multiOrder`
   */
  mode: "multi",
  singleNetwork: "robinhood", // robinhood | solana | base | bsc
  multiOrder: ["solana", "robinhood", "base", "bsc"],

  /** Multi-wallet check access rule. */
  gate: {
    enabled: true,
    minHolding: 1000000, // GM required (summed across active networks of the connected wallet type)
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
  },
};
