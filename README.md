# GM Wallet

**Say GM to your balances.** A read-only, multi-chain wallet balance checker for the **$GM** community.

- **Single check**: any wallet, free for everyone. No $GM needed.
- **Multi check**: up to 50 wallets per run, with combined totals and a CSV export. The connected wallet must hold **≥ 1,000,000 $GM**.
- **Balance checks always run on 5 networks**: Solana, Ethereum, Base, Robinhood Chain and BNB Smart Chain, whatever the mode.
- **CA display mode** (`single` / `multi`): decides which CAs are shown and the site theme. Single shows one network's CA; multi shows all 4 $GM networks (Solana, Robinhood, Base, BSC).
- **Contract address (CA)**: shown with network icons and a copy button in the top bar, the sidebar, the overview and the docs.
- **Built-in docs** at `#/docs`.
- **Design**: terminal look (black background, monospace, green), laid out like an app with a sidebar.
- X: [@GMwallet](https://x.com/GMwallet)

Static site: HTML/CSS/vanilla JS. No build step and no backend.

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

Deploy as-is to Vercel, GitHub Pages or any static host.

## Configure: `js/config.js`

Every brand, token and network setting lives in this one file.

| Key | Purpose |
|---|---|
| `brand.name` / `tagline` / `description` / `domain` | Brand text |
| `token.name` / `token.symbol` | Token name and symbol (`GM`) |
| `token.address` | CA shared by every EVM network (Robinhood, Base, BSC). Leave `""` until launch |
| `token.sol` | Mint address on Solana. Leave `""` until launch |
| `social.x` / `social.xHandle` | X account |
| `checkNetworks` | Networks used for every balance check (default: solana, ethereum, base, robinhood, bsc) |
| `mode` | CA display: `"single"` shows only the CA of `singleNetwork` and themes the site for it. `"multi"` shows the CA for all 4 $GM networks |
| `singleNetwork` | `solana` \| `robinhood` \| `base` \| `bsc` |
| `multiOrder` | CA network order in multi mode |
| `gate.enabled` / `gate.minHolding` | Multi-check access rule (default 1,000,000 GM) |
| `limits.maxWallets` / `limits.concurrency` | Multi-check limits |
| `networks.<id>` | `checkOnly: true` = checked for balances but never shows a CA (Ethereum). Also `name`, `short`, `color`, `color2`, `tagline`, `icon`, `rpcUrls` (tried in order), `explorer`, `ca` (per-network override) |
| `networks.bsc.tokens` | Tokens read on-chain for BSC, which has no free keyless indexer |

Until a CA is set, the site shows "CA: TBA" and Multi check stays locked, because holdings can't be verified without it.

## Data sources (all live, no demo data)

| What | Source |
|---|---|
| Native balances | Public JSON-RPC of each network |
| Solana tokens | RPC `getTokenAccountsByOwner` (SPL + Token-2022) |
| Ethereum / Robinhood / Base tokens | Blockscout API v2 (`/api/v2/addresses/{addr}/tokens`) |
| BSC tokens | `balanceOf` on-chain for `networks.bsc.tokens` |
| $GM balance | Read on-chain from the CA |
| USD prices | DexScreener `/tokens/v1/{chain}/{addresses}`, using the most liquid pair |

## How the multi-check access check works

The user connects a wallet: EVM wallets via EIP-6963 or `window.ethereum`, Solana wallets via Phantom, Solflare or Backpack. The site never requests signatures or transactions. It reads the connected address's $GM balance on every CA network of the same type and adds them up. This is a client-side check that suits a free tool. Anything that needs to be enforced must be re-checked on a server.

## Structure

```
index.html
css/style.css
js/config.js    ← edit this
js/chain.js     networks, RPC, balances, prices
js/wallet.js    wallet connection + GM access check
js/ui.js        helpers (formatting, CA block, copy, toast)
js/views.js     overview, single check, multi check, docs
js/app.js       shell, router, filters, shortcuts
assets/         logo.svg, logo-wordmark.svg, favicon.svg, og.svg, networks/*.svg
```

Keyboard: `/` quick check · `n` new check · `m` multi · `d` docs · `h` home
