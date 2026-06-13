import type { Request, Response } from 'express';
import { getPetsQuery } from '../queries';
import { renderHead, renderPrimaryNavLinks, renderThemeToggle, renderToast } from '../http/render-helpers';

export type StorefrontUser = {
  username: string;
  password: string;
  /**
   * Real `userId` from the seeded `users` table that orders placed by this
   * storefront persona should be attributed to. Storefront usernames
   * (`standard_user`, `problem_user`, ...) are practice mocks that don't
   * correspond to real API users by name, so we explicitly map each one to
   * a seeded user id rather than hardcoding 2002 at order-creation time.
   */
  userId: number;
  role: string;
  locked?: boolean;
};

export type StorefrontCartItem = {
  petId: number;
  quantity: number;
};

export type StorefrontSession = {
  id: string;
  username: string;
  userId: number;
  cart: StorefrontCartItem[];
  checkout?: {
    firstName: string;
    lastName: string;
    postalCode: string;
  };
};

export type StorefrontSortValue = 'az' | 'za' | 'lohi' | 'hilo';

export const storefrontUsers: StorefrontUser[] = [
  { username: 'standard_user', password: 'pethub123', userId: 2002, role: 'customer' },
  { username: 'problem_user', password: 'pethub123', userId: 2003, role: 'customer' },
  { username: 'performance_user', password: 'pethub123', userId: 2004, role: 'customer' },
  { username: 'locked_out_user', password: 'pethub123', userId: 2005, role: 'customer', locked: true },
];

export const storefrontSessions = new Map<string, StorefrontSession>();

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

export const getStorefrontSession = (request: Request): StorefrontSession | undefined => {
  const cookies = parseCookies(request);
  const sessionId = cookies.storefront_session;
  if (!sessionId) {
    return undefined;
  }
  return storefrontSessions.get(sessionId);
};

export const setStorefrontSessionCookie = (response: Response, sessionId: string): void => {
  response.setHeader(
    'Set-Cookie',
    `storefront_session=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax`,
  );
};

export const clearStorefrontSessionCookie = (response: Response): void => {
  response.setHeader('Set-Cookie', 'storefront_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
};

export const requireStorefrontSession = (request: Request, response: Response): StorefrontSession | undefined => {
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

export const mapPetToStorefrontItem = (pet: Awaited<ReturnType<typeof getPetsQuery>>[number]) => ({
  id: pet.id,
  name: pet.name,
  category: pet.category,
  status: pet.status,
  price: pet.price,
  notes: pet.notes,
  description:
    storefrontDescriptions[pet.category] ??
    'Local inventory item for practicing UI automation and exploratory testing.',
  badge: storefrontEmoji[pet.category] ?? '🐾',
  accent: storefrontAccent[pet.category] ?? '#2563eb',
});

export type StorefrontItem = ReturnType<typeof mapPetToStorefrontItem>;
export type StorefrontCartLine = StorefrontItem & { quantity: number; lineTotal: number };

export const getStorefrontInventory = async (): Promise<StorefrontItem[]> => {
  const pets = await getPetsQuery();
  return pets.filter((pet) => pet.status !== 'sold').map((pet) => mapPetToStorefrontItem(pet));
};

export const sortStorefrontInventory = (items: StorefrontItem[], sort: StorefrontSortValue): StorefrontItem[] => {
  const copy = [...items];
  switch (sort) {
    case 'az':
      return copy.sort((left, right) => left.name.localeCompare(right.name));
    case 'za':
      return copy.sort((left, right) => right.name.localeCompare(left.name));
    case 'lohi':
      return copy.sort((left, right) => left.price - right.price);
    case 'hilo':
      return copy.sort((left, right) => right.price - left.price);
  }
};

export const getCartDetails = async (session: StorefrontSession): Promise<StorefrontCartLine[]> => {
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
    .filter((item): item is StorefrontCartLine => Boolean(item));
};

export const getCartBadgeCount = (session: StorefrontSession): number => session.cart.length;

export const renderStorefrontLayout = (options: {
  title: string;
  heading: string;
  body: string;
  session?: StorefrontSession;
  activeNav?: 'inventory' | 'cart' | 'checkout';
  toast?: { message: string; variant?: 'success' | 'error' };
}): string => `<!DOCTYPE html>
<html lang="en">
${renderHead(options.title)}
<body>
  <div class="shell">
    <header class="topbar">
      <div class="brand">
        <strong>PetHub Outfitters</strong>
        <span>Self-hosted QA storefront for inventory, cart, and checkout practice</span>
      </div>
      <nav class="nav" aria-label="Storefront">
        ${renderPrimaryNavLinks('shop')}
        <a href="/shop/inventory" class="${options.activeNav === 'inventory' ? 'active' : ''}">Inventory</a>
        <a href="/shop/cart" class="${options.activeNav === 'cart' ? 'active' : ''}">Cart ${options.session ? `<span class="badge" data-test="shopping-cart-badge">${getCartBadgeCount(options.session)}</span>` : ''}</a>
        <a href="/shop/checkout" class="${options.activeNav === 'checkout' ? 'active' : ''}">Checkout</a>
        ${options.session ? `<form method="post" action="/shop/logout"><button type="submit">Logout</button></form>` : `<a href="/shop" class="button secondary">Sign in</a>`}
        ${renderThemeToggle()}
      </nav>
    </header>
    <main>
      ${options.body}
    </main>
    ${renderToast(options.toast?.message, options.toast?.variant ?? 'success')}
  </div>
</body>
</html>`;

export const renderStorefrontLogin = (error?: string): string =>
  renderStorefrontLayout({
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
          <label class="sr-only" for="shop-username">Username</label>
          <input id="shop-username" data-test="username" name="username" type="text" placeholder="Username" autocomplete="username" />
          <label class="sr-only" for="shop-password">Password</label>
          <input id="shop-password" data-test="password" name="password" type="password" placeholder="Password" autocomplete="current-password" />
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

export const renderStorefrontInventory = async (
  session: StorefrontSession,
  sort: StorefrontSortValue = 'az',
  toast?: { message: string; variant?: 'success' | 'error' },
): Promise<string> => {
  const items = sortStorefrontInventory(await getStorefrontInventory(), sort);
  return renderStorefrontLayout({
    title: 'PetHub Outfitters Inventory',
    heading: 'Inventory',
    session,
    activeNav: 'inventory',
    toast,
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
        <div data-test="inventory-container" class="grid" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
          ${
            items.length === 0
              ? '<p class="muted">No pets are currently available. Restock the catalogue from the admin dashboard.</p>'
              : ''
          }
          ${items
            .map(
              (item) => `
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
            </article>`,
            )
            .join('')}
        </div>
      </section>`,
  });
};

export const renderStorefrontItemDetails = async (session: StorefrontSession, petId: number): Promise<string> => {
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

export const renderStorefrontCart = async (session: StorefrontSession): Promise<string> => {
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
          ${
            items.length === 0
              ? '<p class="muted" data-test="empty-cart">Your cart is currently empty.</p>'
              : items
                  .map(
                    (item) => `
          <div class="product-card" data-test="cart-item">
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
          </div>`,
                  )
                  .join('')
          }
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

export const renderStorefrontCheckout = async (session: StorefrontSession, error?: string): Promise<string> => {
  const items = await getCartDetails(session);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
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
            <label class="sr-only" for="shop-first-name">First Name</label>
            <input id="shop-first-name" data-test="firstName" name="firstName" placeholder="First Name" value="${session.checkout?.firstName ?? ''}" autocomplete="given-name" />
            <label class="sr-only" for="shop-last-name">Last Name</label>
            <input id="shop-last-name" data-test="lastName" name="lastName" placeholder="Last Name" value="${session.checkout?.lastName ?? ''}" autocomplete="family-name" />
            <label class="sr-only" for="shop-postal-code">Postal Code</label>
            <input id="shop-postal-code" data-test="postalCode" name="postalCode" placeholder="Postal Code" value="${session.checkout?.postalCode ?? ''}" autocomplete="postal-code" />
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

export const renderStorefrontComplete = async (session: StorefrontSession, orderId: number): Promise<string> =>
  renderStorefrontLayout({
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
