import { join } from 'node:path';
import express from 'express';
import { initializeLocalApp } from './commands';
import { adminRouter } from './routes/admin.routes';
import { apiRouter } from './routes/api.routes';
import { opsRouter } from './routes/ops.routes';
import { storefrontRouter } from './routes/storefront.routes';

const app = express();
const port = Number(process.env.APP_PORT ?? 3000);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(join(__dirname, 'http', 'static'), { maxAge: '1h' }));
app.use('/api', apiRouter);
app.use('/shop', storefrontRouter);
app.use('/ops', opsRouter);
app.use('/', adminRouter);

const start = async (): Promise<void> => {
  await initializeLocalApp();
  app.listen(port, () => {
    // eslint-disable-next-line no-console -- intentional startup banner
    console.log(`PetHub Local app running at http://127.0.0.1:${port}`);
  });
};

void start();
