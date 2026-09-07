import crypto from 'node:crypto';

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export function getTelegramUser(request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const initData = request.headers.get('x-telegram-init-data');
  if (!token || !initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  const authDate = Number(params.get('auth_date'));
  if (!hash || !authDate || Date.now() / 1000 - authDate > 86400) return null;
  params.delete('hash');
  const checkString = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  const expected = crypto.createHmac('sha256', secret).update(checkString).digest('hex');
  if (hash.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected))) return null;
  try { return JSON.parse(params.get('user')); } catch { return null; }
}

export function requireTelegramUser(request) {
  const user = getTelegramUser(request);
  return user ? { user } : { response: json({ error: 'Telegram authorization required' }, 401) };
}
