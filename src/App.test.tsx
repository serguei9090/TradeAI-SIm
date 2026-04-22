import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import * as storage from './services/storage';

vi.mock('./services/storage', () => ({
  getPortfolio: vi.fn().mockResolvedValue({ balance: 5000, totalValue: 5000 }),
  getPositions: vi.fn().mockResolvedValue([{ id: 1, symbol: 'AAPL', shares: 10, entryPrice: 150, currentPrice: 155 }]),
  getTradeHistory: vi.fn().mockResolvedValue([{ id: 1, symbol: 'AAPL', type: 'BUY', shares: 10, price: 150, timestamp: '2023-01-01T12:00:00Z' }]),
  getApprovedStocks: vi.fn().mockResolvedValue([{ symbol: 'AAPL' }, { symbol: 'MSFT' }]),
  getSettings: vi.fn().mockResolvedValue({ tradeSize: 1, stopLossPct: 5, takeProfitPct: 10, maxPositions: 5, modelProvider: 'custom', customApiModel: 'local-model' }),
  updateSettings: vi.fn().mockResolvedValue({ success: true }),
  getAiLogs: vi.fn().mockResolvedValue([{ id: 1, symbol: 'AAPL', log: 'Test log', timestamp: '2023-01-01T12:00:00Z' }]),
  addFunds: vi.fn().mockResolvedValue({ success: true, amount: 1000 }),
  approveStock: vi.fn().mockResolvedValue({ success: true }),
  removeApprovedStock: vi.fn().mockResolvedValue({ success: true }),
}));

global.fetch = vi.fn().mockImplementation((url, init) => {
    let urlStr = typeof url === 'string' ? url : (url.url ? url.url : String(url));
    if (urlStr.startsWith('/')) {
      urlStr = 'http://localhost' + urlStr;
    }
    return Promise.resolve({
        ok: true,
        json: () => {
            if (urlStr.includes('engine/status') || urlStr.includes('engine/stop')) return Promise.resolve({ running: false });
            if (urlStr.includes('engine/start')) return Promise.resolve({ running: true });
            if (urlStr.includes('ai-chat')) return Promise.resolve({ reply: 'Mocked AI Reply' });
            if (urlStr.includes('fetch-models')) return Promise.resolve({ models: ['model-1', 'model-2'] });
            return Promise.resolve({});
        }
    });
}) as any;

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders main layout and fetches data', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('TradeAI')).toBeInTheDocument();
      expect(screen.getByText('Trading Bot')).toBeInTheDocument();
      expect(screen.getByText('Wallet / Orders')).toBeInTheDocument();
    });

    // Switch tabs
    fireEvent.click(screen.getByText('Wallet / Orders'));
    await waitFor(() => {
      // Look for something specific to Wallet/Orders view
      expect(screen.getByText('Estimated Balance')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Trading Bot'));
    await waitFor(() => {
      expect(screen.getByText('Approved Trading Pairs')).toBeInTheDocument();
    });
  });

  it('opens and closes settings modal', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('TradeAI')).toBeInTheDocument());

    const settingsBtn = document.querySelector('.lucide-settings')?.closest('button');
    if (settingsBtn) fireEvent.click(settingsBtn);

    await waitFor(() => {
        expect(screen.getByText('AI Model Settings')).toBeInTheDocument();
    });

    const closeBtn = screen.getByText('Cancel');
    if (closeBtn) fireEvent.click(closeBtn);

    await waitFor(() => {
        expect(screen.queryByText('AI Model Settings')).not.toBeInTheDocument();
    });
  });

  it('starts engine', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('TradeAI')).toBeInTheDocument());

    const startBtn = screen.getByText('Start Bot');
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/db/engine/start'), expect.any(Object));
    });
  });

  it('adds approved stock', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Approved Trading Pairs')).toBeInTheDocument());

    const input = screen.getByPlaceholderText('e.g. BTC, AAPL');
    fireEvent.change(input, { target: { value: 'TSLA' } });

    const form = input.closest('form');
    if (form) fireEvent.submit(form);

    await waitFor(() => {
      expect(storage.approveStock).toHaveBeenCalledWith('TSLA');
    });
  });

  it('removes approved stock', async () => {
    render(<App />);
    await waitFor(() => {
        expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    const aaplItem = screen.getByText('AAPL').closest('div');
    const removeBtn = aaplItem?.querySelector('button');
    if (removeBtn) fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(storage.removeApprovedStock).toHaveBeenCalledWith('AAPL');
    });
  });

  it('sends AI chat', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('TradeAI')).toBeInTheDocument());

    // Open chat
    const chatBtn = document.querySelector('.lucide-message-circle')?.closest('button');
    if (chatBtn) fireEvent.click(chatBtn);

    await waitFor(() => expect(screen.getByPlaceholderText('Ask about stocks...')).toBeInTheDocument());

    const input = screen.getByPlaceholderText('Ask about stocks...');
    fireEvent.change(input, { target: { value: 'Hello AI' } });

    const form = input.closest('form');
    if (form) fireEvent.submit(form);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/ai-chat'), expect.any(Object));
    });

    expect(await screen.findByText('Mocked AI Reply')).toBeInTheDocument();
  });
});
