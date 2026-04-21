cat << 'PATCH' > backend_routes.patch
--- backend_routes.ts
+++ backend_routes.ts
@@ -10,6 +10,16 @@
   });
 });

+// Add Funds
+router.post('/portfolio/add-funds', (req, res) => {
+  const { amount } = req.body;
+  if (!amount || isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Valid amount is required' });
+
+  db.run("UPDATE portfolios SET balance = balance + ? WHERE id = 'default'", [amount], function(err) {
+    if (err) return res.status(500).json({ error: err.message });
+    res.json({ success: true, amount });
+  });
+});
+
 // Positions
 router.get('/positions', (req, res) => {
PATCH
patch backend_routes.ts backend_routes.patch
