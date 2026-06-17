import { Router, type Request, type Response } from 'express';
import { renderAdminHomePage } from '../admin/admin';
import { createPetCommand, DuplicatePetIdError } from '../commands';

export const adminRouter = Router();

adminRouter.get('/', async (request: Request, response: Response) => {
  const errorMessage = typeof request.query.error === 'string' ? request.query.error : '';
  const createdName = typeof request.query.created === 'string' ? request.query.created : '';
  const toast = errorMessage
    ? { message: errorMessage, variant: 'error' as const }
    : createdName
      ? { message: `Pet ${createdName} created`, variant: 'success' as const }
      : undefined;
  response.send(await renderAdminHomePage({ toast }));
});

adminRouter.post('/pets', async (request: Request, response: Response) => {
  const name = String(request.body.name);
  try {
    await createPetCommand({
      id: Number(request.body.id),
      name,
      category: String(request.body.category),
      status: request.body.status,
      price: Number(request.body.price),
      notes: String(request.body.notes),
    });
  } catch (error) {
    if (error instanceof DuplicatePetIdError) {
      response.redirect(`/?error=${encodeURIComponent(error.message)}`);
      return;
    }
    throw error;
  }

  response.redirect(`/?created=${encodeURIComponent(name)}`);
});
