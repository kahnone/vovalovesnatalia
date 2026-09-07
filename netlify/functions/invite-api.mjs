import { json, requireTelegramUser } from './auth-core.mjs';
import { createInvite } from './store-core.mjs';
const botUsername = 'Myloveunivers_bot';
const appName = 'LoveUnivers';
export default async request => { if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 }); const auth = requireTelegramUser(request); if (auth.response) return auth.response; const code = await createInvite(auth.user.id); if (!code) return json({ error: 'Пригласить можно только из своей ещё не заполненной вселенной.' }, 409); return json({ url: `https://t.me/${botUsername}/${appName}?startapp=${code}` }); };
