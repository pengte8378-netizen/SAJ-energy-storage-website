"use client";

import { useState } from "react";

export type ContentAsset = {
  id: string;
  title: string;
  category: string;
  tags: string;
  summary: string;
  body: string;
  image: string;
  status: "published" | "draft";
  updated: string;
};

export const defaultContentAssets: ContentAsset[] = [
  { id: "company", title: "SAJ 公司简介", category: "品牌资料", tags: "SAJ, 公司, 全球服务", summary: "专注智慧能源转换、储能与能源管理的全球化企业。", body: "SAJ 成立于 2005 年，拥有 21 年电力电子与智慧能源技术积累。\n公司拥有 1200+ 名全球员工、410+ 项专利及软件著作权，储能系统年产能达 7.2 GWh。\n产品与服务覆盖 85+ 个国家和地区，为工商业客户提供发电、储能、用电与运营服务一体化解决方案。", image: "/products/chs3.webp", status: "published", updated: "2026-07-13" },
  { id: "selling", title: "产品核心卖点", category: "产品内容", tags: "CM2, 卖点, AC耦合", summary: "五合一 PCS、高空间效率与灵活并机。", body: "CM2 将高压控制箱、PCS、24V UPS、热管理系统和消防控制模块集成为五合一 PCS。\n单柜额定容量 261 kWh，额定功率 99.9/125 kW，单个 Block 最多支持 20 台并联。\n预接线与即插即用设计减少现场施工，适合存量光伏改造、峰谷套利、VPP 与电力交易。", image: "/products/cm2.webp", status: "published", updated: "2026-07-13" },
  { id: "safety", title: "安全设计与消防策略", category: "安全与消防", tags: "UL9540A, EI-60, 主动安全", summary: "从电芯检测到定向泄爆的五重安全架构。", body: "CM2 采用电芯级检测、Pack 级气溶胶、可燃气体检测、主动排风与定向泄爆的多层防护。\n电池舱采用 EI-60 防火设计，可承受 1200℃ 火焰并提供 1-2 小时耐火保护。\n电池包防护等级 IP67，PCS 防护等级 IP65，并配置电池包级与柜级消防措施。", image: "/assets/cm2-open.png", status: "published", updated: "2026-07-13" },
  { id: "ems", title: "EMS / elekeeper 平台", category: "平台能力", tags: "EMS, VPP, 削峰填谷", summary: "覆盖监控、优化调度、告警和第三方接口。", body: "EMS 持续采集储能、负载、光伏、电网与电价数据，形成统一能量流视图。\n内置自发自用、峰谷套利、需量控制、防逆流与备电等运行策略。\n支持第三方 EMS、电力交易和 VPP 调度接口，并提供设备告警、趋势分析与远程诊断。", image: "/assets/ems-platform.jpg", status: "published", updated: "2026-07-13" },
  { id: "logic", title: "并离网运行逻辑", category: "系统方案", tags: "并网, 离网, 关键负载", summary: "明确正常、停电、备电与恢复四个运行阶段。", body: "正常并网时，EMS 根据负载、电价和光伏功率控制充放电，并执行防逆流限制。\n电网异常时，控制系统隔离故障侧并维持关键负载供电；切换时间与负载等级需在设计阶段确认。\n电网恢复后，系统完成电压、频率和相序检查，再按设定延时平滑恢复并网运行。", image: "/products/cm2.webp", status: "published", updated: "2026-07-13" },
  { id: "cases", title: "相似成功案例", category: "项目案例", tags: "意大利, 工商业, CM2", summary: "意大利工商业 CM2 光储项目实景与配置参考。", body: "项目地点：意大利摩德纳省 Novi di Modena。\n系统采用 CM2 与 C6 组合方案，为工商业负载提供光伏消纳、峰谷套利与能源社区应用支持。\n案例用于说明设备布置、现场交付和实际应用价值；最终收益以项目负载、电价和运行策略测算为准。", image: "/assets/italy-cm2-case.jpg", status: "published", updated: "2026-07-13" },
  { id: "spec", title: "产品规格书", category: "技术资料", tags: "CM2, 参数, 规格", summary: "CM2-99.9K-261 / CM2-125K-261 关键技术参数。", body: "电芯：LFP 3.2V / 314Ah；系统配置 260S1P；额定容量 261 kWh。\n额定交流功率：99.9 kW 或 125 kW；额定电压 380/400 V；频率 50 Hz。\n工作温度 -25℃ 至 +55℃；最大海拔 2000 m；尺寸 2325×1030×1400 mm；重量约 2600 kg。", image: "/products/cm2.webp", status: "published", updated: "2026-07-13" },
  { id: "service", title: "运维与服务", category: "服务资料", tags: "运维, 质保, 调试", summary: "覆盖交付、监控、诊断和生命周期服务。", body: "交付阶段提供安装条件检查、接线核对、通信联调与运行策略确认。\n运行阶段通过平台进行告警监控、趋势分析和远程诊断，并形成问题闭环记录。\nCM2 标准质保周期为 10 年；具体边界、响应时间与备件安排以项目合同和当地服务政策为准。", image: "/assets/cm2-open.png", status: "published", updated: "2026-07-13" },
];

const htmlEscape = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);

export function renderContentAssetPage(asset: ContentAsset, context: { product: string; productImage: string; power: number; capacity: number; country: string; industry: string; backup: boolean }, page: number, total: number) {
  const facts: Record<string, string[]> = {
    company: ["成立于 2005 年", "1200+ 全球员工", "410+ 专利及软著", "覆盖 85+ 国家和地区"],
    selling: [`${context.product} · ${context.power} kW`, `${context.capacity} kWh 系统容量`, "单 Block 最多 20 台", "90%+ 往返效率"],
    safety: ["主动可燃气体检测", "强制排风", "EI-60 防火电池舱", "定向泄爆设计"],
    ems: ["削峰填谷", "需量控制", "防逆流", "VPP / 第三方调度"],
    logic: ["01 正常并网", "02 电网异常", "03 关键负载备电", "04 检查后恢复并网"],
    cases: [context.country, context.industry, "CM2 + C6", "光伏消纳与峰谷套利"],
    spec: ["261 kWh", "99.9 / 125 kW", "IP54 柜体 / IP65 PCS", "-25℃ 至 +55℃"],
    service: ["安装条件检查", "现场联调", "远程诊断", "10 年标准质保"],
  };
  const image = asset.image || context.productImage;
  const paragraphs = asset.body.split(/\n+/).filter(Boolean).map((item) => `<p>${htmlEscape(item)}</p>`).join("");
  const factCards = (facts[asset.id] || [asset.category, asset.tags, context.product, `${context.power} kW / ${context.capacity} kWh`]).map((item, index) => `<div><i>${String(index + 1).padStart(2, "0")}</i><b>${htmlEscape(item)}</b></div>`).join("");
  const logic = asset.id === "logic" ? `<div class="pdf-flow"><span>电网 / 光伏</span><i>→</i><span>EMS 决策</span><i>→</i><span>${htmlEscape(context.product)}</span><i>→</i><span>关键负载</span></div>` : "";
  const spec = asset.id === "spec" ? `<table class="pdf-spec-table"><tbody><tr><th>电池体系</th><td>LFP 3.2V / 314Ah</td><th>系统配置</th><td>260S1P</td></tr><tr><th>额定能量</th><td>261 kWh</td><th>额定功率</th><td>99.9 / 125 kW</td></tr><tr><th>交流电压</th><td>380 / 400 V</td><th>通讯</th><td>Wi-Fi / Ethernet / RS485</td></tr><tr><th>尺寸</th><td>2325×1030×1400 mm</td><th>重量</th><td>约 2600 kg</td></tr></tbody></table>` : "";
  return `<section class="pdf-page pdf-material-page"><div class="pdf-page-head"><b>SAJ</b><span>${htmlEscape(asset.category)} · ${String(page).padStart(2, "0")}</span></div><div class="pdf-asset-title"><div><span>${htmlEscape(asset.tags)}</span><h1>${htmlEscape(asset.title)}</h1><p>${htmlEscape(asset.summary)}</p></div><em>PROJECT-SPECIFIC CONTENT</em></div><div class="pdf-asset-hero"><img src="${htmlEscape(image)}" alt=""><div class="pdf-asset-copy">${paragraphs}</div></div>${logic}${spec}<div class="pdf-fact-grid">${factCards}</div><div class="pdf-source-note">资料来源：SAJ 2026 工商业储能产品手册、销售指南、技术规格及项目案例库。内容已按 ${htmlEscape(context.product)} / ${htmlEscape(context.country)} 项目条件匹配。</div><div class="pdf-footer">SAJ 工商业储能技术方案 <span>${page} / ${total}</span></div></section>`;
}

export function ContentAssetManager({ assets, onChange, notify }: { assets: ContentAsset[]; onChange: (assets: ContentAsset[]) => void; notify: (text: string) => void }) {
  const [editing, setEditing] = useState<ContentAsset | null>(null);
  const newAsset = () => setEditing({ id: `custom-${Date.now()}`, title: "新内容素材", category: "自定义资料", tags: "", summary: "", body: "", image: "", status: "draft", updated: new Date().toISOString().slice(0, 10) });
  const save = () => {
    if (!editing || !editing.title.trim()) return;
    const next = assets.some((item) => item.id === editing.id) ? assets.map((item) => item.id === editing.id ? { ...editing, updated: new Date().toISOString().slice(0, 10) } : item) : [...assets, editing];
    onChange(next); setEditing(null); notify(`已保存内容素材：${editing.title}`);
  };
  const remove = (id: string) => { const item = assets.find((asset) => asset.id === id); onChange(assets.filter((asset) => asset.id !== id)); notify(`已删除内容素材：${item?.title ?? id}`); };
  return <div className="content-manager">
    <div className="content-manager-head"><p>编辑后的标题、正文、标签和图片会直接写入技术方案 PDF。</p><button className="primary" onClick={newAsset}>+ 新建内容</button></div>
    <div className="content-admin-grid">{assets.map((asset) => <article key={asset.id}><img src={asset.image || "/products/cm2.webp"} alt="" /><div><i>{asset.category}</i><b>{asset.title}</b><span>{asset.tags || "未设置标签"}</span><p>{asset.summary}</p><em>{asset.status === "published" ? "已发布" : "草稿"} · {asset.updated}</em><section><button onClick={() => setEditing(asset)}>编辑</button><button className="danger-link" onClick={() => remove(asset.id)}>删除</button></section></div></article>)}</div>
    {editing && <div className="asset-editor"><header><div><span className="eyebrow">CONTENT EDITOR</span><h3>{assets.some((item) => item.id === editing.id) ? "编辑内容素材" : "新建内容素材"}</h3></div><button onClick={() => setEditing(null)}>×</button></header><div className="asset-editor-grid"><label><span>标题</span><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></label><label><span>分类</span><input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></label><label className="wide"><span>标签（逗号分隔）</span><input value={editing.tags} onChange={(e) => setEditing({ ...editing, tags: e.target.value })} /></label><label className="wide"><span>摘要</span><textarea value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} /></label><label className="wide"><span>正文内容</span><textarea className="body-editor" value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></label><label className="wide"><span>图片路径</span><input value={editing.image} placeholder="/assets/example.jpg" onChange={(e) => setEditing({ ...editing, image: e.target.value })} /></label><label><span>状态</span><select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as ContentAsset["status"] })}><option value="published">已发布</option><option value="draft">草稿</option></select></label></div><footer><button className="secondary" onClick={() => setEditing(null)}>取消</button><button className="primary" onClick={save}>保存内容</button></footer></div>}
  </div>;
}
