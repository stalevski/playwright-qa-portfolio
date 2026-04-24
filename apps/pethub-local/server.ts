import express, { type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import {
  createCustomerCommand,
  createEmployeeCommand,
  createOrderCommand,
  createPetCommand,
  createUsersCommand,
  createUserCommand,
  deletePetCommand,
  deleteUserCommand,
  initializeLocalApp,
  loginUserCommand,
  logoutUserCommand,
  updateOrderStatusCommand,
  updatePetWithFormCommand,
  updatePetCommand,
  updateUserCommand,
} from './commands';
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
  getOrdersWithRelationsQuery,
  getPetByIdQuery,
  getPetRelationsQuery,
  getPetsQuery,
  getReadModelsQuery,
  getUserByIdQuery,
  getUserRelationsQuery,
  getUserByUsernameQuery,
  getUsersQuery,
} from './queries';

const app = express();
const port = Number(process.env.APP_PORT ?? 3000);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const respondNotFound = (response: Response, message: string): void => {
  response.status(404).json({ message });
};

const renderStatCard = (label: string, value: number): string => `<div class="card"><div class="muted">${label}</div><div style="font-size: 28px; font-weight: bold;">${value}</div></div>`;

const renderApiQuickLink = (method: string, path: string): string => `<li><span class="pill">${method}</span> <code>${path}</code></li>`;

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

const renderJsonCard = (title: string, value: unknown): string => `<div class="card"><div class="muted">${title}</div><pre>${JSON.stringify(value, null, 2)}</pre></div>`;

type StorefrontUser = {
  username: string;
  password: string;
  firstName: string;
  role: string;
  locked?: boolean;
};

type StorefrontCartItem = {
  petId: number;
  quantity: number;
};

type StorefrontSession = {
  id: string;
  username: string;
  cart: StorefrontCartItem[];
  checkout?: {
    firstName: string;
    lastName: string;
    postalCode: string;
  };
};

type StorefrontSortValue = 'az' | 'za' | 'lohi' | 'hilo';

const storefrontUsers: StorefrontUser[] = [
  { username: 'standard_user', password: 'secret_sauce', firstName: 'Standard', role: 'customer' },
  { username: 'problem_user', password: 'secret_sauce', firstName: 'Problem', role: 'customer' },
  { username: 'performance_user', password: 'secret_sauce', firstName: 'Performance', role: 'customer' },
  { username: 'locked_out_user', password: 'secret_sauce', firstName: 'Locked', role: 'customer', locked: true },
];

const storefrontSessions = new Map<string, StorefrontSession>();

const parseCookies = (request: Request): Record<string, string> => {
  const header = request.headers.cookie;
  if (!header) {
    return {};
  }

  return header.split(';').reduce<Record<string, string>>((cookies, part) => {
    const [name, ...value] = part.trim().split('=');
    if (name) {
      cookies[name] = decodeURIComponent(value.join('='));
    }
    return cookies;
  }, {});
};

const getStorefrontSession = (request: Request): StorefrontSession | undefined => {
  const cookies = parseCookies(request);
  const sessionId = cookies.storefront_session;
  if (!sessionId) {
    return undefined;
  }
  return storefrontSessions.get(sessionId);
};

const setStorefrontSessionCookie = (response: Response, sessionId: string): void => {
  response.setHeader('Set-Cookie', `storefront_session=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax`);
};

const clearStorefrontSessionCookie = (response: Response): void => {
  response.setHeader('Set-Cookie', 'storefront_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
};

const requireStorefrontSession = (request: Request, response: Response): StorefrontSession | undefined => {
  const session = getStorefrontSession(request);
  if (!session) {
    response.redirect('/shop');
    return undefined;
  }
  return session;
};

const storefrontDescriptions: Record<string, string> = {
  Dogs: 'Popular companions with premium training packages and speedy fulfillment.',
  Cats: 'Curated indoor favorites with cozy home bundles and wellness coverage.',
  Birds: 'Starter-friendly birds bundled with cages, care kits, and guided setup.',
};

const storefrontAccent: Record<string, string> = {
  Dogs: '#2563eb',
  Cats: '#7c3aed',
  Birds: '#0f766e',
};

const storefrontEmoji: Record<string, string> = {
  Dogs: '🐶',
  Cats: '🐱',
  Birds: '🐦',
};

const getStorefrontInventory = async (): Promise<Array<ReturnType<typeof mapPetToStorefrontItem>>> => {
  const pets = await getPetsQuery();
  return pets.filter((pet) => pet.status !== 'sold').map((pet) => mapPetToStorefrontItem(pet));
};

const mapPetToStorefrontItem = (pet: Awaited<ReturnType<typeof getPetsQuery>>[number]) => ({
  id: pet.id,
  name: pet.name,
  category: pet.category,
  status: pet.status,
  price: pet.price,
  notes: pet.notes,
  description: storefrontDescriptions[pet.category] ?? 'Local inventory item for practicing UI automation and exploratory testing.',
  badge: storefrontEmoji[pet.category] ?? '🐾',
  accent: storefrontAccent[pet.category] ?? '#2563eb',
});

const sortStorefrontInventory = (items: Array<ReturnType<typeof mapPetToStorefrontItem>>, sort: StorefrontSortValue): Array<ReturnType<typeof mapPetToStorefrontItem>> => {
  const copy = [...items];
  switch (sort) {
    case 'az':
      return copy.sort((left, right) => left.name.localeCompare(right.name));
    case 'za':
      return copy.sort((left, right) => right.name.localeCompare(left.name));
    case 'lohi':
      return copy.sort((left, right) => String(left.price).localeCompare(String(right.price)));
    case 'hilo':
      return copy.sort((left, right) => right.price - left.price);
  }
};

const getCartDetails = async (session: StorefrontSession): Promise<Array<ReturnType<typeof mapPetToStorefrontItem> & { quantity: number; lineTotal: number }>> => {
  const inventory = await getStorefrontInventory();
  return session.cart
    .map((item) => {
      const pet = inventory.find((candidate) => candidate.id === item.petId);
      if (!pet) {
        return undefined;
      }
      return {
        ...pet,
        quantity: item.quantity,
        lineTotal: pet.price * item.quantity,
      };
    })
    .filter((item): item is ReturnType<typeof mapPetToStorefrontItem> & { quantity: number; lineTotal: number } => Boolean(item));
};

const getCartBadgeCount = (session: StorefrontSession): number => session.cart.length;

const renderStorefrontLayout = (options: {
  title: string;
  heading: string;
  body: string;
  session?: StorefrontSession;
  activeNav?: 'inventory' | 'cart' | 'checkout';
}): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${options.title}</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; margin: 0; background: #0b1020; color: #e5eefc; }
    a { color: inherit; text-decoration: none; }
    .shell { min-height: 100vh; }
    .topbar { display: flex; justify-content: space-between; align-items: center; padding: 18px 28px; background: #11162a; border-bottom: 1px solid #26304d; position: sticky; top: 0; }
    .brand { display: grid; gap: 4px; }
    .brand strong { font-size: 20px; }
    .brand span { color: #93a4c7; font-size: 13px; }
    .nav { display: flex; gap: 12px; align-items: center; }
    .nav a, .nav button { background: ${options.activeNav ? '#18233f' : '#18233f'}; color: #e5eefc; border: 1px solid #334166; border-radius: 999px; padding: 10px 14px; font: inherit; cursor: pointer; }
    .nav .active { background: #2563eb; border-color: #2563eb; }
    .badge { display: inline-flex; min-width: 24px; justify-content: center; padding: 2px 8px; background: #f97316; color: white; border-radius: 999px; font-size: 12px; }
    main { padding: 32px; display: grid; gap: 24px; }
    .hero { display: grid; gap: 12px; background: linear-gradient(135deg, #1d4ed8, #7c3aed); padding: 28px; border-radius: 24px; }
    .hero h1 { margin: 0; font-size: 34px; }
    .hero p { margin: 0; max-width: 780px; color: #dbe6ff; }
    .panel { background: #11162a; border: 1px solid #26304d; border-radius: 20px; padding: 24px; }
    .grid { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .product-card { background: #131b31; border: 1px solid #2d3b5d; border-radius: 18px; padding: 18px; display: grid; gap: 12px; }
    .product-card .icon { font-size: 36px; }
    .product-card .meta { color: #8da2cc; font-size: 14px; }
    .price { font-size: 26px; font-weight: 700; }
    .row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
    .row-between { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
    .button, button, select, input { border-radius: 12px; font: inherit; }
    .button, button { border: none; padding: 12px 14px; background: #2563eb; color: white; cursor: pointer; }
    .button.secondary { background: #1f2937; border: 1px solid #334155; }
    .button.ghost { background: transparent; border: 1px solid #334155; }
    input, select { padding: 12px 14px; border: 1px solid #334155; background: #0f172a; color: #e5eefc; }
    .stack { display: grid; gap: 14px; }
    .error { padding: 12px 14px; border-radius: 14px; background: #451a1a; color: #fecaca; border: 1px solid #7f1d1d; }
    .muted { color: #93a4c7; }
    .summary { display: grid; gap: 10px; }
    .summary div { display: flex; justify-content: space-between; }
    .pill { border-radius: 999px; padding: 5px 10px; font-size: 12px; background: #1d4ed8; display: inline-block; }
    .login-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 24px; }
    @media (max-width: 900px) {
      .login-grid { grid-template-columns: 1fr; }
      main { padding: 20px; }
      .topbar { padding: 16px 20px; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header class="topbar">
      <div class="brand">
        <strong>PetHub Outfitters</strong>
        <span>Self-hosted QA storefront for inventory, cart, and checkout practice</span>
      </div>
      <nav class="nav">
        <a href="/">Admin</a>
        <a href="/shop/inventory" class="${options.activeNav === 'inventory' ? 'active' : ''}">Inventory</a>
        <a href="/shop/cart" class="${options.activeNav === 'cart' ? 'active' : ''}">Cart ${options.session ? `<span class="badge" data-test="shopping-cart-badge">${getCartBadgeCount(options.session)}</span>` : ''}</a>
        <a href="/shop/checkout" class="${options.activeNav === 'checkout' ? 'active' : ''}">Checkout</a>
        ${options.session ? `<form method="post" action="/shop/logout"><button type="submit">Logout</button></form>` : `<a href="/shop" class="button secondary">Sign in</a>`}
      </nav>
    </header>
    <main>
      ${options.body}
    </main>
  </div>
</body>
</html>`;

const renderStorefrontLogin = (error?: string): string => renderStorefrontLayout({
  title: 'PetHub Outfitters Login',
  heading: 'Sign in',
  body: `
    <section class="hero">
      <span class="pill">Local UI app</span>
      <h1>Practice against a local storefront instead of a third-party demo</h1>
      <p>Use this shop to exercise login, product navigation, cart state, checkout validation, and intentionally imperfect storefront behavior.</p>
    </section>
    <div class="login-grid">
      <section class="panel stack">
        <div>
          <h2 style="margin-top: 0;">Storefront Login</h2>
          <p class="muted">The flow is inspired by e-commerce demo apps, but everything is local and under your control.</p>
        </div>
        ${error ? `<div class="error" data-test="error">${error}</div>` : ''}
        <form method="post" action="/shop/login" class="stack">
          <input data-test="username" name="username" type="text" placeholder="Username" />
          <input data-test="password" name="password" type="password" placeholder="Password" />
          <button data-test="login-button" type="submit">Sign in</button>
        </form>
      </section>
      <section class="panel stack">
        <div>
          <h2 style="margin-top: 0;">Demo Accounts</h2>
          <p class="muted">Try multiple personas to explore different behaviors.</p>
        </div>
        ${storefrontUsers.map((user) => `<div class="row-between"><span><strong>${user.username}</strong><br /><span class="muted">${user.role}</span></span><span class="muted">${user.password}</span></div>`).join('')}
      </section>
    </div>`,
});

const renderStorefrontInventory = async (session: StorefrontSession, sort: StorefrontSortValue = 'az'): Promise<string> => {
  const items = sortStorefrontInventory(await getStorefrontInventory(), sort);
  return renderStorefrontLayout({
    title: 'PetHub Outfitters Inventory',
    heading: 'Inventory',
    session,
    activeNav: 'inventory',
    body: `
      <section class="hero">
        <span class="pill">Welcome back, ${session.username}</span>
        <h1>Inventory playground</h1>
        <p>Browse local pet inventory, sort products, open details, and add items to a cart. This view is intentionally realistic enough for UI automation and exploratory practice.</p>
      </section>
      <section class="panel stack">
        <div class="row-between">
          <div>
            <h2 style="margin: 0;">Available pets</h2>
            <p class="muted">Only pets that are not sold appear in the storefront.</p>
          </div>
          <form method="get" action="/shop/inventory" class="row">
            <label class="muted" for="sort">Sort</label>
            <select data-test="product-sort-container" id="sort" name="sort" onchange="this.form.submit()">
              <option value="az" ${sort === 'az' ? 'selected' : ''}>Name (A to Z)</option>
              <option value="za" ${sort === 'za' ? 'selected' : ''}>Name (Z to A)</option>
              <option value="lohi" ${sort === 'lohi' ? 'selected' : ''}>Price (low to high)</option>
              <option value="hilo" ${sort === 'hilo' ? 'selected' : ''}>Price (high to low)</option>
            </select>
          </form>
        </div>
        <div data-test="inventory-container" class="grid">
          ${items.map((item) => `
            <article data-test="inventory-item" class="product-card">
              <div class="row-between">
                <span class="icon">${item.badge}</span>
                <span class="pill" style="background: ${item.accent};">${item.category}</span>
              </div>
              <div class="stack">
                <a data-test="inventory-item-name" href="/shop/item/${item.id}"><strong>${item.name}</strong></a>
                <span class="meta">${item.description}</span>
                <span class="meta">${item.notes}</span>
              </div>
              <div class="row-between">
                <span data-test="inventory-item-price" class="price">$${item.price.toFixed(2)}</span>
                <form method="post" action="/shop/cart/add" class="row">
                  <input type="hidden" name="petId" value="${item.id}" />
                  <button type="submit">Add to cart</button>
                </form>
              </div>
            </article>`).join('')}
        </div>
      </section>`,
  });
};

const renderStorefrontItemDetails = async (session: StorefrontSession, petId: number): Promise<string> => {
  const item = (await getStorefrontInventory()).find((candidate) => candidate.id === petId);
  if (!item) {
    return renderStorefrontLayout({
      title: 'Item not found',
      heading: 'Missing item',
      session,
      activeNav: 'inventory',
      body: `<section class="panel"><h2 style="margin-top: 0;">Item not found</h2><p class="muted">The requested item is no longer available in the storefront.</p><a class="button" href="/shop/inventory">Back to inventory</a></section>`,
    });
  }

  return renderStorefrontLayout({
    title: item.name,
    heading: item.name,
    session,
    activeNav: 'inventory',
    body: `
      <section class="hero">
        <span class="pill">Product Details</span>
        <h1>${item.badge} ${item.name}</h1>
        <p>${item.description}</p>
      </section>
      <section class="panel stack">
        <div class="row-between">
          <div class="stack">
            <span class="muted">Category</span>
            <strong>${item.category}</strong>
          </div>
          <div class="stack" style="text-align: right;">
            <span class="muted">Status</span>
            <strong>${item.status}</strong>
          </div>
        </div>
        <p class="muted">${item.notes}</p>
        <div class="row-between">
          <span class="price">$${item.price.toFixed(2)}</span>
          <div class="row">
            <a class="button ghost" href="/shop/inventory">Back to products</a>
            <form method="post" action="/shop/cart/add">
              <input type="hidden" name="petId" value="${item.id}" />
              <button type="submit">Add to cart</button>
            </form>
          </div>
        </div>
      </section>`,
  });
};

const renderStorefrontCart = async (session: StorefrontSession): Promise<string> => {
  const items = await getCartDetails(session);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  return renderStorefrontLayout({
    title: 'Your cart',
    heading: 'Cart',
    session,
    activeNav: 'cart',
    body: `
      <section class="hero">
        <span class="pill">Cart</span>
        <h1>Your selected pets</h1>
        <p>Review items, adjust quantities, and head to checkout when you are ready.</p>
      </section>
      <section class="panel stack">
        <div class="row-between">
          <h2 style="margin: 0;">Cart items</h2>
          <a class="button secondary" href="/shop/inventory">Continue shopping</a>
        </div>
        ${items.length === 0 ? '<p class="muted">Your cart is empty.</p>' : items.map((item) => `
          <div class="product-card">
            <div class="row-between">
              <div>
                <strong data-test="inventory-item-name">${item.name}</strong>
                <div class="meta">${item.category}</div>
              </div>
              <div class="row">
                <span class="muted">Qty ${item.quantity}</span>
                <form method="post" action="/shop/cart/remove">
                  <input type="hidden" name="petId" value="${item.id}" />
                  <button class="button ghost" type="submit">Remove</button>
                </form>
              </div>
            </div>
            <div class="row-between">
              <span data-test="inventory-item-price">$${item.price.toFixed(2)}</span>
              <strong>$${item.lineTotal.toFixed(2)}</strong>
            </div>
          </div>`).join('')}
        <div class="summary">
          <div><span class="muted">Subtotal</span><strong>$${subtotal.toFixed(2)}</strong></div>
        </div>
        <div class="row">
          <a data-test="continue-shopping" class="button secondary" href="/shop/inventory">Continue shopping</a>
          <a data-test="checkout" class="button" href="/shop/checkout">Checkout</a>
        </div>
      </section>`,
  });
};

const renderStorefrontCheckout = async (session: StorefrontSession, error?: string): Promise<string> => {
  const items = await getCartDetails(session);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = subtotal;
  return renderStorefrontLayout({
    title: 'Checkout',
    heading: 'Checkout',
    session,
    activeNav: 'checkout',
    body: `
      <section class="hero">
        <span class="pill">Checkout</span>
        <h1>Complete your order</h1>
        <p>Provide shipping info, review totals, and finish the purchase flow entirely on your local machine.</p>
      </section>
      <div class="login-grid">
        <section class="panel stack">
          <div>
            <h2 style="margin-top: 0;">Your information</h2>
            <p class="muted">These values are only used for the local practice flow.</p>
          </div>
          ${error ? `<div class="error" data-test="error">${error}</div>` : ''}
          <form method="post" action="/shop/checkout" class="stack">
            <input data-test="firstName" name="firstName" placeholder="First Name" value="${session.checkout?.firstName ?? ''}" />
            <input data-test="lastName" name="lastName" placeholder="Last Name" value="${session.checkout?.lastName ?? ''}" />
            <input data-test="postalCode" name="postalCode" placeholder="Postal Code" value="${session.checkout?.postalCode ?? ''}" />
            <button data-test="continue" type="submit">Continue</button>
          </form>
        </section>
        <section class="panel stack">
          <div data-test="checkout-summary-container" class="stack">
            <h2 style="margin-top: 0;">Order summary</h2>
            ${items.map((item) => `<div class="row-between"><span>${item.name} x ${item.quantity}</span><span>$${item.lineTotal.toFixed(2)}</span></div>`).join('') || '<p class="muted">Your cart is empty.</p>'}
            <div class="summary">
              <div><span>Item total</span><strong data-test="subtotal-label">Item total: $${subtotal.toFixed(2)}</strong></div>
              <div><span>Tax</span><strong data-test="tax-label">Tax: $${tax.toFixed(2)}</strong></div>
              <div><span>Total</span><strong data-test="total-label">Total: $${total.toFixed(2)}</strong></div>
            </div>
          </div>
        </section>
      </div>`,
  });
};

const renderStorefrontComplete = async (session: StorefrontSession, orderId: number): Promise<string> => renderStorefrontLayout({
  title: 'Order complete',
  heading: 'Order complete',
  session,
  activeNav: 'checkout',
  body: `
    <section class="hero">
      <span class="pill">Order complete</span>
      <h1>Thanks for shopping locally</h1>
      <p>Your local practice order was created successfully and written to the PetHub Local backend.</p>
    </section>
    <section class="panel stack">
      <h2 style="margin-top: 0;">Order #${orderId}</h2>
      <p class="muted">You can verify the new order in the admin dashboard and API endpoints.</p>
      <div class="row">
        <a class="button" href="/shop/inventory">Back home</a>
        <a class="button secondary" href="/">Open admin dashboard</a>
      </div>
    </section>`,
});

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
    likelyChecks: ['Compare order status in source DB vs read model order ledger', 'Verify event feed contains order.status-updated', 'Check downstream billing order status'],
  },
  {
    slug: 'missing-analytics',
    title: 'Missing Analytics Event',
    severity: 'medium',
    summary: 'A workflow can appear successful in operations data but still not be represented in the analytics replica.',
    sourceOfTruth: 'Source events vs downstream analyticsEvents',
    observedInUi: 'Sync monitor counts and alert cards',
    likelyChecks: ['Compare source event count against analytics replica count', 'Identify latest missing entityId', 'Validate downstream sync timing'],
  },
  {
    slug: 'order-total-mismatch',
    title: 'Order Total Mismatch',
    severity: 'high',
    summary: 'The storefront can create an order whose total looks right in the UI but does not fully describe multi-item cart relations.',
    sourceOfTruth: 'Orders source DB, order relations, storefront completion flow',
    observedInUi: 'Storefront completion and operations incident detail',
    likelyChecks: ['Validate order total against cart lines', 'Check only first pet relation is persisted', 'Verify billing export amount and order relation payload'],
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
              ${latestOrders.map((order) => {
                const ledger = summary.readModels.orderLedger.find((entry) => entry.id === order.id);
                const billing = summary.downstream.billingOrders.find((entry) => entry.orderId === order.id);
                return `<tr><td>#${order.id}</td><td>${order.user?.username ?? order.userId}</td><td>${order.status}</td><td>${ledger?.status ?? 'missing'}</td><td>${billing?.orderStatus ?? 'missing'}</td></tr>`;
              }).join('')}
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
  const queueRows = summary.orders.slice(0, 10).map((order, index) => {
    const ledger = summary.readModels.orderLedger.find((entry) => entry.id === order.id);
    const severity = index === 0 || ledger?.status !== order.status ? 'high' : index % 2 === 0 ? 'medium' : 'low';
    const investigation = ledger?.status !== order.status ? 'Source and projection disagree' : order.totalAmount > 1000 ? 'High-value order requires downstream verification' : 'Routine verification';
    return `<tr><td><span class="pill" style="background: ${severityColor[severity]};">${severity}</span></td><td>#${order.id}</td><td>${order.user?.username ?? order.userId}</td><td>${order.status}</td><td>${ledger?.status ?? 'missing'}</td><td>${investigation}</td></tr>`;
  }).join('');

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

const renderOpsIncidents = async (): Promise<string> => renderOpsLayout({
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
          <div class="code">${JSON.stringify({
            latestOrder: summary.orders[0],
            latestLedger: summary.readModels.orderLedger[0],
            latestBilling: summary.downstream.billingOrders[0],
            latestEvent: summary.events[0],
          }, null, 2)}</div>
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
          ].map(([method, path]) => renderApiQuickLink(method, path)).join('')}
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
    ${renderTableSection('Pets', ['ID', 'Name', 'Category', 'Status', 'Price', 'Updated'], pets.map((pet) => [String(pet.id), pet.name, pet.category, pet.status, pet.price.toFixed(2), pet.updatedAt]))}
    ${renderTableSection('Employees', ['ID', 'User ID', 'Code', 'Department', 'Title', 'Status'], employees.map((employee) => [String(employee.id), String(employee.userId), employee.employeeCode, employee.department, employee.title, employee.status]))}
    ${renderTableSection('Customers', ['ID', 'User ID', 'Number', 'Segment', 'Tier', 'Status'], customers.map((customer) => [String(customer.id), String(customer.userId), customer.customerNumber, customer.segment, customer.loyaltyTier, customer.status]))}
    ${renderTableSection('Orders', ['ID', 'Pet', 'User', 'Status', 'Total', 'Updated'], orders.map((order) => [String(order.id), order.pet?.name ?? `Pet #${order.petId}`, order.user?.username ?? `User #${order.userId}`, order.status, order.totalAmount.toFixed(2), order.updatedAt]))}
    ${renderTableSection('Users', ['ID', 'Username', 'Email', 'Role', 'Created'], users.map((user) => [String(user.id), user.username, user.email, user.role, user.createdAt]))}
    ${renderTableSection('Audit Log', ['ID', 'Entity', 'Action', 'Details', 'Created'], audit.map((entry) => [String(entry.id), entry.order ? `order#${entry.order.id}` : entry.pet ? `pet#${entry.pet.id}` : entry.user ? `user#${entry.user.id}` : `${entry.entityType}#${entry.entityId}`, entry.action, entry.details, entry.createdAt]))}
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

app.get('/shop', (request: Request, response: Response) => {
  const session = getStorefrontSession(request);
  if (session) {
    response.redirect('/shop/inventory');
    return;
  }
  response.send(renderStorefrontLogin());
});

app.post('/shop/login', (request: Request, response: Response) => {
  const username = String(request.body.username ?? '').trim();
  const password = String(request.body.password ?? '').trim();

  if (!username) {
    response.status(400).send(renderStorefrontLogin('Epic sadface: Username is required'));
    return;
  }

  if (!password) {
    response.status(400).send(renderStorefrontLogin('Epic sadface: Password is required'));
    return;
  }

  const user = storefrontUsers.find((candidate) => candidate.username === username && candidate.password === password);
  if (!user) {
    response.status(400).send(renderStorefrontLogin('Epic sadface: Username and password do not match any user in this service'));
    return;
  }

  if (user.locked) {
    response.status(400).send(renderStorefrontLogin('Epic sadface: Sorry, this user has been locked out.'));
    return;
  }

  const sessionId = randomUUID();
  storefrontSessions.set(sessionId, {
    id: sessionId,
    username: user.username,
    cart: [],
  });
  setStorefrontSessionCookie(response, sessionId);
  response.redirect('/shop/inventory');
});

app.post('/shop/logout', (request: Request, response: Response) => {
  const session = getStorefrontSession(request);
  if (session) {
    storefrontSessions.delete(session.id);
  }
  clearStorefrontSessionCookie(response);
  response.redirect('/shop');
});

app.get('/shop/inventory', async (request: Request, response: Response) => {
  const session = requireStorefrontSession(request, response);
  if (!session) {
    return;
  }

  const rawSort = String(request.query.sort ?? 'az');
  const sort: StorefrontSortValue = rawSort === 'za' || rawSort === 'lohi' || rawSort === 'hilo' ? rawSort : 'az';
  response.send(await renderStorefrontInventory(session, sort));
});

app.get('/shop/item/:id', async (request: Request, response: Response) => {
  const session = requireStorefrontSession(request, response);
  if (!session) {
    return;
  }

  response.send(await renderStorefrontItemDetails(session, Number(request.params.id)));
});

app.post('/shop/cart/add', async (request: Request, response: Response) => {
  const session = requireStorefrontSession(request, response);
  if (!session) {
    return;
  }

  const petId = Number(request.body.petId);
  const existing = session.cart.find((item) => item.petId === petId);
  if (existing) {
    existing.quantity += 1;
  } else {
    session.cart.push({ petId, quantity: 1 });
  }

  response.redirect('/shop/inventory');
});

app.post('/shop/cart/remove', (request: Request, response: Response) => {
  const session = requireStorefrontSession(request, response);
  if (!session) {
    return;
  }

  const petId = Number(request.body.petId);
  session.cart = session.cart.filter((item) => item.petId !== petId);
  response.redirect('/shop/cart');
});

app.get('/shop/cart', async (request: Request, response: Response) => {
  const session = requireStorefrontSession(request, response);
  if (!session) {
    return;
  }

  response.send(await renderStorefrontCart(session));
});

app.get('/shop/checkout', async (request: Request, response: Response) => {
  const session = requireStorefrontSession(request, response);
  if (!session) {
    return;
  }

  response.send(await renderStorefrontCheckout(session));
});

app.post('/shop/checkout', async (request: Request, response: Response) => {
  const session = requireStorefrontSession(request, response);
  if (!session) {
    return;
  }

  const firstName = String(request.body.firstName ?? '').trim();
  const lastName = String(request.body.lastName ?? '').trim();
  const postalCode = String(request.body.postalCode ?? '').trim();
  session.checkout = { firstName, lastName, postalCode };

  if (!firstName) {
    response.status(400).send(await renderStorefrontCheckout(session, 'Error: First Name is required'));
    return;
  }

  if (!lastName) {
    response.status(400).send(await renderStorefrontCheckout(session, 'Error: Last Name is required'));
    return;
  }

  if (!postalCode) {
    response.status(400).send(await renderStorefrontCheckout(session, 'Error: Postal Code is required'));
    return;
  }

  const cartItems = await getCartDetails(session);
  if (cartItems.length === 0) {
    response.status(400).send(await renderStorefrontCheckout(session, 'Error: Your cart must contain at least one item'));
    return;
  }

  const firstLine = cartItems[0];
  const nextOrderId = Date.now();
  await createOrderCommand({
    id: nextOrderId,
    petId: firstLine.id,
    userId: 2002,
    quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    status: 'placed',
    totalAmount: cartItems.reduce((sum, item) => sum + item.lineTotal, 0),
  });

  session.cart = [];
  response.redirect(`/shop/complete?orderId=${nextOrderId}`);
});

app.get('/shop/complete', async (request: Request, response: Response) => {
  const session = requireStorefrontSession(request, response);
  if (!session) {
    return;
  }

  const orderId = Number(request.query.orderId ?? 0);
  response.send(await renderStorefrontComplete(session, orderId));
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
    response.status(404).send(renderOpsLayout({
      title: 'Incident not found',
      activeNav: 'incidents',
      body: '<section><h1>Incident not found</h1><p class="muted">The requested investigation pattern does not exist.</p></section>',
    }));
    return;
  }

  response.send(await renderOpsIncidentDetail(incident));
});

app.get('/api/health', (_request: Request, response: Response) => {
  response.json({ status: 'ok', service: 'pethub-qa-lab' });
});

app.get('/api/pets', async (_request: Request, response: Response) => {
  response.json(await getPetsQuery());
});

app.get('/api/pets/findByStatus', async (request: Request, response: Response) => {
  response.json(await findPetsByStatusQuery(String(request.query.status) as 'available' | 'pending' | 'sold'));
});

app.get('/api/pets/findByTags', async (request: Request, response: Response) => {
  const rawTags = request.query.tags;
  const tags = Array.isArray(rawTags)
    ? rawTags.map((tag) => String(tag))
    : String(rawTags ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
  response.json(await findPetsByTagsQuery(tags));
});

app.get('/api/pets/:id/relations', async (request: Request, response: Response) => {
  const pet = await getPetRelationsQuery(Number(request.params.id));
  if (!pet) {
    respondNotFound(response, 'Pet not found');
    return;
  }
  response.json(pet);
});

app.get('/api/pets/:id', async (request: Request, response: Response) => {
  const pet = await getPetByIdQuery(Number(request.params.id));
  if (!pet) {
    respondNotFound(response, 'Pet not found');
    return;
  }
  response.json(pet);
});

app.post('/api/pets', async (request: Request, response: Response) => {
  const pet = await createPetCommand(request.body);
  response.status(201).json(pet);
});

app.post('/api/pets/:id', async (request: Request, response: Response) => {
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

app.post('/api/pets/form-update', async (request: Request, response: Response) => {
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

app.post('/api/pets/:id/uploadImage', async (request: Request, response: Response) => {
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

app.put('/api/pets/:id', async (request: Request, response: Response) => {
  const pet = await updatePetCommand(Number(request.params.id), request.body);
  if (!pet) {
    respondNotFound(response, 'Pet not found');
    return;
  }
  response.json(pet);
});

app.delete('/api/pets/:id', async (request: Request, response: Response) => {
  const deleted = await deletePetCommand(Number(request.params.id));
  response.status(deleted ? 204 : 404).send();
});

app.get('/api/users', async (_request: Request, response: Response) => {
  response.json(await getUsersQuery());
});

app.get('/api/employees', async (_request: Request, response: Response) => {
  response.json(await getEmployeesQuery());
});

app.get('/api/employees/:id', async (request: Request, response: Response) => {
  const employee = await getEmployeeByIdQuery(Number(request.params.id));
  if (!employee) {
    respondNotFound(response, 'Employee not found');
    return;
  }
  response.json(employee);
});

app.post('/api/employees', async (request: Request, response: Response) => {
  const employee = await createEmployeeCommand(request.body);
  response.status(201).json(employee);
});

app.get('/api/customers', async (_request: Request, response: Response) => {
  response.json(await getCustomersQuery());
});

app.get('/api/customers/:id', async (request: Request, response: Response) => {
  const customer = await getCustomerByIdQuery(Number(request.params.id));
  if (!customer) {
    respondNotFound(response, 'Customer not found');
    return;
  }
  response.json(customer);
});

app.post('/api/customers', async (request: Request, response: Response) => {
  const customer = await createCustomerCommand(request.body);
  response.status(201).json(customer);
});

app.get('/api/users/login', async (request: Request, response: Response) => {
  const session = await loginUserCommand(String(request.query.username), String(request.query.password));
  if (!session) {
    response.status(400).json({ message: 'Invalid username/password supplied' });
    return;
  }
  response.json(session);
});

app.post('/api/users/login', async (request: Request, response: Response) => {
  const session = await loginUserCommand(String(request.body.username), String(request.body.password));
  if (!session) {
    response.status(400).send('Invalid username/password supplied');
    return;
  }
  response.redirect('/');
});

app.get('/api/users/logout', async (_request: Request, response: Response) => {
  await logoutUserCommand();
  response.json({ code: 200, type: 'unknown', message: 'ok' });
});

app.post('/api/users/logout', async (_request: Request, response: Response) => {
  await logoutUserCommand();
  response.redirect('/');
});

app.get('/api/users/by-username/:username', async (request: Request, response: Response) => {
  const user = await getUserByUsernameQuery(String(request.params.username));
  if (!user) {
    respondNotFound(response, 'User not found');
    return;
  }
  response.json(user);
});

app.get('/api/users/:id/relations', async (request: Request, response: Response) => {
  const user = await getUserRelationsQuery(Number(request.params.id));
  if (!user) {
    respondNotFound(response, 'User not found');
    return;
  }
  response.json(user);
});

app.get('/api/users/:id', async (request: Request, response: Response) => {
  const user = await getUserByIdQuery(Number(request.params.id));
  if (!user) {
    respondNotFound(response, 'User not found');
    return;
  }
  response.json(user);
});

app.post('/api/users', async (request: Request, response: Response) => {
  const user = await createUserCommand(request.body);
  response.status(201).json(user);
});

app.post('/api/users/createWithArray', async (request: Request, response: Response) => {
  const users = await createUsersCommand(request.body);
  response.status(201).json(users);
});

app.post('/api/users/createWithList', async (request: Request, response: Response) => {
  const users = await createUsersCommand(request.body);
  response.status(201).json(users);
});

app.put('/api/users/:username', async (request: Request, response: Response) => {
  const user = await updateUserCommand(String(request.params.username), request.body);
  if (!user) {
    respondNotFound(response, 'User not found');
    return;
  }
  response.json(user);
});

app.delete('/api/users/:username', async (request: Request, response: Response) => {
  const deleted = await deleteUserCommand(String(request.params.username));
  response.status(deleted ? 204 : 404).send();
});

app.get('/api/orders', async (_request: Request, response: Response) => {
  response.json(await getOrdersQuery());
});

app.get('/api/store/inventory', async (_request: Request, response: Response) => {
  response.json(await getInventoryQuery());
});

app.get('/api/orders/:id/relations', async (request: Request, response: Response) => {
  const order = await getOrderRelationsQuery(Number(request.params.id));
  if (!order) {
    respondNotFound(response, 'Order not found');
    return;
  }
  response.json(order);
});

app.get('/api/orders/:id', async (request: Request, response: Response) => {
  const order = await getOrderByIdQuery(Number(request.params.id));
  if (!order) {
    respondNotFound(response, 'Order not found');
    return;
  }
  response.json(order);
});

app.post('/api/orders', async (request: Request, response: Response) => {
  const order = await createOrderCommand(request.body);
  response.status(201).json(order);
});

app.patch('/api/orders/:id/status', async (request: Request, response: Response) => {
  const order = await updateOrderStatusCommand(Number(request.params.id), request.body.status);
  if (!order) {
    respondNotFound(response, 'Order not found');
    return;
  }
  response.json(order);
});

app.get('/api/audit-log', async (_request: Request, response: Response) => {
  response.json(await getAuditLogQuery());
});

app.get('/api/audit-log/relations', async (_request: Request, response: Response) => {
  response.json(await getAuditLogRelationsQuery());
});

app.get('/api/events', async (_request: Request, response: Response) => {
  response.json(await getEventsQuery());
});

app.get('/api/read-models', async (_request: Request, response: Response) => {
  response.json(await getReadModelsQuery());
});

app.get('/api/downstream-systems', async (_request: Request, response: Response) => {
  response.json(await getDownstreamSystemsQuery());
});

const start = async (): Promise<void> => {
  await initializeLocalApp();
  app.listen(port, () => {
    console.log(`PetHub QA Lab running at http://127.0.0.1:${port}`);
  });
};

void start();
