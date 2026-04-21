<div align="center">
<h1>TradeAI Simulator</h1>
</div>

This project is a standalone local web app for automated bot trading using AI to evaluate market sentiment and execute trades based on real-time data.

## Features
- **Semi-Autonomous AI Trading:** Approve stocks and let the AI manage positions automatically.
- **Local Model Support:** Seamlessly connect to local LLMs (like LM Studio or Ollama) with auto-fetching of available models.
- **Real-Time Data:** Integrates with APIs for live stock prices.
- **Local Database:** Uses SQLite to ensure all data stays local and portable.
- **Professional UI:** Binance-inspired dark-mode interface.

## Prerequisites
- Node.js (v18+)
- A Finnhub API Key (for real-time stock data)
- (Optional) Local LLM server running, or a Gemini API Key

## Setup & Running Locally

1. **Install dependencies:**
   `npm install`

2. **Environment Variables:**
   Create a `.env` file in the root directory based on `.env.example`:
   `cp .env.example .env`
   Fill in the necessary keys:
   - `FINNHUB_API_KEY`: Required for live stock data.
   - `GEMINI_API_KEY`: Required if using Gemini as the AI provider.

3. **Database Setup:**
   The SQLite database will be automatically created in the root folder (`database.sqlite`) when the backend starts.

4. **Run the App:**
   `npm run dev &`
   This command starts the backend Express server on `http://localhost:3000` which also serves the Vite frontend.

## Architecture
- **Frontend:** React, Vite, Tailwind CSS, Recharts.
- **Backend:** Node.js, Express, SQLite3.
- **AI Integration:** Acts as a proxy to communicate with standard OpenAI-compatible local endpoints or Google Gemini.
