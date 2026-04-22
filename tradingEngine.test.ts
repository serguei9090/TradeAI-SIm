import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// First, mock DB
vi.mock('./db', () => {
  return {
    default: {
      get: vi.fn(),
      all: vi.fn(),
      run: vi.fn(),
      serialize: vi.fn((cb) => cb()),
    }
  };
});

import { getEngineRunning, setEngineRunning, startEngine } from './tradingEngine';
import db from './db';

describe('Trading Engine', () => {

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    setEngineRunning(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('engine start state is correct', () => {
    expect(getEngineRunning()).toBe(false);
    setEngineRunning(true);
    expect(getEngineRunning()).toBe(true);
  });

  it('startEngine starts interval, but does nothing if not running', () => {
    startEngine();
    // fast forward 10 seconds
    vi.advanceTimersByTime(10000);
    expect(db.all).not.toHaveBeenCalled();
  });

  it('evaluateStock ignores execution if not running', async () => {
    (db.all as any).mockImplementation((query: any, cb: any) => cb(null, [{ symbol: 'AAPL' }]));
    startEngine();
    vi.advanceTimersByTime(10000);
    // Since isEngineRunning is false, evaluateStock returns early
    expect(db.get).not.toHaveBeenCalled();
  });

  it('evaluateStock completes full cycle (custom provider, SELL)', async () => {
    (db.all as any).mockImplementation((query: any, cb: any) => cb(null, [{ symbol: 'AAPL' }]));

    // first db.get is settings
    (db.get as any).mockImplementationOnce((query: any, cb: any) => cb(null, { modelProvider: 'custom', tradeSize: 1 }));
    // second db.get is within executeTrade
    (db.get as any).mockImplementationOnce((query: any, params: any, cb: any) => {
        if(typeof params === 'function') { cb = params; params = []; }
        cb(null, { balance: 10000 });
    });
    // third db.get is checking existing position for SELL
    (db.get as any).mockImplementationOnce((query: any, params: any, cb: any) => cb(null, { shares: 10 }));

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ // Finnhub price
        json: vi.fn().mockResolvedValue({ c: 150 })
      })
      .mockResolvedValueOnce({ // Finnhub news
        json: vi.fn().mockResolvedValue([{ headline: "News 1", summary: "Sum 1" }])
      })
      .mockResolvedValueOnce({ // AI chat
        json: vi.fn().mockResolvedValue({ choices: [{ message: { content: "SELL\nGood time" } }] })
      }) as any;

    setEngineRunning(true);
    startEngine();

    // advance clock past setInterval
    vi.advanceTimersByTime(10000);

    // need to flush promises manually or just wait
    await vi.waitFor(() => {
        expect(db.run).toHaveBeenCalled();
    });
  });

  it('evaluateStock completes full cycle (custom provider, BUY)', async () => {
    (db.all as any).mockImplementation((query: any, cb: any) => cb(null, [{ symbol: 'AAPL' }]));

    (db.get as any).mockImplementationOnce((query: any, cb: any) => cb(null, { modelProvider: 'custom', tradeSize: 1 }));
    // inside executeTrade
    (db.get as any).mockImplementationOnce((query: any, params: any, cb: any) => {
        if(typeof params === 'function') { cb = params; params = []; }
        cb(null, { balance: 10000 });
    });

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ // Finnhub price
        json: vi.fn().mockResolvedValue({ c: 150 })
      })
      .mockResolvedValueOnce({ // Finnhub news
        json: vi.fn().mockResolvedValue([{ headline: "News 1", summary: "Sum 1" }])
      })
      .mockResolvedValueOnce({ // AI chat
        json: vi.fn().mockResolvedValue({ choices: [{ message: { content: "BUY\nGood time" } }] })
      }) as any;

    setEngineRunning(true);
    startEngine();

    vi.advanceTimersByTime(10000);

    await vi.waitFor(() => {
        expect(db.run).toHaveBeenCalled();
    });
  });

  it('evaluateStock returns if price is 0', async () => {
    (db.all as any).mockImplementation((query: any, cb: any) => cb(null, [{ symbol: 'AAPL' }]));
    (db.get as any).mockImplementationOnce((query: any, cb: any) => cb(null, { modelProvider: 'custom', tradeSize: 1 }));

    global.fetch = vi.fn().mockResolvedValueOnce({
        json: vi.fn().mockResolvedValue({ c: 0 })
    }) as any;

    setEngineRunning(true);
    startEngine();

    vi.advanceTimersByTime(10000);

    await vi.waitFor(() => {
        // fetch called once for price
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('evaluateStock gemini test', async () => {
    (db.all as any).mockImplementation((query: any, cb: any) => cb(null, [{ symbol: 'AAPL' }]));
    (db.get as any).mockImplementationOnce((query: any, cb: any) => cb(null, { modelProvider: 'gemini', apiKey: 'test' }));

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ // Finnhub price
        json: vi.fn().mockResolvedValue({ c: 150 })
      })
      .mockResolvedValueOnce({ // Finnhub news
        json: vi.fn().mockResolvedValue([])
      }) as any;

    setEngineRunning(true);
    startEngine();

    vi.advanceTimersByTime(10000);

    await vi.waitFor(() => {
       // it will try to call gemini which we didn't fully mock, it catches exception
       expect(db.get).toHaveBeenCalled();
    });
  });

  it('evaluateStock gemini no API key', async () => {
    (db.all as any).mockImplementation((query: any, cb: any) => cb(null, [{ symbol: 'AAPL' }]));
    (db.get as any).mockImplementationOnce((query: any, cb: any) => cb(null, { modelProvider: 'gemini' })); // no key

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ // Finnhub price
        json: vi.fn().mockResolvedValue({ c: 150 })
      })
      .mockResolvedValueOnce({ // Finnhub news
        json: vi.fn().mockResolvedValue([])
      }) as any;

    setEngineRunning(true);
    startEngine();

    vi.advanceTimersByTime(10000);

    await vi.waitFor(() => {
       // returns early due to missing API key
       expect(db.run).not.toHaveBeenCalledWith(expect.stringContaining("INSERT INTO ai_logs"), expect.anything());
    });
  });

});
