const fs = require("fs");
let code = fs.readFileSync("src/App.tsx", "utf8");
code = code.replace(
	/const dashboardTotalValue =\n\t\t\(typeof funds === "number" \? funds : 0\) \+ dashboardTotalPortfolioValue;/,
	`const dashboardTotalValue =\n\t\t(typeof portfolio.balance === "number" ? portfolio.balance : 0) + dashboardTotalPortfolioValue;`,
);
fs.writeFileSync("src/App.tsx", code);
