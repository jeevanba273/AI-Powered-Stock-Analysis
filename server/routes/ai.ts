import { Router, Request, Response } from 'express';

const router = Router();
const OPENAI_KEY = () => process.env.OPENAI_API_KEY || '';

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
  "analysis": "A detailed 3-4 paragraph analysis text..."
}

RULES FOR EACH FIELD:

RECOMMENDATION: Base this on the confluence of:
- Price trend (uptrend/downtrend/sideways based on recent price action)
- RSI levels (overbought >70, oversold <30)
- Moving average positioning (price vs SMA20/SMA50, golden/death crosses)
- Volume confirmation (is volume supporting the move?)
- Fundamental valuation (P/E vs industry, market cap, ROE)
- News sentiment (recent headlines positive/negative?)
- Risk-reward ratio at current levels

RISK (1-5): Evaluate based on:
- Price volatility over the last 30 days
- P/E ratio relative to industry peers
- Debt-to-equity ratio
- Recent earnings surprise (beat or miss)
- Sector headwinds/tailwinds
- Market breadth and macro conditions

TECHNICAL PATTERNS (exactly 4): Identify the most relevant patterns from the data. Each pattern should be specific and actionable. Examples:
- "Golden Cross (SMA20 crossed above SMA50)" or "Death Cross (SMA20 crossed below SMA50)"
- "RSI oversold at 28 — potential reversal zone"
- "Bullish MACD crossover with expanding histogram"
- "Price testing resistance at ₹X with increasing volume"
- "Double bottom formation near ₹X support"
- "Bearish divergence — price rising but RSI falling"
- "Volume spike 2x average — institutional accumulation/distribution"
- "Bollinger Band squeeze — breakout imminent"
DO NOT use generic patterns. Reference actual price levels and indicator values from the data.

SUPPORT & RESISTANCE: Calculate from:
- Recent local minima (price lows where bounces occurred) for support
- Recent local maxima (price highs where rejections occurred) for resistance
- Round number levels
- Moving average levels that act as dynamic support/resistance
Return as plain numbers WITHOUT currency symbols (e.g., 2350.50, not ₹2350.50).

ANALYSIS TEXT: Write 3-4 paragraphs that synthesize:
1. Current technical setup — trend direction, key indicator readings (RSI, MACD, moving averages), volume analysis
2. Support/resistance context — where the stock sits relative to key levels, what a break above/below would mean
3. Fundamental backdrop — P/E valuation, recent earnings, sector dynamics, any relevant news
4. Actionable conclusion — what should an investor do at this price, entry/exit levels, timeframe

The analysis should be specific to THIS stock with actual numbers, not generic. Reference the company name, specific price levels, and indicator values. Write in a professional but accessible tone.

CRITICAL: Return ONLY the JSON object. No markdown, no code blocks, no explanation outside the JSON.`;

router.post('/analyze', async (req: Request, res: Response) => {
  const apiKey = OPENAI_KEY();
  if (!apiKey) {
    res.status(500).json({ error: 'OpenAI API key not configured' });
    return;
  }

  try {
    const { ticker, price, change, changePercent, stats, newsHeadlines, historicalPrices } = req.body;

    const userPrompt = `Analyze ${ticker} stock with the following real-time data:

CURRENT PRICE: ₹${price}
CHANGE: ₹${change} (${changePercent}%)

KEY STATS:
- Open: ₹${stats?.open || 'N/A'}
- Day High: ₹${stats?.high || 'N/A'}
- Day Low: ₹${stats?.low || 'N/A'}
- Previous Close: ₹${stats?.prevClose || stats?.close || 'N/A'}
- Volume: ${stats?.volume?.toLocaleString() || 'N/A'}
- Market Cap: ${stats?.marketCap || 'N/A'}
- P/E Ratio: ${stats?.pe || 'N/A'}
- Book Value: ${stats?.bookValue || 'N/A'}
- ROE: ${stats?.roe || 'N/A'}%
- Debt to Equity: ${stats?.debtToEquity || 'N/A'}
- Dividend Yield: ${stats?.dividend || 'N/A'}

RECENT PRICE HISTORY (last 30 data points, newest first):
${(historicalPrices || []).slice(-30).reverse().map((p: any) => `${p.date}: ₹${p.close}${p.volume ? ' (vol: ' + p.volume + ')' : ''}`).join('\n')}

${newsHeadlines && newsHeadlines.length > 0 ? `RECENT NEWS HEADLINES:\n${newsHeadlines.slice(0, 10).map((n: any, i: number) => `${i + 1}. ${n.title || n} (${n.source || ''} ${n.published || n.pub_date || ''})`).join('\n')}` : 'No recent news available.'}

Provide your analysis as the specified JSON object.`;

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
        max_tokens: 1500,
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
    console.log(`[AI] Analysis for ${ticker} — ${data.usage?.total_tokens} tokens`);

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    if (jsonStr.includes('```json')) jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
    else if (jsonStr.includes('```')) jsonStr = jsonStr.split('```')[1].split('```')[0].trim();

    // Remove currency symbols before parsing
    jsonStr = jsonStr.replace(/₹\s*/g, '');

    const analysis = JSON.parse(jsonStr);
    res.json(analysis);
  } catch (error: any) {
    console.error(`[AI] Analysis error: ${error.message}`);
    res.status(500).json({ error: 'Failed to generate analysis', details: error.message });
  }
});

export default router;
