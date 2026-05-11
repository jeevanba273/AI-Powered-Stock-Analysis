# NeuraStock — Feature Status & Roadmap

## Completed Features

### Core Platform
- [x] Express backend with JWT authentication
- [x] Server-side API proxy (no CORS, hidden API keys)
- [x] 1-hour server cache with manual Refresh button
- [x] Retry logic on all API calls
- [x] Dynamic stock catalog (5,400+ from IndianAPI)
- [x] Dynamic MF catalog (251 funds)

### Dashboard (Stock Analysis)
- [x] TradingView Lightweight Charts (1D to MAX, SMA20/SMA50, hover legend)
- [x] GPT-4o-mini AI analysis (40+ data points, 4-5 paragraph output)
- [x] AI news sentiment analysis
- [x] Company logos
- [x] Analyst price targets (mean/high/low, consensus score)
- [x] Stock forecasts (EPS/Revenue actual vs estimate with surprise%)
- [x] Corporate actions timeline (dividends, board meetings, bonus, splits)
- [x] Documents & Filings (conference calls, annual reports, announcements, credit ratings, regulatory)
- [x] Peer comparison strip
- [x] Earnings calendar (upcoming board meetings)
- [x] Support & resistance levels
- [x] Key Stats with day/52-week range meters
- [x] Export PDF report
- [x] Shareable stock URLs (/stock/TCS)

### Pages
- [x] Market Overview (heatmap, gainers/losers, most active NSE+BSE, price shockers, 52-week)
- [x] Stock Comparison (up to 3 stocks side-by-side)
- [x] Stock Screener (industry search)
- [x] IPO Tracker (upcoming/open/listed, detail expansion, subscription data)
- [x] Mutual Funds (browse by category, NAV chart, top holdings)
- [x] Commodities (MCX futures with OI signal)
- [x] News Feed (paginated market news)

### UI/UX
- [x] Dark/Light theme toggle (persists in localStorage)
- [x] Live watchlist prices in sidebar
- [x] Geist + Geist Mono fonts
- [x] Loading skeletons matching actual layout
- [x] Error boundaries per section
- [x] Responsive breakpoints (1024px, 860px)

### Performance
- [x] Stale-while-revalidate client cache
- [x] Prefetch on watchlist hover
- [x] Code splitting (lazy-load pages, prefetch after 3s)
- [x] Server-side data aggregation endpoint
- [x] Non-blocking sentiment analysis
- [x] Batch price fetching

### API Coverage
- [x] All 38 IndianAPI endpoints utilized
- [x] Every field from every endpoint displayed

## Remaining / Future Roadmap

### Phase 1 — Database & Persistence
- [ ] PostgreSQL on Railway
- [ ] User registration (multi-user)
- [ ] Persistent watchlists (per-user, synced)
- [ ] Portfolio tracking (holdings, P&L, XIRR)
- [ ] Analysis history (saved AI analyses)
- [ ] User preferences in DB

### Phase 2 — Mobile & PWA
- [ ] Mobile-first bottom navigation
- [ ] PWA with service worker (offline cached data)
- [ ] Touch-optimized charts and interactions

### Phase 3 — Infrastructure
- [ ] Rate limiting (express-rate-limit)
- [ ] Error tracking (Sentry)
- [ ] CI/CD (GitHub Actions: lint, type-check, build)
- [ ] Tests (Vitest for components, Playwright for E2E)
- [ ] API usage monitoring dashboard

### Phase 4 — Advanced Features
- [ ] Real-time price alerts (set target, get notified)
- [ ] Keyboard shortcuts (1-8 for tabs, arrows for watchlist)
- [ ] Stock correlation matrix
- [ ] Sector performance heatmap
- [ ] Backtesting tools
