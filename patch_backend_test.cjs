const fs = require('fs');
let code = fs.readFileSync('backend_routes.test.ts', 'utf-8');

code = code.replace(
  "describe('Backend Routes', () => {",
  `describe('Backend Routes', () => {
  it('POST /api/portfolio/add-funds should update balance and return success', async () => {
    const res = await request(app).post('/api/portfolio/add-funds').send({ amount: 5000 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.amount).toBe(5000);
  });
`
);

fs.writeFileSync('backend_routes.test.ts', code);
