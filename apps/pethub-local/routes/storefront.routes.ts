import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { createOrderCommand } from '../commands';
import { getPetByIdQuery, nextOrderIdQuery } from '../queries';
import {
  clearStorefrontSessionCookie,
  delayForStorefrontPersona,
  getCartDetails,
  getStorefrontSession,
  renderStorefrontCart,
  renderStorefrontCheckout,
  renderStorefrontComplete,
  renderStorefrontInventory,
  renderStorefrontItemDetails,
  renderStorefrontLogin,
  requireStorefrontSession,
  setStorefrontSessionCookie,
  storefrontSessions,
  storefrontUsers,
  type StorefrontSortValue,
} from '../storefront/storefront';

export const storefrontRouter = Router();

storefrontRouter.get('/', (request: Request, response: Response) => {
  const session = getStorefrontSession(request);
  if (session) {
    response.redirect('/shop/inventory');
    return;
  }
  response.send(renderStorefrontLogin());
});

storefrontRouter.post('/login', (request: Request, response: Response) => {
  const username = String(request.body.username ?? '').trim();
  const password = String(request.body.password ?? '').trim();

  if (!username) {
    response.status(400).send(renderStorefrontLogin("We couldn't sign you in: Username is required"));
    return;
  }

  if (!password) {
    response.status(400).send(renderStorefrontLogin("We couldn't sign you in: Password is required"));
    return;
  }

  const user = storefrontUsers.find((candidate) => candidate.username === username && candidate.password === password);
  if (!user) {
    response
      .status(400)
      .send(
        renderStorefrontLogin("We couldn't sign you in: Username and password do not match any user in this service"),
      );
    return;
  }

  if (user.locked) {
    response.status(400).send(renderStorefrontLogin("We couldn't sign you in: Sorry, this user has been locked out."));
    return;
  }

  const sessionId = randomUUID();
  storefrontSessions.set(sessionId, {
    id: sessionId,
    username: user.username,
    userId: user.userId,
    cart: [],
    behavior: user.behavior,
  });
  setStorefrontSessionCookie(response, sessionId);
  response.redirect('/shop/inventory');
});

storefrontRouter.post('/logout', (request: Request, response: Response) => {
  const session = getStorefrontSession(request);
  if (session) {
    storefrontSessions.delete(session.id);
  }
  clearStorefrontSessionCookie(response);
  response.redirect('/shop');
});

storefrontRouter.get('/inventory', async (request: Request, response: Response) => {
  const session = requireStorefrontSession(request, response);
  if (!session) {
    return;
  }

  await delayForStorefrontPersona(session);

  const rawSort = String(request.query.sort ?? 'az');
  const sort: StorefrontSortValue = rawSort === 'za' || rawSort === 'lohi' || rawSort === 'hilo' ? rawSort : 'az';

  const addedName = typeof request.query.added === 'string' ? request.query.added.trim() : '';
  const removedName = typeof request.query.removed === 'string' ? request.query.removed.trim() : '';
  const toast = addedName
    ? { message: `${addedName} added to cart`, variant: 'success' as const }
    : removedName
      ? { message: `${removedName} removed from cart`, variant: 'success' as const }
      : undefined;

  response.send(await renderStorefrontInventory(session, sort, toast));
});

storefrontRouter.get('/item/:id', async (request: Request, response: Response) => {
  const session = requireStorefrontSession(request, response);
  if (!session) {
    return;
  }

  await delayForStorefrontPersona(session);

  response.send(await renderStorefrontItemDetails(session, Number(request.params.id)));
});

storefrontRouter.post('/cart/add', async (request: Request, response: Response) => {
  const session = requireStorefrontSession(request, response);
  if (!session) {
    return;
  }

  const petId = Number(request.body.petId);
  const pet = await getPetByIdQuery(petId);
  const name = pet?.name ?? `pet #${petId}`;

  // problem_user: adding a pet in the "broken" category is silently dropped -
  // the success toast still appears but the cart never changes (mirrors Sauce
  // Demo problem_user's Add buttons that look like they work but do not).
  const brokenCategory = session.behavior?.brokenCartCategory;
  const addSilentlyFails = Boolean(brokenCategory) && pet?.category === brokenCategory;
  if (!addSilentlyFails) {
    const existing = session.cart.find((item) => item.petId === petId);
    if (existing) {
      existing.quantity += 1;
    } else {
      session.cart.push({ petId, quantity: 1 });
    }
  }

  response.redirect(`/shop/inventory?added=${encodeURIComponent(name)}`);
});

storefrontRouter.post('/cart/remove', (request: Request, response: Response) => {
  const session = requireStorefrontSession(request, response);
  if (!session) {
    return;
  }

  const petId = Number(request.body.petId);
  session.cart = session.cart.filter((item) => item.petId !== petId);
  response.redirect('/shop/cart');
});

storefrontRouter.get('/cart', async (request: Request, response: Response) => {
  const session = requireStorefrontSession(request, response);
  if (!session) {
    return;
  }

  response.send(await renderStorefrontCart(session));
});

storefrontRouter.get('/checkout', async (request: Request, response: Response) => {
  const session = requireStorefrontSession(request, response);
  if (!session) {
    return;
  }

  response.send(await renderStorefrontCheckout(session));
});

storefrontRouter.post('/checkout', async (request: Request, response: Response) => {
  const session = requireStorefrontSession(request, response);
  if (!session) {
    return;
  }

  const firstName = String(request.body.firstName ?? '').trim();
  // problem_user: the Last Name is silently dropped, so checkout always fails
  // its "Last Name is required" validation even when the field was filled
  // (mirrors Sauce Demo problem_user's broken checkout form).
  const lastName = session.behavior?.brokenCheckoutLastName ? '' : String(request.body.lastName ?? '').trim();
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
    response
      .status(400)
      .send(await renderStorefrontCheckout(session, 'Error: Your cart must contain at least one item'));
    return;
  }

  const firstLine = cartItems[0];
  const nextOrderId = await nextOrderIdQuery();
  await createOrderCommand({
    id: nextOrderId,
    petId: firstLine.id,
    userId: session.userId,
    quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    status: 'placed',
    totalAmount: cartItems.reduce((sum, item) => sum + item.lineTotal, 0),
  });

  session.cart = [];
  response.redirect(`/shop/complete?orderId=${nextOrderId}`);
});

storefrontRouter.get('/complete', async (request: Request, response: Response) => {
  const session = requireStorefrontSession(request, response);
  if (!session) {
    return;
  }

  const orderId = Number(request.query.orderId ?? 0);
  response.send(await renderStorefrontComplete(session, orderId));
});
