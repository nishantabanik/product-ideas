import { db, ensureSchema } from "./db";
import { open, seal } from "./secret-box";

export type Provider = "copilot" | "linkedin" | "gateway";

/** Tokens we obtain by signing in (GitHub Copilot, LinkedIn). Stored encrypted. */
export async function saveConnection(provider: Provider, data: unknown) {
  await ensureSchema();
  await db()`insert into connections (provider, data, updated_at) values (${provider}, ${seal(data)}, now())
    on conflict (provider) do update set data = excluded.data, updated_at = now()`;
}

export async function getConnection<T>(provider: Provider): Promise<(T & { updatedAt: string }) | null> {
  await ensureSchema();
  const [r] = await db()<{ data: string; updated_at: Date }[]>`select data, updated_at from connections where provider = ${provider}`;
  if (!r) return null;
  try {
    return { ...open<T>(r.data), updatedAt: new Date(r.updated_at).toISOString() };
  } catch {
    return null; // SESSION_SECRET changed, so the stored token cannot be read. Signing in again replaces it.
  }
}

export async function deleteConnection(provider: Provider) {
  await ensureSchema();
  await db()`delete from connections where provider = ${provider}`;
}

export async function getState(key: string): Promise<string | null> {
  await ensureSchema();
  const [r] = await db()<{ value: string }[]>`select value from sync_state where key = ${key}`;
  return r?.value ?? null;
}

export async function setState(key: string, value: string) {
  await ensureSchema();
  await db()`insert into sync_state (key, value, updated_at) values (${key}, ${value}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
}
