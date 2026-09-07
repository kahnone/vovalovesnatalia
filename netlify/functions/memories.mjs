import { getStore } from '@netlify/blobs';
import { json, requireTelegramUser } from './telegram-auth.mjs';
import { getUniverseFor } from './universe-store.mjs';

const store = () => getStore({ name: 'universe-memories', consistency: 'strong' });

export default async request => {
  const auth = requireTelegramUser(request);
  if (auth.response) return auth.response;
  const universe = await getUniverseFor(auth.user.id);
  if (!universe) return json({ error: 'Вселенная не найдена.' }, 404);
  if (request.method === 'GET') {
    const { blobs } = await store().list({ prefix: `${universe.id}:` });
    const memories = await Promise.all(blobs.map(({ key }) => store().get(key, { type: 'json' })));
    return json(memories.filter(Boolean).sort((a, b) => a.createdAt - b.createdAt));
  }
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const { text, photo } = await request.json();
  if (typeof text !== 'string' || !text.trim() || text.length > 80 || typeof photo !== 'string' || !/^data:image\/jpeg;base64,/.test(photo) || photo.length > 1_900_000) return new Response('Invalid memory', { status: 400 });
  const memory = { id: crypto.randomUUID(), text: text.trim(), photo, createdAt: Date.now() };
  await store().setJSON(`${universe.id}:${memory.id}`, memory);
  return json(memory, 201);
};
