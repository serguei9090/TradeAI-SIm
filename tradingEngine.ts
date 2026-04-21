import db from './db';

// A simple in-memory flag to control the engine
let isEngineRunning = false;

export const setEngineRunning = (running: boolean) => {
  isEngineRunning = running;
  console.log(`Trading engine is now ${running ? 'RUNNING' : 'STOPPED'}`);
};

export const getEngineRunning = () => isEngineRunning;

const evaluateStock = async (symbol: string) => {
  if (!isEngineRunning) return;

  try {
    // 1. Fetch current price
    const apiKey = process.env.FINNHUB_API_KEY;
    let currentPrice = 0;
    if (apiKey) {
      const priceRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
      const priceData = await priceRes.json();
      currentPrice = priceData.c || 0;
    } else {
      console.warn("FINNHUB_API_KEY missing, using mock price");
      currentPrice = 150 + Math.random() * 10;
    }

    if (currentPrice === 0) return;

    // 2. Mock sentiment (or real sentiment if API available)
    const sentimentScore = Math.floor(Math.random() * 100);
    const sentimentLabel = sentimentScore > 60 ? 'Bullish' : sentimentScore < 40 ? 'Bearish' : 'Neutral';

    // 3. Ask AI for decision
    // We'll construct a prompt and call the local proxy logic
    const prompt = `You are an expert AI trading bot.
The current stock is ${symbol}.
The current price is $${currentPrice.toFixed(2)}.
The market sentiment is ${sentimentLabel} (Score: ${sentimentScore}/100).
Based on this information, should we BUY, SELL, or HOLD?
Respond with ONLY ONE WORD: BUY, SELL, or HOLD.`;

    // Fetch config for AI
    const provider = process.env.AI_PROVIDER || 'custom';
    const targetUrl = process.env.AI_API_BASE || 'http://localhost:1234/v1';
    const targetModel = process.env.AI_MODEL || 'local-model';
    const aiApiKey = process.env.AI_API_KEY || "no-key-needed";

    const aiRes = await fetch(`${targetUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const aiData = await aiRes.json();
    const decisionText = aiData.choices?.[0]?.message?.content?.trim().toUpperCase() || 'HOLD';
    let decision = 'HOLD';
    if (decisionText.includes('BUY')) decision = 'BUY';
    if (decisionText.includes('SELL')) decision = 'SELL';

    console.log(`[Trading Engine] Evaluated ${symbol}: Price $${currentPrice.toFixed(2)}, AI Decision: ${decision}`);

    // 4. Execute decision
    if (decision === 'BUY' || decision === 'SELL') {
      executeTrade(symbol, decision, 1, currentPrice); // Default 1 share
    }

  } catch (error) {
    console.error(`[Trading Engine] Error evaluating ${symbol}:`, error);
  }
};

const executeTrade = (symbol: string, type: 'BUY' | 'SELL', shares: number, price: number) => {
  db.serialize(() => {
    db.get("SELECT balance FROM portfolios WHERE id = 'default'", (err, row: any) => {
      if (err) return;
      let currentBalance = row ? row.balance : 10000;
      const cost = shares * price;

      if (type === 'BUY' && currentBalance >= cost) {
        db.run("UPDATE portfolios SET balance = balance - ? WHERE id = 'default'", [cost]);
        db.run("INSERT INTO positions (symbol, shares, entryPrice, stopLoss, takeProfit) VALUES (?, ?, ?, ?, ?)",
          [symbol, shares, price, price * 0.9, price * 1.1]);
        db.run("INSERT INTO trade_history (symbol, type, shares, price) VALUES (?, ?, ?, ?)",
          [symbol, 'BUY', shares, price]);
      } else if (type === 'SELL') {
        db.run("UPDATE portfolios SET balance = balance + ? WHERE id = 'default'", [cost]);
        db.run("DELETE FROM positions WHERE symbol = ?", [symbol]);
        db.run("INSERT INTO trade_history (symbol, type, shares, price) VALUES (?, ?, ?, ?)",
          [symbol, 'SELL', shares, price]);
      }
    });
  });
};

export const startEngine = () => {
  setInterval(() => {
    if (!isEngineRunning) return;

    // Fetch approved stocks and evaluate each
    db.all("SELECT symbol FROM approved_stocks", (err, rows: any[]) => {
      if (err) return console.error("Error fetching approved stocks for engine");
      rows.forEach(row => {
        evaluateStock(row.symbol);
      });
    });
  }, 10000); // Evaluate every 10 seconds for demo purposes
};
