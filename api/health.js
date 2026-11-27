// GET /api/health          → which AI providers are configured (keys are never shown)
// GET /api/health?test=1   → also runs a real test scan on each configured provider
//                            and shows exactly what each one says. Use this to debug.
import { providerStatus, providerOrder, scanWithFallback, PROVIDER_LABELS } from './_lib/ai.js';

// Tiny 16×16 JPEG so the test is fast and nearly free.
const TEST_IMAGE = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAQABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwC7RRRXyB9kf//Z';

export default async function handler(req, res) {
  const providers = providerStatus();
  const order = providerOrder();
  const out = {
    ok: order.length > 0,
    tryOrder: order.map((p) => PROVIDER_LABELS[p]),
    providers,
    hint: order.length ? 'Add ?test=1 to this URL to run a real test scan.' : 'No AI API key found. Add GEMINI_API_KEY in Vercel → Settings → Environment Variables, then redeploy.'
  };

  if (req.query?.test) {
    out.test = {};
    for (const p of order) {
      const started = Date.now();
      try {
        const r = await scanWithFallback(TEST_IMAGE, 'image/jpeg', { only: p });
        out.test[p] = { works: true, model: r.model, ms: Date.now() - started };
      } catch (err) {
        const e = err.errors?.[0];
        out.test[p] = { works: false, status: e?.status || null, error: e?.message || err.message, ms: Date.now() - started };
      }
    }
    out.ok = Object.values(out.test).some((t) => t.works);
  }

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(out);
}
