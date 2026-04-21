# TradeAI Simulator

## Product Summary
TradeAI Simulator is a standalone local web application designed for automated bot trading. It leverages AI models (both local, such as those running via LM Studio or Ollama, and remote, like Gemini) as the primary backend to reason about and execute trades. The AI evaluates real-time stock data, market news, and sentiment to propose and manage positions.

## Core Workflow
1. **Model Configuration:** The user selects a model provider (local or remote). For local providers, the app can automatically fetch available models based on the endpoint and API key.
2. **AI Suggestion & User Approval:** The AI suggests stocks to trade. The user's primary role is to act as a gatekeeper: they review the proposed stock and, if they agree, confirm it.
3. **Autonomous Trading:** Once a stock is confirmed, the AI takes over completely. It continuously evaluates the stock using real-time data, decides when to open or close positions, and manages risk (stop loss/take profit) automatically. The user can intervene to stop or modify positions if needed.

## Key Features
- **Real-Time Data Ingestion:** Uses financial APIs (e.g., Finnhub) to fetch live stock prices and market sentiment.
- **Local SQLite Database:** A robust backend database to store portfolio data, trade history, active positions, and approved stocks, ensuring data portability within the project folder.
- **Professional UI/UX:** A sleek, dark-mode interface inspired by professional trading platforms like Binance, providing a dense, data-rich dashboard.
- **Model Auto-Discovery:** Seamless integration with local LLM setups, allowing users to easily fetch and select available models from their local endpoints.
- **Standalone Architecture:** A unified Node.js/Express backend and React/Vite frontend, designed to run entirely locally.

## Future Roadmap
- Expanding support to cryptocurrency markets alongside traditional stocks.
- Advanced backtesting capabilities using historical data.
- More granular control over AI risk profiles and trading strategies.
