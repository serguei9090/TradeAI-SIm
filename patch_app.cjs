const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Add addFunds import
code = code.replace(
  "import { getPortfolio, getPositions, getTradeHistory, getApprovedStocks, approveStock, removeApprovedStock, getSettings, updateSettings, getAiLogs } from './services/storage';",
  "import { getPortfolio, getPositions, getTradeHistory, getApprovedStocks, approveStock, removeApprovedStock, getSettings, updateSettings, getAiLogs, addFunds } from './services/storage';"
);

// Add state for amount to add
code = code.replace(
  "const [maxPositions, setMaxPositions] = useState(3);",
  "const [maxPositions, setMaxPositions] = useState(3);\n  const [addFundsAmount, setAddFundsAmount] = useState<number>(10000);"
);

// Add addFunds handler
code = code.replace(
  "const saveSettings = async () => {",
  `const handleAddFunds = async () => {
    if (addFundsAmount > 0) {
      await addFunds(addFundsAmount);
      fetchData();
      alert(\`Successfully added $\${addFundsAmount} to portfolio!\`);
    }
  };

  const saveSettings = async () => {`
);

// Add UI for Fund Management in Settings Modal
const replacementUI = `</div>
            </div>

            <hr className="border-[#2b3139] my-4" />
            <h3 className="text-md font-semibold text-white mb-2">Fund Management</h3>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={addFundsAmount}
                onChange={(e) => setAddFundsAmount(Number(e.target.value))}
                className="input-field w-full"
                placeholder="Amount to add"
              />
              <button onClick={handleAddFunds} className="btn-secondary whitespace-nowrap">Add Funds</button>
            </div>

            <div className="flex justify-end gap-3 mt-8">`;
code = code.replace(
  `</div>
            </div>

            <div className="flex justify-end gap-3 mt-8">`,
  replacementUI
);

fs.writeFileSync('src/App.tsx', code);
