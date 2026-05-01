# NeuraStock — Upcoming Improvements

## High Impact — Untapped API Endpoints

- [ ] **Market Overview Dashboard** — Use `/trending` (top gainers/losers), `/NSE_most_active`, `/price_shockers` to build a landing dashboard showing market pulse before any stock is selected
- [ ] **Intraday Charts** — Use `/1D_intraday_data` for 5-min interval charts (currently only daily historical)
- [ ] **Analyst Targets & Recommendations** — Use `/stock_target_price` for real analyst consensus (mean/high/low price targets, buy/sell ratings)
- [ ] **Stock Forecasts** — Use `/stock_forecasts` for EPS/Revenue/ROE estimates (actuals vs estimates)
- [ ] **Company Logos** — Use `/logo` endpoint to display company logos alongside stock names
- [ ] **Corporate Actions Timeline** — Use `/corporate_actions` to show dividends, splits, bonuses history
- [ ] **Peer Comparison Table** — The `/stock` endpoint returns `peerCompanyList` with P/E, market cap, ROE for competitors

## High Impact — Architecture

- [ ] **Move OpenAI calls to a backend** — API key is currently exposed in the client bundle. A serverless function on Railway would fix it
- [ ] **Code splitting** — Bundle is 1.17MB. Lazy-load stock components, dynamic-import the 4,798-stock catalog
- [ ] **Caching with React Query** — Every stock switch re-fetches 4 parallel API calls. Add stale-while-revalidate with 5-min TTL

## Medium Impact — Features

- [ ] **Watchlist / Favorites** — Persist to localStorage, batch-fetch prices via `/nse_stock_batch_live_price`
- [ ] **Stock Comparison** — Side-by-side view of 2-3 stocks (charts + fundamentals)
- [ ] **Market News Feed** — Use `/news` with pagination + `/ai_news` for AI-curated insights
- [ ] **Historical Financials View** — Use `/historical_stats` for quarterly results, balance sheets, cash flows, ratios
- [ ] **Dynamic Stock Catalog** — Fetch from `/static/all_stocks.json` instead of shipping 4,798 entries in the bundle

## Medium Impact — UX

- [ ] **Theme toggle** — Dark mode is hardcoded, Tailwind `darkMode: ["class"]` is already configured
- [ ] **Shareable stock URLs** — `/stock/TCS` routes instead of state-only navigation
- [ ] **Timeframe selector on charts** — Buttons exist but `handleTimeFrameChange` re-fetches the same 3yr data
- [ ] **Loading skeletons** — Replace spinner with card outline placeholders
- [ ] **Mobile bottom nav** — The `use-mobile` hook exists but mobile layout is just a squeezed desktop

## Lower Priority — Tech Debt

- [ ] **Delete `stockService.ts`** — Dead wrapper that just redirects to `indianStockService.ts`
- [ ] **Error boundaries** — One API failure currently breaks the whole page
- [ ] **Tests** — Zero test coverage
- [ ] **PWA support** — Service worker for offline access to cached data
