import express, { type Request, type Response } from 'express';
import { createPetCommand, initializeLocalApp } from './commands';
import {
  getAuditLogRelationsQuery,
  getCustomersQuery,
  getDownstreamSystemsQuery,
  getEmployeesQuery,
  getEventsQuery,
  getInventoryQuery,
  getOrdersWithRelationsQuery,
  getPetsQuery,
  getReadModelsQuery,
  getUsersQuery,
} from './queries';
import { apiRouter } from './routes/api.routes';
import { storefrontRouter } from './routes/storefront.routes';

const app = express();
const port = Number(process.env.APP_PORT ?? 3000);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiRouter);
app.use('/shop', storefrontRouter);

const renderStatCard = (label: string, value: number): string =>
  `<div class="card"><div class="muted">${label}</div><div style="font-size: 28px; font-weight: bold;">${value}</div></div>`;

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

type OpsCaseSeverity = 'low' | 'medium' | 'high';

type OpsCase = {
  slug: string;
  title: string;
  severity: OpsCaseSeverity;
  summary: string;
  sourceOfTruth: string;
  observedInUi: string;
  likelyChecks: string[];
};

const opsCases: OpsCase[] = [
  {
    slug: 'projection-lag',
    title: 'Projection Lag on Order Status',
    severity: 'high',
    summary: 'The source order can move forward while the UI still emphasizes an older projected status.',
    sourceOfTruth: 'Source DB and event feed',
    observedInUi: 'Dashboard cards and investigation summaries',
    likelyChecks: [
      'Compare order status in source DB vs read model order ledger',
      'Verify event feed contains order.status-updated',
      'Check downstream billing order status',
    ],
  },
  {
    slug: 'missing-analytics',
    title: 'Missing Analytics Event',
    severity: 'medium',
    summary:
      'A workflow can appear successful in operations data but still not be represented in the analytics replica.',
    sourceOfTruth: 'Source events vs downstream analyticsEvents',
    observedInUi: 'Sync monitor counts and alert cards',
    likelyChecks: [
      'Compare source event count against analytics replica count',
      'Identify latest missing entityId',
      'Validate downstream sync timing',
    ],
  },
  {
    slug: 'order-total-mismatch',
    title: 'Order Total Mismatch',
    severity: 'high',
    summary:
      'The storefront can create an order whose total looks right in the UI but does not fully describe multi-item cart relations.',
    sourceOfTruth: 'Orders source DB, order relations, storefront completion flow',
    observedInUi: 'Storefront completion and operations incident detail',
    likelyChecks: [
      'Validate order total against cart lines',
      'Check only first pet relation is persisted',
      'Verify billing export amount and order relation payload',
    ],
  },
];

const severityColor: Record<OpsCaseSeverity, string> = {
  low: '#0f766e',
  medium: '#d97706',
  high: '#dc2626',
};

const renderOpsLayout = (options: {
  title: string;
  body: string;
  activeNav?: 'overview' | 'queue' | 'comparisons' | 'incidents';
}): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${options.title}</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; margin: 0; background: #06111f; color: #e2e8f0; }
    a { color: inherit; text-decoration: none; }
    header { padding: 20px 28px; background: #0b1628; border-bottom: 1px solid #243449; display: flex; justify-content: space-between; align-items: center; }
    .brand { display: grid; gap: 4px; }
    .brand strong { font-size: 20px; }
    .brand span { color: #9fb0c9; font-size: 13px; }
    nav { display: flex; gap: 12px; flex-wrap: wrap; }
    nav a { padding: 10px 14px; border-radius: 999px; border: 1px solid #31455f; background: #132238; }
    nav a.active { background: #2563eb; border-color: #2563eb; }
    main { padding: 28px; display: grid; gap: 24px; }
    .hero { padding: 24px; border-radius: 22px; background: linear-gradient(135deg, #0f3a73, #4f46e5); }
    .hero h1, .hero p { margin: 0; }
    .hero p { margin-top: 10px; color: #dbeafe; max-width: 900px; }
    .grid { display: grid; gap: 18px; }
    .stats { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .two-column { grid-template-columns: 1.2fr 0.8fr; }
    .three-column { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .card, section { background: #0c1728; border: 1px solid #243449; border-radius: 18px; padding: 20px; }
    h1, h2, h3 { margin-top: 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #243449; font-size: 14px; vertical-align: top; }
    .muted { color: #9fb0c9; }
    .pill { display: inline-flex; padding: 5px 10px; border-radius: 999px; font-size: 12px; color: white; }
    .list { display: grid; gap: 10px; }
    .list div { padding: 12px 14px; border-radius: 12px; background: #101d31; border: 1px solid #22324a; }
    .code { font-family: Consolas, monospace; font-size: 13px; white-space: pre-wrap; word-break: break-word; }
    @media (max-width: 1000px) { .stats, .two-column, .three-column { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <strong>PetHub Operations Portal</strong>
      <span>Workflow monitoring, projections, downstream replicas, and investigation practice</span>
    </div>
    <nav>
      <a href="/" >Admin</a>
      <a href="/shop">Storefront</a>
      <a href="/ops" class="${options.activeNav === 'overview' ? 'active' : ''}">Overview</a>
      <a href="/ops/queue" class="${options.activeNav === 'queue' ? 'active' : ''}">Work Queue</a>
      <a href="/ops/comparisons" class="${options.activeNav === 'comparisons' ? 'active' : ''}">Comparisons</a>
      <a href="/ops/incidents" class="${options.activeNav === 'incidents' ? 'active' : ''}">Incidents</a>
    </nav>
  </header>
  <main>
    ${options.body}
  </main>
</body>
</html>`;

const buildOpsSummary = async () => {
  const orders = await getOrdersWithRelationsQuery();
  const audit = await getAuditLogRelationsQuery();
  const events = await getEventsQuery();
  const readModels = await getReadModelsQuery();
  const downstream = await getDownstreamSystemsQuery();
  const projectionLagCount = orders.filter((order) => {
    const ledger = readModels.orderLedger.find((entry) => entry.id === order.id);
    return ledger && ledger.status !== order.status;
  }).length;
  const analyticsGap = Math.max(events.length - downstream.analyticsEvents.length, 0);
  const billingMismatchCount = orders.filter((order) => {
    const billing = downstream.billingOrders.find((entry) => entry.orderId === order.id);
    return billing && billing.amount !== order.totalAmount;
  }).length;

  return {
    orders,
    audit,
    events,
    readModels,
    downstream,
    projectionLagCount,
    analyticsGap,
    billingMismatchCount,
    healthScore: Math.max(82, 100 - projectionLagCount * 8 - analyticsGap * 3),
  };
};

const renderOpsOverview = async (): Promise<string> => {
  const summary = await buildOpsSummary();
  const latestOrders = summary.orders.slice(0, 5);
  const latestEvents = summary.events.slice(0, 5);

  return renderOpsLayout({
    title: 'Operations Overview',
    activeNav: 'overview',
    body: `
      <section class="hero">
        <h1>Local workflow investigation playground</h1>
        <p>This portal is intentionally designed for backend-heavy QA work: compare source records, read models, downstream systems, and workflow evidence. Some summaries are intentionally optimistic so you still need to investigate the underlying data.</p>
      </section>
      <div class="grid stats">
        ${renderStatCard('Source Orders', summary.orders.length)}
        ${renderStatCard('Event Feed', summary.events.length)}
        ${renderStatCard('Projection Lag Alerts', summary.projectionLagCount)}
        ${renderStatCard('Ops Health Score', summary.healthScore)}
      </div>
      <div class="grid two-column">
        <section>
          <h2>Recent workflow items</h2>
          <table>
            <thead><tr><th>Order</th><th>User</th><th>Source Status</th><th>Ledger Status</th><th>Billing</th></tr></thead>
            <tbody>
              ${latestOrders
                .map((order) => {
                  const ledger = summary.readModels.orderLedger.find((entry) => entry.id === order.id);
                  const billing = summary.downstream.billingOrders.find((entry) => entry.orderId === order.id);
                  return `<tr><td>#${order.id}</td><td>${order.user?.username ?? order.userId}</td><td>${order.status}</td><td>${ledger?.status ?? 'missing'}</td><td>${billing?.orderStatus ?? 'missing'}</td></tr>`;
                })
                .join('')}
            </tbody>
          </table>
        </section>
        <section>
          <h2>Latest events</h2>
          <div class="list">
            ${latestEvents.map((event) => `<div><strong>${event.type}</strong><br /><span class="muted">${event.entityType}#${event.entityId}</span><br /><span class="muted">${event.createdAt}</span></div>`).join('')}
          </div>
        </section>
      </div>
      <div class="grid three-column">
        ${opsCases.map((incident) => `<section><span class="pill" style="background: ${severityColor[incident.severity]};">${incident.severity}</span><h3 style="margin-top: 12px;">${incident.title}</h3><p class="muted">${incident.summary}</p><a href="/ops/incidents/${incident.slug}" style="color: #93c5fd;">Open investigation</a></section>`).join('')}
      </div>`,
  });
};

const renderOpsQueue = async (): Promise<string> => {
  const summary = await buildOpsSummary();
  const queueRows = summary.orders
    .slice(0, 10)
    .map((order, index) => {
      const ledger = summary.readModels.orderLedger.find((entry) => entry.id === order.id);
      const severity = index === 0 || ledger?.status !== order.status ? 'high' : index % 2 === 0 ? 'medium' : 'low';
      const investigation =
        ledger?.status !== order.status
          ? 'Source and projection disagree'
          : order.totalAmount > 1000
            ? 'High-value order requires downstream verification'
            : 'Routine verification';
      return `<tr><td><span class="pill" style="background: ${severityColor[severity]};">${severity}</span></td><td>#${order.id}</td><td>${order.user?.username ?? order.userId}</td><td>${order.status}</td><td>${ledger?.status ?? 'missing'}</td><td>${investigation}</td></tr>`;
    })
    .join('');

  return renderOpsLayout({
    title: 'Operations Work Queue',
    activeNav: 'queue',
    body: `
      <section class="hero">
        <h1>Work queue</h1>
        <p>A simplified operator queue for investigative testing. It intentionally blends genuine data differences with noisy prioritization so you still need to validate the underlying systems.</p>
      </section>
      <section>
        <h2>Investigations requiring validation</h2>
        <table>
          <thead><tr><th>Priority</th><th>Order</th><th>User</th><th>Source</th><th>Projection</th><th>Reason</th></tr></thead>
          <tbody>${queueRows}</tbody>
        </table>
      </section>`,
  });
};

const renderOpsComparisons = async (): Promise<string> => {
  const summary = await buildOpsSummary();
  return renderOpsLayout({
    title: 'Operations Comparisons',
    activeNav: 'comparisons',
    body: `
      <section class="hero">
        <h1>Cross-system comparisons</h1>
        <p>Use this view to compare source data, projections, and downstream replicas. This is the fastest way to practice the kind of end-to-end data validation you do professionally.</p>
      </section>
      <div class="grid three-column">
        <section>
          <h2>Source orders</h2>
          <div class="code">${JSON.stringify(summary.orders.slice(0, 5), null, 2)}</div>
        </section>
        <section>
          <h2>Read model ledger</h2>
          <div class="code">${JSON.stringify(summary.readModels.orderLedger.slice(0, 5), null, 2)}</div>
        </section>
        <section>
          <h2>Billing replica</h2>
          <div class="code">${JSON.stringify(summary.downstream.billingOrders.slice(0, 5), null, 2)}</div>
        </section>
      </div>
      <div class="grid two-column">
        <section>
          <h2>Comparison notes</h2>
          <div class="list">
            <div>Orders are sourced from the operational JSON database.</div>
            <div>Order ledger is a derived projection refreshed through syncDerivedStores().</div>
            <div>Billing orders represent a downstream replica of order totals and status.</div>
            <div>The storefront checkout flow can create a business-valid total with incomplete item relation fidelity.</div>
          </div>
        </section>
        <section>
          <h2>Signals to investigate</h2>
          <table>
            <thead><tr><th>Signal</th><th>Count</th></tr></thead>
            <tbody>
              <tr><td>Projection lag</td><td>${summary.projectionLagCount}</td></tr>
              <tr><td>Analytics event gap</td><td>${summary.analyticsGap}</td></tr>
              <tr><td>Billing amount mismatch</td><td>${summary.billingMismatchCount}</td></tr>
            </tbody>
          </table>
        </section>
      </div>`,
  });
};

const renderOpsIncidents = async (): Promise<string> =>
  renderOpsLayout({
    title: 'Operations Incidents',
    activeNav: 'incidents',
    body: `
    <section class="hero">
      <h1>Known incident patterns</h1>
      <p>These scenarios are intentionally designed to train investigation habits: source-vs-projection validation, downstream gaps, and workflow integrity checks.</p>
    </section>
    <div class="grid three-column">
      ${opsCases.map((incident) => `<section><span class="pill" style="background: ${severityColor[incident.severity]};">${incident.severity}</span><h2 style="margin-top: 12px;">${incident.title}</h2><p class="muted">${incident.summary}</p><a href="/ops/incidents/${incident.slug}" style="color: #93c5fd;">Open detail</a></section>`).join('')}
    </div>`,
  });

const renderOpsIncidentDetail = async (incident: OpsCase): Promise<string> => {
  const summary = await buildOpsSummary();
  return renderOpsLayout({
    title: incident.title,
    activeNav: 'incidents',
    body: `
      <section class="hero">
        <span class="pill" style="background: ${severityColor[incident.severity]};">${incident.severity}</span>
        <h1 style="margin-top: 12px;">${incident.title}</h1>
        <p>${incident.summary}</p>
      </section>
      <div class="grid two-column">
        <section>
          <h2>Investigation brief</h2>
          <div class="list">
            <div><strong>Source of truth</strong><br /><span class="muted">${incident.sourceOfTruth}</span></div>
            <div><strong>Observed in UI</strong><br /><span class="muted">${incident.observedInUi}</span></div>
            ${incident.likelyChecks.map((check) => `<div>${check}</div>`).join('')}
          </div>
        </section>
        <section>
          <h2>Relevant live data</h2>
          <div class="code">${JSON.stringify(
            {
              latestOrder: summary.orders[0],
              latestLedger: summary.readModels.orderLedger[0],
              latestBilling: summary.downstream.billingOrders[0],
              latestEvent: summary.events[0],
            },
            null,
            2,
          )}</div>
        </section>
      </div>
      <section>
        <h2>Suggested validation path</h2>
        <table>
          <thead><tr><th>Step</th><th>What to compare</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>Source DB order vs read model order ledger</td></tr>
            <tr><td>2</td><td>Event feed vs analytics downstream replica</td></tr>
            <tr><td>3</td><td>UI summary labels vs source totals</td></tr>
            <tr><td>4</td><td>Order relation integrity through API relation endpoints</td></tr>
          </tbody>
        </table>
      </section>`,
  });
};

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

app.get('/ops', async (_request: Request, response: Response) => {
  response.send(await renderOpsOverview());
});

app.get('/ops/queue', async (_request: Request, response: Response) => {
  response.send(await renderOpsQueue());
});

app.get('/ops/comparisons', async (_request: Request, response: Response) => {
  response.send(await renderOpsComparisons());
});

app.get('/ops/incidents', async (_request: Request, response: Response) => {
  response.send(await renderOpsIncidents());
});

app.get('/ops/incidents/:slug', async (request: Request, response: Response) => {
  const incident = opsCases.find((candidate) => candidate.slug === request.params.slug);
  if (!incident) {
    response.status(404).send(
      renderOpsLayout({
        title: 'Incident not found',
        activeNav: 'incidents',
        body: '<section><h1>Incident not found</h1><p class="muted">The requested investigation pattern does not exist.</p></section>',
      }),
    );
    return;
  }

  response.send(await renderOpsIncidentDetail(incident));
});

const start = async (): Promise<void> => {
  await initializeLocalApp();
  app.listen(port, () => {
    console.log(`PetHub QA Lab running at http://127.0.0.1:${port}`);
  });
};

void start();
