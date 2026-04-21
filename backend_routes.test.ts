import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import dbRoutes from './backend_routes';

// Mock DB
vi.mock('./db', () => ({
  default: {
    get: vi.fn((query, params, cb) => {
      if (typeof params === 'function') {
        cb = params;
        params = [];
      }
      if (query.includes('settings')) {
        cb(null, { customApiUrl: 'http://test', tradeSize: 2 });
      } else if (query.includes('portfolios')) {
        cb(null, { balance: 5000 });
      } else {
        cb(null, {});
      }
    }),
    all: vi.fn((query, cb) => {
      cb(null, [{ id: 1, symbol: 'AAPL' }]);
    }),
    run: vi.fn((query, params, cb) => {
      if (cb) cb(null);
    }),
    serialize: vi.fn((cb) => cb()),
  }
}));

// Mock fetch globally
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ choices: [{ message: { content: "Mocked AI Response" } }] })
  })
) as any;

const app = express();
app.use(express.json());
app.use('/api', dbRoutes);

describe('Backend Routes', () => {
  it('POST /api/portfolio/add-funds should update balance and return success', async () => {
    const res = await request(app).post('/api/portfolio/add-funds').send({ amount: 5000 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.amount).toBe(5000);
  });

  it('GET /api/settings should return mocked settings', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body.customApiUrl).toBe('http://test');
    expect(res.body.tradeSize).toBe(2);
  });

  it('GET /api/ai-logs should return mocked logs', async () => {
    const res = await request(app).get('/api/ai-logs');
    expect(res.status).toBe(200);
    expect(res.body[0].symbol).toBe('AAPL');
  });

  it('POST /api/ai-chat should return a reply', async () => {
    const res = await request(app).post('/api/ai-chat').send({ message: 'Hello AI' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reply');
    expect(res.body.reply).toBe('Mocked AI Response');
  });
});
