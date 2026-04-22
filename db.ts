import sqlite3Pkg from "sqlite3";
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

    db.serialize(() => {
      // Portfolios Table
      db.run(`CREATE TABLE IF NOT EXISTS portfolios (
        id TEXT PRIMARY KEY,
        balance REAL NOT NULL,
        totalValue REAL NOT NULL
      )`);

      db.get("SELECT count(*) as count FROM portfolios", (err, row: any) => {
        if (!err && row.count === 0) {
          db.run("INSERT INTO portfolios (id, balance, totalValue) VALUES ('default', 10000.0, 10000.0)");
        }
      });

      // Positions Table
      db.run(`CREATE TABLE IF NOT EXISTS positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        shares REAL NOT NULL,
        entryPrice REAL NOT NULL,
        stopLoss REAL NOT NULL,
        takeProfit REAL NOT NULL
      )`);

      // Trade History Table
      db.run(`CREATE TABLE IF NOT EXISTS trade_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        type TEXT NOT NULL, -- 'BUY' or 'SELL'
        shares REAL NOT NULL,
        price REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Approved Stocks Table
      db.run(`CREATE TABLE IF NOT EXISTS approved_stocks (
        symbol TEXT PRIMARY KEY,
        approvedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Settings Table
      db.run(`CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        customApiUrl TEXT,
        customApiModel TEXT,
        apiKey TEXT,
        tradeSize INTEGER,
        stopLossPct REAL,
        takeProfitPct REAL,
        maxPositions INTEGER
      )`);

      db.get("SELECT count(*) as count FROM settings", (err, row: any) => {
        if (!err && row.count === 0) {
          db.run(`INSERT INTO settings
            (id, customApiUrl, customApiModel, apiKey, tradeSize, stopLossPct, takeProfitPct, maxPositions)
            VALUES ('default', 'http://localhost:1234/v1', 'local-model', '', 1, 10.0, 10.0, 3)`);
        }
      });

      // Migrate settings table to add modelProvider
      db.all("PRAGMA table_info(settings)", (err, columns: any[]) => {
        if (!err && columns) {
          const hasModelProvider = columns.some(col => col.name === 'modelProvider');
          if (!hasModelProvider) {
            db.run("ALTER TABLE settings ADD COLUMN modelProvider TEXT DEFAULT 'custom'");
          }
        }
      });

      // AI Logs Table
      db.run(`CREATE TABLE IF NOT EXISTS ai_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        log TEXT
      )`);
    });
  }
});

export default db;
