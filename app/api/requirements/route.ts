import { env } from "cloudflare:workers";
import { verifyRequest } from "../_auth";

export async function GET(request: Request) {
  const { env } = await import("cloudflare:workers");
  if (!await verifyRequest(request)) return Response.json({ error: "未授权" }, { status: 401 });
  const row = await env.DB.prepare("SELECT value, updated_at FROM app_state WHERE key = ?").bind("requirements").first<{ value: string; updated_at: string }>();
  return Response.json({ requirements: row ? JSON.parse(row.value) : [], updatedAt: row?.updated_at ?? null });
}

export async function PUT(request: Request) {
  const { env } = await import("cloudflare:workers");
  const userId = await verifyRequest(request);
  if (!userId) return Response.json({ error: "未授权" }, { status: 401 });
  const body = await request.json() as { requirements?: unknown };
  if (!Array.isArray(body.requirements)) return Response.json({ error: "数据格式不正确" }, { status: 400 });
  const value = JSON.stringify(body.requirements);
  if (value.length > 4_000_000) return Response.json({ error: "需求数据超过大小限制" }, { status: 413 });
  const updatedAt = new Date().toISOString();
  await env.DB.prepare("INSERT INTO app_state (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
    .bind("requirements", value, updatedAt).run();
  return Response.json({ ok: true, updatedAt, updatedBy: userId });
}
