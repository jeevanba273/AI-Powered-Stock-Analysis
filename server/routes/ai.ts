import { Router, Request, Response } from 'express';

const router = Router();
const OPENAI_KEY = () => process.env.OPENAI_API_KEY || '';
const INDIAN_API_KEY = () => process.env.INDIAN_API_KEY || process.env.VITE_INDIAN_API_KEY || '';
const DEV_BASE = 'https://dev.indianapi.in';

const apiFetch = async (path: string): Promise<any> => {
  try {
    const res = await fetch(`${DEV_BASE}${path}`, {
      headers: { 'X-API-Key': INDIAN_API_KEY(), 'Content-Type': 'application/json' }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
};

const SYSTEM_PROMPT = `You are an expert Indian stock market analyst with deep knowledge of technical analysis, fundamental analysis, and market dynamics. You analyze stocks listed on NSE and BSE.

When given stock data, you MUST return ONLY a valid JSON object with these exact fields:

{
  "recommendation": "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell",
  "risk": 1-5 (integer, where 1=Very Low, 2=Low, 3=Moderate, 4=High, 5=Very High),
  "riskLevel": "Very Low" | "Low" | "Moderate" | "High" | "Very High",
  "technicalPatterns": ["pattern1", "pattern2", "pattern3", "pattern4"] (exactly 4 patterns detected),
  "supportResistance": {
    "support": [level1, level2] (2 numeric support price levels, no currency symbols),
    "resistance": [level1, level2] (2 numeric resistance price levels, no currency symbols)
  },
  "analysis": "A detailed 4-5 paragraph analysis text..."
}

RULES FOR EACH FIELD:

RECOMMENDATION: Base on the confluence of:
- Price trend (uptrend/downtrend/sideways from recent price action)
- RSI levels (overbought >70, oversold <30)
- Moving average positioning (price vs SMA20/SMA50, golden/death crosses)
- Volume confirmation (is volume supporting the move?)
- Fundamental valuation (P/E vs industry P/E, ROE, debt levels)
- Quarterly earnings trend (revenue/profit growth or decline)
- News sentiment (recent headlines positive/negative?)
- Analyst consensus targets (current price vs mean target)
- Peer comparison (how does this stock compare to sector peers?)

RISK (1-5): Evaluate based on:
- Price volatility over the last 30 days
- P/E ratio relative to industry P/E
- Debt-to-equity ratio
- Recent earnings surprise (beat or miss)
- Analyst target price distance from current price
- Sector headwinds/tailwinds from news

TECHNICAL PATTERNS (exactly 4): Identify the most relevant from the data. Be SPECIFIC — reference actual price levels and values:
- "Golden Cross (SMA20 crossed above SMA50)" or "Death Cross..."
- "RSI at 28 — oversold, potential reversal zone"
- "Price testing resistance at ₹X with 1.5x average volume"
- "Bearish divergence — price rising but declining volume"
- "Support holding at ₹X (tested 3 times in last month)"
DO NOT use generic patterns. Use real numbers from the data.

SUPPORT & RESISTANCE: Calculate from recent local minima/maxima, round numbers, and moving average levels. Return as plain numbers WITHOUT currency symbols.

ANALYSIS TEXT: Write 4-5 detailed paragraphs covering:
1. Technical Setup — trend direction, RSI, MACD equivalent (momentum), moving average positioning, volume analysis with actual numbers
2. Fundamental Assessment — P/E valuation vs industry, ROE, debt profile, quarterly revenue/profit trend, dividend yield
3. News & Sentiment — synthesize recent headlines, what they mean for the stock, any catalysts or risks mentioned
4. Analyst View — consensus target price, how many analysts, upside/downside from current price, recent earnings surprises
5. Conclusion — clear actionable view with entry/exit levels, timeframe, and key risks to watch

Be specific to THIS stock. Use actual numbers, company name, price levels. Professional but accessible tone. This analysis will be shown to retail investors.

CRITICAL: Return ONLY the JSON object. No markdown code blocks, no explanation outside the JSON.`;

router.post('/analyze', async (req: Request, res: Response) => {
  const apiKey = OPENAI_KEY();
  if (!apiKey) {
    res.status(500).json({ error: 'OpenAI API key not configured' });
    return;
  }

  try {
    const { ticker, price, change, changePercent, stats, newsHeadlines, historicalPrices } = req.body;
    const t0 = Date.now();

    // Fetch additional data server-side in parallel
    const [analystData, quarterData, peerData, actionsData] = await Promise.all([
      apiFetch(`/stock_target_price?stock_id=${ticker}`),
      apiFetch(`/historical_stats?stock_name=${ticker}&stats=quarter_results`),
      apiFetch(`/get_stock_data?stock_name=${ticker}`),
      apiFetch(`/corporate_actions?stock_name=${ticker}`),
    ]);

    // Build analyst targets section
    let analystSection = 'No analyst data available.';
    if (analystData?.priceTarget) {
      const pt = analystData.priceTarget;
      const rec = analystData.recommendation;
      analystSection = `ANALYST CONSENSUS:
- Price Target: Mean ₹${pt.Mean}, High ₹${pt.High}, Low ₹${pt.Low}, Median ₹${pt.Median}
- Number of Analysts: ${pt.NumberOfEstimates}
- Recommendation Score: ${rec?.Mean?.toFixed(1) || 'N/A'}/5 (1=Buy, 5=Sell)
- Upside/Downside from current price: ${price ? ((pt.Mean / price - 1) * 100).toFixed(1) + '%' : 'N/A'}`;
    }

    // Build quarterly financials section
    let quarterSection = 'No quarterly financial data available.';
    if (quarterData && typeof quarterData === 'object') {
      const metrics = ['Sales', 'Net Profit', 'Operating Profit', 'OPM %', 'EPS in Rs'];
      const lines: string[] = [];
      for (const metric of metrics) {
        if (quarterData[metric]) {
          const entries = Object.entries(quarterData[metric]).slice(-6);
          lines.push(`${metric}: ${entries.map(([k, v]) => `${k}: ${v}`).join(', ')}`);
        }
      }
      if (lines.length > 0) {
        quarterSection = `QUARTERLY FINANCIALS (last 6 quarters, in Cr):\n${lines.join('\n')}`;
      }
    }

    // Build peer comparison section
    let peerSection = 'No peer data available.';
    const peers = peerData?.companyProfile?.peerCompanyList || peerData?.peerCompanyList || [];
    if (peers.length > 0) {
      peerSection = `PEER COMPARISON:\n${peers.slice(0, 5).map((p: any) =>
        `- ${p.companyName}: Price ₹${p.price}, P/E ${p.priceToEarningsValueRatio?.toFixed(1) || 'N/A'}, MCap ${p.marketCap?.toLocaleString() || 'N/A'}Cr, Change ${p.percentChange?.toFixed(2)}%`
      ).join('\n')}`;
    }

    // Build recent dividends section
    let dividendSection = '';
    if (actionsData?.dividends?.data?.length > 0) {
      const recent = actionsData.dividends.data.slice(0, 3);
      dividendSection = `\nRECENT DIVIDENDS:\n${recent.map((d: any) => `- ${d[0] || 'N/A'}: ${d[2] || 'N/A'}% — ${(d[4] || '').slice(0, 100)}`).join('\n')}`;
    }

    // Industry P/E from stock details
    const industryPE = peerData?.stats?.industryPe || stats?.industryPe;
    const companyIndustry = peerData?.industry || '';

    const userPrompt = `Analyze ${ticker} stock with the following comprehensive real-time data:

CURRENT PRICE: ₹${price}
CHANGE: ₹${change} (${changePercent}%)
INDUSTRY: ${companyIndustry}

KEY FUNDAMENTALS:
- Open: ₹${stats?.open || 'N/A'}
- Day High: ₹${stats?.high || 'N/A'}
- Day Low: ₹${stats?.low || 'N/A'}
- Previous Close: ₹${stats?.prevClose || stats?.close || 'N/A'}
- Volume: ${stats?.volume?.toLocaleString() || 'N/A'}
- Market Cap: ${stats?.marketCap || 'N/A'}
- P/E Ratio: ${stats?.pe || 'N/A'} (Industry P/E: ${industryPE || 'N/A'})
- P/B Ratio: ${peerData?.stats?.pbRatio || 'N/A'}
- Book Value: ${stats?.bookValue || 'N/A'}
- ROE: ${stats?.roe || 'N/A'}%
- ROIC: ${peerData?.stats?.roic?.toFixed(1) || 'N/A'}%
- Debt to Equity: ${stats?.debtToEquity || 'N/A'}
- Dividend Yield: ${stats?.dividend || 'N/A'}
- EPS (TTM): ${peerData?.stats?.epsTtm || 'N/A'}
- Operating Profit Margin: ${peerData?.stats?.operatingProfitMargin?.toFixed(1) || 'N/A'}%
- Net Profit Margin: ${peerData?.stats?.netProfitMargin?.toFixed(1) || 'N/A'}%
- EV/EBITDA: ${peerData?.stats?.evToEbitda || 'N/A'}
- PEG Ratio: ${peerData?.stats?.pegRatio?.toFixed(2) || 'N/A'}

PRICE HISTORY (last 30 trading days, newest first):
${(historicalPrices || []).slice(-30).reverse().map((p: any) => `${p.date}: ₹${p.close}${p.volume ? ' (vol: ' + p.volume.toLocaleString() + ')' : ''}`).join('\n')}

${analystSection}

${quarterSection}

${peerSection}
${dividendSection}

${newsHeadlines && newsHeadlines.length > 0 ? `RECENT NEWS (last 10 headlines):\n${newsHeadlines.slice(0, 10).map((n: any, i: number) => `${i + 1}. ${n.title || n} (${n.source || ''}, ${n.published || n.pub_date || ''})`).join('\n')}` : 'No recent news available.'}

Provide your comprehensive analysis as the specified JSON object.`;

    console.log(`[AI] Sending ${ticker} analysis request (${userPrompt.length} chars prompt)...`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`[AI] OpenAI error ${response.status}: ${err.slice(0, 300)}`);
      res.status(response.status).json({ error: 'OpenAI API error', details: err.slice(0, 200) });
      return;
    }

    const data: any = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const ms = Date.now() - t0;
    console.log(`[AI] Analysis for ${ticker} complete — ${data.usage?.total_tokens} tokens, ${ms}ms`);

    // Parse JSON from response
    let jsonStr = content;
    if (jsonStr.includes('```json')) jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
    else if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
    jsonStr = jsonStr.replace(/₹\s*/g, '');

    const analysis = JSON.parse(jsonStr);
    res.json(analysis);
  } catch (error: any) {
    console.error(`[AI] Analysis error: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate analysis', details: error.message });
  }
});

export default router;
