import { verifyRequest } from "../_auth";

type StoredRequirement = { id?: unknown; no?: unknown } & Record<string, unknown>;
function parseList<T>(value?: string | null): T[] { if (!value) return []; try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
async function ensureTables(db: any) { await db.batch([
  db.prepare("CREATE TABLE IF NOT EXISTS requirements_v2 (id TEXT PRIMARY KEY, requirement_no TEXT NOT NULL UNIQUE, payload TEXT NOT NULL, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL)"),
  db.prepare("CREATE TABLE IF NOT EXISTS requirement_counters (day TEXT PRIMARY KEY, seq INTEGER NOT NULL)"),
  db.prepare("CREATE TABLE IF NOT EXISTS deleted_requirements_v2 (id TEXT PRIMARY KEY, deleted_at TEXT NOT NULL, deleted_by TEXT NOT NULL)"),
  db.prepare("CREATE INDEX IF NOT EXISTS idx_requirements_v2_updated_at ON requirements_v2(updated_at DESC)"),
]); }
async function migrateLegacy(db: any) {
  const migrated = await db.prepare("SELECT value FROM app_state WHERE key = ?").bind("requirements_v2_migrated").first();
  if (migrated) return;
  const [row, deletedRow] = await Promise.all([
    db.prepare("SELECT value FROM app_state WHERE key = ?").bind("requirements").first<{ value: string }>(),
    db.prepare("SELECT value FROM app_state WHERE key = ?").bind("deleted_requirement_ids").first<{ value: string }>(),
  ]);
  const deleted = new Set(parseList<string>(deletedRow?.value)); const now = new Date().toISOString();
  const statements = parseList<StoredRequirement>(row?.value).filter((item) => typeof item.id === "string" && typeof item.no === "string" && !deleted.has(item.id)).map((item) => db.prepare("INSERT OR IGNORE INTO requirements_v2 (id, requirement_no, payload, updated_at, updated_by) VALUES (?, ?, ?, ?, ?)").bind(item.id, item.no, JSON.stringify(item), now, "legacy-migration"));
  if (statements.length) await db.batch(statements);
  await db.prepare("INSERT INTO app_state (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at").bind("requirements_v2_migrated", "1", now).run();
}
export async function GET(request: Request) {
  const { env } = await import("cloudflare:workers"); if (!await verifyRequest(request)) return Response.json({ error: "未授权" }, { status: 401 });
  await ensureTables(env.DB); await migrateLegacy(env.DB);
  const result = await env.DB.prepare("SELECT payload FROM requirements_v2 ORDER BY updated_at DESC").all<{ payload: string }>();
  const requirements = result.results.flatMap((row) => { try { return [JSON.parse(row.payload) as StoredRequirement]; } catch { return []; } }); return Response.json({ requirements });
}
export async function POST(request: Request) {
  const { env } = await import("cloudflare:workers"); const userId = await verifyRequest(request); if (!userId) return Response.json({ error: "未授权" }, { status: 401 });
  const body = await request.json() as { requirement?: StoredRequirement }; if (!body.requirement || typeof body.requirement !== "object") return Response.json({ error: "数据格式不正确" }, { status: 400 });
  await ensureTables(env.DB); await migrateLegacy(env.DB); const now = new Date();
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(now).replaceAll("-", "");
  const existing = await env.DB.prepare("SELECT MAX(CAST(SUBSTR(requirement_no, 14) AS INTEGER)) AS seq FROM requirements_v2 WHERE requirement_no LIKE ?").bind(`REQ-${day}-%`).first<{seq:number}>();
  const counter = await env.DB.prepare("INSERT INTO requirement_counters (day, seq) VALUES (?, ?) ON CONFLICT(day) DO UPDATE SET seq = seq + 1 RETURNING seq").bind(day, (existing?.seq ?? 0) + 1).first<{ seq: number }>();
  const id = crypto.randomUUID(); const no = `REQ-${day}-${String(counter?.seq ?? 1).padStart(3, "0")}`; const requirement = { ...body.requirement, id, no }; const value = JSON.stringify(requirement);
  if (value.length > 500_000) return Response.json({ error: "需求数据超过大小限制" }, { status: 413 });
  await env.DB.prepare("INSERT INTO requirements_v2 (id, requirement_no, payload, updated_at, updated_by) VALUES (?, ?, ?, ?, ?)").bind(id, no, value, now.toISOString(), userId).run(); return Response.json({ requirement });
}
export async function PATCH(request: Request) {
  const { env } = await import("cloudflare:workers"); const userId = await verifyRequest(request); if (!userId) return Response.json({ error: "未授权" }, { status: 401 });
  const body = await request.json() as { requirement?: StoredRequirement }; const requirement = body.requirement;
  if (!requirement || typeof requirement.id !== "string" || typeof requirement.no !== "string") return Response.json({ error: "数据格式不正确" }, { status: 400 }); await ensureTables(env.DB);
  if (await env.DB.prepare("SELECT id FROM deleted_requirements_v2 WHERE id = ?").bind(requirement.id).first()) return Response.json({ error: "该需求已删除" }, { status: 410 });
  const value = JSON.stringify(requirement); if (value.length > 500_000) return Response.json({ error: "需求数据超过大小限制" }, { status: 413 });
  const result = await env.DB.prepare("UPDATE requirements_v2 SET payload = ?, updated_at = ?, updated_by = ? WHERE id = ?").bind(value, new Date().toISOString(), userId, requirement.id).run();
  if (!result.meta.changes) return Response.json({ error: "需求不存在" }, { status: 404 }); return Response.json({ requirement });
}
export async function DELETE(request: Request) {
  const { env } = await import("cloudflare:workers"); const userId = await verifyRequest(request); if (!userId) return Response.json({ error: "未授权" }, { status: 401 });
  const body = await request.json() as { id?: unknown }; if (typeof body.id !== "string" || !body.id.trim()) return Response.json({ error: "缺少需求 ID" }, { status: 400 }); await ensureTables(env.DB); const updatedAt = new Date().toISOString();
  await env.DB.batch([env.DB.prepare("DELETE FROM requirements_v2 WHERE id = ?").bind(body.id), env.DB.prepare("INSERT INTO deleted_requirements_v2 (id, deleted_at, deleted_by) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET deleted_at = excluded.deleted_at, deleted_by = excluded.deleted_by").bind(body.id, updatedAt, userId)]);
  return Response.json({ ok: true, deletedId: body.id, updatedAt, updatedBy: userId });
}
