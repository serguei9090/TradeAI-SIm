import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createServer as createViteServer } from "vite";
import { acpManager } from "./acpManager";
import dbRoutes from "./backend_routes";
import db from "./db";
import { startEngine } from "./tradingEngine";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
	const app = express();
	const PORT = 3000;

	app.use(express.json());

	// Use DB routes
	app.use("/api/db", dbRoutes);

	// API route to test connection
	app.post("/api/test-connection", async (req, res) => {
		const { provider, apiUrl, apiKey, model } = req.body;

		try {
			if (provider === "gemini") {
				try {
					const text = await acpManager.prompt("Hello");
					// Wrap in OpenAI format to not break the frontend
					res.json({
						choices: [{ message: { content: text } }],
					});
				} catch (e: any) {
					console.error("ACP prompt error:", e);
					res.status(500).json({ error: `Gemini ACP error: ${e.message}` });
				}
			} else {
				// Choose endpoint/model based on provider (custom)
				const targetUrl = apiUrl ? apiUrl : process.env.AI_API_BASE;
				const targetModel = model ? model : process.env.AI_MODEL;
				const apiKey = process.env.AI_API_KEY || "no-key-needed";

				if (!targetUrl || !targetModel) {
					return res.status(400).json({ error: "AI configuration not set" });
				}

				const response = await fetch(`${targetUrl}/chat/completions`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${apiKey}`,
					},
					body: JSON.stringify({
						model: targetModel,
						messages: [{ role: "user", content: prompt }],
					}),
				});

				const data = await response.json();
				res.json(data);
			}
		} catch (_error) {
			res.status(500).json({ error: "Failed to fetch from AI endpoint" });
		}
	});

	// API route for Stock Data proxy
	app.get("/api/stock-price/:symbol", async (req, res) => {
		const { symbol } = req.params;
		const apiKey = process.env.FINNHUB_API_KEY;

		if (!apiKey) {
			return res.status(500).json({ error: "FINNHUB_API_KEY not configured" });
		}

		try {
			const response = await fetch(
				`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`,
			);
			const data = await response.json();

			if (data.c) {
				res.json({ price: data.c });
			} else {
				res.status(404).json({ error: "Could not fetch price" });
			}
		} catch (_error) {
			res.status(500).json({ error: "Failed to fetch stock data" });
		}
	});

	// Vite middleware for development
	if (process.env.NODE_ENV !== "production") {
		const vite = await createViteServer({
			server: { middlewareMode: true },
			appType: "spa",
		});
		app.use(vite.middlewares);
	} else {
		const distPath = path.join(process.cwd(), "dist");
		app.use(express.static(distPath));
		app.get("*", (_req, res) => {
			res.sendFile(path.join(distPath, "index.html"));
		});
	}

	startEngine();

	app.listen(PORT, "0.0.0.0", () => {
		console.log(`Server running on http://localhost:${PORT}`);
	});
}

startServer();
