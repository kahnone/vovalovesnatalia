import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';

const store = () => getStore({ name: 'telegram-universes', consistency: 'strong' });
const membershipKey = userId => `member:${userId}`;
const universeKey = id => `universe:${id}`;

export async function getUniverseFor(userId) { const id = await store().get(membershipKey(userId)); return id ? store().get(universeKey(id), { type: 'json' }) : null; }
export async function getOrCreateUniverse(user) { const existing = await getUniverseFor(user.id); if (existing) return existing; const universe = { id: crypto.randomUUID(), ownerId: user.id, memberIds: [user.id], createdAt: Date.now() }; await store().setJSON(universeKey(universe.id), universe); await store().set(membershipKey(user.id), universe.id); return universe; }
export async function createInvite(userId) { const universe = await getUniverseFor(userId); if (!universe || universe.ownerId !== userId || universe.memberIds.length > 1) return null; const code = crypto.randomBytes(18).toString('base64url'); await store().setJSON(`invite:${code}`, { universeId: universe.id, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 }); return code; }
export async function joinFromInvite(user, code) { const invite = await store().get(`invite:${code}`, { type: 'json' }); if (!invite || invite.expiresAt < Date.now()) return { error: 'Приглашение недействительно или уже истекло.' }; const already = await getUniverseFor(user.id); if (already && already.id !== invite.universeId) return { error: 'Этот аккаунт уже состоит в другой вселенной.' }; const universe = await store().get(universeKey(invite.universeId), { type: 'json' }); if (!universe) return { error: 'Вселенная не найдена.' }; if (!universe.memberIds.includes(user.id)) { if (universe.memberIds.length >= 2) return { error: 'В этой вселенной уже есть два участника.' }; universe.memberIds.push(user.id); await store().setJSON(universeKey(universe.id), universe); await store().set(membershipKey(user.id), universe.id); } await store().delete(`invite:${code}`); return { universe }; }
