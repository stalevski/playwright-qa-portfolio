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
} from '../queries';
import { renderHead, renderStatCard, renderThemeToggle } from '../http/render-helpers';

const renderApiQuickLink = (method: string, path: string): string =>
  `<li><span class="pill">${method}</span> <code>${path}</code></li>`;

const renderTableSection = (title: string, headers: string[], rows: string[][]): string => `
    <section>
      <h2>${title}</h2>
      <table>
        <thead><tr>${headers.map((header) => `<th scope="col">${header}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </section>`;

const renderJsonCard = (title: string, value: unknown): string =>
  `<div class="card"><div class="muted">${title}</div><pre>${JSON.stringify(value, null, 2)}</pre></div>`;

export const renderAdminHomePage = async (): Promise<string> => {
  const pets = await getPetsQuery();
  const users = await getUsersQuery();
  const employees = await getEmployeesQuery();
  const customers = await getCustomersQuery();
  const orders = await getOrdersWithRelationsQuery();
  const audit = await getAuditLogRelationsQuery();
  const readModels = await getReadModelsQuery();
  const downstreamSystems = await getDownstreamSystemsQuery();
  const inventory = await getInventoryQuery();

  return `<!DOCTYPE html>
<html lang="en">
${renderHead('PetHub Local')}
<body>
  <header>
    <div class="brand">
      <h1 style="margin: 0; font-size: 20px;">PetHub Local</h1>
      <span>Local QA sandbox for Playwright UI, API, event-driven CQRS flows, read models, downstream databases, and Swagger-style Petstore practice.</span>
    </div>
    <nav aria-label="Main">
      <a href="/shop">Storefront</a>
      <a href="/ops">Operations</a>
      ${renderThemeToggle()}
    </nav>
  </header>
  <main>
    <section aria-label="Summary statistics">
      <div class="grid stats">
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
            <label class="sr-only" for="admin-pet-id">Pet ID</label>
            <input id="admin-pet-id" name="id" type="number" placeholder="Pet ID" required />
            <label class="sr-only" for="admin-pet-name">Pet name</label>
            <input id="admin-pet-name" name="name" type="text" placeholder="Pet name" required />
          </div>
          <div class="row">
            <label class="sr-only" for="admin-pet-category">Category</label>
            <input id="admin-pet-category" name="category" type="text" placeholder="Category" required />
            <label class="sr-only" for="admin-pet-status">Status</label>
            <select id="admin-pet-status" name="status">
              <option value="available">available</option>
              <option value="pending">pending</option>
              <option value="sold">sold</option>
            </select>
          </div>
          <div class="row">
            <label class="sr-only" for="admin-pet-price">Price</label>
            <input id="admin-pet-price" name="price" type="number" step="0.01" placeholder="Price" required />
            <label class="sr-only" for="admin-pet-notes">Notes</label>
            <input id="admin-pet-notes" name="notes" type="text" placeholder="Notes" required />
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
          <a class="button" href="/shop" style="width: fit-content;">Open storefront</a>
        </div>
        <div class="card" style="display: grid; gap: 12px;">
          <strong>Operations Investigation Portal</strong>
          <span class="muted">Compare source data, projections, downstream replicas, and incident scenarios designed for backend-heavy QA investigation.</span>
          <a class="button" href="/ops" style="width: fit-content; background: var(--indigo);">Open operations portal</a>
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
          <label class="sr-only" for="explorer-find-status">Status</label>
          <select id="explorer-find-status" name="status">
            <option value="available">available</option>
            <option value="pending">pending</option>
            <option value="sold">sold</option>
          </select>
          <button type="submit">Execute</button>
        </form>
        <form method="get" action="/api/pets/findByTags">
          <h3>Find Pets by Tags</h3>
          <label class="sr-only" for="explorer-find-tags">Tags</label>
          <input id="explorer-find-tags" name="tags" type="text" placeholder="tag1,tag2" />
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
          <label class="sr-only" for="explorer-login-username">Username</label>
          <input id="explorer-login-username" name="username" type="text" placeholder="Username" required />
          <label class="sr-only" for="explorer-login-password">Password</label>
          <input id="explorer-login-password" name="password" type="password" placeholder="Password" required />
          <button type="submit">Execute</button>
        </form>
        <form method="post" action="/api/users/logout">
          <h3>User Logout</h3>
          <button type="submit">Execute</button>
        </form>
        <form method="post" action="/api/pets/form-update">
          <h3>Update Pet With Form Data</h3>
          <label class="sr-only" for="explorer-update-id">Pet ID</label>
          <input id="explorer-update-id" name="petId" type="number" placeholder="Pet ID" required />
          <label class="sr-only" for="explorer-update-name">Updated name</label>
          <input id="explorer-update-name" name="name" type="text" placeholder="Updated name" />
          <label class="sr-only" for="explorer-update-status">Status</label>
          <select id="explorer-update-status" name="status">
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
</html>`;
};
