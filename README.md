
# NeuraStock: AI-Powered Stock Analysis Platform

[![Live Demo](https://img.shields.io/badge/demo-live-green.svg)](https://ai-powered-stock-analysis.up.railway.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg?logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.0-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-latest-000.svg)](https://ui.shadcn.com/)
[![Recharts](https://img.shields.io/badge/Recharts-2.12.7-22B5BF.svg)](https://recharts.org/)

![NeuraStock Banner](https://i.imgur.com/XYZ123.png) <!-- Replace with your banner image URL -->

## 🚀 Overview

**NeuraStock** is a cutting-edge AI-powered stock analysis platform designed specifically for the Indian stock market. It combines advanced technical analysis with machine learning to provide detailed insights, trend predictions, and intelligent recommendations for investors.

### [✨ Live Demo](https://ai-powered-stock-analysis.up.railway.app/)

## 📋 Key Features

- **🧠 AI-Powered Analysis**: Advanced algorithms analyze market data to provide detailed insights and recommendations
- **📈 Real-time Technical Analysis**: Get support/resistance levels, technical patterns, and risk assessments
- **🔮 Trend Prediction**: Short, medium, and long-term trend forecasting
- **📊 Interactive Charts**: Visualize price movements and volume with responsive charts
- **📰 News Sentiment Analysis**: AI-driven analysis of news articles to gauge market sentiment
- **🔍 Comprehensive Stock Database**: Extensive catalog of Indian stocks (NSE & BSE)
- **📱 Fully Responsive**: Seamless experience across desktop and mobile devices

## 🖼️ Screenshots

<div align="center">
  <img src="https://i.imgur.com/example1.png" alt="NeuraStock Dashboard" width="80%"/>
  <p><em>Main dashboard with AI analysis and stock charts</em></p>
  
  <img src="https://i.imgur.com/example2.png" alt="Technical Patterns" width="40%"/>
  <img src="https://i.imgur.com/example3.png" alt="Sentiment Analysis" width="40%"/>
  <p><em>Technical pattern detection and news sentiment analysis</em></p>
</div>

## 🛠️ Technologies Used

### Frontend
- **React 18**: Modern component-based UI library
- **TypeScript**: Type-safe JavaScript for robust development
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components
- **Recharts**: Responsive charting library
- **Lucide React**: Beautiful & consistent icon set

### Analysis Tools
- **Technical Indicators**: Moving averages, RSI, MACD, Bollinger Bands
- **Pattern Recognition**: Detects common chart patterns (e.g., double tops, head & shoulders)
- **AI Integration**: Machine learning models for stock analysis and recommendations
- **Sentiment Analysis**: Processes news content to determine market sentiment

### Data Handling
- **React Query**: Efficient data fetching and state management
- **Custom Hooks**: Reusable logic for improved maintainability

## 🧩 Core Components

### Stock Analysis
- **AI Analysis Engine**: Processes historical data to generate insights
- **Technical Pattern Detection**: Identifies chart patterns and their significance
- **Support/Resistance Calculator**: Determines key price levels
- **News Sentiment Analyzer**: Evaluates news articles for positive/negative sentiment

### Visualization
- **Price Chart**: Interactive area chart with tooltips
- **Volume Analysis**: Bar chart showing trading volume
- **Trend Indicators**: Visual representation of trend directions
- **Sentiment Indicators**: Visual breakdown of positive vs negative news

### User Interface
- **Stock Search**: Fast search with autocomplete for Indian stocks
- **Dashboard Layout**: Organized view of all analysis components
- **Responsive Design**: Adapts seamlessly to all screen sizes

## 📊 Sample Analysis Output

```json
{
  "recommendation": "Buy",
  "analysis": "The stock shows strong momentum with consistent higher lows forming a clear uptrend channel.",
  "risk": 3,
  "riskLevel": "Moderate",
  "supportResistance": {
    "support": [1250, 1200, 1150],
    "resistance": [1350, 1400, 1450]
  },
  "technicalPatterns": [
    "Uptrend channel formation",
    "Golden cross on 50/200 day MA",
    "Support level consolidation"
  ]
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Basic knowledge of React and TypeScript

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/neurastock.git
cd neurastock
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Configure environment variables
```bash
cp .env.example .env
# Add your API keys and configuration
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open your browser
```
http://localhost:5173
```

## 🌐 Deployment

The application is currently deployed on [Railway](https://railway.app/). To deploy your own instance:

1. Fork this repository
2. Create a new project on Railway
3. Connect your GitHub repository
4. Configure environment variables
5. Deploy!

## 🔍 How It Works

1. **Data Collection**: The platform sources historical stock data, news, and market information
2. **Analysis Processing**:
   - Technical indicators are calculated (SMA, EMA, RSI, MACD)
   - Chart patterns are detected using algorithmic pattern recognition
   - Support and resistance levels are calculated using local minima/maxima
3. **AI Processing**:
   - Data is processed to generate risk assessment and trend predictions
   - News articles are analyzed for sentiment analysis and market mood
   - Machine learning models evaluate multiple factors to provide recommendations
4. **Visualization**: Results are displayed through interactive charts and visual components

## 🔮 Future Roadmap

- [ ] Portfolio tracking and management
- [ ] Custom watchlists and alerts
- [ ] Advanced screener with AI-powered filters
- [ ] Backtesting tools for strategy validation
- [ ] Export/share analysis reports

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [IndianAPI](https://indianapi.in/) for market data API
- [OpenAI API](https://openai.com/api/) for AI analysis and sentiment processing
- [TradingView](https://www.tradingview.com/) for chart inspiration
- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Alpha Vantage](https://www.alphavantage.co/) for market data API concepts

## 📬 Contact

For questions, suggestions, or collaborations:

- **Email**: [your.email@example.com](mailto:your.email@example.com)
- **Twitter**: [@yourusername](https://twitter.com/yourusername)
- **LinkedIn**: [Your Name](https://linkedin.com/in/yourname)

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/yourusername">Your Name</a>
</p>

<p align="center">
  <a href="https://ai-powered-stock-analysis.up.railway.app/">Visit NeuraStock</a> | 
  <a href="https://github.com/yourusername/neurastock/issues">Report Bug</a> | 
  <a href="https://github.com/yourusername/neurastock/issues">Request Feature</a>
</p>

