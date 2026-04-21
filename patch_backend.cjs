const fs = require('fs');
let code = fs.readFileSync('backend_routes.ts', 'utf8');
const replacement = `// AI Logs
router.get('/ai-logs', (req, res) => {
  db.all("SELECT * FROM ai_logs ORDER BY timestamp DESC LIMIT 50", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// AI Chat
router.post('/ai-chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const settings: any = await new Promise((resolve) => {
      db.get("SELECT * FROM settings WHERE id = 'default'", (err, row) => resolve(row || {}));
    });

    const targetUrl = settings.customApiUrl || process.env.AI_API_BASE || 'http://localhost:1234/v1';
    const targetModel = settings.customApiModel || process.env.AI_MODEL || 'local-model';
    const aiApiKey = settings.apiKey || process.env.AI_API_KEY || "no-key-needed";

    const aiRes = await fetch(\`\${targetUrl}/chat/completions\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${aiApiKey}\`,
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [{ role: "user", content: message }],
      }),
    });

    const aiData = await aiRes.json();
    const reply = aiData.choices?.[0]?.message?.content?.trim() || "No response from AI.";

    res.json({ reply });
  } catch (err: any) {
    console.error("AI Chat Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;`;

code = code.replace(/\/\/ AI Logs\nrouter\.get\('\/ai-logs', \(req, res\) => \{\n  db\.all\("SELECT \* FROM ai_logs ORDER BY timestamp DESC LIMIT 50", \(err, rows\) => \{\n    if \(err\) return res\.status\(500\)\.json\(\{ error: err\.message \}\);\n    res\.json\(rows\);\n  \}\);\n\}\);\n\nexport default router;/g, replacement);

fs.writeFileSync('backend_routes.ts', code);
