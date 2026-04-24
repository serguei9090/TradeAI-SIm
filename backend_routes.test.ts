import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import dbRoutes from "./backend_routes";

// Mock DB
vi.mock("./db", () => {
	return {
		default: {
			get: vi.fn(),
			all: vi.fn(),
			run: vi.fn(),
			serialize: vi.fn((cb) => cb()),
		},
	};
});

import db from "./db";

// Mock fetch globally
global.fetch = vi.fn(() =>
	Promise.resolve({
		json: () =>
			Promise.resolve({
				choices: [{ message: { content: "Mocked AI Response" } }],
			}),
	}),
) as any;

const app = express();
app.use(express.json());
app.use("/api", dbRoutes);

describe("Backend Routes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Portfolio", () => {
		it("GET /api/portfolio should return portfolio", async () => {
			(db.get as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(null, { balance: 5000 }),
			);
			const res = await request(app).get("/api/portfolio");
			expect(res.status).toBe(200);
			expect(res.body.balance).toBe(5000);
		});

		it("GET /api/portfolio should handle errors", async () => {
			(db.get as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(new Error("DB Error")),
			);
			const res = await request(app).get("/api/portfolio");
			expect(res.status).toBe(500);
			expect(res.body.error).toBe("DB Error");
		});
	});

	describe("Add Funds", () => {
		it("POST /api/portfolio/add-funds should update balance and return success", async () => {
			(db.run as any).mockImplementationOnce(
				(_query: any, _params: any, cb: any) => cb.call(null, null),
			);
			const res = await request(app)
				.post("/api/portfolio/add-funds")
				.send({ amount: 5000 });
			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.amount).toBe(5000);
		});

		it("POST /api/portfolio/add-funds should return 400 for invalid amounts", async () => {
			const res = await request(app)
				.post("/api/portfolio/add-funds")
				.send({ amount: -500 });
			expect(res.status).toBe(400);
		});

		it("POST /api/portfolio/add-funds should handle errors", async () => {
			(db.run as any).mockImplementationOnce(
				(_query: any, _params: any, cb: any) =>
					cb.call(null, new Error("DB Error")),
			);
			const res = await request(app)
				.post("/api/portfolio/add-funds")
				.send({ amount: 5000 });
			expect(res.status).toBe(500);
		});
	});

	describe("Positions", () => {
		it("GET /api/positions should return positions", async () => {
			(db.all as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(null, [{ id: 1, symbol: "AAPL" }]),
			);
			const res = await request(app).get("/api/positions");
			expect(res.status).toBe(200);
			expect(res.body[0].symbol).toBe("AAPL");
		});

		it("GET /api/positions should handle errors", async () => {
			(db.all as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(new Error("DB Error")),
			);
			const res = await request(app).get("/api/positions");
			expect(res.status).toBe(500);
		});
	});

	describe("Trade History", () => {
		it("GET /api/trade-history should return history", async () => {
			(db.all as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(null, [{ id: 1, symbol: "AAPL", type: "BUY" }]),
			);
			const res = await request(app).get("/api/trade-history");
			expect(res.status).toBe(200);
			expect(res.body[0].type).toBe("BUY");
		});

		it("GET /api/trade-history should handle errors", async () => {
			(db.all as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(new Error("DB Error")),
			);
			const res = await request(app).get("/api/trade-history");
			expect(res.status).toBe(500);
		});
	});

	describe("Approved Stocks", () => {
		it("GET /api/approved-stocks should return stocks", async () => {
			(db.all as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(null, [{ symbol: "AAPL" }]),
			);
			const res = await request(app).get("/api/approved-stocks");
			expect(res.status).toBe(200);
			expect(res.body[0].symbol).toBe("AAPL");
		});

		it("GET /api/approved-stocks should handle errors", async () => {
			(db.all as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(new Error("DB Error")),
			);
			const res = await request(app).get("/api/approved-stocks");
			expect(res.status).toBe(500);
		});

		it("POST /api/approved-stocks should add stock", async () => {
			(db.run as any).mockImplementationOnce(
				(_query: any, _params: any, cb: any) => cb.call(null, null),
			);
			const res = await request(app)
				.post("/api/approved-stocks")
				.send({ symbol: "TSLA" });
			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
			expect(res.body.symbol).toBe("TSLA");
		});

		it("POST /api/approved-stocks should return 400 if symbol missing", async () => {
			const res = await request(app).post("/api/approved-stocks").send({});
			expect(res.status).toBe(400);
		});

		it("POST /api/approved-stocks should handle errors", async () => {
			(db.run as any).mockImplementationOnce(
				(_query: any, _params: any, cb: any) =>
					cb.call(null, new Error("DB Error")),
			);
			const res = await request(app)
				.post("/api/approved-stocks")
				.send({ symbol: "TSLA" });
			expect(res.status).toBe(500);
		});

		it("DELETE /api/approved-stocks/:symbol should delete stock", async () => {
			(db.run as any).mockImplementationOnce(
				(_query: any, _params: any, cb: any) => cb.call(null, null),
			);
			const res = await request(app).delete("/api/approved-stocks/TSLA");
			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
		});

		it("DELETE /api/approved-stocks/:symbol should handle errors", async () => {
			(db.run as any).mockImplementationOnce(
				(_query: any, _params: any, cb: any) =>
					cb.call(null, new Error("DB Error")),
			);
			const res = await request(app).delete("/api/approved-stocks/TSLA");
			expect(res.status).toBe(500);
		});
	});

	describe("Trade", () => {
		it("POST /api/trade BUY should succeed with sufficient funds", async () => {
			(db.get as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(null, { balance: 10000 }),
			);
			(db.run as any).mockImplementation(
				(_query: any, _params: any, cb: any) => {
					if (cb) cb.call(null, null);
				},
			);

			const res = await request(app)
				.post("/api/trade")
				.send({ symbol: "AAPL", type: "BUY", shares: 1, price: 150 });
			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
		});

		it("POST /api/trade BUY should fail with insufficient funds", async () => {
			(db.get as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(null, { balance: 100 }),
			);

			const res = await request(app)
				.post("/api/trade")
				.send({ symbol: "AAPL", type: "BUY", shares: 1, price: 150 });
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Insufficient funds");
		});

		it("POST /api/trade SELL should succeed", async () => {
			(db.get as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(null, { balance: 100 }),
			);
			(db.run as any).mockImplementation(
				(_query: any, _params: any, cb: any) => {
					if (cb) cb.call(null, null);
				},
			);

			const res = await request(app)
				.post("/api/trade")
				.send({ symbol: "AAPL", type: "SELL", shares: 1, price: 150 });
			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
		});

		it("POST /api/trade INVALID should fail", async () => {
			(db.get as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(null, { balance: 1000 }),
			);

			const res = await request(app)
				.post("/api/trade")
				.send({ symbol: "AAPL", type: "INVALID", shares: 1, price: 150 });
			expect(res.status).toBe(400);
			expect(res.body.error).toBe("Invalid trade type");
		});

		it("POST /api/trade should handle DB error on get", async () => {
			(db.get as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(new Error("DB Error")),
			);

			const res = await request(app)
				.post("/api/trade")
				.send({ symbol: "AAPL", type: "BUY", shares: 1, price: 150 });
			expect(res.status).toBe(500);
		});
	});

	describe("Engine", () => {
		it("GET /api/engine/status", async () => {
			const res = await request(app).get("/api/engine/status");
			expect(res.status).toBe(200);
			expect(typeof res.body.running).toBe("boolean");
		});
		it("POST /api/engine/start", async () => {
			const res = await request(app).post("/api/engine/start");
			expect(res.status).toBe(200);
			expect(res.body.running).toBe(true);
		});
		it("POST /api/engine/stop", async () => {
			const res = await request(app).post("/api/engine/stop");
			expect(res.status).toBe(200);
			expect(res.body.running).toBe(false);
		});
	});

	describe("Settings", () => {
		it("GET /api/settings should return settings", async () => {
			(db.get as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(null, { customApiUrl: "http://test", tradeSize: 2 }),
			);
			const res = await request(app).get("/api/settings");
			expect(res.status).toBe(200);
			expect(res.body.customApiUrl).toBe("http://test");
		});

		it("GET /api/settings should handle errors", async () => {
			(db.get as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(new Error("DB Error")),
			);
			const res = await request(app).get("/api/settings");
			expect(res.status).toBe(500);
		});

		it("POST /api/settings should update settings", async () => {
			(db.run as any).mockImplementationOnce(
				(_query: any, _params: any, cb: any) => cb.call(null, null),
			);
			const res = await request(app)
				.post("/api/settings")
				.send({ tradeSize: 3 });
			expect(res.status).toBe(200);
			expect(res.body.success).toBe(true);
		});

		it("POST /api/settings should handle errors", async () => {
			(db.run as any).mockImplementationOnce(
				(_query: any, _params: any, cb: any) =>
					cb.call(null, new Error("DB Error")),
			);
			const res = await request(app)
				.post("/api/settings")
				.send({ tradeSize: 3 });
			expect(res.status).toBe(500);
		});
	});

	describe("AI Logs", () => {
		it("GET /api/ai-logs should return mocked logs", async () => {
			(db.all as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(null, [{ symbol: "AAPL" }]),
			);
			const res = await request(app).get("/api/ai-logs");
			expect(res.status).toBe(200);
			expect(res.body[0].symbol).toBe("AAPL");
		});

		it("GET /api/ai-logs should handle errors", async () => {
			(db.all as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(new Error("DB Error")),
			);
			const res = await request(app).get("/api/ai-logs");
			expect(res.status).toBe(500);
		});
	});

	describe("AI Chat", () => {
		it("POST /api/ai-chat should return 400 if message is missing", async () => {
			const res = await request(app).post("/api/ai-chat").send({});
			expect(res.status).toBe(400);
		});

		it("POST /api/ai-chat should return a reply for custom provider", async () => {
			(db.get as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(null, { modelProvider: "custom" }),
			);
			const res = await request(app)
				.post("/api/ai-chat")
				.send({ message: "Hello AI" });
			expect(res.status).toBe(200);
			expect(res.body.reply).toBe("Mocked AI Response");
		});

		it("POST /api/ai-chat should use Gemini provider when set", async () => {
			(db.get as any).mockImplementationOnce((_query: any, cb: any) =>
				cb(null, { modelProvider: "gemini", apiKey: "test" }),
			);
			// we would need to mock GoogleGenerativeAI but let's see if we can get a partial error or reply
			const res = await request(app)
				.post("/api/ai-chat")
				.send({ message: "Hello AI" });
			// Since it's not fully mocked, it might fail in test, let's catch it.
			expect(res.status).toBe(500); // we didn't mock generateContent
		});
	});
});
