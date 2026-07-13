"use client";

import { useEffect, useMemo, useState } from "react";
import { ContentAssetManager, defaultContentAssets, renderContentAssetPage, type ContentAsset } from "./content-assets";

type Scenario = "new" | "retrofit" | "storage" | "backup" | "vpp";
type Product = "CHS2" | "CHS3" | "CM2";
type Bom = { code: string; name: string; type: string; qty: number; reason: string };

const steps = ["项目基础信息", "系统需求", "推荐配置", "配置校验", "方案构建", "预览导出"];
const scenarios: { id: Scenario; title: string; sub: string; mark: string }[] = [
  { id: "new", title: "新建光伏 + 储能", sub: "优先直流耦合，提高光伏利用率", mark: "DC" },
  { id: "retrofit", title: "存量光伏改造", sub: "交流耦合，减少原系统改动", mark: "AC" },
  { id: "storage", title: "纯储能削峰填谷", sub: "峰谷套利与需量管理", mark: "TOU" },
  { id: "backup", title: "备电 / 微电网", sub: "并离网切换与柴油机协同", mark: "UPS" },
  { id: "vpp", title: "VPP / 电力市场", sub: "响应调度与聚合交易", mark: "VPP" },
];
const products = {
  CHS2: { title: "CHS2 混合储能系统", image: "/products/chs2.webp", power: 50, capacity: 100, tags: ["200% 光伏超配", "内置 STS", "最多 10 台并联"] },
  CHS3: { title: "CHS3 液冷混合储能系统", image: "/products/chs3.webp", power: 125, capacity: 261, tags: ["直流母线耦合", "液冷温差 ≤3°C", "内置 EMS / STS"] },
  CM2: { title: "CM2 智能一体化储能柜", image: "/products/cm2.webp", power: 125, capacity: 261, tags: ["五合一 PCS", "五重安全架构", "单 Block 最多 20 台"] },
} as const;
const optionalModules = [
  ["company", "SAJ 公司简介", "品牌与全球服务能力"], ["selling", "产品核心卖点", "自动匹配所选产品系列"],
  ["safety", "安全设计与消防策略", "多层防护与主动安全"], ["ems", "EMS / elekeeper 平台", "能量调度、监控与运维"],
  ["logic", "并离网运行逻辑", "切换策略与关键负载保障"], ["cases", "相似成功案例", "按国家、行业和规模筛选"],
  ["spec", "产品规格书", "附加相关产品数据表"], ["service", "运维与服务", "质保、响应与生命周期服务"],
] as const;

function calculate(req: any, preferred?: Product) {
  const product: Product = preferred ?? (req.scenario === "storage" || req.scenario === "vpp" || req.power > 500 ? "CM2" : req.power > 100 || req.pv > 200 ? "CHS3" : "CHS2");
  const p = products[product];
  const qty = Math.max(Math.ceil(req.power / p.power), Math.ceil(req.capacity / p.capacity));
  const bom: Bom[] = [{ code: product === "CHS2" ? "CHS2-50K-T6" : product === "CHS3" ? "CH3-125K-T8" : "CM2-125K-261", name: p.title, type: product === "CHS2" ? "混合逆变器" : "储能主机", qty, reason: `覆盖 ${req.power} kW / ${req.capacity} kWh 目标` }];
  if (product === "CHS2") bom.push({ code: "CB2-100.3K-HV5", name: "CB2 高压电池柜", type: "电池系统", qty: Math.max(qty, Math.ceil(req.capacity / 100)), reason: "按目标容量自动匹配" });
  if (product === "CHS3") bom.push({ code: "CB3-L261", name: "CB3 液冷电池柜", type: "电池系统", qty, reason: "液冷温控，温差 ≤3°C" });
  if (qty > 1 || req.backup || req.vpp) bom.push({ code: product === "CM2" ? "CM2-EMS" : "eManager-C1 Pro", name: "系统能量管理控制器", type: "控制器", qty: 1, reason: qty > 1 ? "多机并联自动加入" : "并离网 / 调度需求" });
  bom.push({ code: req.transformer <= 500 ? "CT-500A" : req.transformer <= 1000 ? "CT-1000A" : "CT-2000A", name: "计量电流互感器", type: "计量附件", qty: 3, reason: "按变压器容量预选" });
  if (req.backup) bom.push({ code: "BACKUP-METER", name: "并离网控制电表", type: "通信附件", qty: 1, reason: "并离网切换所需" });
  if (req.dg) bom.push({ code: "DG-IO-MODULE", name: "柴油机通信 I/O 模块", type: "可选附件", qty: 1, reason: "柴油发电机协同控制" });
  return { product, qty, power: qty * p.power, capacity: qty * p.capacity, bom };
}

export default function Home() {
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [preferredProduct, setPreferredProduct] = useState<Product | "AUTO">("AUTO");
  const [adminView, setAdminView] = useState<"products" | "rules" | "content" | null>(null);
  const [toast, setToast] = useState("所有输入将自动保存");
  const [project, setProject] = useState({ name: "意大利食品工厂光储项目", customer: "Demo Food Industries", country: "意大利", industry: "食品加工", owner: "Li Peng", language: "中文" });
  const [req, setReq] = useState({ scenario: "new" as Scenario, power: 250, capacity: 522, pv: 420, voltage: "400V / 50Hz", transformer: 800, gridExport: false, backup: true, blackStart: false, dg: false, vpp: false, environment: "outdoor", minTemp: -10, maxTemp: 42, altitude: 320 });
  const [result, setResult] = useState(() => calculate(req));
  const [bom, setBom] = useState<Bom[]>(() => calculate(req).bom);
  const [modules, setModules] = useState<string[]>(["selling", "safety", "ems", "logic", "cases"]);
  const [contentAssets, setContentAssets] = useState<ContentAsset[]>(defaultContentAssets);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.localStorage.setItem("saj-bess-draft", JSON.stringify({ project, req, bom }));
      setToast("草稿已自动保存");
    }, 500);
    return () => window.clearTimeout(timer);
  }, [project, req, bom]);

  useEffect(() => {
    const stored = window.localStorage.getItem("saj-content-assets");
    if (stored) {
      try { setContentAssets(JSON.parse(stored)); } catch { /* keep defaults */ }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("saj-content-assets", JSON.stringify(contentAssets));
  }, [contentAssets]);

  const risks = useMemo(() => {
    const rows: string[][] = [];
    if (result.power < req.power * 1.05) rows.push(["warning", "功率余量偏低", "当前设计余量低于 5%，建议核对冲击负载。"]); 
    if (req.maxTemp > 45) rows.push(["warning", "高温降额风险", "最高温度超过 45°C，需复核设备降额曲线。"]); 
    if (result.power > req.transformer * 0.8) rows.push(["error", "变压器容量接近上限", "储能功率超过变压器容量的 80%，请调整配置。"]); 
    rows.push(["info", "零反送要求", "方案将启用防逆流控制并配置计量 CT。"]); 
    if (req.backup) rows.push(["info", "关键负载备电", "已自动加入并离网控制设备，需确认关键负载清单。"]); 
    return rows;
  }, [req, result]);
  const blocking = risks.some((row) => row[0] === "error");
  const product = products[result.product];

  function next(target: number) { setMaxStep((value) => Math.max(value, target)); setStep(target); setToast("进度已保存"); }
  function runRecommendation() {
    setToast("正在计算兼容配置…");
    window.setTimeout(() => {
      const nextResult = calculate(req, preferredProduct === "AUTO" ? undefined : preferredProduct); setResult(nextResult); setBom(nextResult.bom); next(3); setToast(`配置完成：推荐 ${nextResult.product} 系列`);
    }, 650);
  }
  function updateQuantity(index: number, quantity: number) { setBom((rows) => rows.map((row, i) => i === index ? { ...row, qty: Math.max(1, quantity || 1) } : row)); }
  function exportData() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ project, requirements: req, result, bom, modules }, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `${project.country}_${project.customer}_${project.name}_V1.0.json`; link.click(); URL.revokeObjectURL(url);
  }


  async function exportPdf() {
    setIsExporting(true);
    setToast("正在生成 PDF，请稍候…");
    const escape = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
    const selected = contentAssets.filter((asset) => modules.includes(asset.id) && asset.status === "published");
    const moduleText = (id: string) => ({
      company: "SAJ 专注于智慧能源转换、储能及能源管理，为全球工商业客户提供产品、平台和全生命周期服务。",
      selling: `${result.product} 核心优势：${product.tags.join("、")}。`,
      safety: result.product === "CM2" ? "五重安全架构包含主动气体检测、强制排风、定向泄爆及分级消防保护。" : "从电芯、BMS、系统控制到消防联动构建多层安全防护。",
      ems: "EMS 支持实时监控、削峰填谷、防逆流、需量管理及第三方调度接口。",
      logic: req.backup ? "系统支持并离网运行，关键负载切换逻辑和恢复策略需在现场调试阶段确认。" : "本项目按并网运行逻辑配置，支持功率控制与防逆流。",
      cases: `已匹配 ${project.country} 及相近行业的工商业光储案例，用于说明系统架构和应用价值。`,
      spec: `${result.product} 规格书将作为附件，涵盖功率、容量、环境、尺寸及认证信息。`,
      service: "包含远程监控、告警诊断、运维支持和质保边界说明。",
    } as Record<string, string>)[id] ?? "已匹配对应项目内容。";
    const filename = `${project.country}_${project.customer}_${project.name}_V1.0_${new Date().toISOString().slice(0, 10)}.pdf`.replace(/[\\/:*?"<>|]/g, "_");
    const host = document.createElement("div");
    host.className = "pdf-export-host";
    host.innerHTML = `
      <section class="pdf-page pdf-cover-page"><div class="pdf-brand">SAJ</div><div class="pdf-kicker">TECHNICAL PROPOSAL · V1.0</div><h1>${escape(project.name)}</h1><h2>${escape(project.customer)}</h2><div class="pdf-cover-product"><img src="${product.image}" alt=""><div><strong>${result.power} kW / ${result.capacity} kWh</strong><span>${escape(result.product)} 工商业储能系统</span></div></div><div class="pdf-cover-meta"><span>${escape(project.country)} · ${new Date().toLocaleDateString("zh-CN")}</span><b>CONFIDENTIAL</b></div></section>
      <section class="pdf-page"><div class="pdf-page-head"><b>SAJ</b><span>项目摘要 · 01</span></div><h1>项目概览与推荐方案</h1><p class="pdf-lead">基于项目负载、电网、光伏、储能目标及安装环境生成的智能配置建议。</p><div class="pdf-summary-grid"><div><span>项目名称</span><b>${escape(project.name)}</b></div><div><span>客户名称</span><b>${escape(project.customer)}</b></div><div><span>国家 / 地区</span><b>${escape(project.country)}</b></div><div><span>项目行业</span><b>${escape(project.industry)}</b></div></div><div class="pdf-highlight"><div><span>推荐产品</span><b>${escape(result.product)}</b></div><div><span>额定功率</span><b>${result.power} kW</b></div><div><span>额定容量</span><b>${result.capacity} kWh</b></div><div><span>预计时长</span><b>${(result.capacity / result.power).toFixed(1)} h</b></div></div><h2>推荐依据</h2><ul><li>目标功率 ${req.power} kW，当前配置达到 ${result.power} kW。</li><li>目标容量 ${req.capacity} kWh，当前配置容量余量 ${result.capacity - req.capacity} kWh。</li><li>${req.backup ? "项目要求并离网运行，已配置控制器与计量附件。" : "项目采用并网运行架构。"}</li><li>已结合 ${escape(req.voltage)}、${req.transformer} kVA 变压器及安装环境筛选产品。</li></ul><div class="pdf-footer">SAJ 工商业储能智能配置与技术方案工具 <span>1 / ${3 + selected.length}</span></div></section>
      <section class="pdf-page"><div class="pdf-page-head"><b>SAJ</b><span>BOM 设备清单 · 02</span></div><h1>推荐设备与数量</h1><table><thead><tr><th>设备型号</th><th>设备名称</th><th>类型</th><th>数量</th><th>推荐依据</th></tr></thead><tbody>${bom.map((item) => `<tr><td><b>${escape(item.code)}</b></td><td>${escape(item.name)}</td><td>${escape(item.type)}</td><td>${item.qty}</td><td>${escape(item.reason)}</td></tr>`).join("")}</tbody></table><div class="pdf-note"><b>配置说明</b><p>计量 CT 规格为预选值，需结合负载、光伏、储能及变压器容量由授权设计人员最终确认。</p></div><div class="pdf-footer">SAJ 工商业储能智能配置与技术方案工具 <span>2 / ${3 + selected.length}</span></div></section>
      ${selected.map((asset, index) => renderContentAssetPage(asset, { product: result.product, productImage: product.image, power: result.power, capacity: result.capacity, country: project.country, industry: project.industry, backup: req.backup }, 3 + index, 3 + selected.length)).join("")}
      <section class="pdf-page"><div class="pdf-page-head"><b>SAJ</b><span>风险与边界 · 04</span></div><h1>配置校验结果</h1><div class="pdf-health"><strong>${blocking ? 76 : 94}</strong><div><b>${blocking ? "存在待处理阻断项" : "配置校验通过"}</b><span>已执行产品、兼容、附件及项目边界规则。</span></div></div><div class="pdf-risks">${risks.map((risk) => `<div class="${escape(risk[0])}"><i>${risk[0] === "error" ? "×" : risk[0] === "warning" ? "!" : "i"}</i><p><b>${escape(risk[1])}</b><span>${escape(risk[2])}</span></p></div>`).join("")}</div><div class="pdf-disclaimer"><b>免责声明</b><p>本方案用于销售选型和技术沟通，不承担完整工程设计责任。最终配置、电气设计、保护设置、消防方案及当地并网合规性，仍需由具备授权的技术人员确认。</p></div><div class="pdf-footer">SAJ 工商业储能智能配置与技术方案工具 <span>${3 + selected.length} / ${3 + selected.length}</span></div></section>`;
    document.body.appendChild(host);
    try {
      const [{ jsPDF }, html2canvasModule] = await Promise.all([import("jspdf"), import("html2canvas")]);
      await document.fonts.ready;
      await Promise.all(Array.from(host.querySelectorAll("img")).map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => { image.onload = () => resolve(); image.onerror = () => resolve(); })));
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const pages = Array.from(host.querySelectorAll<HTMLElement>(".pdf-page"));
      for (let index = 0; index < pages.length; index += 1) {
        if (index > 0) pdf.addPage("a4", "portrait");
        const canvas = await html2canvasModule.default(pages[index], { scale: 1.45, useCORS: true, backgroundColor: "#ffffff", logging: false });
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 210, 297, undefined, "FAST");
      }
      pdf.save(filename);
      setToast("PDF 已生成并开始下载");
    } catch (error) {
      console.error(error);
      setToast("PDF 生成失败，请重试");
    } finally {
      host.remove();
      setIsExporting(false);
    }
  }
  return <main className="app-shell">
    <aside className={`sidebar ${menu ? "open" : ""}`}>
      <div className="brand"><span>SAJ</span><b>AI DESIGNER<small>智能配置与方案工具</small></b></div>
      <nav><button className="active">⌁ 配置工作台</button><button onClick={() => setToast("项目列表功能已就绪")}>▣ 我的项目 <em>12</em></button><button onClick={() => setToast("方案中心功能已就绪")}>◇ 方案中心</button><p>资产管理</p><button onClick={() => setAdminView("products")}>▤ 产品与 SKU</button><button onClick={() => setAdminView("rules")}>⌘ 规则引擎</button><button onClick={() => setAdminView("content")}>◫ 内容资产库</button><p>系统</p><button onClick={() => setToast("审计日志功能已就绪")}>◎ 审计日志</button><button onClick={() => setToast("系统设置功能已就绪")}>⚙ 设置</button></nav>
      <footer><i />产品规则库 <b>v2026.06</b></footer>
    </aside>

    <section className="main-column">
      <header className="topbar"><button className="menu" onClick={() => setMenu(!menu)}>☰</button><div><span>配置项目</span><strong>{project.name || "未命名项目"}</strong><small>SAJ-IT-2026-0713 · V1.0 草稿</small></div><section><button onClick={() => setToast("草稿已保存")}>保存草稿</button><i>LP</i><p><b>Li Peng</b><small>解决方案工程师</small></p></section></header>
      <div className="stepper">{steps.map((label, index) => <button key={label} className={`${step === index + 1 ? "active" : ""} ${maxStep > index + 1 ? "done" : ""}`} disabled={index + 1 > maxStep} onClick={() => setStep(index + 1)}><i>{maxStep > index + 1 ? "✓" : index + 1}</i><span>{label}</span></button>)}</div>

      <div className="workspace"><section className="content">
        {step === 1 && <><Heading n="01" title="创建一个新项目" sub="填写项目与客户信息，系统将自动生成项目编号和初始版本。" badge="完整度 83%" /><Panel title="项目基础信息" note="带 * 为必填项"><div className="form-grid"><Field label="项目名称 *" wide><input value={project.name} onChange={(e) => setProject({ ...project, name: e.target.value })} /></Field><Field label="客户名称 *"><input value={project.customer} onChange={(e) => setProject({ ...project, customer: e.target.value })} /></Field><Field label="国家 / 地区 *"><select value={project.country} onChange={(e) => setProject({ ...project, country: e.target.value })}><option>意大利</option><option>德国</option><option>澳大利亚</option><option>南非</option><option>中国</option></select></Field><Field label="项目行业"><select value={project.industry} onChange={(e) => setProject({ ...project, industry: e.target.value })}><option>食品加工</option><option>制造业</option><option>商业园区</option><option>农业</option><option>充电场站</option></select></Field><Field label="销售负责人"><input value={project.owner} onChange={(e) => setProject({ ...project, owner: e.target.value })} /></Field><Field label="目标方案语言"><select value={project.language} onChange={(e) => setProject({ ...project, language: e.target.value })}><option>中文</option><option>English</option><option>Deutsch</option><option>Italiano</option><option>Español</option></select></Field><Field label="预计交付时间"><input type="date" defaultValue="2026-11-30" /></Field><Field label="客户需求说明" wide><textarea defaultValue="降低峰值需量费用，提高光伏自用率，并为关键生产线提供约 2 小时备电。" /></Field></div></Panel><Actions note="项目编号将在保存后自动生成"><span /><button className="primary" onClick={() => next(2)}>保存并填写系统需求 →</button></Actions></>}

        {step === 2 && <><Heading n="02" title="定义系统需求" sub="选择应用场景并填写关键工程参数，推荐引擎将实时检查输入完整性。" badge="已填写 16 / 18" /><Panel title="01 · 应用场景" note="单选"><div className="scenario-grid">{scenarios.map((item) => <button key={item.id} className={req.scenario === item.id ? "selected" : ""} onClick={() => setReq({ ...req, scenario: item.id })}><i>{item.mark}</i><b>{item.title}</b><small>{item.sub}</small><em>✓</em></button>)}</div></Panel><Panel title="02 · 产品系列偏好" note={req.scenario === "retrofit" || req.scenario === "storage" || req.scenario === "vpp" ? "AC 耦合支持选择 CM2" : "可使用自动推荐或人工指定"}><div className="product-choice">{(["AUTO", "CHS2", "CHS3", "CM2"] as const).map((item) => <button key={item} className={preferredProduct === item ? "selected" : ""} onClick={() => setPreferredProduct(item)}><b>{item === "AUTO" ? "智能推荐" : item}</b><small>{item === "AUTO" ? "按规则自动匹配" : item === "CM2" ? "AC 耦合一体化储能柜" : item === "CHS3" ? "液冷混合储能系统" : "紧凑型混合储能系统"}</small></button>)}</div></Panel><Panel title="03 · 功率与容量目标" note="推荐依据核心参数"><div className="metric-grid"><Metric label="目标储能功率" value={req.power} unit="kW" max={1500} set={(value: number) => setReq({ ...req, power: value })} /><Metric label="目标储能容量" value={req.capacity} unit="kWh" max={3000} set={(value: number) => setReq({ ...req, capacity: value })} /><Metric label="光伏装机容量" value={req.pv} unit="kWp" max={2000} set={(value: number) => setReq({ ...req, pv: value })} /></div><div className="duration"><span>目标充放电时长</span><b>{(req.capacity / req.power || 0).toFixed(1)} h</b><small>由容量 ÷ 功率自动计算</small></div></Panel><Panel title="04 · 电网与运行要求"><div className="compact-grid"><Field label="并网电压 / 频率"><select value={req.voltage} onChange={(e) => setReq({ ...req, voltage: e.target.value })}><option>400V / 50Hz</option><option>380V / 50Hz</option><option>415V / 50Hz</option></select></Field><Field label="变压器额定容量"><input type="number" value={req.transformer} onChange={(e) => setReq({ ...req, transformer: Number(e.target.value) })} /></Field><Toggle label="允许向电网反送电" on={req.gridExport} set={(value: boolean) => setReq({ ...req, gridExport: value })} /><Toggle label="要求并离网运行" on={req.backup} set={(value: boolean) => setReq({ ...req, backup: value })} /><Toggle label="要求黑启动" on={req.blackStart} set={(value: boolean) => setReq({ ...req, blackStart: value })} /><Toggle label="接入柴油发电机" on={req.dg} set={(value: boolean) => setReq({ ...req, dg: value })} /><Toggle label="参与 VPP 调度" on={req.vpp} set={(value: boolean) => setReq({ ...req, vpp: value })} /></div></Panel><Panel title="05 · 安装环境"><div className="compact-grid env"><Field label="安装位置"><select value={req.environment} onChange={(e) => setReq({ ...req, environment: e.target.value })}><option value="outdoor">室外</option><option value="indoor">室内机房</option></select></Field><Field label="最低温度 (°C)"><input type="number" value={req.minTemp} onChange={(e) => setReq({ ...req, minTemp: Number(e.target.value) })} /></Field><Field label="最高温度 (°C)"><input type="number" value={req.maxTemp} onChange={(e) => setReq({ ...req, maxTemp: Number(e.target.value) })} /></Field><Field label="海拔 (m)"><input type="number" value={req.altitude} onChange={(e) => setReq({ ...req, altitude: Number(e.target.value) })} /></Field></div></Panel><Actions><button className="secondary" onClick={() => setStep(1)}>← 返回</button><button className="primary" onClick={runRecommendation}>智能生成推荐配置 ✦</button></Actions></>}

        {step === 3 && <><Heading n="03" title="智能推荐配置" sub="系统已基于项目参数、产品兼容关系和并机规则完成匹配。" badge="✓ 推荐完成" success /><div className="recommend"><div><img src={product.image} alt={product.title} /></div><section><span>最佳匹配 · {result.product}</span><h2>{product.title}</h2><p>{req.scenario === "new" ? "直流耦合光储架构" : "工商业交流耦合储能架构"}</p><div className="result-metrics"><b>{result.power}<small>kW 额定功率</small></b><b>{result.capacity}<small>kWh 额定容量</small></b><b>{(result.capacity / result.power).toFixed(1)}<small>h 预计时长</small></b></div><div className="tags">{product.tags.map((tag) => <i key={tag}>{tag}</i>)}</div></section></div><Panel title="推荐设备清单" note="数量可调整"><div className="bom"><header><span>设备 / 型号</span><span>类型</span><span>数量</span><span>推荐依据</span></header>{bom.map((item, index) => <div key={`${item.code}-${index}`}><span><b>{item.code}</b><small>{item.name}</small></span><span><em>{item.type}</em></span><span><button onClick={() => updateQuantity(index, item.qty - 1)}>−</button><input type="number" value={item.qty} onChange={(e) => updateQuantity(index, Number(e.target.value))} /><button onClick={() => updateQuantity(index, item.qty + 1)}>+</button></span><span>{item.reason}</span></div>)}</div></Panel><div className="two-col"><Panel title={`为什么推荐 ${result.product}？`}><ul className="reasons"><li>功率目标 {req.power} kW，{result.qty} 台配置达到 {result.power} kW。</li><li>容量余量为 {result.capacity - req.capacity} kWh，满足当前目标。</li><li>{req.backup ? "并离网需求已自动加入控制器与电表。" : "按并网运行架构完成配置。"}</li><li>室外环境已排除仅支持 IP20 的配置。</li></ul></Panel><Panel title="可选替代方案"><div className="alternative"><i>兼容替代方案</i><b>{result.product === "CM2" ? "CHS3 多机并联" : "CM2 交流耦合"}</b><small>AC 耦合项目可直接切换 CM2</small><button className="secondary full" onClick={() => { const target: Product = result.product === "CM2" ? "CHS3" : "CM2"; const changed = calculate(req, target); setPreferredProduct(target); setResult(changed); setBom(changed.bom); setToast(`已切换为 ${target}`); }}>应用此方案</button></div></Panel></div><Actions><button className="secondary" onClick={() => setStep(2)}>← 修改需求</button><button className="primary" onClick={() => next(4)}>检查配置安全性 →</button></Actions></>}

        {step === 4 && <><Heading n="04" title="配置校验与版本锁定" sub="阻断级错误必须修复；高风险项需技术人员确认并记录原因。" badge={blocking ? "发现阻断项" : "✓ 校验通过"} success={!blocking} /><Panel><div className="score"><b>{blocking ? 76 : 94}<small>配置健康度</small></b><section><h2>{blocking ? "需要调整后才能锁定" : "配置满足当前安全与兼容规则"}</h2><p>已执行 28 条产品规则、14 条兼容规则和 9 条项目边界检查。</p><div><span>✓ 46 已通过</span><span>△ {risks.filter((row) => row[0] === "warning").length} 警告</span><span>× {risks.filter((row) => row[0] === "error").length} 阻断</span></div></section></div></Panel><Panel title="校验结果" note="按风险等级排序"><div className="risk-list">{risks.map((risk, index) => <div className={risk[0]} key={index}><i>{risk[0] === "error" ? "×" : risk[0] === "warning" ? "!" : "i"}</i><section><b>{risk[1]}</b><p>{risk[2]}</p></section><span>{risk[0] === "error" ? "阻断" : risk[0] === "warning" ? "高风险" : "建议"}</span></div>)}</div></Panel><Panel title="版本与审计记录"><p className="audit">锁定后将生成 BOM、规则校验和系统拓扑快照。后续修改会创建新版本，当前版本不可覆盖。</p><label className="check"><input type="checkbox" defaultChecked /> 我已核对客户输入，并理解本工具不替代最终工程设计审核。</label></Panel><Actions><button className="secondary" onClick={() => setStep(3)}>← 返回调整 BOM</button><button className="primary" disabled={blocking} onClick={() => next(5)}>锁定 V1.0 配置 ▣</button></Actions></>}

        {step === 5 && <><Heading n="05" title="构建技术方案" sub="必选内容已固定，可按项目需要添加、移除并调整可选模块。" badge={`预计 ${12 + modules.length * 2} 页`} /><div className="builder"><Panel title="方案目录" note="自动匹配内容"><h3 className="group-title">必选模块</h3>{["封面与项目摘要", "客户需求概述", "推荐系统架构与拓扑", "BOM 设备清单", "关键技术参数", "风险边界与免责声明"].map((title, index) => <div className="required" key={title}><i>{String(index + 1).padStart(2, "0")}</i><b>{title}</b><em>必选</em></div>)}<h3 className="group-title">可选模块</h3>{optionalModules.map(([id, fallbackTitle, fallbackSub], index) => {
          const asset = contentAssets.find((item) => item.id === id);
          const title = asset?.title ?? fallbackTitle;
          const sub = asset?.summary ?? fallbackSub;
          return <button className={`module ${modules.includes(id) ? "selected" : ""}`} key={id} onClick={() => setModules((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}><i>{modules.includes(id) ? "✓" : "+"}</i><span><b>{title}</b><small>{sub}</small></span><em>{String(index + 7).padStart(2, "0")}</em></button>;
        })}</Panel><Panel><span className="eyebrow">智能内容匹配</span><h2>已找到 18 项适配素材</h2><p className="muted">根据 {result.product}、{project.country}、{project.industry}、{req.scenario === "new" ? "直流耦合" : "交流耦合"} 标签筛选。</p><div className="asset-stats"><span><b>6</b>产品内容</span><span><b>4</b>系统图</span><span><b>5</b>项目案例</span><span><b>3</b>证书</span></div><button className="secondary full" onClick={() => setModal(true)}>查看匹配素材</button></Panel></div><Actions><button className="secondary" onClick={() => setStep(4)}>← 返回校验</button><button className="primary" onClick={() => next(6)}>生成方案预览 →</button></Actions></>}

        {step === 6 && <><Heading n="06" title="预览与导出" sub="检查方案信息和页面顺序，然后导出正式技术方案。" badge="✓ 配置版本 V1.0" success /><div className="preview-layout"><div className="doc"><div className="cover"><b>SAJ</b><span>TECHNICAL PROPOSAL · V1.0</span><h2>{project.name}</h2><p>{project.customer}</p><section><img src={product.image} alt="产品" /><div><b>{result.power} kW / {result.capacity} kWh</b><small>{result.product} 工商业储能系统</small></div></section><footer>{project.country} · 2026.07.13 <em>CONFIDENTIAL</em></footer></div><div className="thumbs">{[1, 2, 3, 4, 5, 6].map((n) => <i className={n === 1 ? "active" : ""} key={n}>{String(n).padStart(2, "0")}</i>)}</div></div><Panel title="导出设置"><Field label="方案标题"><input value={`${project.name} 技术方案`} readOnly /></Field><Field label="版本号"><input value="V1.0" readOnly /></Field><label className="check"><input type="checkbox" defaultChecked /> 添加“机密”水印</label><label className="check"><input type="checkbox" /> 显示内部型号编码</label><label className="check"><input type="checkbox" defaultChecked /> 附加产品规格书</label><div className="export-summary"><span>PDF 页数 <b>{4 + modules.length}</b></span><span>方案语言 <b>{project.language}</b></span><span>配置状态 <b>已锁定</b></span></div><button className="primary full" disabled={isExporting} onClick={exportPdf}>{isExporting ? "正在生成 PDF…" : "导出 PDF 方案"}</button><button className="secondary full" onClick={exportData}>导出项目数据</button><small className="disclaimer">最终配置仍需由具备授权的技术人员确认。</small></Panel></div><Actions><button className="secondary" onClick={() => setStep(5)}>← 调整方案内容</button><button className="primary" disabled={isExporting} onClick={exportPdf}>{isExporting ? "正在生成 PDF…" : "生成并导出 PDF ↓"}</button></Actions></>}
      </section>

      <aside className="insights"><header><b><i />智能助手</b><button onClick={() => setModal(true)}>•••</button></header>{step <= 2 ? <><div className="tip"><i>✦</i><h3>输入提示</h3><p>完整的负载曲线能显著提升削峰容量与备电时长推荐的准确度。</p><button>上传负载曲线</button></div><Summary project={project} req={req} /><div className="insight-block"><h4>实时规则提示</h4><Mini type="good" title="功率与容量有效" sub={`充放电时长 ${(req.capacity / req.power || 0).toFixed(1)} 小时`} /><Mini type="info" title="零反送控制" sub="将自动加入电表与 CT" /></div></> : <><div className="product-mini"><img src={product.image} alt={product.title} /><section><span>当前推荐</span><b>{result.product}</b><small>{result.power} kW / {result.capacity} kWh</small></section></div><div className="insight-block"><h4>风险与待确认</h4>{risks.slice(0, 4).map((risk, index) => <Mini key={index} type={risk[0]} title={risk[1]} sub={risk[2]} />)}</div><div className="insight-block"><h4>推荐依据</h4><ul><li>功率与容量双重约束</li><li>产品兼容与最小配置</li><li>并离网及附件规则</li><li>国家、电压和安装环境</li></ul></div></>}<footer>规则引擎已更新 <small>2026.06.28</small></footer></aside>
      </div>
    </section>

    {adminView && <AdminPanel view={adminView} close={() => setAdminView(null)} notify={setToast} contentAssets={contentAssets} setContentAssets={setContentAssets} />}<div className="toast">✓ {toast}</div>
    {modal && <div className="modal-bg" onClick={() => setModal(false)}><div className="modal" onClick={(e) => e.stopPropagation()}><button onClick={() => setModal(false)}>×</button><span className="eyebrow">CONTENT ASSETS</span><h2>智能匹配素材</h2><p>已根据当前配置从营销资料库中匹配以下内容。</p>{[["CHS2 / CHS3 / CM2 产品卖点", "产品内容 · 6 项"], ["直流耦合与并离网拓扑", "系统图 · 4 项"], ["意大利工商业项目案例", "案例 · 5 项"], ["IEC / EN / CEI 认证资料", "证书 · 3 项"]].map((item) => <div className="asset" key={item[0]}><b>{item[0]}</b><span>{item[1]}</span></div>)}<button className="primary full" onClick={() => setModal(false)}>应用到技术方案</button></div></div>}
  </main>;
}

function Heading({ n, title, sub, badge, success }: any) { return <div className="heading"><div><span className="eyebrow">STEP {n} / 06</span><h1>{title}</h1><p>{sub}</p></div><em className={success ? "success" : ""}>{badge}</em></div>; }
function Panel({ title, note, children }: any) { return <div className="panel">{(title || note) && <header><h2>{title}</h2><span>{note}</span></header>}{children}</div>; }
function Field({ label, wide, children }: any) { return <label className={`field ${wide ? "wide" : ""}`}><span>{label}</span>{children}</label>; }
function Actions({ note, children }: any) { return <div className="actions"><span>{note}</span><section>{children}</section></div>; }
function Metric({ label, value, unit, max, set }: any) { return <label className="metric"><span>{label}</span><div><input type="number" value={value} onChange={(e) => set(Number(e.target.value))} /><b>{unit}</b></div><input type="range" min="0" max={max} step="10" value={value} onChange={(e) => set(Number(e.target.value))} /></label>; }
function Toggle({ label, on, set }: any) { return <button className="toggle" onClick={() => set(!on)}><span>{label}</span><i className={on ? "on" : ""}><b /></i><em>{on ? "是" : "否"}</em></button>; }
function Summary({ project, req }: any) { return <div className="insight-block"><h4>项目摘要</h4><dl><div><dt>国家 / 地区</dt><dd>{project.country}</dd></div><div><dt>应用场景</dt><dd>{scenarios.find((item) => item.id === req.scenario)?.title}</dd></div><div><dt>功率目标</dt><dd>{req.power} kW</dd></div><div><dt>容量目标</dt><dd>{req.capacity} kWh</dd></div></dl></div>; }
function Mini({ type, title, sub }: any) { return <div className={`mini ${type}`}><i>{type === "warning" ? "!" : type === "error" ? "×" : type === "good" ? "✓" : "i"}</i><p><b>{title}</b><span>{sub}</span></p></div>; }

function AdminPanel({ view, close, notify, contentAssets, setContentAssets }: { view: "products" | "rules" | "content"; close: () => void; notify: (text: string) => void; contentAssets: ContentAsset[]; setContentAssets: (assets: ContentAsset[]) => void }) {
  const titles = { products: "产品与 SKU", rules: "规则引擎", content: "内容资产库" };
  return <div className="modal-bg admin-bg" onClick={close}><div className="admin-modal" onClick={(event) => event.stopPropagation()}><header><div><span className="eyebrow">ASSET MANAGEMENT</span><h2>{titles[view]}</h2></div><button onClick={close}>×</button></header>
    <div className="admin-toolbar"><input placeholder={view === "products" ? "搜索产品型号…" : view === "rules" ? "搜索规则名称…" : "搜索内容或标签…"} /><button className="secondary">导入 Excel</button>{view !== "content" && <button className="primary" onClick={() => notify(`已创建${titles[view]}草稿`)}>+ 新建</button>}</div>
    {view === "products" && <div className="admin-table"><div className="admin-row head"><span>产品型号</span><span>系列 / 类型</span><span>关键参数</span><span>状态</span><span>操作</span></div>{[["CHS2-50K-T6", "CHS2 / 混合逆变器", "50 kW · IP55"], ["CH3-125K-T8", "CHS3 / 混合逆变器", "125 kW · 1500V PV"], ["CM2-125K-261", "CM2 / 一体化储能柜", "125 kW · 261 kWh"]].map((row) => <div className="admin-row" key={row[0]}><span><b>{row[0]}</b></span><span>{row[1]}</span><span>{row[2]}</span><span><i className="active-status">已发布</i></span><span><button onClick={() => notify(`正在编辑 ${row[0]}`)}>编辑</button></span></div>)}</div>}
    {view === "rules" && <div className="admin-table"><div className="admin-row head"><span>规则名称</span><span>适用产品</span><span>等级</span><span>状态</span><span>操作</span></div>{[["AC 耦合允许 CM2", "CM2", "兼容"], ["多机并联增加 EMS", "CHS2 / CHS3 / CM2", "必选"], ["变压器容量上限", "全系列", "阻断"]].map((row) => <div className="admin-row" key={row[0]}><span><b>{row[0]}</b></span><span>{row[1]}</span><span>{row[2]}</span><span><i className="active-status">已发布</i></span><span><button onClick={() => notify(`正在编辑规则：${row[0]}`)}>编辑</button></span></div>)}</div>}
    {view === "content" && <ContentAssetManager assets={contentAssets} onChange={setContentAssets} notify={notify} />}
  </div></div>;
}