import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";

const root = new URL("../", import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, "$1");
const htmlFiles = readdirSync(root).filter(file => extname(file) === ".html");
const gamePages = [
  "tute.html", "brisca.html", "generala.html", "chinchon.html", "escoba.html", "culo.html",
  "poker.html", "es-un-10.html", "blackjack.html", "impostor.html", "chao-pescao.html",
  "mentiroso-dados.html", "siete-media.html", "la-bomba.html", "quien-mas-probable.html",
  "mentiroso-cartas.html", "presidente.html", "piramide.html", "tabu.html", "password.html",
  "ruleta-caos.html", "juicio-anton.html"
];
const report = { html: htmlFiles.length, games: gamePages.length, refs: 0, swAssets: 0, missing: [], swMissing: [], duplicates: [], bad: [] };

function localTarget(reference) {
  const target = reference.split(/[?#]/)[0].replace(/^\.\//, "");
  if (!target || target.startsWith("#") || /^(?:https?:|mailto:|tel:|data:|javascript:)/.test(target)) return "";
  return decodeURIComponent(target);
}

for (const file of htmlFiles) {
  const source = readFileSync(join(root, file), "utf8");
  if (!/name=["']viewport["']/.test(source)) report.bad.push(`${file}:viewport`);
  if (!source.includes("26.0.3")) report.bad.push(`${file}:version`);
  if ((source.match(/v25-mobile\.css/g) || []).length !== 1) report.bad.push(`${file}:mobile-css`);
  if ((source.match(/v25-mobile\.js/g) || []).length !== 1) report.bad.push(`${file}:mobile-js`);
  if ((source.match(/stats-v26\.js/g) || []).length !== 1) report.bad.push(`${file}:global-stats`);

  const ids = [...source.matchAll(/\sid=["']([^"']+)["']/g)].map(match => match[1]);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) report.duplicates.push(`${file}:${id}`);
    seen.add(id);
  }

  for (const match of source.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const target = localTarget(match[1]);
    if (!target) continue;
    report.refs += 1;
    if (!existsSync(join(root, target))) report.missing.push(`${file}:${target}`);
  }
}

for (const page of gamePages) if (!existsSync(join(root, page))) report.missing.push(`catalog:${page}`);

const manifest = JSON.parse(readFileSync(join(root, "manifest.webmanifest"), "utf8"));
if (!manifest.name.includes("22 juegos")) report.bad.push("manifest:game-count");
if (!manifest.shortcuts?.some(shortcut => shortcut.url.replace(/^\.\//, "") === "brisca.html")) report.bad.push("manifest:brisca-shortcut");

const worker = readFileSync(join(root, "sw.js"), "utf8");
const assetMatch = worker.match(/const CORE_ASSETS = (\[[^;]+\]);/s);
const assets = assetMatch ? JSON.parse(assetMatch[1]) : [];
report.swAssets = assets.length;
report.swMissing = assets.map(asset => asset.replace(/^\.\//, "")).filter(asset => !existsSync(join(root, asset)));
for (const required of ["./brisca.html", "./brisca.css", "./brisca.js", "./stats-v26.js"]) {
  if (!assets.includes(required)) report.bad.push(`service-worker:${required}`);
}

console.log(JSON.stringify({
  html: report.html,
  games: report.games,
  refs: report.refs,
  swAssets: report.swAssets,
  missing: report.missing.length,
  swMissing: report.swMissing.length,
  duplicates: report.duplicates.length,
  bad: report.bad.length
}, null, 2));

if (report.html !== 28 || report.games !== 22 || report.missing.length || report.swMissing.length || report.duplicates.length || report.bad.length) {
  console.error(report);
  process.exit(1);
}
