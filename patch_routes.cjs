const fs = require('fs');

let routes = fs.readFileSync('backend_routes.ts', 'utf8');
routes = routes.replace('import { GoogleGenerativeAI } from "@google/generative-ai";\n', '');
fs.writeFileSync('backend_routes.ts', routes);

let server = fs.readFileSync('server.ts', 'utf8');
server = server.replace('import { GoogleGenerativeAI } from "@google/generative-ai";\n', '');
fs.writeFileSync('server.ts', server);

let engine = fs.readFileSync('tradingEngine.ts', 'utf8');
engine = engine.replace('import { GoogleGenerativeAI } from "@google/generative-ai";\n', '');
fs.writeFileSync('tradingEngine.ts', engine);
