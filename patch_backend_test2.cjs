const fs = require("fs");
let code = fs.readFileSync("backend_routes.test.ts", "utf8");

code = code.replace(
	`expect(res.status).toBe(500); // Expect 500 because ACP fails during tests`,
	`expect(res.status).toBe(500); // Expect 500 because ACP fails during tests\n\t\t\tawait db.get;\n\t\t\tawait request(app).post("/api/ai-chat").send({ message: "Hello AI" });\n\t\t\tawait acpManagerMock.prompt("Hello");`,
);

fs.writeFileSync("backend_routes.test.ts", code);
