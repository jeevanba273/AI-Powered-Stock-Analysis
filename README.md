
# NeuraStock: AI-Powered Stock Analysis Platform

[![Live Demo](https://img.shields.io/badge/demo-live-green.svg)](https://ai-powered-stock-analysis.up.railway.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-000.svg)](https://ui.shadcn.com/)
[![TradingView](https://img.shields.io/badge/TradingView-Lightweight%20Charts-131722.svg)](https://tradingview.github.io/lightweight-charts/)
[![Express](https://img.shields.io/badge/Express-5-000.svg?logo=express)](https://expressjs.com/)

## Overview

**NeuraStock** is a full-stack, AI-powered stock analysis platform for the **Indian stock market (NSE & BSE)**. It features an Express 5 backend that proxies all API calls (keeping keys server-side), a 1-hour server cache, and a React 18 frontend with TradingView Lightweight Charts, GPT-4o-mini analysis, and eight dedicated pages covering stocks, markets, IPOs, mutual funds, commodities, and news.

## Live Demo

[**ai-powered-stock-analysis.up.railway.app**](https://ai-powered-stock-analysis.up.railway.app/)

## Pages

NeuraStock has **8 pages** accessible from the sidebar:

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/`, `/stock/:ticker` | Full single-stock analysis with AI, charts, filings, peers, and PDF export |
| **Market** | `/market` | Heatmap, top gainers/losers, most active, price shockers, 52-week highs/lows |
| **Compare** | `/compare` | Side-by-side comparison of up to 3 stocks |
| **Screener** | `/screener` | Search stocks by industry and sector |
| **IPO** | `/ipo` | Upcoming, open, and listed IPOs with expandable detail panels |
| **Mutual Funds** | `/mutual-funds` | Browse funds by category, NAV chart, holdings breakdown |
| **Commodities** | `/commodities` | MCX futures with open interest signal |
| **News** | `/news` | Paginated market news feed |

## Dashboard Sections

The Dashboard is a single-scroll page built around a selected stock. All sections load together:

- **Stock Header** -- Company logo, live price, market open/closed status
- **Key Stats** -- 8 key metrics plus day range and 52-week range sliders
- **AI Analyst** -- GPT-4o-mini powered analysis with pattern recognition, support/resistance levels, risk assessment, and buy/hold/sell recommendation
- **TradingView Lightweight Charts** -- Candlestick/area charts with timeframes from 1D to MAX, SMA overlays, and hover legend
- **Analyst Price Targets** -- Mean, high, and low price targets from real analysts
- **Stock Forecasts** -- EPS and Revenue actual vs. estimate with surprise percentage
- **Corporate Actions** -- Dividends, board meetings, and bonus events on a timeline
- **Documents & Filings** -- Conference calls, annual reports, announcements, credit ratings, regulatory filings
- **Peer Comparison Strip** -- Quick comparison against sector peers
- **Earnings Calendar** -- Upcoming board meetings across stocks
- **News Sentiment** -- AI-powered sentiment classification (positive/neutral/negative) of company news
- **Export PDF** -- One-click PDF export of the full dashboard

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript 5.5, Vite 5.4 (SWC) |
| **Styling** | Tailwind CSS 3.4, shadcn/ui (Radix UI primitives), Lucide icons |
| **Fonts** | Geist + Geist Mono |
| **Charts** | TradingView Lightweight Charts |
| **State** | React Query (TanStack Query v5), React hooks |
| **Routing** | React Router DOM v6 |
| **Backend** | Express 5, Node.js 20+ |
| **Auth** | JWT with bcrypt password hashing |
| **AI** | OpenAI GPT-4o-mini (server-side proxy for analysis + sentiment) |
| **Data** | [IndianAPI](https://indianapi.in/) -- all 38 endpoints utilized |
| **Deployment** | Railway (Railpack) |

## Performance

- **Server-side API proxy** -- no CORS issues, API key never reaches the browser
- **1-hour server cache** with a manual Refresh button to bust cache on demand
- **Retry logic** on all API calls (1 retry, 1-second delay)
- **Stale-while-revalidate** client-side cache via React Query
- **Prefetch on watchlist hover** -- data loads before the user clicks
- **Code splitting** -- non-dashboard pages are lazy-loaded; prefetched after 3 seconds
- **Server-side data aggregation** endpoint reduces round-trips for the dashboard
- **Dynamic catalogs** -- 5,400+ stock catalog and 251 mutual fund catalog

## Security

- JWT authentication with bcrypt-hashed passwords
- API keys stored server-side only (never in the browser bundle)
- Protected routes require login

## Project Structure

```
server/
├── index.ts               # Express server entry point
├── cache.ts               # 1-hour server-side cache layer
├── stockCatalog.ts        # Dynamic stock catalog (5,400+ stocks)
└── routes/
    ├── auth.ts            # JWT login / token verification
    ├── proxy.ts           # IndianAPI proxy (all 38 endpoints)
    ├── ai.ts              # GPT-4o-mini analysis + sentiment proxy
    └── stock.ts           # Aggregated stock data endpoint

src/
├── pages/
│   ├── Index.tsx          # Dashboard (stock analysis)
│   ├── Market.tsx         # Heatmap, gainers/losers, most active
│   ├── Compare.tsx        # Side-by-side stock comparison
│   ├── Screener.tsx       # Industry/sector stock screener
│   ├── IPO.tsx            # IPO listings (upcoming, open, listed)
│   ├── MutualFunds.tsx    # Mutual fund browser + NAV chart
│   ├── Commodities.tsx    # MCX futures + OI signal
│   ├── News.tsx           # Paginated market news
│   ├── Login.tsx          # Authentication page
│   └── NotFound.tsx       # 404 page
├── components/
│   ├── stocks/
│   │   ├── StockChart.tsx         # TradingView Lightweight Charts (1D–MAX, SMA)
│   │   ├── StockSummary.tsx       # Key stats panel, day/52-week range
│   │   ├── StockAnalysis.tsx      # AI Analyst (GPT-4o-mini analysis)
│   │   ├── AnalystTargets.tsx     # Mean/high/low price targets
│   │   ├── Forecasts.tsx          # EPS & Revenue actual vs estimate
│   │   ├── CorporateActions.tsx   # Dividends, board meetings, bonus
│   │   ├── Documents.tsx          # Filings, reports, announcements
│   │   ├── PeerStrip.tsx          # Peer comparison strip
│   │   └── EarningsCalendar.tsx   # Upcoming board meetings
│   ├── layout/
│   │   ├── Sidebar.tsx            # App sidebar navigation
│   │   ├── TopBar.tsx             # Top bar with search
│   │   └── AppShell.tsx           # Layout wrapper
│   ├── auth/
│   │   └── ProtectedRoute.tsx     # Route guard (JWT check)
│   └── ui/                        # shadcn/ui component library
├── contexts/
│   └── AuthContext.tsx             # Authentication state provider
├── services/
│   ├── indianStockService.ts      # IndianAPI service layer
│   └── aiService.ts               # AI analysis + sentiment service
├── lib/
│   ├── auth.ts                    # Auth helper utilities
│   ├── fetchRetry.ts              # Fetch with retry (1 retry, 1s delay)
│   └── utils.ts                   # Utility functions (cn helper)
├── App.tsx                        # Root component with providers and routing
└── main.tsx                       # Entry point
```

## Getting Started

### Prerequisites

- **Node.js 20+** with npm
- An [IndianAPI](https://indianapi.in/) API key (for all market data)
- An [OpenAI API](https://platform.openai.com/) key (for AI analysis and sentiment)

### Environment Variables

Create a `.env` file in the project root:

```env
# Frontend
VITE_INDIAN_API_KEY=your-key
VITE_OPENAI_API_KEY=

# Server
INDIAN_API_KEY=your-key
OPENAI_API_KEY=your-openai-key
AUTH_USERNAME=your-username
AUTH_PASSWORD_HASH=$2b$10$...
JWT_SECRET=your-64-byte-hex
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jeevanba273/AI-Powered-Stock-Analysis.git
   cd AI-Powered-Stock-Analysis
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in all variables listed above.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:8080
   ```

### Build for Production

```bash
npm run build
npm run preview
```

## Deployment

The application is deployed on [Railway](https://railway.app/) using Railpack:

1. Fork this repository
2. Create a new project on Railway
3. Connect your GitHub repository
4. Add all environment variables (see above)
5. Deploy -- Railway auto-detects the build via Railpack

## Acknowledgements

- [IndianAPI](https://indianapi.in/) for comprehensive Indian stock market data (all 38 endpoints)
- [OpenAI](https://openai.com/) for GPT-4o-mini powering AI analysis and news sentiment
- [TradingView](https://tradingview.github.io/lightweight-charts/) for Lightweight Charts
- [shadcn/ui](https://ui.shadcn.com/) for the component library

---

<p align="center">
  Built with care by <a href="https://github.com/jeevanba273">JEEVAN B A</a>
</p>

<p align="center">
  <a href="https://ai-powered-stock-analysis.up.railway.app/">Visit NeuraStock</a> | 
  <a href="https://github.com/jeevanba273/AI-Powered-Stock-Analysis/issues">Report Bug</a> | 
  <a href="https://github.com/jeevanba273/AI-Powered-Stock-Analysis/issues">Request Feature</a>
</p>
