const fs = require("fs");
let code = fs.readFileSync("backend_routes.ts", "utf8");

const importStatement = `import { acpManager } from "./acpManager";\n`;
if (!code.includes("import { acpManager }")) {
	code = importStatement + code;
}

code = code.replace(
	/if \(provider === "gemini"\) \{[\s\S]*?const apiKey = settings\.apiKey \|\| process\.env\.google_api;[\s\S]*?if \(!apiKey\)[\s\S]*?return res\.status\(400\)\.json\(\{ error: "Gemini API Key missing" \}\);[\s\S]*?const genAI = new GoogleGenerativeAI\(apiKey\);[\s\S]*?const aiModel = genAI\.getGenerativeModel\(\{ model: targetModel \}\);[\s\S]*?const result = await aiModel\.generateContent\(message\);[\s\S]*?const reply = result\.response\.text\(\);[\s\S]*?res\.json\(\{ reply \}\);[\s\S]*?\} else \{/,
	`if (provider === "gemini") {
			try {
				const reply = await acpManager.prompt(message);
				res.json({ reply });
			} catch (e: any) {
				console.error("ACP Chat error:", e);
				res.status(500).json({ error: \`Gemini ACP error: \${e.message}\` });
			}
		} else {`,
);

fs.writeFileSync("backend_routes.ts", code);
