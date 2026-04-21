const fs = require('fs');

let code = `import sqlite3Pkg from "sqlite3";
const sqlite3 = sqlite3Pkg.verbose();
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');

    // Create tables
    db.serialize(() => {
      // Portfolios Table
      db.run(\`CREATE TABLE IF NOT EXISTS portfolios (
        id TEXT PRIMARY KEY,
        balance REAL NOT NULL,
        totalValue REAL NOT NULL
      )\`);

      // Initialize default portfolio if empty
      db.get("SELECT count(*) as count FROM portfolios", (err, row: any) => {
        if (!err && row.count === 0) {
          db.run("INSERT INTO portfolios (id, balance, totalValue) VALUES ('default', 10000.0, 10000.0)");
        }
      });

      // Positions Table
      db.run(\`CREATE TABLE IF NOT EXISTS positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        shares REAL NOT NULL,
        entryPrice REAL NOT NULL,
        stopLoss REAL NOT NULL,
        takeProfit REAL NOT NULL
      )\`);

      // Trade History Table
      db.run(\`CREATE TABLE IF NOT EXISTS trade_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        type TEXT NOT NULL, -- 'BUY' or 'SELL'
        shares REAL NOT NULL,
        price REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )\`);

      // Approved Stocks Table
      db.run(\`CREATE TABLE IF NOT EXISTS approved_stocks (
        symbol TEXT PRIMARY KEY,
        approvedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )\`);
    });
  }
});

export default db;
`;

fs.writeFileSync('db.ts', code);
