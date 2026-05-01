
# NeuraStock: AI-Powered Stock Analysis Platform

[![Live Demo](https://img.shields.io/badge/demo-live-green.svg)](https://ai-powered-stock-analysis.up.railway.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-000.svg)](https://ui.shadcn.com/)
[![Recharts](https://img.shields.io/badge/Recharts-2.12.7-22B5BF.svg)](https://recharts.org/)

## Overview

**NeuraStock** is an AI-powered stock analysis platform built for the **Indian stock market (NSE & BSE)**. It fetches live market data, runs technical analysis algorithms locally, and optionally leverages OpenAI's GPT-4o-mini for deeper insights — all presented through interactive charts and a clean dashboard UI.

## Live Demo

[**ai-powered-stock-analysis.up.railway.app**](https://ai-powered-stock-analysis.up.railway.app/)

## Key Features

### Real-Time Market Data
- Live stock prices via the IndianAPI batch price endpoint (NSE)
- 3-year historical price and volume data
- Company fundamentals: P/E ratio, market cap, book value, ROE, debt-to-equity
- IST-aware market open/closed status detection
- Searchable catalog of **4,798 Indian stocks** with NSE and BSE codes

### AI-Powered Technical Analysis
- **Dual analysis engine**: local algorithmic analysis runs first; OpenAI GPT-4o-mini is used as a fallback/enhancement
- **Technical indicators**: RSI, MACD, Bollinger Bands, SMA/EMA crossovers (20/50-day)
- **Pattern recognition**: Doji, Three White Soldiers, Three Black Crows, Golden Cross, Death Cross, resistance breakouts, support breakdowns
- **Support & resistance levels**: calculated from local price minima/maxima
- **Risk assessment**: 1-5 scale based on price volatility, P/E ratio, and recent momentum
- **Recommendations**: Strong Buy / Buy / Hold / Sell / Strong Sell based on short and medium-term momentum

### Trend Analysis
- **Current Trend Analysis**: Linear regression over 1-week, 1-month, and 3-month windows with R-squared strength measurement and volatility classification
- **Future Trend Prediction**: Short, mid, and long-term outlook derived from pattern formations, support/resistance profiles, and AI recommendation signals

### News Sentiment Analysis
- Fetches company-specific news via IndianAPI
- AI-driven sentiment classification (Positive / Neutral / Negative) with percentage breakdown
- Uses OpenAI GPT-4o-mini for sentiment scoring with graceful fallback to neutral defaults

### Interactive Charts
- **Price chart**: Area chart with gradient fill, custom tooltips showing OHLCV data and daily change percentage
- **Volume chart**: Bar chart with formatted volume display (K/M/B)
- Built with Recharts, fully responsive

### Detailed Financials Dialog
- Company overview and industry classification
- Key fundamentals (from API)
- Yearly and quarterly financial statements (Revenue, Profit, etc.)
- Advanced statistics with auto-formatted labels (P/E, P/B, EV, ROE, ROIC, etc.)
- 52-week price range for both NSE and BSE

### Stock Search
- Instant autocomplete search across 4,798+ stocks by name, NSE code, or BSE code
- Quick-access buttons for popular Indian stocks (TCS, Reliance, Infosys, HDFC Bank, ICICI Bank, SBI, Tata Motors, Bharti Airtel)
- Click-outside-to-close dropdown with keyboard-friendly UX

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Framework** | React 18, TypeScript 5.5, Vite 5.4 (SWC) |
| **Styling** | Tailwind CSS 3.4, shadcn/ui (Radix UI primitives), Lucide icons |
| **Charts** | Recharts 2.12 |
| **State** | React Query (TanStack Query v5), React hooks |
| **Routing** | React Router DOM v6 |
| **APIs** | [IndianAPI](https://indianapi.in/) (market data), [OpenAI API](https://platform.openai.com/) (GPT-4o-mini for analysis & sentiment) |
| **Deployment** | Railway |

## Project Structure

```
src/
├── components/
│   ├── stocks/
│   │   ├── AIAnalysisResults.tsx    # Full analysis display with patterns, risk, S/R levels, insights
│   │   ├── AIErrorState.tsx         # Error handling UI for analysis failures
│   │   ├── AILoadingState.tsx       # Pre-analysis placeholder state
│   │   ├── CurrentTrendAnalysis.tsx  # Linear regression trend analysis (1W/1M/3M)
│   │   ├── FutureTrendAnalysis.tsx   # Predictive trend outlook based on AI signals
│   │   ├── StockAnalysis.tsx        # Analysis orchestration component
│   │   ├── StockChart.tsx           # Price area chart + volume bar chart
│   │   ├── StockSearch.tsx          # Search bar with autocomplete dropdown
│   │   ├── StockSearchDialog.tsx    # Dialog-based stock search (Command palette)
│   │   └── StockSummary.tsx         # Price card with stats + detailed financials dialog
│   └── ui/                          # shadcn/ui component library
├── config/
│   ├── apiKeys.ts                   # Environment variable loader for API keys
│   └── apiKeys.example.ts          # Example configuration
├── data/
│   └── stocksCatalog.ts            # 4,798 Indian stocks (NSE + BSE codes)
├── services/
│   ├── aiService.ts                # AI analysis engine (local algorithms + OpenAI fallback)
│   ├── indianStockService.ts       # IndianAPI integration (live prices, historical, news)
│   └── stockService.ts             # Legacy wrapper (redirects to indianStockService)
├── pages/
│   ├── Index.tsx                   # Main dashboard page
│   └── NotFound.tsx                # 404 page
├── hooks/
│   └── use-mobile.tsx              # Mobile breakpoint detection hook
├── lib/
│   └── utils.ts                    # Utility functions (cn helper)
├── App.tsx                         # Root component with providers and routing
└── main.tsx                        # Entry point
```

## Getting Started

### Prerequisites

- **Node.js 16+** with npm (or Bun — `bun.lockb` is included)
- An [IndianAPI](https://indianapi.in/) API key (for stock data)
- An [OpenAI API](https://platform.openai.com/) key (optional — local algorithms work without it)

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
   Edit `.env` and add your API keys:
   ```
   VITE_INDIAN_API_KEY=your-indian-api-key-here
   VITE_OPENAI_API_KEY=your-openai-api-key-here
   ```

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

## How It Works

1. **Data Fetching** — When a stock is selected, four parallel API calls fetch live price, 3-year historical data, company fundamentals, and recent news from IndianAPI.

2. **News Sentiment** — News headlines are sent to OpenAI GPT-4o-mini for sentiment classification, returning a positive/neutral/negative percentage breakdown.

3. **AI Analysis (on demand)** — Clicking "Generate Analysis" triggers the analysis engine:
   - **Local algorithms run first**: risk scoring (volatility + P/E + momentum), pattern detection (RSI, MACD, Bollinger Bands, candlestick patterns, MA crossovers), support/resistance from local minima/maxima, and recommendation based on short/medium-term returns.
   - **OpenAI fallback**: If local analysis fails, the same data is sent to GPT-4o-mini with a structured JSON prompt for analysis, patterns, risk, and recommendations.
   - **Triple fallback**: If OpenAI also fails or returns unparseable JSON, local algorithms retry. If everything fails, a generic safe response is returned.

4. **Trend Analysis** — Current trends use linear regression with R-squared confidence; future trend predictions combine pattern signals, risk profiles, and AI recommendations.

5. **Visualization** — All results render through interactive Recharts charts and a card-based dashboard layout.

## Deployment

The application is deployed on [Railway](https://railway.app/):

1. Fork this repository
2. Create a new project on Railway
3. Connect your GitHub repository
4. Add environment variables (`VITE_INDIAN_API_KEY`, `VITE_OPENAI_API_KEY`)
5. Deploy — Railway auto-detects the Vite build

## API Reference

| API | Endpoint | Purpose |
|-----|----------|---------|
| IndianAPI | `POST /nse_stock_batch_live_price` | Live stock prices |
| IndianAPI | `GET /historical_data` | 3-year price & volume history |
| IndianAPI | `GET /get_stock_data` | Company details & fundamentals |
| IndianAPI | `GET /company_news` | Company-specific news |
| IndianAPI | `GET /indices` | Market indices (NIFTY 50, Bank NIFTY, India VIX) |
| OpenAI | `POST /v1/chat/completions` | Stock analysis & news sentiment (GPT-4o-mini) |

## Acknowledgements

- [IndianAPI](https://indianapi.in/) for Indian stock market data
- [OpenAI](https://openai.com/) for GPT-4o-mini powering AI analysis and sentiment
- [shadcn/ui](https://ui.shadcn.com/) for the component library
- [Recharts](https://recharts.org/) for charting
- [TradingView](https://www.tradingview.com/) for chart design inspiration

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/jeevanba273">JEEVAN B A</a>
</p>

<p align="center">
  <a href="https://ai-powered-stock-analysis.up.railway.app/">Visit NeuraStock</a> | 
  <a href="https://github.com/jeevanba273/AI-Powered-Stock-Analysis/issues">Report Bug</a> | 
  <a href="https://github.com/jeevanba273/AI-Powered-Stock-Analysis/issues">Request Feature</a>
</p>
