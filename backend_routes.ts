import express from "express";
import { acpManager } from "./acpManager";
import db from "./db";
import { getEngineRunning, setEngineRunning } from "./tradingEngine";

const router = express.Router();

// Portfolio
router.get("/portfolio", (_req, res) => {
	db.get("SELECT * FROM portfolios WHERE id = 'default'", (err, row: any) => {
		if (err) return res.status(500).json({ error: err.message });
		res.json(row || { balance: 10000, totalValue: 10000 });
	});
});

// Add Funds
router.post("/portfolio/add-funds", (req, res) => {
	const { amount } = req.body;
	if (!amount || Number.isNaN(amount) || amount <= 0)
		return res.status(400).json({ error: "Valid amount is required" });

	db.run(
		"UPDATE portfolios SET balance = balance + ? WHERE id = 'default'",
		[amount],
		(err) => {
			if (err) return res.status(500).json({ error: err.message });
			res.json({ success: true, amount });
		},
	);
});

// Positions
router.get("/positions", (_req, res) => {
	db.all("SELECT * FROM positions", (err, rows) => {
		if (err) return res.status(500).json({ error: err.message });
		res.json(rows);
	});
});

// Trade History
router.get("/trade-history", (_req, res) => {
	db.all("SELECT * FROM trade_history ORDER BY timestamp DESC", (err, rows) => {
		if (err) return res.status(500).json({ error: err.message });
		res.json(rows);
	});
});

// Approved Stocks
router.get("/approved-stocks", (_req, res) => {
	db.all("SELECT * FROM approved_stocks", (err, rows) => {
		if (err) return res.status(500).json({ error: err.message });
		res.json(rows);
	});
});

router.post("/approved-stocks", (req, res) => {
	const { symbol } = req.body;
	if (!symbol) return res.status(400).json({ error: "Symbol is required" });

	db.run(
		"INSERT OR IGNORE INTO approved_stocks (symbol) VALUES (?)",
		[symbol],
		(err) => {
			if (err) return res.status(500).json({ error: err.message });
			res.json({ success: true, symbol });
		},
	);
});

router.delete("/approved-stocks/:symbol", (req, res) => {
	const { symbol } = req.params;
	db.run("DELETE FROM approved_stocks WHERE symbol = ?", [symbol], (err) => {
		if (err) return res.status(500).json({ error: err.message });
		res.json({ success: true });
	});
});

// Execute Trade
router.post("/trade", (req, res) => {
	const { symbol, type, shares, price, stopLoss, takeProfit } = req.body;

	db.serialize(() => {
		db.get(
			"SELECT balance FROM portfolios WHERE id = 'default'",
			(err, row: any) => {
				if (err) return res.status(500).json({ error: err.message });
				const currentBalance = row ? row.balance : 10000;

				const cost = shares * price;

				if (type === "BUY") {
					if (currentBalance < cost) {
						return res.status(400).json({ error: "Insufficient funds" });
					}

					db.run(
						"UPDATE portfolios SET balance = balance - ? WHERE id = 'default'",
						[cost],
					);
					db.run(
						"INSERT INTO positions (symbol, shares, entryPrice, stopLoss, takeProfit) VALUES (?, ?, ?, ?, ?)",
						[symbol, shares, price, stopLoss, takeProfit],
					);
					db.run(
						"INSERT INTO trade_history (symbol, type, shares, price) VALUES (?, ?, ?, ?)",
						[symbol, "BUY", shares, price],
					);

					res.json({ success: true });
				} else if (type === "SELL") {
					db.run(
						"UPDATE portfolios SET balance = balance + ? WHERE id = 'default'",
						[cost],
					);
					db.run("DELETE FROM positions WHERE symbol = ?", [symbol]);
					db.run(
						"INSERT INTO trade_history (symbol, type, shares, price) VALUES (?, ?, ?, ?)",
						[symbol, "SELL", shares, price],
					);

					res.json({ success: true });
				} else {
					res.status(400).json({ error: "Invalid trade type" });
				}
			},
		);
	});
});

// Engine Control Routes
router.get("/engine/status", (_req, res) => {
	res.json({ running: getEngineRunning() });
});

router.post("/engine/start", (_req, res) => {
	setEngineRunning(true);
	res.json({ running: true });
});

router.post("/engine/stop", (_req, res) => {
	setEngineRunning(false);
	res.json({ running: false });
});

// Settings
router.get("/settings", (_req, res) => {
	db.get("SELECT * FROM settings WHERE id = 'default'", (err, row: any) => {
		if (err) return res.status(500).json({ error: err.message });
		res.json(row || {});
	});
});

router.post("/settings", (req, res) => {
	const {
		modelProvider,
		customApiUrl,
		customApiModel,
		apiKey,
		tradeSize,
		stopLossPct,
		takeProfitPct,
		maxPositions,
	} = req.body;

	db.run(
		`UPDATE settings SET
    modelProvider = ?, customApiUrl = ?, customApiModel = ?, apiKey = ?, tradeSize = ?, stopLossPct = ?, takeProfitPct = ?, maxPositions = ?
    WHERE id = 'default'`,
		[
			modelProvider,
			customApiUrl,
			customApiModel,
			apiKey,
			tradeSize,
			stopLossPct,
			takeProfitPct,
			maxPositions,
		],
		(err) => {
			if (err) return res.status(500).json({ error: err.message });
			res.json({ success: true });
		},
	);
});

// AI Logs
router.get("/ai-logs", (_req, res) => {
	db.all(
		"SELECT * FROM ai_logs ORDER BY timestamp DESC LIMIT 50",
		(err, rows) => {
			if (err) return res.status(500).json({ error: err.message });
			res.json(rows);
		},
	);
});

// AI Chat
router.post("/ai-chat", async (req, res) => {
	const { message } = req.body;
	if (!message) return res.status(400).json({ error: "Message is required" });

	try {
		const settings: any = await new Promise((resolve) => {
			db.get("SELECT * FROM settings WHERE id = 'default'", (_err, row) =>
				resolve(row || {}),
			);
		});

		const provider = settings.modelProvider || "custom";
		const targetModel =
			settings.customApiModel || process.env.AI_MODEL || "local-model";

		if (provider === "gemini") {
			try {
				const reply = await acpManager.prompt(message);
				res.json({ reply });
			} catch (e: any) {
				console.error("ACP Chat error:", e);
				res.status(500).json({ error: `Gemini ACP error: ${e.message}` });
			}
		} else {
			const targetUrl =
				settings.customApiUrl ||
				process.env.AI_API_BASE ||
				"http://localhost:1234/v1";
			const aiApiKey =
				settings.apiKey || process.env.AI_API_KEY || "no-key-needed";

			const aiRes = await fetch(`${targetUrl}/chat/completions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${aiApiKey}`,
				},
				body: JSON.stringify({
					model: targetModel,
					messages: [{ role: "user", content: message }],
				}),
			});

			const aiData = await aiRes.json();
			const reply =
				aiData.choices?.[0]?.message?.content?.trim() || "No response from AI.";
			res.json({ reply });
		}
	} catch (err: any) {
		console.error("AI Chat Error:", err);
		res.status(500).json({ error: err.message });
	}
});

export default router;
