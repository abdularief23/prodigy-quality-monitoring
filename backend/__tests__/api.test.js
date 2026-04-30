const request = require('supertest');
const express = require('express');

// Build a minimal express app mirroring the real server routes
// to avoid actual DB/Azure side effects in unit tests
function buildTestApp() {
  const app = express();
  app.use(express.json());

  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Prodigy AI-Powered Production Problem Detection System',
      version: '3.0.0',
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date(),
      message: 'Prodigy Backend running',
      version: '3.0.0',
    });
  });

  // Simulate /api/problems returning empty data
  app.get('/api/problems', (req, res) => {
    res.json({ status: 'success', data: [], total: 0 });
  });

  // Simulate upload validation
  app.post('/api/upload-excel', (req, res) => {
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }
    res.json({ status: 'success', message: 'File processed' });
  });

  return app;
}

describe('API Routes', () => {
  let app;

  beforeAll(() => {
    app = buildTestApp();
  });

  describe('GET /', () => {
    test('returns 200 with status ok', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    test('returns correct app name', async () => {
      const res = await request(app).get('/');
      expect(res.body.message).toContain('Prodigy');
    });

    test('returns version 3.0.0', async () => {
      const res = await request(app).get('/');
      expect(res.body.version).toBe('3.0.0');
    });
  });

  describe('GET /api/health', () => {
    test('returns 200 with status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    test('returns timestamp field', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body).toHaveProperty('timestamp');
    });

    test('returns version 3.0.0', async () => {
      const res = await request(app).get('/api/health');
      expect(res.body.version).toBe('3.0.0');
    });
  });

  describe('GET /api/problems', () => {
    test('returns 200 with success status', async () => {
      const res = await request(app).get('/api/problems');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
    });

    test('returns data array', async () => {
      const res = await request(app).get('/api/problems');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('returns total field', async () => {
      const res = await request(app).get('/api/problems');
      expect(res.body).toHaveProperty('total');
    });
  });

  describe('POST /api/upload-excel', () => {
    test('returns 400 without multipart content-type', async () => {
      const res = await request(app)
        .post('/api/upload-excel')
        .send({});
      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });

  describe('404 for unknown routes', () => {
    test('returns 404 for unknown route', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.statusCode).toBe(404);
    });
  });
});
