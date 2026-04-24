export const executeTrade = async (
	symbol: string,
	type: "BUY" | "SELL",
	shares: number,
	price: number,
	stopLoss: number,
	takeProfit: number,
) => {
	const res = await fetch("/api/db/trade", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ symbol, type, shares, price, stopLoss, takeProfit }),
	});

	if (!res.ok) {
		const data = await res.json();
		throw new Error(data.error || "Trade failed");
	}

	return res.json();
};
