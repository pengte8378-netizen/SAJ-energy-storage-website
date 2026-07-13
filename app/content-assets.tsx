"use client";

import { useState } from "react";

export type ContentAsset = {
  id: string;
  moduleId: string;
  product: "ALL" | "CHS2" | "CHS3" | "CM2";
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
  { id: "company", moduleId: "company", product: "ALL", title: "SAJ 公司简介", category: "品牌资料", tags: "SAJ, 公司, 全球服务", summary: "专注智慧能源转换、储能与能源管理的全球化企业。", body: "SAJ 成立于 2005 年，拥有 21 年电力电子与智慧能源技术积累。\n公司拥有 1200+ 名全球员工、410+ 项专利及软件著作权，储能系统年产能达 7.2 GWh。\n产品与服务覆盖 85+ 个国家和地区，为工商业客户提供发电、储能、用电与运营服务一体化解决方案。", image: "/products/chs3.webp", status: "published", updated: "2026-07-13" },
  { id: "selling", moduleId: "selling", product: "CM2", title: "产品核心卖点", category: "产品内容", tags: "CM2, 卖点, AC耦合", summary: "五合一 PCS、高空间效率与灵活并机。", body: "CM2 将高压控制箱、PCS、24V UPS、热管理系统和消防控制模块集成为五合一 PCS。\n单柜额定容量 261 kWh，额定功率 99.9/125 kW，单个 Block 最多支持 20 台并联。\n预接线与即插即用设计减少现场施工，适合存量光伏改造、峰谷套利、VPP 与电力交易。", image: "/products/cm2.webp", status: "published", updated: "2026-07-13" },
  { id: "safety", moduleId: "safety", product: "CM2", title: "安全设计与消防策略", category: "安全与消防", tags: "UL9540A, EI-60, 主动安全", summary: "从电芯检测到定向泄爆的五重安全架构。", body: "CM2 采用电芯级检测、Pack 级气溶胶、可燃气体检测、主动排风与定向泄爆的多层防护。\n电池舱采用 EI-60 防火设计，可承受 1200℃ 火焰并提供 1-2 小时耐火保护。\n电池包防护等级 IP67，PCS 防护等级 IP65，并配置电池包级与柜级消防措施。", image: "/assets/cm2-open.png", status: "published", updated: "2026-07-13" },
  { id: "ems", moduleId: "ems", product: "ALL", title: "EMS / elekeeper 平台", category: "平台能力", tags: "EMS, VPP, 削峰填谷", summary: "覆盖监控、优化调度、告警和第三方接口。", body: "EMS 持续采集储能、负载、光伏、电网与电价数据，形成统一能量流视图。\n内置自发自用、峰谷套利、需量控制、防逆流与备电等运行策略。\n支持第三方 EMS、电力交易和 VPP 调度接口，并提供设备告警、趋势分析与远程诊断。", image: "/assets/ems-platform.jpg", status: "published", updated: "2026-07-13" },
  { id: "logic", moduleId: "logic", product: "ALL", title: "并离网运行逻辑", category: "系统方案", tags: "并网, 离网, 关键负载", summary: "明确正常、停电、备电与恢复四个运行阶段。", body: "正常并网时，EMS 根据负载、电价和光伏功率控制充放电，并执行防逆流限制。\n电网异常时，控制系统隔离故障侧并维持关键负载供电；切换时间与负载等级需在设计阶段确认。\n电网恢复后，系统完成电压、频率和相序检查，再按设定延时平滑恢复并网运行。", image: "/products/cm2.webp", status: "published", updated: "2026-07-13" },
  { id: "cases", moduleId: "cases", product: "CM2", title: "相似成功案例", category: "项目案例", tags: "意大利, 工商业, CM2", summary: "意大利工商业 CM2 光储项目实景与配置参考。", body: "项目地点：意大利摩德纳省 Novi di Modena。\n系统采用 CM2 与 C6 组合方案，为工商业负载提供光伏消纳、峰谷套利与能源社区应用支持。\n案例用于说明设备布置、现场交付和实际应用价值；最终收益以项目负载、电价和运行策略测算为准。", image: "/assets/italy-cm2-case.jpg", status: "published", updated: "2026-07-13" },
  { id: "spec", moduleId: "spec", product: "CM2", title: "产品规格书", category: "技术资料", tags: "CM2, 参数, 规格", summary: "CM2-99.9K-261 / CM2-125K-261 关键技术参数。", body: "电芯：LFP 3.2V / 314Ah；系统配置 260S1P；额定容量 261 kWh。\n额定交流功率：99.9 kW 或 125 kW；额定电压 380/400 V；频率 50 Hz。\n工作温度 -25℃ 至 +55℃；最大海拔 2000 m；尺寸 2325×1030×1400 mm；重量约 2600 kg。", image: "/products/cm2.webp", status: "published", updated: "2026-07-13" },
  { id: "service", moduleId: "service", product: "ALL", title: "运维与服务", category: "服务资料", tags: "运维, 质保, 调试", summary: "覆盖交付、监控、诊断和生命周期服务。", body: "交付阶段提供安装条件检查、接线核对、通信联调与运行策略确认。\n运行阶段通过平台进行告警监控、趋势分析和远程诊断，并形成问题闭环记录。\n标准质保周期、响应时间与备件安排以所选产品、项目合同和当地服务政策为准。", image: "/assets/cm2-open.png", status: "published", updated: "2026-07-13" },
  { id: "selling-CHS2", moduleId: "selling", product: "CHS2", title: "CHS2 产品核心卖点", category: "产品内容", tags: "CHS2, DC耦合, STS", summary: "200% 光伏超配、内置 STS 与小型工商业灵活扩展。", body: "CHS2 集成光伏逆变、储能变流与静态切换功能，适用于超市、农场、小型工厂和微电网。\n50 kW 机型最高可接入 100 kWp 光伏，支持 6 路 MPPT，并可在给负载供电的同时为电池充电。\n内置 STS 支持小于 20 ms 的并离网切换，最多 10 台并联，并可直接接入柴油发电机。", image: "/products/chs2.webp", status: "published", updated: "2026-07-13" },
  { id: "safety-CHS2", moduleId: "safety", product: "CHS2", title: "CHS2 安全设计与消防策略", category: "安全与消防", tags: "CHS2, AFCI, IP55", summary: "从电弧防护、电芯预警到柜级消防的系统安全设计。", body: "CHS2 标配 AFCI 电弧故障保护，并配置交直流 Type II 浪涌保护。\n系统支持电芯健康预警、CO 与火灾检测以及柜级消防联动。\n电池柜防护等级 IP55，逆变器防护等级 IP66，适应 -30℃ 至 +50℃ 的工商业环境。", image: "/products/chs2.webp", status: "published", updated: "2026-07-13" },
  { id: "spec-CHS2", moduleId: "spec", product: "CHS2", title: "CHS2 产品规格书", category: "技术资料", tags: "CHS2, 参数, 规格", summary: "CHS2-29.9K/30K/50K 与 CB2 电池系统关键参数。", body: "额定交流功率 29.9/30/50 kW；最大光伏阵列功率最高 100 kWp；最大效率 98%。\nCB2 电池系统采用 LFP 280Ah 电芯，单柜额定能量 100.3 kWh。\n支持 6 路 MPPT、1000 V 最大直流电压、最多 10 台并联以及 10 年标准质保。", image: "/products/chs2.webp", status: "published", updated: "2026-07-13" },
  { id: "cases-CHS2", moduleId: "cases", product: "CHS2", title: "CHS2 相似成功案例", category: "项目案例", tags: "意大利, AC耦合, CHS2", summary: "意大利 550 kW / 300 kWh 工商业光储改造案例。", body: "项目地点：意大利 San Giuseppe di Cassola，办公与工业建筑。\n系统采用 C6 光伏逆变器与 CHS2 储能组成 AC 耦合方案，光伏规模约 550 kW，储能容量约 300 kWh。\n项目通过提高光伏自用率、峰谷优化和绿色电力应用降低综合用能成本。", image: "/products/chs2.webp", status: "published", updated: "2026-07-13" },
  { id: "selling-CHS3", moduleId: "selling", product: "CHS3", title: "CHS3 产品核心卖点", category: "产品内容", tags: "CHS3, 1500V, DC-BUS", summary: "1500V 高压架构、直流母线耦合与内置 EMS/STS。", body: "CHS3 采用 1500V（欧洲版本 1250V）工商业混合逆变架构，降低直流侧线缆与 BOS 成本。\n直流母线耦合减少能量转换环节，相比传统交流耦合可提升系统效率。\n内置 EMS 与 STS，支持小于 20 ms 的并离网切换、100 Mbps 通信和多机并联。", image: "/products/chs3.webp", status: "published", updated: "2026-07-13" },
  { id: "safety-CHS3", moduleId: "safety", product: "CHS3", title: "CHS3 安全设计与消防策略", category: "安全与消防", tags: "CHS3, 液冷, 主动排风", summary: "电弧防护、连接器测温与电池多层消防协同。", body: "CHS3 集成 AFCI、光伏组串级隔离和连接器温度检测，降低直流侧故障风险。\nCB3-L261 支持可燃气体检测与主动排风，并配置 Pack 级和柜级气溶胶消防。\n液冷系统将电芯温差控制在 3℃ 以内，设备防护等级 IP66，适应 -30℃ 至 +60℃ 环境。", image: "/assets/ems-platform.jpg", status: "published", updated: "2026-07-13" },
  { id: "spec-CHS3", moduleId: "spec", product: "CHS3", title: "CHS3 产品规格书", category: "技术资料", tags: "CHS3, 参数, 规格", summary: "CH3 75-125 kW 与 CB3-L261 液冷电池关键参数。", body: "逆变器额定交流功率覆盖 75-125 kW，最大光伏阵列功率 150-250 kWp。\nCB3-L261 采用 LFP 3.2V/314Ah 电芯，单柜额定能量 261 kWh，支持 2-8 小时灵活配置。\n系统最大效率不低于 98%，防护等级 IP66，可扩展至 1.25 MW / 10.4 MWh。", image: "/products/chs3.webp", status: "published", updated: "2026-07-13" },
  { id: "cases-CHS3", moduleId: "cases", product: "CHS3", title: "CHS3 相似应用方案", category: "项目案例", tags: "制造业, 工业园区, CHS3", summary: "面向中大型工厂与工业园区的高压直流光储方案。", body: "典型场景包括中大型制造工厂、商业建筑和工业园区。\n系统采用 CH3 混合逆变器与 CB3-L261 液冷电池，支持 1500V 高压光伏接入、削峰填谷和关键负载备电。\n方案可结合柴油发电机形成分级供电策略，在经济性与供电可靠性之间灵活平衡。", image: "/products/chs3.webp", status: "published", updated: "2026-07-13" },
];

const htmlEscape = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);

export function renderContentAssetPage(asset: ContentAsset, context: { product: string; productImage: string; power: number; capacity: number; country: string; industry: string; backup: boolean }, page: number, total: number) {
  const moduleId = asset.moduleId || asset.id;
  const commonFacts: Record<string, string[]> = {
    company: ["成立于 2005 年", "1200+ 全球员工", "410+ 专利及软著", "覆盖 85+ 国家和地区"],
    ems: ["削峰填谷", "需量控制", "防逆流", "VPP / 第三方调度"],
    logic: ["01 正常并网", "02 电网异常", "03 关键负载备电", "04 检查后恢复并网"],
    service: ["安装条件检查", "现场联调", "远程诊断", "质保按产品政策执行"],
  };
  const productFacts: Record<string, Record<string, string[]>> = {
    CHS2: {
      selling: [`${context.product} · ${context.power} kW`, `${context.capacity} kWh 系统容量`, "200% 光伏超配", "最多 10 台并联"],
      safety: ["AFCI 电弧防护", "CO / 火灾检测", "柜级消防", "IP55 / IP66"],
      cases: [context.country, context.industry, "C6 + CHS2", "光伏消纳与备电"],
      spec: ["29.9-50 kW", "100.3 kWh 电池柜", "6 MPPT / 1000V", "-30℃ 至 +50℃"],
    },
    CHS3: {
      selling: [`${context.product} · ${context.power} kW`, `${context.capacity} kWh 系统容量`, "1500V 高压架构", "内置 EMS / STS"],
      safety: ["AFCI 与组串隔离", "连接器测温", "主动排风", "Pack / 柜级消防"],
      cases: [context.country, context.industry, "CH3 + CB3-L261", "中大型光储与备电"],
      spec: ["75-125 kW", "261 kWh 液冷电池", "IP66", "-30℃ 至 +60℃"],
    },
    CM2: {
      selling: [`${context.product} · ${context.power} kW`, `${context.capacity} kWh 系统容量`, "单 Block 最多 20 台", "90%+ 往返效率"],
      safety: ["主动可燃气体检测", "强制排风", "EI-60 防火电池舱", "定向泄爆设计"],
      cases: [context.country, context.industry, "CM2 + C6", "AC 耦合与峰谷套利"],
      spec: ["261 kWh", "99.9 / 125 kW", "IP54 柜体 / IP65 PCS", "-25℃ 至 +55℃"],
    },
  };
  const specRows: Record<string, string[][]> = {
    CHS2: [["额定功率", "29.9 / 30 / 50 kW"], ["电池系统", "LFP 280Ah / 100.3 kWh"], ["光伏输入", "最高 100 kWp / 6 MPPT"], ["防护等级", "电池柜 IP55 / 逆变器 IP66"]],
    CHS3: [["额定功率", "75-125 kW"], ["电池系统", "LFP 314Ah / 261 kWh"], ["直流架构", "1500V（欧洲 1250V）"], ["防护等级", "IP66"]],
    CM2: [["额定功率", "99.9 / 125 kW"], ["电池系统", "LFP 314Ah / 261 kWh"], ["交流电压", "380 / 400 V"], ["防护等级", "柜体 IP54 / PCS IP65"]],
  };
  const image = asset.product === "ALL" ? context.productImage : (asset.image || context.productImage);
  const paragraphs = asset.body.split(/\n+/).filter(Boolean).map((item) => `<p>${htmlEscape(item)}</p>`).join("");
  const matchedFacts = productFacts[context.product]?.[moduleId] || commonFacts[moduleId] || [asset.category, asset.tags, context.product, `${context.power} kW / ${context.capacity} kWh`];
  const factCards = matchedFacts.map((item, index) => `<div><i>${String(index + 1).padStart(2, "0")}</i><b>${htmlEscape(item)}</b></div>`).join("");
  const spec = moduleId === "spec" ? `<table class="pdf-spec-table"><tbody>${(specRows[context.product] || []).map(([label, value]) => `<tr><th>${htmlEscape(label)}</th><td>${htmlEscape(value)}</td></tr>`).join("")}</tbody></table>` : "";
  const logic = moduleId === "logic" ? `<div class="pdf-flow"><span>电网 / 光伏</span><i>→</i><span>EMS 决策</span><i>→</i><span>${htmlEscape(context.product)}</span><i>→</i><span>关键负载</span></div>` : "";
  return `<section class="pdf-page pdf-material-page"><div class="pdf-page-head"><b>SAJ</b><span>${htmlEscape(asset.category)} · ${String(page).padStart(2, "0")}</span></div><div class="pdf-asset-title"><div><span>${htmlEscape(asset.tags)}</span><h1>${htmlEscape(asset.title)}</h1><p>${htmlEscape(asset.summary)}</p></div><em>PROJECT-SPECIFIC CONTENT</em></div><div class="pdf-asset-hero"><img src="${htmlEscape(image)}" alt=""><div class="pdf-asset-copy">${paragraphs}</div></div>${logic}${spec}<div class="pdf-fact-grid">${factCards}</div><div class="pdf-source-note">资料来源：SAJ 2026 工商业储能产品手册、销售指南、技术规格及项目案例库。内容已按 ${htmlEscape(context.product)} / ${htmlEscape(context.country)} 项目条件匹配。</div><div class="pdf-footer">SAJ 工商业储能技术方案 <span>${page} / ${total}</span></div></section>`;
}

export function ContentAssetManager({ assets, onChange, notify }: { assets: ContentAsset[]; onChange: (assets: ContentAsset[]) => void; notify: (text: string) => void }) {
  const [editing, setEditing] = useState<ContentAsset | null>(null);
  const newAsset = () => setEditing({ id: `custom-${Date.now()}`, moduleId: `custom-${Date.now()}`, product: "ALL", title: "新内容素材", category: "自定义资料", tags: "", summary: "", body: "", image: "", status: "draft", updated: new Date().toISOString().slice(0, 10) });
  const save = () => {
    if (!editing || !editing.title.trim()) return;
    const next = assets.some((item) => item.id === editing.id) ? assets.map((item) => item.id === editing.id ? { ...editing, updated: new Date().toISOString().slice(0, 10) } : item) : [...assets, editing];
    onChange(next); setEditing(null); notify(`已保存内容素材：${editing.title}`);
  };
  const remove = (id: string) => { const item = assets.find((asset) => asset.id === id); onChange(assets.filter((asset) => asset.id !== id)); notify(`已删除内容素材：${item?.title ?? id}`); };
  return <div className="content-manager">
    <div className="content-manager-head"><p>编辑后的标题、正文、标签和图片会直接写入技术方案 PDF。</p><button className="primary" onClick={newAsset}>+ 新建内容</button></div>
    <div className="content-admin-grid">{assets.map((asset) => <article key={asset.id}><img src={asset.image || "/products/cm2.webp"} alt="" /><div><i>{asset.category} · {asset.product === "ALL" ? "全产品" : asset.product}</i><b>{asset.title}</b><span>{asset.tags || "未设置标签"}</span><p>{asset.summary}</p><em>{asset.status === "published" ? "已发布" : "草稿"} · {asset.updated}</em><section><button onClick={() => setEditing(asset)}>编辑</button><button className="danger-link" onClick={() => remove(asset.id)}>删除</button></section></div></article>)}</div>
    {editing && <div className="asset-editor"><header><div><span className="eyebrow">CONTENT EDITOR</span><h3>{assets.some((item) => item.id === editing.id) ? "编辑内容素材" : "新建内容素材"}</h3></div><button onClick={() => setEditing(null)}>×</button></header><div className="asset-editor-grid"><label><span>标题</span><input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></label><label><span>分类</span><input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></label><label className="wide"><span>标签（逗号分隔）</span><input value={editing.tags} onChange={(e) => setEditing({ ...editing, tags: e.target.value })} /></label><label className="wide"><span>摘要</span><textarea value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} /></label><label className="wide"><span>正文内容</span><textarea className="body-editor" value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></label><label className="wide"><span>图片路径</span><input value={editing.image} placeholder="/assets/example.jpg" onChange={(e) => setEditing({ ...editing, image: e.target.value })} /></label><label><span>适用产品</span><select value={editing.product} onChange={(e) => setEditing({ ...editing, product: e.target.value as ContentAsset["product"] })}><option value="ALL">全产品</option><option value="CHS2">CHS2</option><option value="CHS3">CHS3</option><option value="CM2">CM2</option></select></label><label><span>状态</span><select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as ContentAsset["status"] })}><option value="published">已发布</option><option value="draft">草稿</option></select></label></div><footer><button className="secondary" onClick={() => setEditing(null)}>取消</button><button className="primary" onClick={save}>保存内容</button></footer></div>}
  </div>;
}
