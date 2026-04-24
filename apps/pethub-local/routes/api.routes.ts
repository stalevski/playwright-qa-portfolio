import { Router, type Request, type Response } from 'express';
import {
  createCustomerCommand,
  createEmployeeCommand,
  createOrderCommand,
  createPetCommand,
  createUserCommand,
  createUsersCommand,
  deletePetCommand,
  deleteUserCommand,
  loginUserCommand,
  logoutUserCommand,
  resetDatabase,
  updateOrderStatusCommand,
  updatePetCommand,
  updatePetWithFormCommand,
  updateUserCommand,
} from '../commands';
import {
  findPetsByStatusQuery,
  findPetsByTagsQuery,
  getAuditLogQuery,
  getAuditLogRelationsQuery,
  getCustomerByIdQuery,
  getCustomersQuery,
  getDownstreamSystemsQuery,
  getEmployeeByIdQuery,
  getEmployeesQuery,
  getEventsQuery,
  getInventoryQuery,
  getOrderByIdQuery,
  getOrderRelationsQuery,
  getOrdersQuery,
  getPetByIdQuery,
  getPetRelationsQuery,
  getPetsQuery,
  getReadModelsQuery,
  getUserByIdQuery,
  getUserByUsernameQuery,
  getUserRelationsQuery,
  getUsersQuery,
} from '../queries';
import { respondNotFound } from '../http/responses';

export const apiRouter = Router();

apiRouter.get('/health', (_request: Request, response: Response) => {
  response.json({ status: 'ok', service: 'pethub-qa-lab' });
});

apiRouter.get('/pets', async (_request: Request, response: Response) => {
  response.json(await getPetsQuery());
});

apiRouter.get('/pets/findByStatus', async (request: Request, response: Response) => {
  response.json(await findPetsByStatusQuery(String(request.query.status) as 'available' | 'pending' | 'sold'));
});

apiRouter.get('/pets/findByTags', async (request: Request, response: Response) => {
  const rawTags = request.query.tags;
  const tags = Array.isArray(rawTags)
    ? rawTags.map((tag) => String(tag))
    : String(rawTags ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
  response.json(await findPetsByTagsQuery(tags));
});

apiRouter.get('/pets/:id/relations', async (request: Request, response: Response) => {
  const pet = await getPetRelationsQuery(Number(request.params.id));
  if (!pet) {
    respondNotFound(response, 'Pet not found');
    return;
  }
  response.json(pet);
});

apiRouter.get('/pets/:id', async (request: Request, response: Response) => {
  const pet = await getPetByIdQuery(Number(request.params.id));
  if (!pet) {
    respondNotFound(response, 'Pet not found');
    return;
  }
  response.json(pet);
});

apiRouter.post('/pets', async (request: Request, response: Response) => {
  const pet = await createPetCommand(request.body);
  response.status(201).json(pet);
});

apiRouter.post('/pets/:id', async (request: Request, response: Response) => {
  const pet = await updatePetWithFormCommand(Number(request.params.id), {
    name: request.body.name ? String(request.body.name) : undefined,
    status: request.body.status,
  });
  if (!pet) {
    respondNotFound(response, 'Pet not found');
    return;
  }
  response.json({ code: 200, type: 'unknown', message: String(pet.id) });
});

apiRouter.post('/pets/form-update', async (request: Request, response: Response) => {
  const pet = await updatePetWithFormCommand(Number(request.body.petId), {
    name: request.body.name ? String(request.body.name) : undefined,
    status: request.body.status,
  });
  if (!pet) {
    respondNotFound(response, 'Pet not found');
    return;
  }
  response.redirect('/');
});

apiRouter.post('/pets/:id/uploadImage', async (request: Request, response: Response) => {
  const pet = await getPetByIdQuery(Number(request.params.id));
  if (!pet) {
    respondNotFound(response, 'Pet not found');
    return;
  }
  response.json({
    code: 200,
    type: 'unknown',
    message: `${String(request.body.additionalMetadata ?? 'uploaded')} ${String(request.body.file ?? 'file')} bytes`,
  });
});

apiRouter.put('/pets/:id', async (request: Request, response: Response) => {
  const pet = await updatePetCommand(Number(request.params.id), request.body);
  if (!pet) {
    respondNotFound(response, 'Pet not found');
    return;
  }
  response.json(pet);
});

apiRouter.delete('/pets/:id', async (request: Request, response: Response) => {
  const deleted = await deletePetCommand(Number(request.params.id));
  response.status(deleted ? 204 : 404).send();
});

apiRouter.get('/users', async (_request: Request, response: Response) => {
  response.json(await getUsersQuery());
});

apiRouter.get('/employees', async (_request: Request, response: Response) => {
  response.json(await getEmployeesQuery());
});

apiRouter.get('/employees/:id', async (request: Request, response: Response) => {
  const employee = await getEmployeeByIdQuery(Number(request.params.id));
  if (!employee) {
    respondNotFound(response, 'Employee not found');
    return;
  }
  response.json(employee);
});

apiRouter.post('/employees', async (request: Request, response: Response) => {
  const employee = await createEmployeeCommand(request.body);
  response.status(201).json(employee);
});

apiRouter.get('/customers', async (_request: Request, response: Response) => {
  response.json(await getCustomersQuery());
});

apiRouter.get('/customers/:id', async (request: Request, response: Response) => {
  const customer = await getCustomerByIdQuery(Number(request.params.id));
  if (!customer) {
    respondNotFound(response, 'Customer not found');
    return;
  }
  response.json(customer);
});

apiRouter.post('/customers', async (request: Request, response: Response) => {
  const customer = await createCustomerCommand(request.body);
  response.status(201).json(customer);
});

apiRouter.get('/users/login', async (request: Request, response: Response) => {
  const session = await loginUserCommand(String(request.query.username), String(request.query.password));
  if (!session) {
    response.status(400).json({ message: 'Invalid username/password supplied' });
    return;
  }
  response.json(session);
});

apiRouter.post('/users/login', async (request: Request, response: Response) => {
  const session = await loginUserCommand(String(request.body.username), String(request.body.password));
  if (!session) {
    response.status(400).send('Invalid username/password supplied');
    return;
  }
  response.redirect('/');
});

apiRouter.get('/users/logout', async (_request: Request, response: Response) => {
  await logoutUserCommand();
  response.json({ code: 200, type: 'unknown', message: 'ok' });
});

apiRouter.post('/users/logout', async (_request: Request, response: Response) => {
  await logoutUserCommand();
  response.redirect('/');
});

apiRouter.get('/users/by-username/:username', async (request: Request, response: Response) => {
  const user = await getUserByUsernameQuery(String(request.params.username));
  if (!user) {
    respondNotFound(response, 'User not found');
    return;
  }
  response.json(user);
});

apiRouter.get('/users/:id/relations', async (request: Request, response: Response) => {
  const user = await getUserRelationsQuery(Number(request.params.id));
  if (!user) {
    respondNotFound(response, 'User not found');
    return;
  }
  response.json(user);
});

apiRouter.get('/users/:id', async (request: Request, response: Response) => {
  const user = await getUserByIdQuery(Number(request.params.id));
  if (!user) {
    respondNotFound(response, 'User not found');
    return;
  }
  response.json(user);
});

apiRouter.post('/users', async (request: Request, response: Response) => {
  const user = await createUserCommand(request.body);
  response.status(201).json(user);
});

apiRouter.post('/users/createWithArray', async (request: Request, response: Response) => {
  const users = await createUsersCommand(request.body);
  response.status(201).json(users);
});

apiRouter.post('/users/createWithList', async (request: Request, response: Response) => {
  const users = await createUsersCommand(request.body);
  response.status(201).json(users);
});

apiRouter.put('/users/:username', async (request: Request, response: Response) => {
  const user = await updateUserCommand(String(request.params.username), request.body);
  if (!user) {
    respondNotFound(response, 'User not found');
    return;
  }
  response.json(user);
});

apiRouter.delete('/users/:username', async (request: Request, response: Response) => {
  const deleted = await deleteUserCommand(String(request.params.username));
  response.status(deleted ? 204 : 404).send();
});

apiRouter.get('/orders', async (_request: Request, response: Response) => {
  response.json(await getOrdersQuery());
});

apiRouter.get('/store/inventory', async (_request: Request, response: Response) => {
  response.json(await getInventoryQuery());
});

apiRouter.get('/orders/:id/relations', async (request: Request, response: Response) => {
  const order = await getOrderRelationsQuery(Number(request.params.id));
  if (!order) {
    respondNotFound(response, 'Order not found');
    return;
  }
  response.json(order);
});

apiRouter.get('/orders/:id', async (request: Request, response: Response) => {
  const order = await getOrderByIdQuery(Number(request.params.id));
  if (!order) {
    respondNotFound(response, 'Order not found');
    return;
  }
  response.json(order);
});

apiRouter.post('/orders', async (request: Request, response: Response) => {
  const order = await createOrderCommand(request.body);
  response.status(201).json(order);
});

apiRouter.patch('/orders/:id/status', async (request: Request, response: Response) => {
  const order = await updateOrderStatusCommand(Number(request.params.id), request.body.status);
  if (!order) {
    respondNotFound(response, 'Order not found');
    return;
  }
  response.json(order);
});

apiRouter.get('/audit-log', async (_request: Request, response: Response) => {
  response.json(await getAuditLogQuery());
});

apiRouter.get('/audit-log/relations', async (_request: Request, response: Response) => {
  response.json(await getAuditLogRelationsQuery());
});

apiRouter.get('/events', async (_request: Request, response: Response) => {
  response.json(await getEventsQuery());
});

apiRouter.get('/read-models', async (_request: Request, response: Response) => {
  response.json(await getReadModelsQuery());
});

apiRouter.get('/downstream-systems', async (_request: Request, response: Response) => {
  response.json(await getDownstreamSystemsQuery());
});

apiRouter.post('/admin/reset', async (_request: Request, response: Response) => {
  await resetDatabase();
  response.json({ status: 'ok', message: 'database reset and reseeded' });
});
