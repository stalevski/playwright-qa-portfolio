const { request } = require('./node_modules/playwright');
(async () => {
  const api = await request.newContext({ baseURL: 'https://petstore.swagger.io/v2/' });
  const pet = { id: Date.now(), category: { id: 1, name: 'Default Category' }, name: 'status-check-pet', photoUrls: [], tags: [], status: 'pending' };
  await api.post('pet', { data: pet });
  const response = await api.get('pet/findByStatus?status=pending');
  console.log('pending-after-create', response.status(), response.ok());
  console.log((await response.text()).slice(0, 200));
  await api.dispose();
})();
