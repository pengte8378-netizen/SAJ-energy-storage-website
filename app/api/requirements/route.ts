import { verifyRequest } from "../_auth";

type StoredRequirement = { id?: unknown } & Record<string, unknown>;

function parseList<T>(value?: string | null): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { env } = await import("cloudflare:workers");
  if (!await verifyRequest(request)) return Response.json({ error: "未授权" }, { status: 401 });
  const [row, deletedRow] = await Promise.all([
    env.DB.prepare("SELECT value, updated_at FROM app_state WHERE key = ?").bind("requirements").first<{ value: string; updated_at: string }>(),
    env.DB.prepare("SELECT value FROM app_state WHERE key = ?").bind("deleted_requirement_ids").first<{ value: string }>(),
  ]);
  const deleted = new Set(parseList<string>(deletedRow?.value));
  const requirements = parseList<StoredRequirement>(row?.value).filter((item) => typeof item.id !== "string" || !deleted.has(item.id));
  return Response.json({ requirements, updatedAt: row?.updated_at ?? null });
}

export async function PUT(request: Request) {
  const { env } = await import("cloudflare:workers");
  const userId = await verifyRequest(request);
  if (!userId) return Response.json({ error: "未授权" }, { status: 401 });
  const body = await request.json() as { requirements?: unknown };
  if (!Array.isArray(body.requirements)) return Response.json({ error: "数据格式不正确" }, { status: 400 });
  const deletedRow = await env.DB.prepare("SELECT value FROM app_state WHERE key = ?").bind("deleted_requirement_ids").first<{ value: string }>();
  const deleted = new Set(parseList<string>(deletedRow?.value));
  const requirements = (body.requirements as StoredRequirement[]).filter((item) => typeof item?.id !== "string" || !deleted.has(item.id));
  const value = JSON.stringify(requirements);
  if (value.length > 4_000_000) return Response.json({ error: "需求数据超过大小限制" }, { status: 413 });
  const updatedAt = new Date().toISOString();
  await env.DB.prepare("INSERT INTO app_state (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
    .bind("requirements", value, updatedAt).run();
  return Response.json({ ok: true, updatedAt, updatedBy: userId });
}

export async function DELETE(request: Request) {
  const { env } = await import("cloudflare:workers");
  const userId = await verifyRequest(request);
  if (!userId) return Response.json({ error: "未授权" }, { status: 401 });
  const body = await request.json() as { id?: unknown };
  if (typeof body.id !== "string" || !body.id.trim()) return Response.json({ error: "缺少需求 ID" }, { status: 400 });

  const [row, deletedRow] = await Promise.all([
    env.DB.prepare("SELECT value FROM app_state WHERE key = ?").bind("requirements").first<{ value: string }>(),
    env.DB.prepare("SELECT value FROM app_state WHERE key = ?").bind("deleted_requirement_ids").first<{ value: string }>(),
  ]);
  const requirements = parseList<StoredRequirement>(row?.value).filter((item) => item.id !== body.id);
  const deleted = new Set(parseList<string>(deletedRow?.value));
  deleted.add(body.id);
  const updatedAt = new Date().toISOString();

  await env.DB.batch([
    env.DB.prepare("INSERT INTO app_state (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
      .bind("requirements", JSON.stringify(requirements), updatedAt),
    env.DB.prepare("INSERT INTO app_state (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
      .bind("deleted_requirement_ids", JSON.stringify([...deleted]), updatedAt),
  ]);
  return Response.json({ ok: true, deletedId: body.id, updatedAt, updatedBy: userId });
}