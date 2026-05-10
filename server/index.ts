import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import proxyRoutes from './routes/proxy.js';
import { loadCatalog, getCatalog, getCatalogAge, startCatalogRefresh } from './stockCatalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/proxy', proxyRoutes);

app.get('/api/stocks/catalog', (_req, res) => {
  const catalog = getCatalog();
  if (catalog.length === 0) {
    res.status(503).json({ error: 'Catalog not loaded yet' });
    return;
  }
  res.json(catalog);
});

app.get('/api/stocks/catalog-stats', (_req, res) => {
  res.json(getCatalogAge());
});

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

app.get('{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

async function start() {
  await loadCatalog();
  startCatalogRefresh();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] NeuraStock running on port ${PORT}`);
    console.log(`[Server] Auth: ${process.env.AUTH_USERNAME ? 'configured' : 'NOT configured'}`);
    console.log(`[Server] Catalog: ${getCatalog().length} stocks loaded`);
  });
}

start();
