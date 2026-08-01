import { verifyRequest } from "../_auth";

const defaults = {
  productRows: ["CHS2 混合储能系统", "CHS3 液冷混合储能系统", "CM2 储能一体柜"],
  typeRows: ["新功能", "规格升级", "认证", "降本", "质量优化", "软件", "其他"].map((name) => ({ name, enabled: true })),
  dueDays: 7,
  staleDays: 7,
  timezone: "Asia/Shanghai",
  pageSize: 20,
  dateFormat: "YYYY/MM/DD",
  dashboardScope: "全部团队需求",
};

export async function GET(request: Request) {
  const { env } = await import("cloudflare:workers");
  if (!await verifyRequest(request)) return Response.json({ error: "未授权" }, { status: 401 });
  const row = await env.DB.prepare("SELECT value FROM app_state WHERE key = ?").bind("settings_v3").first<{ value: string }>();
  if (!row?.value) return Response.json({ settings: defaults });
  try { return Response.json({ settings: { ...defaults, ...JSON.parse(row.value) } }); }
  catch { return Response.json({ settings: defaults }); }
}

export async function PUT(request: Request) {
  const { env } = await import("cloudflare:workers");
  const userId = await verifyRequest(request);
  if (!userId) return Response.json({ error: "未授权" }, { status: 401 });
  const body = await request.json() as { settings?: Record<string, unknown> };
  if (!body.settings || typeof body.settings !== "object") return Response.json({ error: "设置格式不正确" }, { status: 400 });
  const settings = { ...defaults, ...body.settings };
  settings.productRows = Array.isArray(settings.productRows) ? settings.productRows.map(String).filter(Boolean).slice(0, 100) : defaults.productRows;
  settings.typeRows = Array.isArray(settings.typeRows) ? settings.typeRows.slice(0, 100) : defaults.typeRows;
  settings.dueDays = Math.min(30, Math.max(1, Number(settings.dueDays) || 7));
  settings.staleDays = Math.min(30, Math.max(1, Number(settings.staleDays) || 7));
  settings.pageSize = [20, 50, 100].includes(Number(settings.pageSize)) ? Number(settings.pageSize) : 20;
  const updatedAt = new Date().toISOString();
  await env.DB.prepare("INSERT INTO app_state (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
    .bind("settings_v3", JSON.stringify(settings), updatedAt).run();
  return Response.json({ settings, updatedAt, updatedBy: userId });
}
