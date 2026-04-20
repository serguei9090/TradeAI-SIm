import { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchStockPrice, fetchSentiment, runBacktest } from './services/data';
import { getTradingSuggestions } from './services/aiSuggestion';
import { executeTrade } from './services/trading';
import { getDoc as getLocalDoc, getDocs as getLocalDocs } from './services/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolio' | 'backtest'>('dashboard');
  const [modelProvider, setModelProvider] = useState<'gemini' | 'custom'>('gemini');
  const [customApiUrl, setCustomApiUrl] = useState(localStorage.getItem('customApiUrl') || 'http://localhost:1234/v1');
  const [customApiModel, setCustomApiModel] = useState(localStorage.getItem('customApiModel') || 'local-model');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('NVDA');
  const [price, setPrice] = useState<number>(0);
  const [sentiment, setSentiment] = useState<{ score: number, label: string }>({ score: 50, label: 'Neutral' });
  const [history, setHistory] = useState<string[]>(['NVDA']);
  const [inputValue, setInputValue] = useState('');
  
  const [chartData, setChartData] = useState<{time: string, price: number}[]>([]);
  const [timeframe, setTimeframe] = useState('1D');
  
  const [portfolio, setPortfolio] = useState<{balance: number, totalValue: number}>({balance: 10000, totalValue: 0});
  const [positions, setPositions] = useState<any[]>([]);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);

  const [backtestParams, setBacktestParams] = useState({ symbol: 'NVDA', start: '2026-01-01', end: '2026-02-01' });
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [autoTrade, setAutoTrade] = useState(false);
  const [isAgentRunning, setIsAgentRunning] = useState(false);
  
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [chatLog, setChatLog] = useState<{role: 'ai' | 'user', text: string}[]>([]);

  const getAiSuggestions = async () => {
    // Collect some data to pass to AI
    const data = { selectedSymbol, price, sentiment };
    const newSuggestions = await getTradingSuggestions(data);
    setSuggestions(newSuggestions);
    setChatLog(prev => [...prev, {role: 'ai', text: `Suggested stocks: ${newSuggestions.join(', ')}. Would you like to add them to Auto-Trade?`}]);
  };

  const addSuggestionToTrading = async (symbol: string) => {
    // Logic to add to a tracking list (implied: just updates autoTrade settings)
    setSelectedSymbol(symbol);
    setAutoTrade(true);
    setChatLog(prev => [...prev, {role: 'user', text: `Adding ${symbol} to auto-trade.`}]);
  };

  useEffect(() => {
    const updateData = async () => {
      const [newPrice, newSentiment] = await Promise.all([
        fetchStockPrice(selectedSymbol),
        fetchSentiment(selectedSymbol)
      ]);
      setPrice(newPrice);
      setSentiment(newSentiment);
      setChartData(prev => [...prev.slice(-19), {time: new Date().toLocaleTimeString().split(':').slice(0, 2).join(':'), price: newPrice}]);
      
      if (isAgentRunning) {
        getAiSuggestions();
      }

      if (autoTrade && newSentiment.label === 'Bullish' && positions.length < 3) {
        await executeTrade(selectedSymbol, 'BUY', 1, newPrice, newPrice * 0.9, newPrice * 1.1);
      }
    };
    
    updateData();
    const interval = setInterval(updateData, 5000);
    return () => clearInterval(interval);
  }, [selectedSymbol, autoTrade, positions.length]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const portData = await getLocalDoc('portfolios/default');
        if (portData) setPortfolio(portData);
        
        const posData = await getLocalDocs('positions');
        setPositions(posData);
        
        const histData = await getLocalDocs('history');
        setTradeHistory(histData);
      } catch (e) {
        console.error("Error loading local data", e);
      }
    };
    fetchPortfolio();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue) {
      const symbol = inputValue.toUpperCase();
      setSelectedSymbol(symbol);
      if (!history.includes(symbol)) {
        setHistory(prev => [symbol, ...prev].slice(0, 5));
      }
      setInputValue('');
    }
  };

  const handleBacktest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTesting(true);
    const results = await runBacktest(backtestParams.symbol, backtestParams.start, backtestParams.end);
    setBacktestResults(results);
    setIsTesting(false);
  };

  return (
    <div className="min-h-screen gradient-bg p-6 text-[#e2e8f0]">
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="glass-card p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Settings</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Model Provider</label>
              <select 
                value={modelProvider} 
                onChange={(e) => {
                  const val = e.target.value as 'gemini' | 'custom';
                  setModelProvider(val);
                  localStorage.setItem('modelProvider', val);
                }}
                className="glass-card w-full p-2"
              >
                <option value="gemini">Gemini</option>
                <option value="custom">Local / Custom API</option>
              </select>
            </div>
            {modelProvider === 'custom' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">API Base URL</label>
                  <input
                    type="text"
                    value={customApiUrl}
                    onChange={(e) => {
                      setCustomApiUrl(e.target.value);
                      localStorage.setItem('customApiUrl', e.target.value);
                    }}
                    className="glass-card w-full p-2"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Model Name</label>
                  <input
                    type="text"
                    value={customApiModel}
                    onChange={(e) => {
                      setCustomApiModel(e.target.value);
                      localStorage.setItem('customApiModel', e.target.value);
                    }}
                    className="glass-card w-full p-2"
                  />
                </div>
              </>
            )}
            <button onClick={() => setIsSettingsOpen(false)} className="glass-card w-full py-2 bg-blue-600">Close</button>
          </div>
        </div>
      )}
      
        <nav className="mb-8 p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"></div>
            <h1 className="text-xl font-bold tracking-tight text-white">TradeAI Sim</h1>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => setIsSettingsOpen(true)} className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200">Settings</button>
            <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200">
              <input type="checkbox" checked={autoTrade} onChange={e => setAutoTrade(e.target.checked)} />
              <span>Auto-Trade</span>
            </label>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ticker..."
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button type="submit" className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white">Search</button>
            </form>
            <div className="h-6 w-px bg-slate-700 mx-2"></div>
            <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-1.5 text-sm rounded-lg ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('portfolio')} className={`px-4 py-1.5 text-sm rounded-lg ${activeTab === 'portfolio' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Portfolio</button>
            <button onClick={() => setActiveTab('backtest')} className={`px-4 py-1.5 text-sm rounded-lg ${activeTab === 'backtest' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Backtest</button>
          </div>
        </nav>

      {activeTab === 'dashboard' ? (
        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-medium text-slate-400">Search History</h2>
            <div className="flex flex-wrap gap-2 mt-4">
              {history.map(sym => (
                <button key={sym} onClick={() => setSelectedSymbol(sym)} className={`px-3 py-1 text-xs rounded-full ${sym === selectedSymbol ? 'bg-blue-600' : 'bg-white/10'}`}>
                  {sym}
                </button>
              ))}
            </div>
          </div>
          <div className="glass-card p-6 col-span-1 md:col-span-2">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-medium text-slate-400">{selectedSymbol} Price Chart</h2>
              <div className="flex gap-2">
                {['1D', '5D', '1M', '1Y'].map(tf => (
                  <button key={tf} onClick={() => setTimeframe(tf)} className={`px-2 py-0.5 text-xs rounded ${timeframe === tf ? 'bg-blue-600' : 'bg-white/10'}`}>
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="time" stroke="#64748b" />
                  <YAxis stroke="#64748b" domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '0.5rem', color: '#f8fafc' }}
                    itemStyle={{ color: '#3b82f6' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                    labelStyle={{ color: '#94a3b8', marginBottom: '0.25rem' }}
                  />
                  <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card p-6">
            <h2 className="text-lg font-medium text-slate-400">Market Sentiment</h2>
            <p className={`text-2xl font-bold ${sentiment.label === 'Bullish' ? 'text-green-400' : sentiment.label === 'Bearish' ? 'text-red-400' : 'text-slate-400'}`}>
              {sentiment.label} ({sentiment.score})
            </p>
          </div>
          <div className="glass-card p-6 col-span-1 md:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-slate-400">AI Trading Agent</h2>
              <button 
                onClick={() => setIsAgentRunning(!isAgentRunning)} 
                className={`px-4 py-2 rounded-lg text-sm font-medium ${isAgentRunning ? 'bg-red-900/50 text-red-200' : 'bg-blue-900/50 text-blue-200'}`}
              >
                {isAgentRunning ? 'Stop Agent' : 'Start Agent'}
              </button>
            </div>
            
            <div className="h-40 overflow-y-auto mb-4 p-4 bg-slate-950 rounded-lg space-y-2 border border-slate-800">
              {chatLog.length === 0 && <p className="text-slate-600 italic">Agent is idle. Click "Start Agent" to begin.</p>}
              {chatLog.map((log, i) => <p key={i} className={log.role === 'ai' ? 'text-blue-400' : 'text-slate-300'}>[{log.role.toUpperCase()}]: {log.text}</p>)}
            </div>

            <div className="flex gap-2">
              {suggestions.map(sym => (
                <button key={sym} onClick={() => addSuggestionToTrading(sym)} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-sm border border-slate-700 text-slate-200">
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </main>
      ) : activeTab === 'portfolio' ? (
        <main className="glass-card p-6">
          <h2 className="text-xl font-bold mb-6">Portfolio Details</h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass-card p-4"><h3 className="text-slate-400 text-sm">Cash</h3><p className="text-2xl font-mono">${portfolio.balance.toFixed(2)}</p></div>
            <div className="glass-card p-4"><h3 className="text-slate-400 text-sm">Total Value</h3><p className="text-2xl font-mono">${portfolio.totalValue.toFixed(2)}</p></div>
            <div className="glass-card p-4"><h3 className="text-slate-400 text-sm">Perf vs Benchmark</h3><p className="text-2xl font-mono text-green-400">+2.4%</p></div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-sm border-b border-white/10">
                <th className="pb-2">Symbol</th>
                <th className="pb-2">Shares</th>
                <th className="pb-2">Avg Entry</th>
                <th className="pb-2">Stop Loss</th>
                <th className="pb-2">Take Profit</th>
                <th className="pb-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(pos => (
                <tr key={pos.id} className="border-b border-white/5">
                  <td className="py-3 font-bold">{pos.symbol}</td>
                  <td className="py-3">{pos.shares}</td>
                  <td className="py-3">${pos.entryPrice.toFixed(2)}</td>
                  <td className="py-3">${pos.stopLoss.toFixed(2)}</td>
                  <td className="py-3">${pos.takeProfit.toFixed(2)}</td>
                  <td className="py-3">${ (pos.shares * (pos.symbol === selectedSymbol ? (price || 0) : (pos.entryPrice || 0))).toFixed(2) }</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="text-lg font-bold mt-10 mb-4">Trade History</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-sm border-b border-white/10">
                <th className="pb-2">Symbol</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Shares</th>
                <th className="pb-2">Exec Price</th>
              </tr>
            </thead>
            <tbody>
              {tradeHistory.map(trade => (
                <tr key={trade.id} className="border-b border-white/5">
                  <td className="py-3 font-bold">{trade.symbol}</td>
                  <td className={`py-3 ${trade.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{trade.type}</td>
                  <td className="py-3">{trade.shares}</td>
                  <td className="py-3">${trade.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      ) : (
        <main className="glass-card p-6">
          <h2 className="text-xl font-bold mb-6">Strategy Backtester</h2>
          <form onSubmit={handleBacktest} className="grid grid-cols-2 gap-4 mb-8">
            <input type="text" value={backtestParams.symbol} onChange={e => setBacktestParams({...backtestParams, symbol: e.target.value.toUpperCase()})} className="glass-card p-2" placeholder="Symbol" />
            <input type="date" value={backtestParams.start} onChange={e => setBacktestParams({...backtestParams, start: e.target.value})} className="glass-card p-2" />
            <input type="date" value={backtestParams.end} onChange={e => setBacktestParams({...backtestParams, end: e.target.value})} className="glass-card p-2" />
            <button type="submit" disabled={isTesting} className="glass-card p-2 bg-blue-600 hover:bg-blue-700">{isTesting ? 'Running...' : 'Run Backtest'}</button>
          </form>
          {backtestResults && (
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card p-4"><h3 className="text-slate-400 text-sm">Profit</h3><p className="text-xl font-mono">${backtestResults.totalProfit.toFixed(2)}</p></div>
              <div className="glass-card p-4"><h3 className="text-slate-400 text-sm">Win Rate</h3><p className="text-xl font-mono">{(backtestResults.winRate * 100).toFixed(1)}%</p></div>
              <div className="glass-card p-4"><h3 className="text-slate-400 text-sm">Drawdown</h3><p className="text-xl font-mono">{(backtestResults.maxDrawdown * 100).toFixed(1)}%</p></div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
