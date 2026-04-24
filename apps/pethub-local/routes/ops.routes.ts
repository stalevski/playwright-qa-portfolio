import { Router, type Request, type Response } from 'express';
import {
  opsCases,
  renderOpsComparisons,
  renderOpsIncidentDetail,
  renderOpsIncidents,
  renderOpsLayout,
  renderOpsOverview,
  renderOpsQueue,
} from '../ops/ops';

export const opsRouter = Router();

opsRouter.get('/', async (_request: Request, response: Response) => {
  response.send(await renderOpsOverview());
});

opsRouter.get('/queue', async (_request: Request, response: Response) => {
  response.send(await renderOpsQueue());
});

opsRouter.get('/comparisons', async (_request: Request, response: Response) => {
  response.send(await renderOpsComparisons());
});

opsRouter.get('/incidents', async (_request: Request, response: Response) => {
  response.send(await renderOpsIncidents());
});

opsRouter.get('/incidents/:slug', async (request: Request, response: Response) => {
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
