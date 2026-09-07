import { json, requireTelegramUser } from './telegram-auth.mjs';
import { getOrCreateUniverse, joinFromInvite } from './universe-store.mjs';

export default async request => {
  const auth = requireTelegramUser(request);
  if (auth.response) return auth.response;
  const code = new URL(request.url).searchParams.get('startParam');
  const result = code ? await joinFromInvite(auth.user, code) : { universe: await getOrCreateUniverse(auth.user) };
  if (result.error) return json({ error: result.error }, 403);
  const { universe } = result;
  return json({ universe: { id: universe.id, memberCount: universe.memberIds.length, isOwner: universe.ownerId === auth.user.id } });
};
