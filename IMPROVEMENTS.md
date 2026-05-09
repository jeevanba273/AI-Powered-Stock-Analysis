# NeuraStock — Full Feature Roadmap

## What's Done

- [x] Express backend with JWT auth (login page, protected routes)
- [x] Server-side API proxy (no CORS, API key hidden from browser)
- [x] 1-hour server cache with Refresh button
- [x] Retry on dev server 500s
- [x] Full UI redesign (dark terminal, sidebar, topbar, SVG charts)
- [x] Parallel API calls with timeouts
- [x] Fallback server pattern (dev → normal)

---

## Phase 1 — Improve Current Dashboard (1-2 days)

Quick wins that make the existing page significantly better.

| Feature | API Needed | Effort |
|---------|-----------|--------|
| **TradingView Lightweight Charts** — Replace custom SVG with professional candlestick charts, zoom, pan, crosshair | None (library) | 3-4 hrs |
| **Company Logos** — Show logos in sidebar watchlist, stock header, and search results | `GET /logo` | 1-2 hrs |
| **Analyst Targets** — Show analyst price targets (mean/high/low) and buy/sell/hold ratings below AI analysis | `GET /stock_target_price` | 2 hrs |
| **Peer Comparison Strip** — 5 peers with sparklines, P/E, market cap (data already in `/get_stock_data` response) | Already fetched | 2 hrs |
| **Shareable Stock URLs** — `/stock/TCS` routes so you can bookmark or share a stock link | None | 1 hr |
| **Loading Skeletons** — Card-shaped shimmer placeholders instead of spinner | None | 1-2 hrs |
| **Error Boundaries** — Catch render errors per-card instead of crashing the whole page | None | 1 hr |
| **Delete dead code** — Remove `stockService.ts`, unused shadcn components, old layout files | None | 30 min |

---

## Phase 2 — New Pages: Market + News (2-3 days)

New tabs using API endpoints you're already paying for but not using.

### Market Overview Tab
A landing page showing the market pulse at a glance.

| Section | API | Description |
|---------|-----|-------------|
| **Market Indices Bar** | `GET /indices` | NIFTY 50, SENSEX, Bank NIFTY, India VIX with live values (already have the endpoint) |
| **Top Gainers / Losers** | `GET /trending` | Two columns: top 10 gainers and top 10 losers with price, change%, volume |
| **Most Active (NSE + BSE)** | `GET /NSE_most_active` + `GET /BSE_most_active` | Stocks with highest volume, includes trend ratings and 52-week range |
| **Price Shockers** | `GET /price_shockers` | Stocks with biggest deviation from average price |
| **52-Week High/Low** | `GET /fetch_52_week_high_low_data` | Stocks hitting new 52-week highs and lows |

### News Feed Tab
Paginated market news with AI-curated section.

| Section | API | Description |
|---------|-----|-------------|
| **Market News** | `GET /news?page_no=1&size=20` | Paginated general market news with title, summary, image, source, topics |
| **AI-Curated News** | `GET /ai_news?category=stock_market` | AI-summarized market insights, filterable by: stock_market, mutual_funds, ipo, investing, economy, commodities |
| **Company News** | `GET /company_news?stock_name=X` | Already used — can show in a sidebar panel when a stock is selected |

---

## Phase 3 — Database + Portfolio (3-5 days)

Add PostgreSQL on Railway and build real user features.

### Database Setup
- **PostgreSQL** on Railway ($0 hobby tier)
- **Schema**: users, watchlists, portfolio_holdings, analysis_history, user_preferences
- **ORM**: Prisma (type-safe, works great with TypeScript + Express)

### Features

| Feature | Description |
|---------|-------------|
| **User Registration** | Multi-user signup/login (extend existing JWT auth) |
| **Persistent Watchlist** — Saved per-user, synced across devices | Replace localStorage with DB. Batch-fetch live prices via `/nse_stock_batch_live_price` for all watchlist stocks |
| **Portfolio Tracking** | Add holdings (stock, qty, buy price, date). Calculate P&L, XIRR, allocation %. Display in a Portfolio page |
| **Analysis History** | Save every AI analysis result to DB. View past analyses for any stock with timestamps |
| **User Preferences** | Theme (dark/light), default stock, density, saved in DB |
| **Corporate Actions Alerts** | `GET /corporate_actions` — weekly cron checks for dividends/splits on held stocks, store notifications |

---

## Phase 4 — Advanced Features (1-2 weeks)

Polish and power-user features.

| Feature | API / Tech | Description |
|---------|-----------|-------------|
| **Intraday Charts** | `POST /1D_intraday_data` | 5-min interval chart for the current day. Requires stock_id (from `/static/all_stocks.json`) |
| **Stock Forecasts** | `GET /stock_forecasts` | EPS/Revenue/ROE estimates: actuals vs analyst estimates, consensus tracking |
| **Historical Financials** | `GET /historical_stats` | Quarterly results, balance sheet, cash flow, ratios — full fundamental view |
| **Stock Screener** | `GET /industry_search` + filters | Filter stocks by sector, P/E range, market cap, trend rating |
| **Stock Comparison** | Existing data | Side-by-side view of 2-3 stocks: charts overlaid, fundamentals table |
| **Dynamic Stock Catalog** | `GET /static/all_stocks.json` | Fetch at startup instead of bundling 4,798 entries (saves ~200KB from bundle) |
| **Credit Ratings** | `GET /credit_ratings` | CRISIL/ICRA/CARE ratings display on stock detail |
| **Conference Calls** | `GET /concalls` | Links to earnings call transcripts |
| **Annual Reports** | `GET /annual_reports` | Download links for annual reports |
| **IPO Section** | `GET /ipo/v2` + `GET /ipo/{id}` | Upcoming, open, and recently listed IPOs with subscription data |

---

## Phase 5 — Infrastructure + Scale (ongoing)

| Feature | Description |
|---------|-------------|
| **Move OpenAI to server-side proxy** | Add `/api/ai/analyze` and `/api/ai/sentiment` endpoints. Remove `VITE_OPENAI_API_KEY` from frontend entirely |
| **Code splitting** | Lazy-load Market/News pages, dynamic-import stock catalog |
| **PWA** | Service worker for offline cached data, installable app |
| **Mobile-first redesign** | Bottom nav, swipe between stocks, optimized touch targets |
| **Theme toggle** | Light/dark mode switch (CSS variables already support it) |
| **Rate limiting** | `express-rate-limit` on auth and proxy endpoints |
| **Monitoring** | Error tracking (Sentry), uptime monitoring, API usage dashboard via `/usage` endpoint |
| **CI/CD** | GitHub Actions: lint, type-check, build on every PR |
| **Tests** | Vitest for components, Playwright for E2E (login flow, stock search, analysis) |

---

## API Endpoint Usage Map

| Status | Endpoint | Used In |
|--------|----------|---------|
| **In Use** | `POST /nse_stock_batch_live_price` | Live prices |
| **In Use** | `GET /get_stock_data` | Stock details |
| **In Use** | `GET /historical_data` | Price charts |
| **In Use** | `GET /company_news` | News feed |
| Phase 1 | `GET /logo` | Company logos |
| Phase 1 | `GET /stock_target_price` | Analyst targets |
| Phase 2 | `GET /trending` | Market overview |
| Phase 2 | `GET /NSE_most_active` | Market overview |
| Phase 2 | `GET /BSE_most_active` | Market overview |
| Phase 2 | `GET /price_shockers` | Market overview |
| Phase 2 | `GET /fetch_52_week_high_low_data` | Market overview |
| Phase 2 | `GET /news` | News feed |
| Phase 2 | `GET /ai_news` | AI-curated news |
| Phase 2 | `GET /indices` | Market indices bar |
| Phase 3 | `GET /corporate_actions` | Portfolio alerts |
| Phase 4 | `POST /1D_intraday_data` | Intraday charts |
| Phase 4 | `GET /stock_forecasts` | Forecasts |
| Phase 4 | `GET /historical_stats` | Financials view |
| Phase 4 | `GET /industry_search` | Screener |
| Phase 4 | `GET /credit_ratings` | Credit ratings |
| Phase 4 | `GET /concalls` | Conference calls |
| Phase 4 | `GET /annual_reports` | Annual reports |
| Phase 4 | `GET /ipo/v2` | IPO section |
| Phase 5 | `GET /usage` | API monitoring |
| Phase 5 | `GET /ping` | Health checks |
