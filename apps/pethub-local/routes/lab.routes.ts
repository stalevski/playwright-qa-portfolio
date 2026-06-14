import { Router, type Request, type Response } from 'express';
import {
  renderLabDialogs,
  renderLabDynamic,
  renderLabForms,
  renderLabFrameInner,
  renderLabFrames,
  renderLabHome,
  renderLabMenus,
  renderLabOverlays,
  renderLabShadowDom,
  renderLabTables,
  renderLabWidgets,
} from '../lab/lab';

export const labRouter = Router();

labRouter.get('/', (_request: Request, response: Response) => {
  response.send(renderLabHome());
});

labRouter.get('/forms', (_request: Request, response: Response) => {
  response.send(renderLabForms());
});

labRouter.get('/dynamic', (_request: Request, response: Response) => {
  response.send(renderLabDynamic());
});

labRouter.get('/dialogs', (_request: Request, response: Response) => {
  response.send(renderLabDialogs());
});

labRouter.get('/tables', (_request: Request, response: Response) => {
  response.send(renderLabTables());
});

labRouter.get('/widgets', (_request: Request, response: Response) => {
  response.send(renderLabWidgets());
});

labRouter.get('/menus', (_request: Request, response: Response) => {
  response.send(renderLabMenus());
});

labRouter.get('/overlays', (_request: Request, response: Response) => {
  response.send(renderLabOverlays());
});

labRouter.get('/frames', (_request: Request, response: Response) => {
  response.send(renderLabFrames());
});

labRouter.get('/frames/inner', (_request: Request, response: Response) => {
  response.send(renderLabFrameInner());
});

labRouter.get('/shadow-dom', (_request: Request, response: Response) => {
  response.send(renderLabShadowDom());
});
