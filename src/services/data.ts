// src/services/data.ts
// Utility functions formerly in firebase.ts

export const fetchStockPrice = async (symbol: string): Promise<number> => {
	try {
		const response = await fetch(`/api/stock-price/${symbol}`);
		const data = await response.json();
		return data.price || 0;
	} catch (error) {
		console.error("Error fetching real-time price:", error);
		return 0;
	}
};

export const runBacktest = async (
	_symbol: string,
	_startDate: string,
	_endDate: string,
): Promise<{ totalProfit: number; winRate: number; maxDrawdown: number }> => {
	await new Promise((resolve) => setTimeout(resolve, 2000));
	return {
		totalProfit: Math.random() * 5000,
		winRate: Math.random() * 0.5 + 0.3,
		maxDrawdown: Math.random() * 0.2,
	};
};

export const fetchSentiment = async (
	_symbol: string,
): Promise<{ score: number; label: string }> => {
	await new Promise((resolve) => setTimeout(resolve, 800));
	const score = Math.floor(Math.random() * 100);
	let label = "Neutral";
	if (score > 60) label = "Bullish";
	else if (score < 40) label = "Bearish";
	return { score, label };
};
