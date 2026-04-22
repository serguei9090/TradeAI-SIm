import db from './db';
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    // Fetch Settings
    const settings: any = await new Promise((resolve) => {
      db.get("SELECT * FROM settings WHERE id = 'default'", (err, row) => resolve(row || {}));
    });

    // 1. Fetch current price
    const apiKey = process.env.FINNHUB_API_KEY;
    let currentPrice = 0;
    if (apiKey) {
      const priceRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
      const priceData = await priceRes.json();
      currentPrice = priceData.c || 0;
    } else {
      currentPrice = 150 + Math.random() * 10;
    }

    if (currentPrice === 0) return;

    // 2. Fetch real news for sentiment
    let newsStr = "No recent news.";
    if (apiKey) {
      const today = new Date().toISOString().split('T')[0];
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const newsRes = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${lastWeek}&to=${today}&token=${apiKey}`);
      const newsData = await newsRes.json();
      if (Array.isArray(newsData) && newsData.length > 0) {
        newsStr = newsData.slice(0, 3).map((n: any) => `- ${n.headline}: ${n.summary}`).join('\n');
      }
    }

    // 3. Ask AI for decision
    const prompt = `You are an expert AI trading bot.
The current stock is ${symbol}.
The current price is ${currentPrice.toFixed(2)}.

Recent News:
${newsStr}

Based on this information and the recent news sentiment, should we BUY, SELL, or HOLD?
Respond with ONLY ONE WORD: BUY, SELL, or HOLD.
Then, on a new line, provide a short 1-sentence reasoning.`;

    // Use settings from DB
        const provider = settings.modelProvider || 'custom';
    const targetModel = settings.customApiModel || process.env.AI_MODEL || 'local-model';

    let rawResponse = 'HOLD\nNo AI response';
    try {
      if (provider === 'gemini') {
        const genAiKey = settings.apiKey || process.env.google_api;
        if (!genAiKey) {
            console.log("Gemini API key missing, skipping trade evaluation.");
            return;
        }
        const genAI = new GoogleGenerativeAI(genAiKey);
        const aiModel = genAI.getGenerativeModel({ model: targetModel });
        const result = await aiModel.generateContent(prompt);
        rawResponse = result.response.text();
      } else {
        const targetUrl = settings.customApiUrl || process.env.AI_API_BASE || 'http://localhost:1234/v1';
        const aiApiKey = settings.apiKey || process.env.AI_API_KEY || "no-key-needed";

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
        rawResponse = aiData.choices?.[0]?.message?.content?.trim() || 'HOLD\nNo AI response';
      }
    } catch(e) {
       console.log("AI request failed, skipping", e);
       return;
    }
    const lines = rawResponse.split('\n');
    const decisionText = lines[0].toUpperCase();
    const reasoning = lines.slice(1).join(' ').trim() || 'No reasoning provided';

    let decision = 'HOLD';
    if (decisionText.includes('BUY')) decision = 'BUY';
    if (decisionText.includes('SELL')) decision = 'SELL';

    const logEntry = `Decision: ${decision}. Price: ${currentPrice.toFixed(2)}. Reasoning: ${reasoning}`;

    db.run("INSERT INTO ai_logs (symbol, log) VALUES (?, ?)", [symbol, logEntry]);

    // 4. Execute decision using risk settings
    if (decision === 'BUY' || decision === 'SELL') {
      const shares = settings.tradeSize || 1;
      const stopLoss = price => price * (1 - (settings.stopLossPct || 10) / 100);
      const takeProfit = price => price * (1 + (settings.takeProfitPct || 10) / 100);

      executeTrade(symbol, decision, shares, currentPrice, stopLoss(currentPrice), takeProfit(currentPrice));
    }

  } catch (error) {
    console.error(`[Trading Engine] Error evaluating ${symbol}:`, error);
  }
};

const executeTrade = (symbol: string, type: 'BUY' | 'SELL', shares: number, price: number, sl: number, tp: number) => {
  db.serialize(() => {
    db.get("SELECT balance FROM portfolios WHERE id = 'default'", (err, row: any) => {
      if (err) return;
      let currentBalance = row ? row.balance : 10000;
      const cost = shares * price;

      if (type === 'BUY' && currentBalance >= cost) {
        db.run("UPDATE portfolios SET balance = balance - ? WHERE id = 'default'", [cost]);
        db.run("INSERT INTO positions (symbol, shares, entryPrice, stopLoss, takeProfit) VALUES (?, ?, ?, ?, ?)",
          [symbol, shares, price, sl, tp]);
        db.run("INSERT INTO trade_history (symbol, type, shares, price) VALUES (?, ?, ?, ?)",
          [symbol, 'BUY', shares, price]);
      } else if (type === 'SELL') {
        // Find existing position to see if we have it
        db.get("SELECT shares FROM positions WHERE symbol = ?", [symbol], (err, pos: any) => {
          if (pos && pos.shares >= shares) {
            db.run("UPDATE portfolios SET balance = balance + ? WHERE id = 'default'", [cost]);
            db.run("DELETE FROM positions WHERE symbol = ?", [symbol]);
            db.run("INSERT INTO trade_history (symbol, type, shares, price) VALUES (?, ?, ?, ?)",
              [symbol, 'SELL', shares, price]);
          }
        });
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
