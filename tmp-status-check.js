const { request } = require('./node_modules/playwright');
(async () => {
  const api = await request.newContext({ baseURL: 'https://petstore.swagger.io/v2/' });
  for (const status of ['available', 'pending', 'sold']) {
    const response = await api.get(`pet/findByStatus?status=${status}`);
    console.log(status, response.status(), response.ok());
  }
  await api.dispose();
})();
