const fs = require('fs');

let engineCode = fs.readFileSync('tradingEngine.ts', 'utf8');

const importReplacement = `import db from './db';
import { GoogleGenerativeAI } from "@google/generative-ai";`;

engineCode = engineCode.replace(/import db from '\.\/db';/, importReplacement);

const aiCallReplacement = `    const provider = settings.modelProvider || 'custom';
    const targetModel = settings.customApiModel || process.env.AI_MODEL || 'local-model';

    let rawResponse = 'HOLD\\nNo AI response';
    try {
      if (provider === 'gemini') {
        const genAiKey = settings.apiKey || process.env.google_api;
        if (!genAiKey) {
            console.log("Gemini API key missing, skipping trade evaluation.");
            return;
        }
        const genAI = new GoogleGenerativeAI(genAiKey);
        const aiModel = genAI.getGenerativeModel({ model: targetModel });
        const result = await aiModel.generateContent(prompt);
        rawResponse = result.response.text();
      } else {
        const targetUrl = settings.customApiUrl || process.env.AI_API_BASE || 'http://localhost:1234/v1';
        const aiApiKey = settings.apiKey || process.env.AI_API_KEY || "no-key-needed";

        const aiRes = await fetch(\`\${targetUrl}/chat/completions\`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": \`Bearer \${aiApiKey}\`,
          },
          body: JSON.stringify({
            model: targetModel,
            messages: [{ role: "user", content: prompt }],
          }),
        });
        const aiData = await aiRes.json();
        rawResponse = aiData.choices?.[0]?.message?.content?.trim() || 'HOLD\\nNo AI response';
      }
    } catch(e) {
       console.log("AI request failed, skipping", e);
       return;
    }`;

engineCode = engineCode.replace(
  /const targetUrl = settings\.customApiUrl \|\| process\.env\.AI_API_BASE \|\| 'http:\/\/localhost:1234\/v1';[\s\S]*?const rawResponse = aiData\.choices\?\.\[0\]\?\.message\?\.content\?\.trim\(\) \|\| 'HOLD\\nNo AI response';/,
  aiCallReplacement
);

fs.writeFileSync('tradingEngine.ts', engineCode);
