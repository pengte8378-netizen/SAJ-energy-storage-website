type RequestPayload = {
  features: Record<string, unknown>;
  goal: string;
  project: { country?: string; industry?: string };
  requirements: { transformer?: number; pv?: number; voltage?: string; backup?: boolean; coupling?: string; existingGridPv?: boolean };
};

const systemPrompt = `你是SAJ工商业储能负荷分析助手。你只负责基于已经由确定性程序计算的负荷统计特征提出目标功率、目标容量、产品偏好和解释，不得编造原始负荷数据。
必须遵守：
1. 返回严格JSON，不要Markdown。
2. 推荐功率和容量必须为正数，并采用适合工程预选的整数。
3. 容量不大于200kWh时优先CHS2，大于200kWh时优先CHS3。
4. 备电或离网需求下CM2不可选；CM2仅适用于无备电要求的AC耦合项目。
5. 最终逆变器、电池柜、EMS、电表、CT和区域版本由后续确定性规则引擎计算，你不能自行声称已通过最终工程审核。
6. 数据不足时降低confidence，并在warnings和assumptions中说明。
JSON结构示例：{"primary_objective":"降低需量并兼顾光伏消纳","recommended_power_kw":250,"recommended_capacity_kwh":522,"preferred_product":"CHS3","confidence":"high","reasoning":["原因1"],"warnings":[],"assumptions":["假设1"]}`;

function isRecommendation(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.primary_objective === "string" && Number(item.recommended_power_kw) > 0 && Number(item.recommended_capacity_kwh) > 0 && ["CHS2", "CHS3", "CM2"].includes(String(item.preferred_product)) && ["high", "medium", "low"].includes(String(item.confidence)) && Array.isArray(item.reasoning) && Array.isArray(item.warnings) && Array.isArray(item.assumptions);
}

export async function POST(request: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return Response.json({ error: "DeepSeek API尚未配置，请由管理员设置DEEPSEEK_API_KEY。" }, { status: 503 });
  let body: RequestPayload;
  try { body = await request.json() as RequestPayload; }
  catch { return Response.json({ error: "请求数据格式无效。" }, { status: 400 }); }
  if (!body.features || !body.goal) return Response.json({ error: "缺少负荷特征或优化目标。" }, { status: 400 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `请用JSON分析以下脱敏项目数据：${JSON.stringify(body)}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 1800,
      }),
    });
    const result = await response.json() as { choices?: { message?: { content?: string } }[]; error?: { message?: string } };
    if (!response.ok) return Response.json({ error: result.error?.message || "DeepSeek API请求失败。" }, { status: 502 });
    const content = result.choices?.[0]?.message?.content;
    if (!content) return Response.json({ error: "DeepSeek返回了空结果，请重试。" }, { status: 502 });
    const recommendation = JSON.parse(content) as unknown;
    if (!isRecommendation(recommendation)) return Response.json({ error: "AI结果未通过结构校验，请重试。" }, { status: 502 });
    return Response.json({ recommendation });
  } catch (error) {
    return Response.json({ error: error instanceof Error && error.name === "AbortError" ? "DeepSeek分析超时，请稍后重试。" : "AI分析服务暂时不可用。" }, { status: 502 });
  } finally { clearTimeout(timeout); }
}
