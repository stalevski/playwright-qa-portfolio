import express, { type Request, type Response } from 'express';
import { createPetCommand, initializeLocalApp } from './commands';
import {
  getAuditLogRelationsQuery,
  getCustomersQuery,
  getDownstreamSystemsQuery,
  getEmployeesQuery,
  getInventoryQuery,
  getOrdersWithRelationsQuery,
  getPetsQuery,
  getReadModelsQuery,
  getUsersQuery,
} from './queries';
import { renderStatCard } from './http/render-helpers';
import { apiRouter } from './routes/api.routes';
import { opsRouter } from './routes/ops.routes';
import { storefrontRouter } from './routes/storefront.routes';

const app = express();
const port = Number(process.env.APP_PORT ?? 3000);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiRouter);
app.use('/shop', storefrontRouter);
app.use('/ops', opsRouter);

const renderApiQuickLink = (method: string, path: string): string =>
  `<li><span class="pill">${method}</span> <code>${path}</code></li>`;

const renderTableSection = (title: string, headers: string[], rows: string[][]): string => `
    <section>
      <h2>${title}</h2>
      <table>
        <thead><tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </section>`;

const renderJsonCard = (title: string, value: unknown): string =>
  `<div class="card"><div class="muted">${title}</div><pre>${JSON.stringify(value, null, 2)}</pre></div>`;

app.get('/', async (_request: Request, response: Response) => {
  const pets = await getPetsQuery();
  const users = await getUsersQuery();
  const employees = await getEmployeesQuery();
  const customers = await getCustomersQuery();
  const orders = await getOrdersWithRelationsQuery();
  const audit = await getAuditLogRelationsQuery();
  const readModels = await getReadModelsQuery();
  const downstreamSystems = await getDownstreamSystemsQuery();
  const inventory = await getInventoryQuery();

  response.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PetHub QA Lab</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #0f172a; color: #e2e8f0; }
    header { padding: 24px 32px; background: #111827; border-bottom: 1px solid #334155; }
    main { padding: 24px 32px; display: grid; gap: 24px; }
    section { background: #111827; border: 1px solid #334155; border-radius: 16px; padding: 20px; }
    h1, h2 { margin-top: 0; }
    .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
    .card { background: #1e293b; border-radius: 12px; padding: 16px; }
    .layout { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 24px; }
    .three-column { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #334155; font-size: 14px; }
    form { display: grid; gap: 12px; }
    input, select, textarea, button { border-radius: 10px; border: 1px solid #475569; padding: 10px 12px; font: inherit; }
    input, select, textarea { background: #0f172a; color: #e2e8f0; }
    button { background: #2563eb; color: white; border: none; cursor: pointer; }
    .row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .muted { color: #94a3b8; font-size: 14px; }
    .pill { display: inline-block; padding: 4px 8px; border-radius: 999px; background: #1d4ed8; font-size: 12px; }
    pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-size: 13px; }
  </style>
</head>
<body>
  <header>
    <h1>PetHub QA Lab</h1>
    <p class="muted">Local QA sandbox for Playwright UI, API, event-driven CQRS flows, read models, downstream databases, and Swagger-style Petstore practice.</p>
  </header>
  <main>
    <section>
      <div class="stats">
        ${renderStatCard('Pets', pets.length)}
        ${renderStatCard('Users', users.length)}
        ${renderStatCard('Employees', employees.length)}
        ${renderStatCard('Customers', customers.length)}
        ${renderStatCard('Orders', orders.length)}
        ${renderStatCard('Audit Events', audit.length)}
      </div>
    </section>
    <div class="layout">
      <section>
        <h2>Create Pet</h2>
        <form method="post" action="/pets">
          <div class="row">
            <input name="id" type="number" placeholder="Pet ID" required />
            <input name="name" type="text" placeholder="Pet name" required />
          </div>
          <div class="row">
            <input name="category" type="text" placeholder="Category" required />
            <select name="status">
              <option value="available">available</option>
              <option value="pending">pending</option>
              <option value="sold">sold</option>
            </select>
          </div>
          <div class="row">
            <input name="price" type="number" step="0.01" placeholder="Price" required />
            <input name="notes" type="text" placeholder="Notes" required />
          </div>
          <button type="submit">Create pet</button>
        </form>
      </section>
      <section>
        <h2>Local UI Playgrounds</h2>
        <p class="muted">Practice against first-party UI flows instead of relying only on public demos.</p>
        <div class="card" style="display: grid; gap: 12px; margin-bottom: 20px;">
          <strong>PetHub Outfitters Storefront</strong>
          <span class="muted">Login, inventory browsing, item details, cart, and checkout flow with QA-friendly imperfections.</span>
          <a href="/shop" style="display: inline-flex; width: fit-content; padding: 10px 14px; border-radius: 10px; background: #2563eb; color: white; text-decoration: none;">Open storefront</a>
        </div>
        <div class="card" style="display: grid; gap: 12px;">
          <strong>Operations Investigation Portal</strong>
          <span class="muted">Compare source data, projections, downstream replicas, and incident scenarios designed for backend-heavy QA investigation.</span>
          <a href="/ops" style="display: inline-flex; width: fit-content; padding: 10px 14px; border-radius: 10px; background: #4f46e5; color: white; text-decoration: none;">Open operations portal</a>
        </div>
      </section>
      <section>
        <h2>API Quick Links</h2>
        <p class="muted">Use these endpoints as stable local automation targets.</p>
        <ul>
          ${[
            ['GET', '/api/pets'],
            ['POST', '/api/pets'],
            ['PUT', '/api/pets/:id'],
            ['GET', '/api/orders'],
            ['POST', '/api/orders'],
            ['GET', '/api/users'],
            ['POST', '/api/users'],
            ['GET', '/api/employees'],
            ['POST', '/api/employees'],
            ['GET', '/api/customers'],
            ['POST', '/api/customers'],
            ['GET', '/api/audit-log'],
            ['GET', '/api/events'],
            ['GET', '/api/read-models'],
            ['GET', '/api/downstream-systems'],
          ]
            .map(([method, path]) => renderApiQuickLink(method, path))
            .join('')}
        </ul>
      </section>
    </div>
    <section>
      <h2>Swagger-style Explorer</h2>
      <p class="muted">Manual UI helpers for common Swagger Petstore operations against the local app.</p>
      <div class="three-column">
        <form method="get" action="/api/pets/findByStatus">
          <h3>Find Pets by Status</h3>
          <select name="status">
            <option value="available">available</option>
            <option value="pending">pending</option>
            <option value="sold">sold</option>
          </select>
          <button type="submit">Execute</button>
        </form>
        <form method="get" action="/api/pets/findByTags">
          <h3>Find Pets by Tags</h3>
          <input name="tags" type="text" placeholder="tag1,tag2" />
          <button type="submit">Execute</button>
        </form>
        <form method="get" action="/api/store/inventory">
          <h3>Get Inventory</h3>
          <button type="submit">Execute</button>
        </form>
      </div>
      <div class="three-column" style="margin-top: 24px;">
        <form method="post" action="/api/users/login">
          <h3>User Login</h3>
          <input name="username" type="text" placeholder="Username" required />
          <input name="password" type="password" placeholder="Password" required />
          <button type="submit">Execute</button>
        </form>
        <form method="post" action="/api/users/logout">
          <h3>User Logout</h3>
          <button type="submit">Execute</button>
        </form>
        <form method="post" action="/api/pets/form-update">
          <h3>Update Pet With Form Data</h3>
          <input name="petId" type="number" placeholder="Pet ID" required />
          <input name="name" type="text" placeholder="Updated name" />
          <select name="status">
            <option value="available">available</option>
            <option value="pending">pending</option>
            <option value="sold">sold</option>
          </select>
          <button type="submit">Execute</button>
        </form>
      </div>
      <div style="margin-top: 24px;" class="card">
        <div class="muted">Inventory Snapshot</div>
        <pre>${JSON.stringify(inventory, null, 2)}</pre>
      </div>
    </section>
    ${renderTableSection(
      'Pets',
      ['ID', 'Name', 'Category', 'Status', 'Price', 'Updated'],
      pets.map((pet) => [String(pet.id), pet.name, pet.category, pet.status, pet.price.toFixed(2), pet.updatedAt]),
    )}
    ${renderTableSection(
      'Employees',
      ['ID', 'User ID', 'Code', 'Department', 'Title', 'Status'],
      employees.map((employee) => [
        String(employee.id),
        String(employee.userId),
        employee.employeeCode,
        employee.department,
        employee.title,
        employee.status,
      ]),
    )}
    ${renderTableSection(
      'Customers',
      ['ID', 'User ID', 'Number', 'Segment', 'Tier', 'Status'],
      customers.map((customer) => [
        String(customer.id),
        String(customer.userId),
        customer.customerNumber,
        customer.segment,
        customer.loyaltyTier,
        customer.status,
      ]),
    )}
    ${renderTableSection(
      'Orders',
      ['ID', 'Pet', 'User', 'Status', 'Total', 'Updated'],
      orders.map((order) => [
        String(order.id),
        order.pet?.name ?? `Pet #${order.petId}`,
        order.user?.username ?? `User #${order.userId}`,
        order.status,
        order.totalAmount.toFixed(2),
        order.updatedAt,
      ]),
    )}
    ${renderTableSection(
      'Users',
      ['ID', 'Username', 'Email', 'Role', 'Created'],
      users.map((user) => [String(user.id), user.username, user.email, user.role, user.createdAt]),
    )}
    ${renderTableSection(
      'Audit Log',
      ['ID', 'Entity', 'Action', 'Details', 'Created'],
      audit.map((entry) => [
        String(entry.id),
        entry.order
          ? `order#${entry.order.id}`
          : entry.pet
            ? `pet#${entry.pet.id}`
            : entry.user
              ? `user#${entry.user.id}`
              : `${entry.entityType}#${entry.entityId}`,
        entry.action,
        entry.details,
        entry.createdAt,
      ]),
    )}
    <section>
      <h2>Read Models Database</h2>
      <div class="three-column">
        ${renderJsonCard('Pet Catalog', readModels.petCatalog.slice(0, 5))}
        ${renderJsonCard('User Directory', readModels.userDirectory.slice(0, 5))}
        ${renderJsonCard('Employee Directory', readModels.employeeDirectory.slice(0, 5))}
      </div>
      <div class="three-column" style="margin-top: 24px;">
        ${renderJsonCard('Customer Registry', readModels.customerRegistry.slice(0, 5))}
        ${renderJsonCard('Order Ledger', readModels.orderLedger.slice(0, 5))}
        ${renderJsonCard('Audit Feed', readModels.auditFeed.slice(0, 5))}
        ${renderJsonCard('Event Feed', readModels.eventFeed.slice(0, 5))}
      </div>
    </section>
    <section>
      <h2>Downstream Systems Database</h2>
      <div class="three-column">
        ${renderJsonCard('Inventory Replica', downstreamSystems.inventoryReplica.slice(0, 5))}
        ${renderJsonCard('CRM Customers', downstreamSystems.crmCustomers.slice(0, 5))}
        ${renderJsonCard('HR Employees', downstreamSystems.hrEmployees.slice(0, 5))}
      </div>
      <div class="three-column" style="margin-top: 24px;">
        ${renderJsonCard('Customer Profiles', downstreamSystems.customerProfiles.slice(0, 5))}
        ${renderJsonCard('Billing Orders', downstreamSystems.billingOrders.slice(0, 5))}
        ${renderJsonCard('Analytics Events', downstreamSystems.analyticsEvents.slice(0, 5))}
      </div>
    </section>
  </main>
</body>
</html>`);
});

app.post('/pets', async (request: Request, response: Response) => {
  await createPetCommand({
    id: Number(request.body.id),
    name: String(request.body.name),
    category: String(request.body.category),
    status: request.body.status,
    price: Number(request.body.price),
    notes: String(request.body.notes),
  });

  response.redirect('/');
});

const start = async (): Promise<void> => {
  await initializeLocalApp();
  app.listen(port, () => {
    // eslint-disable-next-line no-console -- intentional startup banner
    console.log(`PetHub QA Lab running at http://127.0.0.1:${port}`);
  });
};

void start();
