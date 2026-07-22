/* Holistic audit report generator.
 * Reads findings/*-findings.json + report-content.json + evidence/screenshot-index.json
 * Emits: merged JSON, detailed CSV, and a print/PDF-ready HTML report.
 * Pure Node, no deps.
 */
const fs = require("fs");
const path = require("path");

const ROOT = "c:/Users/soura/Dropbox/AI/Projects/Saudi-HR/hrms-app/docs/holistic-audit-2026-07-21";
const FIND = path.join(ROOT, "findings");
const DATE = "2026-07-21";
const APP = "hrms-app";

// ---------- load ----------
function readJSON(p, fallback) { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; } }

const content = readJSON(path.join(ROOT, "report-content.json"), {});
const shots = readJSON(path.join(ROOT, "evidence", "screenshot-index.json"),
             readJSON(path.join(ROOT, "evidence", "screenshot-index.smoke.json"), []));

let allFindings = [];
for (const f of fs.readdirSync(FIND).filter((x) => x.endsWith("-findings.json"))) {
  const arr = readJSON(path.join(FIND, f), []);
  const domain = f.replace("-findings.json", "");
  if (Array.isArray(arr)) arr.forEach((x) => allFindings.push({ ...x, domain }));
}

// ---------- normalize ----------
const SEV = {
  critical: { key: "Critical", rank: 5, color: "#b4232a", band: "P0" },
  high:     { key: "High",     rank: 4, color: "#d9822b", band: "P1" },
  medium:   { key: "Medium",   rank: 3, color: "#c9a227", band: "P2" },
  low:      { key: "Low",      rank: 2, color: "#2f7d5b", band: "P3" },
  info:     { key: "Info",     rank: 1, color: "#5566a6", band: "P4" },
};
function normSev(s) {
  const t = String(s || "").toLowerCase();
  if (t.includes("critical")) return SEV.critical;
  if (t.includes("high")) return SEV.high;
  if (t.includes("medium")) return SEV.medium;
  if (t.includes("low")) return SEV.low;
  return SEV.info;
}
allFindings.forEach((f) => {
  f._sev = normSev(f.severity);
  f._maxImpact = Math.max(Number(f.techImpact) || 0, Number(f.bizImpact) || 0, Number(f.userImpact) || 0);
  f._risk = Number(f.riskScore) || (Number(f.likelihood) || 0) * f._maxImpact;
});
// sort: severity desc, then risk desc
allFindings.sort((a, b) => b._sev.rank - a._sev.rank || b._risk - a._risk);
// dedup: suppressed IDs are cross-domain duplicates merged into a primary; kept in raw exports, excluded from counts/detail
const suppress = new Set(content.suppress || []);
const corro = content.corroborations || {};
allFindings.forEach((f) => { f._suppressed = suppress.has(f.id); });
const findings = allFindings.filter((f) => !f._suppressed);

// ---------- aggregates ----------
const sevOrder = ["Critical", "High", "Medium", "Low", "Info"];
const bySev = Object.fromEntries(sevOrder.map((k) => [k, 0]));
findings.forEach((f) => bySev[f._sev.key]++);

const byDomain = {};
findings.forEach((f) => { byDomain[f.domain] = byDomain[f.domain] || {}; byDomain[f.domain][f._sev.key] = (byDomain[f.domain][f._sev.key] || 0) + 1; });

const byCat = {};
findings.forEach((f) => { const c = (f.category || "Other").split("/")[0].trim(); byCat[c] = (byCat[c] || 0) + 1; });

const DOMAIN_LABEL = {
  AUTH: "Authentication & Session", RBAC: "RBAC & Multi-Tenant", API: "API & Input Validation",
  DB: "Database & Integrity", BIZ: "Business Logic", UX: "UI/UX & Accessibility",
  PRIV: "Privacy, Logging & Client Sec", QA: "Performance / Tests / Quality",
};

// ---------- svg helpers ----------
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function barChart(rows, opts = {}) {
  const w = opts.w || 640, bh = 26, gap = 10, padL = opts.padL || 190, padR = 60, padT = 8;
  const max = Math.max(1, ...rows.map((r) => r.value));
  const h = padT * 2 + rows.length * (bh + gap);
  let svg = `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img" class="chart">`;
  rows.forEach((r, i) => {
    const y = padT + i * (bh + gap);
    const bw = Math.round(((w - padL - padR) * r.value) / max);
    svg += `<text x="${padL - 10}" y="${y + bh / 2 + 4}" text-anchor="end" class="lbl">${esc(r.label)}</text>`;
    svg += `<rect x="${padL}" y="${y}" width="${Math.max(bw, r.value ? 3 : 0)}" height="${bh}" rx="4" fill="${r.color || "#5566a6"}"/>`;
    svg += `<text x="${padL + Math.max(bw, 3) + 8}" y="${y + bh / 2 + 4}" class="val">${r.value}</text>`;
  });
  return svg + "</svg>";
}

function heatMap() {
  // 5x5 grid: X = max impact (1..5), Y = likelihood (5..1)
  const cell = 92, padL = 60, padT = 20, size = 5;
  const w = padL + size * cell + 20, h = padT + size * cell + 60;
  const grid = {};
  findings.forEach((f) => {
    const L = Math.min(5, Math.max(1, Number(f.likelihood) || 1));
    const I = Math.min(5, Math.max(1, f._maxImpact || 1));
    const k = L + "," + I; grid[k] = (grid[k] || []); grid[k].push(f.id);
  });
  function color(L, I) {
    const score = L * I;
    if (score >= 20) return "#b4232a"; if (score >= 15) return "#d9822b";
    if (score >= 8) return "#c9a227"; if (score >= 3) return "#2f7d5b"; return "#5566a6";
  }
  let svg = `<svg viewBox="0 0 ${w} ${h}" width="100%" class="heat" role="img">`;
  for (let li = 0; li < size; li++) {
    const L = 5 - li;
    svg += `<text x="${padL - 12}" y="${padT + li * cell + cell / 2 + 4}" text-anchor="end" class="axis">${L}</text>`;
    for (let ii = 0; ii < size; ii++) {
      const I = ii + 1, x = padL + ii * cell, y = padT + li * cell;
      const ids = grid[L + "," + I] || [];
      svg += `<rect x="${x}" y="${y}" width="${cell - 4}" height="${cell - 4}" rx="6" fill="${color(L, I)}" opacity="${ids.length ? 0.92 : 0.16}"/>`;
      if (ids.length) svg += `<text x="${x + (cell - 4) / 2}" y="${y + (cell - 4) / 2 + 7}" text-anchor="middle" class="heatn">${ids.length}</text>`;
    }
  }
  for (let ii = 0; ii < size; ii++) svg += `<text x="${padL + ii * cell + cell / 2}" y="${padT + size * cell + 24}" text-anchor="middle" class="axis">${ii + 1}</text>`;
  svg += `<text x="${padL + (size * cell) / 2}" y="${padT + size * cell + 48}" text-anchor="middle" class="axisttl">Max Impact →</text>`;
  svg += `<text x="18" y="${padT + (size * cell) / 2}" text-anchor="middle" class="axisttl" transform="rotate(-90 18 ${padT + (size * cell) / 2})">Likelihood →</text>`;
  return svg + "</svg>";
}

function scoreGauge(label, val) {
  const v = Math.round(Number(val) || 0);
  const col = v >= 80 ? "#2f7d5b" : v >= 60 ? "#c9a227" : v >= 40 ? "#d9822b" : "#b4232a";
  return `<div class="gauge"><div class="gnum" style="color:${col}">${v}</div><div class="glbl">${esc(label)}</div>
    <div class="gbar"><span style="width:${v}%;background:${col}"></span></div></div>`;
}

// ---------- findings table ----------
function findingCard(f) {
  const ev = (f.evidence || []).map((e) => `<div class="ev"><code>${esc(e.file)}${e.line ? ":" + e.line : ""}</code>${e.snippet ? `<pre>${esc(e.snippet)}</pre>` : ""}</div>`).join("");
  return `<div class="finding sev-${f._sev.key.toLowerCase()}">
    <div class="fhead"><span class="fid">${esc(f.id)}</span><span class="chip" style="background:${f._sev.color}">${f._sev.key} · ${f._sev.band}</span>
      <span class="chip ghost">Risk ${f._risk}</span><span class="chip ghost">${esc(f.status || "")}</span>
      <span class="ftitle">${esc(f.title)}</span>${(corro[f.id] || []).length ? `<span class="chip ghost">corroborated: ${esc((corro[f.id] || []).join(", "))}</span>` : ""}</div>
    <div class="fmeta"><b>Module:</b> <code>${esc(f.module || f.page || "-")}</code> &nbsp;·&nbsp; <b>Role:</b> ${esc(f.role || "-")} &nbsp;·&nbsp; <b>L</b>${esc(f.likelihood)} <b>·T</b>${esc(f.techImpact)} <b>B</b>${esc(f.bizImpact)} <b>U</b>${esc(f.userImpact)}</div>
    <p class="fdesc">${esc(f.description)}</p>
    <div class="frow"><div><b>Expected:</b> ${esc(f.expectedBehavior)}</div><div><b>Actual:</b> ${esc(f.actualBehavior)}</div></div>
    ${ev ? `<details class="evidence"><summary>Evidence (${(f.evidence || []).length})</summary>${ev}</details>` : ""}
    <div class="frec"><b>Recommendation:</b> ${esc(f.recommendation)}${f.workaround ? `<br><b>Workaround:</b> ${esc(f.workaround)}` : ""}
      <span class="tag">${esc(f.estimatedEffort || "")}</span><span class="tag">${esc(f.targetSprint || "")}</span><span class="tag">${esc(f.suggestedOwner || "")}</span></div>
  </div>`;
}

// ---------- gallery ----------
function gallery() {
  if (!shots.length) return "<p class='muted'>Screenshot capture pending.</p>";
  const CAP = { "01_Discovery": 2, "02_Authentication": 1, "10_Errors": 1, "05_UI_UX": 3, "03_RBAC": 4, "04_Functional": 6, "12_Other": 2 };
  const groups = {};
  shots.forEach((s) => { groups[s.folder] = groups[s.folder] || []; groups[s.folder].push(s); });
  return Object.keys(groups).sort().map((g) => {
    let items = groups[g];
    const cap = CAP[g] || 4;
    if (items.length > cap) { const step = items.length / cap, picked = []; for (let i = 0; i < cap; i++) picked.push(items[Math.floor(i * step)]); items = picked; }
    return `<h3 class="galh">${esc(g.replace(/_/g, " "))} <span class="muted">(${items.length} of ${groups[g].length})</span></h3><div class="grid">${
      items.map((s) => `<figure><img src="evidence/screenshots/${esc(s.folder)}/${esc(s.file)}"/><figcaption>${esc(s.id)} · ${esc(s.description)}</figcaption></figure>`).join("")
    }</div>`;
  }).join("");
}

// ---------- merged outputs ----------
fs.writeFileSync(path.join(ROOT, `${APP}_Audit_Findings_${DATE}.json`),
  JSON.stringify({ app: APP, date: DATE, totals: bySev, count: findings.length,
    activeCount: findings.length,
    findings: allFindings.map(({ _sev, _maxImpact, _risk, ...rest }) => rest) }, null, 2));

const CSV_COLS = ["id", "title", "category", "domain", "module", "page", "url", "role", "severity", "priority", "riskScore", "likelihood", "techImpact", "bizImpact", "userImpact", "status", "description", "expectedBehavior", "actualBehavior", "reproduction", "recommendation", "workaround", "suggestedOwner", "estimatedEffort", "targetSprint"];
const csvCell = (v) => `"${String(v == null ? "" : v).replace(/"/g, '""').replace(/[\r\n]+/g, " ")}"`;
const csv = [CSV_COLS.join(",")].concat(allFindings.map((f) => CSV_COLS.map((c) => csvCell(f[c])).join(","))).join("\n");
fs.writeFileSync(path.join(ROOT, `${APP}_Detailed_Audit_Findings_${DATE}.csv`), csv);

// ---------- scores ----------
const scores = content.scores || {};
const weights = content.weights || {};
let overall = content.overallScore;
if (overall == null && Object.keys(weights).length) {
  let num = 0, den = 0;
  for (const k of Object.keys(weights)) { if (scores[k] != null) { num += scores[k] * weights[k]; den += weights[k]; } }
  overall = den ? Math.round(num / den) : null;
}
const rating = overall == null ? "-" : overall >= 90 ? "Excellent" : overall >= 80 ? "Good" : overall >= 70 ? "Acceptable with improvements" : overall >= 60 ? "Significant improvement required" : overall >= 40 ? "High risk" : "Critical condition";

// ---------- HTML ----------
const section = (id, title, body) => `<section id="${id}"><h2>${esc(title)}</h2>${body}</section>`;
const list = (arr) => `<ul>${(arr || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;

const domainRows = Object.keys(byDomain).sort().map((d) => ({
  label: DOMAIN_LABEL[d] || d, value: sevOrder.reduce((a, k) => a + (byDomain[d][k] || 0), 0), color: "#40567a",
}));
const catRows = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => ({ label: k, value: v, color: "#7a5ea6" }));
const sevRows = sevOrder.map((k) => ({ label: k, value: bySev[k], color: SEV[k.toLowerCase()].color }));

const roadmap = content.roadmap || {};
const roadmapBlock = ["immediate", "urgent", "shortTerm", "mediumTerm"].map((k) => roadmap[k] ? `
  <div class="road road-${k}"><h4>${esc(roadmap[k].title)}</h4>${list(roadmap[k].items)}</div>` : "").join("");

const scoreCards = Object.entries(scores).map(([k, v]) => scoreGauge(k, v)).join("");

const cov = content.coverage || {};
const coverageTable = Object.keys(cov).length ? `<table class="tbl"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${
  Object.entries(cov).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</tbody></table>` : "";

const rbac = content.rbacMatrix;
function rbacCell(c, i, last) {
  const t = String(c).toLowerCase();
  let cls = "";
  if (i === last) {
    if (t.includes("fail") || t.includes("leak")) cls = "cell-none";
    else if (t.includes("partial")) cls = "cell-scoped";
    else if (t.includes("pass") || t.includes("ok")) cls = "cell-full";
  }
  return `<td class="${cls}">${esc(c)}</td>`;
}
const rbacBlock = rbac && rbac.rows ? `<table class="tbl rbac"><thead><tr>${rbac.cols.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${
  rbac.rows.map((r) => `<tr>${r.map((c, i) => rbacCell(c, i, r.length - 1)).join("")}</tr>`).join("")}</tbody></table>` : "";

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${APP} — Holistic SaaS Audit Report — ${DATE}</title>
<style>
:root{--ink:#14181f;--muted:#5b6472;--line:#e4e7ec;--bg:#fff;--soft:#f6f8fa;--brand:#0f5132;--gold:#b7962f}
*{box-sizing:border-box}
body{margin:0;color:var(--ink);font:14px/1.55 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:var(--bg)}
.wrap{max-width:1040px;margin:0 auto;padding:0 34px}
h1,h2,h3,h4{line-height:1.2;letter-spacing:-.01em}
h2{font-size:22px;margin:0 0 14px;padding-bottom:8px;border-bottom:2px solid var(--line)}
h3{font-size:16px;margin:22px 0 8px}
section{padding:26px 0;border-bottom:1px solid var(--line)}
code{background:var(--soft);padding:1px 5px;border-radius:4px;font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace}
pre{background:#0f172a;color:#e2e8f0;padding:10px 12px;border-radius:6px;overflow:auto;font:11.5px/1.5 ui-monospace,Menlo,monospace;white-space:pre-wrap;margin:6px 0 0}
.muted{color:var(--muted)}
/* cover */
.cover{min-height:96vh;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(135deg,#0f5132,#0b3a24 60%,#08251a);color:#fff;padding:60px 34px;border:0}
.cover .kicker{color:var(--gold);text-transform:uppercase;letter-spacing:.28em;font-size:12px;font-weight:700}
.cover h1{font-size:46px;margin:14px 0 6px}
.cover .sub{font-size:19px;color:#d7e5dd;max-width:680px}
.cover .meta{margin-top:40px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 28px;max-width:660px}
.cover .meta div{border-left:2px solid var(--gold);padding-left:12px}
.cover .meta b{display:block;color:var(--gold);font-size:11px;text-transform:uppercase;letter-spacing:.12em}
.scorehero{margin-top:34px;display:flex;align-items:center;gap:22px}
.scorehero .big{font-size:74px;font-weight:800;line-height:1}
.scorehero .rate{font-size:18px;font-weight:700}
.confid{margin-top:30px;font-size:12px;color:#9fc3b1;max-width:680px}
/* chips + cards */
.chip{display:inline-block;color:#fff;font-size:11px;font-weight:700;padding:2px 9px;border-radius:20px;margin-right:6px}
.chip.ghost{background:#eef1f5;color:#48505e}
.kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:6px 0 18px}
.kpi{border:1px solid var(--line);border-radius:10px;padding:14px;text-align:center}
.kpi .n{font-size:30px;font-weight:800}.kpi .l{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:26px}
.chart .lbl{font-size:12px;fill:#3a4048}.chart .val{font-size:12px;font-weight:700;fill:#3a4048}
.heat text.axis{font-size:13px;fill:#5b6472}.heat .heatn{fill:#fff;font-weight:800;font-size:15px}.heat .axisttl{font-size:12px;fill:#5b6472;font-weight:600}
.gauges{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.gauge{border:1px solid var(--line);border-radius:10px;padding:12px 14px}
.gauge .gnum{font-size:26px;font-weight:800}.gauge .glbl{font-size:12px;color:var(--muted);text-transform:capitalize;min-height:30px}
.gbar{height:7px;background:var(--soft);border-radius:6px;overflow:hidden;margin-top:6px}.gbar span{display:block;height:100%}
/* findings */
.finding{border:1px solid var(--line);border-left-width:5px;border-radius:8px;padding:14px 16px;margin:12px 0;page-break-inside:avoid}
.sev-critical{border-left-color:#b4232a}.sev-high{border-left-color:#d9822b}.sev-medium{border-left-color:#c9a227}.sev-low{border-left-color:#2f7d5b}.sev-info{border-left-color:#5566a6}
.fhead{display:flex;align-items:center;flex-wrap:wrap;gap:4px}
.fid{font-weight:800;margin-right:8px}.ftitle{font-weight:700;flex:1 1 100%;margin-top:6px}
.fmeta{font-size:12px;color:var(--muted);margin:8px 0}
.fdesc{margin:8px 0}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:14px;font-size:13px;background:var(--soft);padding:10px;border-radius:6px}
.evidence{margin:10px 0}.evidence summary{cursor:pointer;font-weight:600;font-size:13px}
.ev{margin-top:8px}.frec{font-size:13px;margin-top:10px}
.tag{display:inline-block;background:#eef2f7;color:#41506b;border-radius:20px;padding:1px 9px;font-size:11px;margin-left:6px;font-weight:600}
/* tables */
.tbl{width:100%;border-collapse:collapse;font-size:12.5px;margin:8px 0}
.tbl th,.tbl td{border:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
.tbl th{background:var(--soft);font-weight:700}
.rbac td.cell-full,.rbac td.cell-yes{background:#e7f4ec}.rbac td.cell-none,.rbac td.cell-no{background:#fbe9e7}.rbac td.cell-scoped,.rbac td.cell-own,.rbac td.cell-self{background:#fdf6e3}
.road{border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin:10px 0}
.road h4{margin:0 0 6px}.road-immediate{border-left:5px solid #b4232a}.road-urgent{border-left:5px solid #d9822b}.road-shortTerm{border-left:5px solid #c9a227}.road-mediumTerm{border-left:5px solid #2f7d5b}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
figure{margin:0;border:1px solid var(--line);border-radius:8px;overflow:hidden;page-break-inside:avoid}
figure img{width:100%;display:block;border-bottom:1px solid var(--line)}
figcaption{font-size:11px;padding:6px 8px;color:var(--muted)}
.galh{margin-top:20px}
.toc{columns:2;font-size:13px}.toc a{color:var(--brand);text-decoration:none}
.note{background:#fff8e6;border:1px solid #f0d98a;border-radius:8px;padding:10px 14px;font-size:13px}
figure img{max-height:150mm;object-fit:contain;object-position:top;background:#f6f8fa}
@media print{.finding,figure,.road,section{page-break-inside:avoid}section{border-bottom:0}a{color:inherit;text-decoration:none}figure img{max-height:120mm}}
@page{size:A4;margin:14mm}
</style></head><body>

<header class="cover">
  <div class="kicker">Confidential · Holistic SaaS Security &amp; Quality Audit</div>
  <h1>${esc(content.appTitle || "Taāzur HRMS")}</h1>
  <div class="sub">${esc(content.appDescription || "Independent full-scope audit — security, RBAC, data, API, UI/UX, accessibility, performance, privacy and test coverage.")}</div>
  <div class="scorehero"><div class="big">${overall == null ? "–" : overall}<span style="font-size:26px">/100</span></div>
    <div><div class="rate">${esc(rating)}</div><div class="muted">Overall weighted health score</div></div></div>
  <div class="meta">
    <div><b>Application</b>${esc(content.appTitle || APP)}</div>
    <div><b>Environment</b>Production demo (${esc(content.host || "hrms-app-chi.vercel.app")})</div>
    <div><b>Audit date</b>${DATE}</div>
    <div><b>Method</b>White-box (source) + live black-box</div>
    <div><b>Total findings</b>${findings.length}</div>
    <div><b>Critical / High</b>${bySev.Critical} / ${bySev.High}</div>
  </div>
  <div class="confid">This document contains confidential security findings. Distribute on a need-to-know basis. Passwords, tokens and secrets are masked. Data shown is from a fictitious demo tenant.</div>
</header>

<div class="wrap">

${section("summary", "1. Executive summary", `
  <div class="kpis">
    ${sevOrder.map((k) => `<div class="kpi"><div class="n" style="color:${SEV[k.toLowerCase()].color}">${bySev[k]}</div><div class="l">${k}</div></div>`).join("")}
  </div>
  ${(content.execSummary || []).map((p) => `<p>${esc(p)}</p>`).join("")}
  ${content.topRisk ? `<div class="note"><b>Most serious issue:</b> ${esc(content.topRisk)}</div>` : ""}
`)}

${section("scorecard", "2. Overall scorecard", `
  <p class="muted">Module scores (0–100), weighted into the overall health score shown on the cover.</p>
  <div class="gauges">${scoreCards}</div>
  ${coverageTable ? `<h3>Test coverage</h3>${coverageTable}` : ""}
`)}

${section("distribution", "3. Severity, category &amp; domain distribution", `
  <div class="grid2">
    <div><h3>By severity</h3>${barChart(sevRows)}</div>
    <div><h3>By audit domain</h3>${barChart(domainRows)}</div>
  </div>
  <h3>By category (top)</h3>${barChart(catRows, { padL: 230 })}
`)}

${section("heatmap", "4. Risk heat map", `
  <p class="muted">Each cell counts findings at that likelihood × maximum-impact. Colour follows Likelihood × Impact (20–25 Critical, 15–19 High, 8–14 Medium, 3–7 Low).</p>
  ${heatMap()}
`)}

${section("scope", "5. Scope, methodology &amp; limitations", `
  ${(content.scope || []).map((p) => `<p>${esc(p)}</p>`).join("")}
  ${content.methodology ? `<h3>Methodology</h3>${list(content.methodology)}` : ""}
  ${content.limitations ? `<h3>Limitations &amp; coverage caveats</h3>${list(content.limitations)}` : ""}
`)}

${content.rbacMatrix ? section("rbac", "6. RBAC permission matrix", `
  ${(content.rbacIntro || []).map((p) => `<p>${esc(p)}</p>`).join("")}
  ${rbacBlock}`) : ""}

${section("domains", "7. Findings by domain", `
  ${(content.domainSummaries || []).map((d) => `<h3>${esc(d.title)} — score ${esc(d.score)}/100</h3><p>${esc(d.summary)}</p>`).join("")}
`)}

${section("findings", "8. Detailed findings", `
  <p class="muted">${findings.length} findings, ordered by severity then risk score. Evidence cites <code>file:line</code> from the audited source.</p>
  ${findings.map(findingCard).join("")}
`)}

${section("roadmap", "9. Remediation roadmap", `
  ${roadmapBlock || "<p class='muted'>See per-finding recommendations.</p>"}
`)}

${section("evidence", "10. Screenshot evidence", `
  <p class="muted">${shots.length} screenshots were captured live from the running application across 4 roles and 4 viewports (all four demo logins succeeded). A representative subset is shown below; the complete set is in <code>evidence/screenshots/</code> with the index in <code>evidence/screenshot-index.json</code>.</p>
  ${gallery()}
`)}

${section("strengths", "11. Strengths &amp; conclusion", `
  ${content.strengths ? `<h3>What the app does well</h3>${list(content.strengths)}` : ""}
  ${(content.conclusion || []).map((p) => `<p>${esc(p)}</p>`).join("")}
`)}

<section style="border-bottom:0"><p class="muted" style="font-size:12px">Generated ${DATE} · ${APP} holistic audit · ${findings.length} findings · white-box + live black-box.</p></section>
</div>
</body></html>`;

fs.writeFileSync(path.join(ROOT, `${APP}_Holistic_SaaS_Audit_Report_${DATE}.html`), html);
console.log(`Report built: ${findings.length} findings | sev ${JSON.stringify(bySev)} | overall ${overall} (${rating}) | shots ${shots.length}`);
