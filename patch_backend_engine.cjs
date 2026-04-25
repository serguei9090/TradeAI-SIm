const fs = require("fs");

// Patch backend_routes.ts
let backendCode = fs.readFileSync("backend_routes.ts", "utf8");
backendCode = backendCode.replace(
	'import { GoogleGenerativeAI } from "@google/generative-ai";\n',
	"",
);
fs.writeFileSync("backend_routes.ts", backendCode);

// Patch tradingEngine.ts
let engineCode = fs.readFileSync("tradingEngine.ts", "utf8");
engineCode = engineCode.replace(
	'import { GoogleGenerativeAI } from "@google/generative-ai";\n',
	"",
);
fs.writeFileSync("tradingEngine.ts", engineCode);
