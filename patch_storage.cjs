const fs = require("fs");
let code = fs.readFileSync("src/services/storage.ts", "utf-8");
const replacement = `export const updateSettings = async (settings: any): Promise<any> => {
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

export const getAiLogs = async (): Promise<any[]> => {`;
code = code.replace(
	`export const updateSettings = async (settings: any): Promise<any> => {
  const res = await fetch('/api/db/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  return res.json();
};

export const getAiLogs = async (): Promise<any[]> => {`,
	replacement,
);
fs.writeFileSync("src/services/storage.ts", code);
