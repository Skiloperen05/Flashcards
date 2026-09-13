import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

// Local development uses the same authenticated gateway as production.
// Never maintain a second entitlement implementation or a public Drive fallback.
export default async function driveHandler(req, res) {
  const requested = new URL(req.originalUrl || req.url, 'http://localhost');
  const target = new URL('https://qnwjhheoekpqqqhevztw.supabase.co/functions/v1/drive-proxy');
  target.search = requested.search;
  const headers = {};
  for (const name of ['authorization', 'content-type', 'origin', 'x-requested-with', 'x-google-token']) {
    if (req.headers[name]) headers[name] = req.headers[name];
  }
  try {
    const options = { method: req.method, headers, redirect: 'error' };
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      options.body = req;
      options.duplex = 'half';
    }
    const response = await fetch(target, options);
    res.status(response.status);
    for (const name of ['content-type', 'content-disposition', 'cache-control', 'referrer-policy', 'x-content-type-options']) {
      if (response.headers.has(name)) res.setHeader(name, response.headers.get(name));
    }
    if (!response.body) return res.end();
    await pipeline(Readable.fromWeb(response.body), res);
  } catch (_) {
    if (res.headersSent) return res.destroy();
    res.status(502).json({ error: 'Kunne ikke kontakte dokumenttjenesten.' });
  }
}
