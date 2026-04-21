# Implementation Plan

## 1. Fix Configuration & Risk Settings Disconnect
- Update `tradingEngine.ts` to fetch configuration settings (AI API details, trade size, stop loss, take profit, max positions) from the database or an API endpoint rather than relying solely on `process.env`.
- Create new backend routes in `backend_routes.ts` to save and load user settings to/from SQLite.
- Update `App.tsx` to send settings to the backend when "Save Settings" is clicked.

## 2. Implement Real News & Sentiment Integration
- Modify `tradingEngine.ts` to fetch real company news using the Finnhub API (e.g., `/company-news`).
- Extract headlines and summaries and include them in the prompt sent to the AI for decision making.

## 3. Implement Live AI Reasoning Logs
- Create a new SQLite table `ai_logs` to store the thought process/reasoning for each evaluation.
- Update `tradingEngine.ts` to insert log entries into the database whenever an evaluation occurs.
- Add an API route in `backend_routes.ts` to fetch these logs.
- Update `App.tsx` "AI Reasoning Log" panel to poll and display these logs in real-time.

## 4. Implement AI Chat Assistant
- Add a Chat interface in `App.tsx` (perhaps a sliding sidebar or a dedicated panel).
- Create a new backend endpoint `/api/ai-chat` that takes user messages and queries the configured AI model for conversational responses.
- Implement UI to render the chat history and allow users to type questions (e.g., "What tech stocks should I add?").

## 5. Add Unit Tests and Code Quality
- Write Vitest unit tests for the new backend routes and logic in `tradingEngine.ts`.
- Run `npm run lint` (using ESLint/TypeScript) to ensure code quality.

## 6. (Optional/Future) Advanced Charting & Portfolio Metrics
- Add Recharts for visual history of portfolio balance.
- Calculate win rate and ROI.
