export const getPortfolio = async (): Promise<any> => {
  const res = await fetch('/api/db/portfolio');
  return res.json();
};

export const getPositions = async (): Promise<any[]> => {
  const res = await fetch('/api/db/positions');
  return res.json();
};

export const getTradeHistory = async (): Promise<any[]> => {
  const res = await fetch('/api/db/trade-history');
  return res.json();
};

export const getApprovedStocks = async (): Promise<any[]> => {
  const res = await fetch('/api/db/approved-stocks');
  return res.json();
};

export const approveStock = async (symbol: string): Promise<any> => {
  const res = await fetch('/api/db/approved-stocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol })
  });
  return res.json();
};

export const removeApprovedStock = async (symbol: string): Promise<any> => {
  const res = await fetch(`/api/db/approved-stocks/${symbol}`, {
    method: 'DELETE'
  });
  return res.json();
};

export const getSettings = async (): Promise<any> => {
  const res = await fetch('/api/db/settings');
  return res.json();
};

export const updateSettings = async (settings: any): Promise<any> => {
  const res = await fetch('/api/db/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  return res.json();
};

export const addFunds = async (amount: number): Promise<any> => {
  const res = await fetch('/api/db/portfolio/add-funds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  });
  return res.json();
};

export const getAiLogs = async (): Promise<any[]> => {
  const res = await fetch('/api/db/ai-logs');
  return res.json();
};
