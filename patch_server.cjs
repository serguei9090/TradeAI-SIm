const fs = require("fs");
let code = fs.readFileSync("server.ts", "utf8");
code = code.replace(
	/const text = await acpManager.prompt\(prompt\);/,
	`const text = await acpManager.prompt("Hello");`,
);
fs.writeFileSync("server.ts", code);
