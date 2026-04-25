const fs = require("fs");
let code = fs.readFileSync("tradingEngine.ts", "utf8");

const importStatement = `import { acpManager } from "./acpManager";\n`;
if (!code.includes("import { acpManager }")) {
	code = importStatement + code;
}

code = code.replace(
	/if \(provider === "gemini"\) \{[\s\S]*?const genAiKey = settings\.apiKey \|\| process\.env\.google_api;[\s\S]*?if \(!genAiKey\) \{[\s\S]*?console\.log\("Gemini API key missing, skipping trade evaluation\."\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?const genAI = new GoogleGenerativeAI\(genAiKey\);[\s\S]*?const aiModel = genAI\.getGenerativeModel\(\{ model: targetModel \}\);[\s\S]*?const result = await aiModel\.generateContent\(prompt\);[\s\S]*?rawResponse = result\.response\.text\(\);[\s\S]*?\} else \{/,
	`if (provider === "gemini") {
				rawResponse = await acpManager.prompt(prompt);
			} else {`,
);

fs.writeFileSync("tradingEngine.ts", code);
