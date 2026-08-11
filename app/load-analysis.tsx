"use client";

import { useState } from "react";

export type AiRecommendation = {
  primary_objective: string;
  recommended_power_kw: number;
  recommended_capacity_kwh: number;
  preferred_product: "CHS2" | "CHS3" | "CM2";
  confidence: "high" | "medium" | "low";
  reasoning: string[];
  warnings: string[];
  assumptions: string[];
};

type LoadFeatures = {
  fileName: string;
  records: number;
  days: number;
  intervalMinutes: number;
  dataQuality: number;
  maximumLoadKw: number;
  averageLoadKw: number;
  minimumLoadKw: number;
  p95LoadKw: number;
  loadFactor: number;
  averageDailyEnergyKwh: number;
  peakDurationHours: number;
  missingRate: number;
};

type Props = {
  project: { country: string; industry: string };
  requirements: { transformer: number; pv: number; voltage: string; backup: boolean; coupling: "AC" | "DC"; existingGridPv: boolean };
  onApply: (recommendation: AiRecommendation) => void;
};

function splitCsvLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { current += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(current.trim()); current = "";
    } else current += char;
  }
  cells.push(current.trim());
  return cells;
}

function percentile(values: number[], ratio: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
}

function parseNumber(value: string) {
  const normalized = value.replace(/\s/g, "").replace(/,(?=\d{3}(?:\D|$))/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

async function analyzeCsv(file: File): Promise<LoadFeatures> {
  const text = (await file.text()).replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 3) throw new Error("文件数据不足，至少需要标题行和两条负荷记录。");
  const delimiter = [",", "\t", ";"].sort((a, b) => lines[0].split(b).length - lines[0].split(a).length)[0];
  const headers = splitCsvLine(lines[0], delimiter).map((item) => item.toLowerCase());
  const timeIndex = headers.findIndex((item) => /时间|日期|timestamp|date|time/.test(item));
  const loadIndex = headers.findIndex((item) => /负荷|有功|load|power|demand|kw|kwh/.test(item));
  if (timeIndex < 0 || loadIndex < 0) throw new Error("未识别到时间列或负荷列，请使用包含“时间”和“负荷(kW)”的CSV标题。");

  const rows = lines.slice(1).map((line) => splitCsvLine(line, delimiter));
  const valid = rows.map((row) => ({ time: new Date(row[timeIndex]).getTime(), value: parseNumber(row[loadIndex]) })).filter((row) => Number.isFinite(row.time) && row.value !== null && row.value >= 0) as { time: number; value: number }[];
  if (valid.length < 2) throw new Error("没有足够的有效时间和负荷数据。");
  valid.sort((a, b) => a.time - b.time);
  const unique = valid.filter((row, index) => index === 0 || row.time !== valid[index - 1].time);
  const diffs = unique.slice(1).map((row, index) => (row.time - unique[index].time) / 60000).filter((value) => value > 0 && value <= 1440);
  const intervalMinutes = Math.max(1, Math.round(percentile(diffs, 0.5) || 60));
  const durationDays = Math.max(1, (unique.at(-1)!.time - unique[0].time) / 86400000 + intervalMinutes / 1440);
  const expectedRecords = Math.max(unique.length, Math.round(durationDays * 1440 / intervalMinutes));
  const missingRate = Math.max(0, 1 - unique.length / expectedRecords);
  const rawValues = unique.map((row) => row.value);
  const isEnergyColumn = /kwh|电量|energy/.test(headers[loadIndex]);
  const values = isEnergyColumn ? rawValues.map((value) => value / (intervalMinutes / 60)) : rawValues;
  const maximumLoadKw = Math.max(...values);
  const averageLoadKw = values.reduce((sum, value) => sum + value, 0) / values.length;
  const p95LoadKw = percentile(values, 0.95);
  const days = Math.max(1, Math.round(durationDays));
  const totalEnergy = values.reduce((sum, value) => sum + value * intervalMinutes / 60, 0);
  const invalidRate = Math.max(0, 1 - valid.length / rows.length);
  const duplicateRate = Math.max(0, 1 - unique.length / valid.length);
  const coveragePenalty = days >= 30 ? 0 : Math.min(25, (30 - days) / 30 * 25);
  const dataQuality = Math.max(0, Math.round(100 - invalidRate * 30 - duplicateRate * 20 - missingRate * 30 - coveragePenalty));
  return {
    fileName: file.name,
    records: unique.length,
    days,
    intervalMinutes,
    dataQuality,
    maximumLoadKw,
    averageLoadKw,
    minimumLoadKw: Math.min(...values),
    p95LoadKw,
    loadFactor: maximumLoadKw ? averageLoadKw / maximumLoadKw : 0,
    averageDailyEnergyKwh: totalEnergy / durationDays,
    peakDurationHours: values.filter((value) => value >= p95LoadKw).length * intervalMinutes / 60 / durationDays,
    missingRate,
  };
}

const numberText = (value: number, digits = 0) => value.toLocaleString("zh-CN", { maximumFractionDigits: digits });

export function LoadAnalysisPanel({ project, requirements, onApply }: Props) {
  const [features, setFeatures] = useState<LoadFeatures | null>(null);
  const [recommendation, setRecommendation] = useState<AiRecommendation | null>(null);
  const [goal, setGoal] = useState("综合收益最大化");
  const [status, setStatus] = useState("等待上传客户负荷CSV");
  const [busy, setBusy] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true); setRecommendation(null); setStatus("正在解析负荷数据…");
    try {
      const next = await analyzeCsv(file);
      setFeatures(next); setStatus(`已完成 ${next.records} 条记录的数据质量检查`);
    } catch (error) {
      setFeatures(null); setStatus(error instanceof Error ? error.message : "负荷文件解析失败");
    } finally { setBusy(false); }
  }

  async function runAi() {
    if (!features) return;
    setBusy(true); setStatus("DeepSeek 正在比较负荷特征与产品配置…");
    try {
      const response = await fetch("/api/deepseek-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features, goal, project, requirements }),
      });
      const payload = await response.json() as { recommendation?: AiRecommendation; error?: string };
      if (!response.ok || !payload.recommendation) throw new Error(payload.error || "DeepSeek分析失败");
      setRecommendation(payload.recommendation); setStatus("AI分析完成，等待工程师确认");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "DeepSeek分析失败");
    } finally { setBusy(false); }
  }

  return <div className="load-ai">
    <div className="load-ai-head"><div><span className="eyebrow">LOAD PROFILE · DEEPSEEK API</span><h2>客户负荷智能分析</h2><p>原始数据仅在浏览器中解析，API接收脱敏后的统计特征。</p></div><label className="upload-button"><input type="file" accept=".csv,.txt,text/csv" onChange={(event) => upload(event.target.files?.[0])} />{busy ? "处理中…" : "上传负荷 CSV"}</label></div>
    <div className="ai-status"><i className={features ? "ready" : ""} />{status}</div>
    {!features && <div className="load-empty"><b>CSV最低要求</b><span>包含时间列和负荷功率列，支持15/30/60分钟数据；推荐连续30天以上。</span><code>时间,负荷(kW){"\n"}2026-01-01 00:00,428.5</code></div>}
    {features && <>
      <div className="load-kpis"><div><span>数据质量</span><b>{features.dataQuality}<small>/100</small></b></div><div><span>最大负荷</span><b>{numberText(features.maximumLoadKw)}<small>kW</small></b></div><div><span>95%分位</span><b>{numberText(features.p95LoadKw)}<small>kW</small></b></div><div><span>日均用电</span><b>{numberText(features.averageDailyEnergyKwh)}<small>kWh</small></b></div></div>
      <div className="load-details"><span>{features.days}天数据</span><span>{features.intervalMinutes}分钟间隔</span><span>平均负荷 {numberText(features.averageLoadKw)} kW</span><span>负荷率 {(features.loadFactor * 100).toFixed(1)}%</span><span>缺失率 {(features.missingRate * 100).toFixed(1)}%</span></div>
      <div className="ai-actions"><label><span>主要优化目标</span><select value={goal} onChange={(event) => setGoal(event.target.value)}><option>综合收益最大化</option><option>降低最大需量</option><option>峰谷套利</option><option>提高光伏自用率</option><option>关键负载备电</option></select></label><button className="primary" disabled={busy} onClick={runAi}>{busy ? "分析中…" : "启动 DeepSeek 智能分析 ✦"}</button></div>
    </>}
    {recommendation && <div className="ai-result"><header><div><span>AI主推荐</span><h3>{recommendation.recommended_power_kw} kW / {recommendation.recommended_capacity_kwh} kWh</h3></div><em>{recommendation.preferred_product} · {recommendation.confidence === "high" ? "高置信度" : recommendation.confidence === "medium" ? "中置信度" : "低置信度"}</em></header><p>{recommendation.primary_objective}</p><ul>{recommendation.reasoning.map((item) => <li key={item}>{item}</li>)}</ul>{recommendation.warnings.length > 0 && <div className="ai-warnings">{recommendation.warnings.map((item) => <span key={item}>! {item}</span>)}</div>}<button className="primary full" onClick={() => onApply(recommendation)}>采用建议并进入产品配置 →</button></div>}
  </div>;
}
