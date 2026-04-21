const fs = require('fs');
let code = fs.readFileSync('backend_routes.ts', 'utf-8');
const replacement = `// Portfolio
router.get('/portfolio', (req, res) => {
  db.get("SELECT * FROM portfolios WHERE id = 'default'", (err, row: any) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || { balance: 10000, totalValue: 10000 });
  });
});

// Add Funds
router.post('/portfolio/add-funds', (req, res) => {
  const { amount } = req.body;
  if (!amount || isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });

  db.run("UPDATE portfolios SET balance = balance + ? WHERE id = 'default'", [amount], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, amount });
  });
});`;
code = code.replace(`// Portfolio
router.get('/portfolio', (req, res) => {
  db.get("SELECT * FROM portfolios WHERE id = 'default'", (err, row: any) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || { balance: 10000, totalValue: 10000 });
  });
});`, replacement);
fs.writeFileSync('backend_routes.ts', code);
