const fs = require('fs');

let code = `import express from 'express';
import db from './db';
import { getEngineRunning, setEngineRunning } from './tradingEngine';

const router = express.Router();

// Portfolio
router.get('/portfolio', (req, res) => {
  db.get("SELECT * FROM portfolios WHERE id = 'default'", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || { balance: 10000, totalValue: 10000 });
  });
});

// Positions
router.get('/positions', (req, res) => {
  db.all("SELECT * FROM positions", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Trade History
router.get('/trade-history', (req, res) => {
  db.all("SELECT * FROM trade_history ORDER BY timestamp DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Approved Stocks
router.get('/approved-stocks', (req, res) => {
  db.all("SELECT * FROM approved_stocks", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/approved-stocks', (req, res) => {
  const { symbol } = req.body;
  if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

  db.run("INSERT OR IGNORE INTO approved_stocks (symbol) VALUES (?)", [symbol], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, symbol });
  });
});

router.delete('/approved-stocks/:symbol', (req, res) => {
  const { symbol } = req.params;
  db.run("DELETE FROM approved_stocks WHERE symbol = ?", [symbol], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Execute Trade
router.post('/trade', (req, res) => {
  const { symbol, type, shares, price, stopLoss, takeProfit } = req.body;

  db.serialize(() => {
    db.get("SELECT balance FROM portfolios WHERE id = 'default'", (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      let currentBalance = row ? row.balance : 10000;

      const cost = shares * price;

      if (type === 'BUY') {
        if (currentBalance < cost) {
          return res.status(400).json({ error: 'Insufficient funds' });
        }

        db.run("UPDATE portfolios SET balance = balance - ? WHERE id = 'default'", [cost]);
        db.run("INSERT INTO positions (symbol, shares, entryPrice, stopLoss, takeProfit) VALUES (?, ?, ?, ?, ?)",
          [symbol, shares, price, stopLoss, takeProfit]);
        db.run("INSERT INTO trade_history (symbol, type, shares, price) VALUES (?, ?, ?, ?)",
          [symbol, 'BUY', shares, price]);

        res.json({ success: true });

      } else if (type === 'SELL') {
        db.run("UPDATE portfolios SET balance = balance + ? WHERE id = 'default'", [cost]);
        db.run("DELETE FROM positions WHERE symbol = ?", [symbol]);
        db.run("INSERT INTO trade_history (symbol, type, shares, price) VALUES (?, ?, ?, ?)",
          [symbol, 'SELL', shares, price]);

        res.json({ success: true });
      } else {
        res.status(400).json({ error: 'Invalid trade type' });
      }
    });
  });
});

// Engine Control Routes
router.get('/engine/status', (req, res) => {
  res.json({ running: getEngineRunning() });
});

router.post('/engine/start', (req, res) => {
  setEngineRunning(true);
  res.json({ running: true });
});

router.post('/engine/stop', (req, res) => {
  setEngineRunning(false);
  res.json({ running: false });
});

export default router;
`;

fs.writeFileSync('backend_routes.ts', code);
