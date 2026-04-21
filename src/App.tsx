import React, { useState, useEffect } from 'react';
import { Play, Square, Settings, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getPortfolio, getPositions, getTradeHistory, getApprovedStocks, approveStock, removeApprovedStock } from './services/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolio'>('dashboard');

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [modelProvider, setModelProvider] = useState<'gemini' | 'custom'>('custom');
  const [customApiUrl, setCustomApiUrl] = useState(localStorage.getItem('customApiUrl') || 'http://localhost:1234/v1');
  const [customApiModel, setCustomApiModel] = useState(localStorage.getItem('customApiModel') || 'local-model');
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  
  // Data State
  const [portfolio, setPortfolio] = useState<{balance: number, totalValue: number}>({balance: 0, totalValue: 0});
  const [positions, setPositions] = useState<any[]>([]);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);
  const [approvedStocks, setApprovedStocks] = useState<any[]>([]);
  
  // Trade Config State
  const [tradeSize, setTradeSize] = useState(Number(localStorage.getItem('tradeSize')) || 1);
  const [stopLossPct, setStopLossPct] = useState(Number(localStorage.getItem('stopLossPct')) || 10);
  const [takeProfitPct, setTakeProfitPct] = useState(Number(localStorage.getItem('takeProfitPct')) || 10);
  const [maxPositions, setMaxPositions] = useState(Number(localStorage.getItem('maxPositions')) || 3);
  
  // Engine State
  const [isEngineRunning, setIsEngineRunning] = useState(false);

  // Suggestion State (Mock for now, would typically be an AI generation)
  const [suggestionInput, setSuggestionInput] = useState('');

  const refreshData = async () => {
    const port = await getPortfolio();
    setPortfolio(port);
    const pos = await getPositions();
    setPositions(pos);
    const hist = await getTradeHistory();
    setTradeHistory(hist);
    const approved = await getApprovedStocks();
    setApprovedStocks(approved);

    // Check engine status
    const engineRes = await fetch('/api/db/engine/status');
    if (engineRes.ok) {
      const data = await engineRes.json();
      setIsEngineRunning(data.running);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/fetch-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiUrl: customApiUrl, apiKey })
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableModels(data.data || []);
      }
    } catch (e) {
      console.error("Failed to fetch models", e);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('customApiUrl', customApiUrl);
    localStorage.setItem('customApiModel', customApiModel);
    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('tradeSize', tradeSize.toString());
    localStorage.setItem('stopLossPct', stopLossPct.toString());
    localStorage.setItem('takeProfitPct', takeProfitPct.toString());
    localStorage.setItem('maxPositions', maxPositions.toString());
    setIsSettingsOpen(false);
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestionInput) {
      await approveStock(suggestionInput.toUpperCase());
      setSuggestionInput('');
      refreshData();
    }
  };

  const handleRemoveApprove = async (symbol: string) => {
    await removeApprovedStock(symbol);
    refreshData();
  };

  const toggleEngine = async () => {
    const endpoint = isEngineRunning ? '/api/db/engine/stop' : '/api/db/engine/start';
    await fetch(endpoint, { method: 'POST' });
    setIsEngineRunning(!isEngineRunning);
  };

  return (
    <div className="min-h-screen bg-[#0b0e11] text-[#eaecef] font-sans selection:bg-[#fcd535] selection:text-black">
      {/* Top Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-[#1e2329] border-b border-[#2b3139]">
        <div className="flex items-center gap-6">
          <h1 className="text-[#fcd535] text-xl font-bold tracking-tight">TradeAI</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors ${activeTab === 'dashboard' ? 'text-[#fcd535] border-[#fcd535]' : 'text-[#848e9c] border-transparent hover:text-white'}`}
            >
              Trading Bot
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`text-sm font-medium pb-1 border-b-2 transition-colors ${activeTab === 'portfolio' ? 'text-[#fcd535] border-[#fcd535]' : 'text-[#848e9c] border-transparent hover:text-white'}`}
            >
              Wallet / Orders
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-[#848e9c]">Engine Status:</span>
            <span className={`h-2.5 w-2.5 rounded-full ${isEngineRunning ? 'bg-[#0ecb81]' : 'bg-[#f6465d]'}`}></span>
            <span className={`text-sm font-medium ${isEngineRunning ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              {isEngineRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          <button
            onClick={toggleEngine}
            className={`flex items-center gap-2 px-4 py-1.5 rounded text-sm font-semibold transition-colors ${isEngineRunning ? 'bg-[#f6465d] hover:bg-[#c9394c] text-white' : 'bg-[#0ecb81] hover:bg-[#0b9c63] text-white'}`}
          >
            {isEngineRunning ? <Square size={16} /> : <Play size={16} />}
            {isEngineRunning ? 'Stop Bot' : 'Start Bot'}
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-[#848e9c] hover:text-white rounded hover:bg-[#2b3139] transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Approved Stocks Panel */}
            <div className="panel lg:col-span-1">
              <h2 className="text-lg font-semibold mb-4 text-white">Approved Trading Pairs</h2>
              <p className="text-sm text-[#848e9c] mb-4">The bot will autonomously evaluate and trade these pairs when running.</p>

              <form onSubmit={handleApprove} className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={suggestionInput}
                  onChange={(e) => setSuggestionInput(e.target.value)}
                  placeholder="e.g. BTC, AAPL"
                  className="input-field flex-1 uppercase"
                />
                <button type="submit" className="btn-secondary flex items-center justify-center">
                  <Plus size={16} />
                </button>
              </form>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {approvedStocks.length === 0 && (
                  <p className="text-sm text-[#848e9c] text-center py-4">No approved stocks yet. Add one above.</p>
                )}
                {approvedStocks.map(stock => (
                  <div key={stock.symbol} className="flex justify-between items-center p-3 bg-[#2b3139] rounded border border-[#2b3139] hover:border-[#474d57] transition-colors">
                    <span className="font-bold text-white">{stock.symbol}</span>
                    <button onClick={() => handleRemoveApprove(stock.symbol)} className="text-[#848e9c] hover:text-[#f6465d] transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Log / Status Panel */}
            <div className="panel lg:col-span-2 flex flex-col h-[600px]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">AI Reasoning Log</h2>
                <button onClick={refreshData} className="text-[#848e9c] hover:text-[#fcd535] transition-colors"><RefreshCw size={16} /></button>
              </div>
              <div className="flex-1 bg-[#0b0e11] rounded border border-[#2b3139] p-4 font-mono text-sm overflow-y-auto">
                <p className="text-[#848e9c] mb-2">// The AI's real-time thoughts will appear here when the engine is running.</p>
                <p className="text-[#848e9c]">Waiting for engine tick...</p>
                {/* In a real scenario, we'd fetch a log table from the DB */}
              </div>
            </div>

          </div>
        ) : (
          <div className="space-y-6">
            {/* Portfolio Overview */}
            <div className="panel">
              <h2 className="text-lg font-semibold mb-4 text-white">Estimated Balance</h2>
              <div className="flex gap-12">
                <div>
                  <p className="text-sm text-[#848e9c]">Fiat and Spot Balance</p>
                  <p className="text-3xl font-bold text-white mt-1">${portfolio.balance?.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Positions */}
            <div className="panel">
              <h2 className="text-lg font-semibold mb-4 text-white">Open Positions</h2>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="table-header">Pair</th>
                    <th className="table-header">Size</th>
                    <th className="table-header">Entry Price</th>
                    <th className="table-header">Stop Loss</th>
                    <th className="table-header">Take Profit</th>
                    <th className="table-header text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.length === 0 && (
                    <tr><td colSpan={6} className="table-cell text-center text-[#848e9c]">No open positions</td></tr>
                  )}
                  {positions.map(pos => (
                    <tr key={pos.id} className="border-b border-[#2b3139] hover:bg-[#2b3139] transition-colors">
                      <td className="table-cell font-bold text-white">{pos.symbol}</td>
                      <td className="table-cell">{pos.shares}</td>
                      <td className="table-cell">${pos.entryPrice?.toFixed(2)}</td>
                      <td className="table-cell text-[#f6465d]">${pos.stopLoss?.toFixed(2)}</td>
                      <td className="table-cell text-[#0ecb81]">${pos.takeProfit?.toFixed(2)}</td>
                      <td className="table-cell text-right">
                        {/* A real app would have a manual close button here */}
                        <button className="text-xs bg-[#2b3139] hover:bg-[#f6465d] text-white px-2 py-1 rounded transition-colors">Close</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Trade History */}
            <div className="panel">
              <h2 className="text-lg font-semibold mb-4 text-white">Order History</h2>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="table-header">Time</th>
                    <th className="table-header">Pair</th>
                    <th className="table-header">Type</th>
                    <th className="table-header">Executed</th>
                    <th className="table-header">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeHistory.length === 0 && (
                    <tr><td colSpan={5} className="table-cell text-center text-[#848e9c]">No trade history</td></tr>
                  )}
                  {tradeHistory.slice(0, 10).map(trade => (
                    <tr key={trade.id} className="border-b border-[#2b3139] hover:bg-[#2b3139] transition-colors">
                      <td className="table-cell">{new Date(trade.timestamp).toLocaleString()}</td>
                      <td className="table-cell font-bold text-white">{trade.symbol}</td>
                      <td className={`table-cell font-semibold ${trade.type === 'BUY' ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>{trade.type}</td>
                      <td className="table-cell">{trade.shares}</td>
                      <td className="table-cell">${trade.price?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1e2329] border border-[#2b3139] rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-white">AI Model Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#848e9c] mb-1">API Base URL</label>
                <input
                  type="text"
                  value={customApiUrl}
                  onChange={(e) => setCustomApiUrl(e.target.value)}
                  className="input-field w-full"
                  placeholder="http://localhost:1234/v1"
                />
              </div>

              <div>
                <label className="block text-sm text-[#848e9c] mb-1">API Key (Optional for Local)</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={fetchModels} className="btn-secondary w-full">Fetch Models</button>
              </div>

              <div>
                <label className="block text-sm text-[#848e9c] mb-1">Model ID</label>
                {availableModels.length > 0 ? (
                  <select
                    value={customApiModel}
                    onChange={(e) => setCustomApiModel(e.target.value)}
                    className="input-field w-full appearance-none"
                  >
                    {availableModels.map(m => (
                      <option key={m.id} value={m.id}>{m.id}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={customApiModel}
                    onChange={(e) => setCustomApiModel(e.target.value)}
                    className="input-field w-full"
                  />
                )}
              </div>

              <hr className="border-[#2b3139] my-4" />
              <h3 className="text-md font-semibold text-white mb-2">Trading Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#848e9c] mb-1">Trade Size (Shares)</label>
                  <input type="number" min="1" value={tradeSize} onChange={(e) => setTradeSize(Number(e.target.value))} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm text-[#848e9c] mb-1">Max Positions</label>
                  <input type="number" min="1" max="10" value={maxPositions} onChange={(e) => setMaxPositions(Number(e.target.value))} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm text-[#848e9c] mb-1">Stop Loss (%)</label>
                  <input type="number" min="1" value={stopLossPct} onChange={(e) => setStopLossPct(Number(e.target.value))} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm text-[#848e9c] mb-1">Take Profit (%)</label>
                  <input type="number" min="1" value={takeProfitPct} onChange={(e) => setTakeProfitPct(Number(e.target.value))} className="input-field w-full" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setIsSettingsOpen(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveSettings} className="btn-primary">Save Settings</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
