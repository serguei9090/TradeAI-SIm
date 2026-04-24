import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import { createServer as createViteServer } from "vite";
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
				// Use user-provided key, or fallback to google_api env var
				const genAiKey = apiKey || process.env.google_api;
				if (!genAiKey) {
					return res.status(400).json({
						error:
							"Missing Gemini API Key. Provide one or set google_api in .env",
					});
				}

				const genAI = new GoogleGenerativeAI(genAiKey);
				const aiModel = genAI.getGenerativeModel({
					model: model || "gemma-3-12b",
				});
				const result = await aiModel.generateContent("Hello! Are you there?");
				const _text = result.response.text();
				res.json({
					success: true,
					message: "Connected to Google AI Studio successfully!",
				});
			} else {
				// Custom provider testing
				if (!apiUrl) {
					return res.status(400).json({ error: "Missing custom API URL" });
				}
				const targetUrl = apiUrl.replace(/\/v1\/?$/, "");
				const response = await fetch(`${targetUrl}/v1/models`, {
					headers: { Authorization: `Bearer ${apiKey || "no-key"}` },
				});

				if (!response.ok) {
					throw new Error(
						`Failed to fetch from custom URL: ${response.statusText}`,
					);
				}
				res.json({
					success: true,
					message: "Connected to Custom API successfully!",
				});
			}
		} catch (error: any) {
			console.error("Test Connection Error:", error);
			res.status(500).json({ error: error.message || "Failed to connect" });
		}
	});

	// API route for Model Auto-Fetch
	app.post("/api/fetch-models", async (req, res) => {
		const { apiUrl, apiKey } = req.body;
		if (!apiUrl) return res.status(400).json({ error: "apiUrl is required" });
		try {
			const response = await fetch(`${apiUrl}/models`, {
				headers: { Authorization: `Bearer ${apiKey || "no-key"}` },
			});
			if (!response.ok)
				throw new Error(`Failed to fetch: ${response.statusText}`);
			const data = await response.json();
			res.json(data);
		} catch (_error) {
			res.status(500).json({ error: "Failed to fetch models from endpoint" });
		}
	});

	// API route for AI proxy
	app.post("/api/ai-proxy", async (req, res) => {
		const { prompt, provider, apiUrl, model } = req.body;

		try {
			if (provider === "gemini") {
				db.get(
					"SELECT * FROM settings WHERE id = 'default'",
					async (err, settings: any) => {
						if (err) return res.status(500).json({ error: "DB Error" });

						const apiKey = settings?.apiKey || process.env.google_api;
						const targetModel =
							settings?.customApiModel || model || "gemma-3-12b";

						if (!apiKey)
							return res.status(400).json({ error: "Gemini API Key missing" });

						try {
							const genAI = new GoogleGenerativeAI(apiKey);
							const aiModel = genAI.getGenerativeModel({ model: targetModel });
							const result = await aiModel.generateContent(prompt);
							const text = result.response.text();

							// Wrap in OpenAI format to not break the frontend
							res.json({
								choices: [{ message: { content: text } }],
							});
						} catch (e: any) {
							res.status(500).json({ error: `Gemini error: ${e.message}` });
						}
					},
				);
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
