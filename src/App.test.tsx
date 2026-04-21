import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { vi } from 'vitest';

// Mock fetch completely to avoid unhandled errors
global.fetch = vi.fn(async (url) => {
  if (url === '/api/db/portfolio') return { ok: true, json: async () => ({ balance: 10000, totalValue: 10000 }) };
  if (url === '/api/db/positions') return { ok: true, json: async () => [] };
  if (url === '/api/db/trade-history') return { ok: true, json: async () => [] };
  if (url === '/api/db/approved-stocks') return { ok: true, json: async () => [] };
  if (url === '/api/db/engine/status') return { ok: true, json: async () => ({ running: false }) };

  return { ok: true, json: async () => ({}) };
}) as any;

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders TradeAI header', async () => {
    render(<App />);
    expect(await screen.findByText('TradeAI')).toBeInTheDocument();
  });

  it('switches tabs to Wallet', async () => {
    render(<App />);
    const walletTab = await screen.findByText('Wallet / Orders');
    fireEvent.click(walletTab);
    expect(await screen.findByText('Estimated Balance')).toBeInTheDocument();
  });

  it('opens settings modal', async () => {
    render(<App />);
    const buttons = await screen.findAllByRole('button');
    // Settings is the 4th button in the array usually:
    // 1: Trading Bot tab
    // 2: Wallet tab
    // 3: Start/Stop Engine
    // 4: Settings
    fireEvent.click(buttons[3]);

    expect(await screen.findByText('AI Model Settings')).toBeInTheDocument();
  });
});
