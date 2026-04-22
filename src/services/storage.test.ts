import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as storage from './storage';

global.fetch = vi.fn() as any;

describe('Storage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPortfolio', async () => {
    (global.fetch as any).mockResolvedValueOnce({ json: () => Promise.resolve({ balance: 1000 }) });
    const res = await storage.getPortfolio();
    expect(global.fetch).toHaveBeenCalledWith('/api/db/portfolio');
    expect(res.balance).toBe(1000);
  });

  it('getPositions', async () => {
    (global.fetch as any).mockResolvedValueOnce({ json: () => Promise.resolve([{ symbol: 'AAPL' }]) });
    const res = await storage.getPositions();
    expect(global.fetch).toHaveBeenCalledWith('/api/db/positions');
    expect(res[0].symbol).toBe('AAPL');
  });

  it('getTradeHistory', async () => {
    (global.fetch as any).mockResolvedValueOnce({ json: () => Promise.resolve([{ id: 1 }]) });
    const res = await storage.getTradeHistory();
    expect(global.fetch).toHaveBeenCalledWith('/api/db/trade-history');
  });

  it('getApprovedStocks', async () => {
    (global.fetch as any).mockResolvedValueOnce({ json: () => Promise.resolve([{ symbol: 'TSLA' }]) });
    const res = await storage.getApprovedStocks();
    expect(global.fetch).toHaveBeenCalledWith('/api/db/approved-stocks');
  });

  it('approveStock', async () => {
    (global.fetch as any).mockResolvedValueOnce({ json: () => Promise.resolve({ success: true }) });
    const res = await storage.approveStock('TSLA');
    expect(global.fetch).toHaveBeenCalledWith('/api/db/approved-stocks', expect.objectContaining({ method: 'POST' }));
  });

  it('removeApprovedStock', async () => {
    (global.fetch as any).mockResolvedValueOnce({ json: () => Promise.resolve({ success: true }) });
    const res = await storage.removeApprovedStock('TSLA');
    expect(global.fetch).toHaveBeenCalledWith('/api/db/approved-stocks/TSLA', expect.objectContaining({ method: 'DELETE' }));
  });

  it('getSettings', async () => {
    (global.fetch as any).mockResolvedValueOnce({ json: () => Promise.resolve({ tradeSize: 5 }) });
    const res = await storage.getSettings();
    expect(global.fetch).toHaveBeenCalledWith('/api/db/settings');
  });

  it('updateSettings', async () => {
    (global.fetch as any).mockResolvedValueOnce({ json: () => Promise.resolve({ success: true }) });
    const res = await storage.updateSettings({ tradeSize: 10 });
    expect(global.fetch).toHaveBeenCalledWith('/api/db/settings', expect.objectContaining({ method: 'POST' }));
  });

  it('addFunds', async () => {
    (global.fetch as any).mockResolvedValueOnce({ json: () => Promise.resolve({ success: true }) });
    const res = await storage.addFunds(1000);
    expect(global.fetch).toHaveBeenCalledWith('/api/db/portfolio/add-funds', expect.objectContaining({ method: 'POST' }));
  });

  it('getAiLogs', async () => {
    (global.fetch as any).mockResolvedValueOnce({ json: () => Promise.resolve([{ id: 1 }]) });
    const res = await storage.getAiLogs();
    expect(global.fetch).toHaveBeenCalledWith('/api/db/ai-logs');
  });
});
