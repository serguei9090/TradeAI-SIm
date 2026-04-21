const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

// Insert new state variables for trade config near line 25
appCode = appCode.replace(
  "  const [approvedStocks, setApprovedStocks] = useState<any[]>([]);",
  `  const [approvedStocks, setApprovedStocks] = useState<any[]>([]);

  // Trade Config State
  const [tradeSize, setTradeSize] = useState(Number(localStorage.getItem('tradeSize')) || 1);
  const [stopLossPct, setStopLossPct] = useState(Number(localStorage.getItem('stopLossPct')) || 10);
  const [takeProfitPct, setTakeProfitPct] = useState(Number(localStorage.getItem('takeProfitPct')) || 10);
  const [maxPositions, setMaxPositions] = useState(Number(localStorage.getItem('maxPositions')) || 3);`
);

// Update saveSettings function
appCode = appCode.replace(
  "    localStorage.setItem('apiKey', apiKey);",
  `    localStorage.setItem('apiKey', apiKey);
    localStorage.setItem('tradeSize', tradeSize.toString());
    localStorage.setItem('stopLossPct', stopLossPct.toString());
    localStorage.setItem('takeProfitPct', takeProfitPct.toString());
    localStorage.setItem('maxPositions', maxPositions.toString());`
);

// Insert new UI elements into the Settings Modal
const settingsInjection = `
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
            </div>`;

appCode = appCode.replace(
  "            </div>\n\n            <div className=\"flex justify-end gap-3 mt-8\">",
  settingsInjection + "\n\n            <div className=\"flex justify-end gap-3 mt-8\">"
);

fs.writeFileSync('src/App.tsx', appCode);
