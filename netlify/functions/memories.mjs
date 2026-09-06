import { getStore } from '@netlify/blobs';

const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const store = () => getStore({ name: 'universe-memories', consistency: 'strong' });

export default async request => {
  if (request.method === 'GET') {
    const { blobs } = await store().list();
    const memories = await Promise.all(blobs.map(({ key }) => store().get(key, { type: 'json' })));
    return new Response(JSON.stringify(memories.filter(Boolean).sort((a, b) => a.createdAt - b.createdAt)), { headers });
  }
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const { text, photo } = await request.json();
  if (typeof text !== 'string' || !text.trim() || text.length > 80 || typeof photo !== 'string' || !/^data:image\/jpeg;base64,/.test(photo) || photo.length > 1900000) return new Response('Invalid memory', { status: 400 });
  const memory = { id: crypto.randomUUID(), text: text.trim(), photo, createdAt: Date.now() };
  await store().setJSON(memory.id, memory);
  return new Response(JSON.stringify(memory), { status: 201, headers });
};
