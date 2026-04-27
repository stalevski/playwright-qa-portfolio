import { Router, type Request, type Response } from 'express';
import { renderAdminHomePage } from '../admin/admin';
import { createPetCommand } from '../commands';

export const adminRouter = Router();

adminRouter.get('/', async (_request: Request, response: Response) => {
  response.send(await renderAdminHomePage());
});

adminRouter.post('/pets', async (request: Request, response: Response) => {
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
