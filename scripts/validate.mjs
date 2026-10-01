import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const htmlFiles = readdirSync(root).filter(file => extname(file) === ".html");
const jsFiles = readdirSync(root).filter(file => extname(file) === ".js" && file !== "playwright.config.js");
const gamePages = [
  "tute.html", "brisca.html", "generala.html", "chinchon.html", "escoba.html", "culo.html",
  "cinquillo.html", "pocha.html", "burro.html", "poker.html", "blackjack.html", "siete-media.html",
  "es-un-10.html", "impostor.html", "chao-pescao.html", "mentiroso-dados.html", "la-bomba.html",
  "quien-mas-probable.html", "mentiroso-cartas.html", "presidente.html", "piramide.html", "tabu.html",
  "password.html", "ruleta-caos.html", "juicio-anton.html", "charadas.html", "pictionary.html"
];
const removedRuntime = ["career.html", "career.js", "career.css", "club.js", "club.css", "auth.js", "auth.css", "stats-v26.js"];
const report = { html: htmlFiles.length, games: gamePages.length, refs: 0, swAssets: 0, missing: [], swMissing: [], duplicates: [], bad: [], syntax: [] };

function localTarget(reference) {
  const target = reference.split(/[?#]/)[0].replace(/^\.\//, "");
  if (!target || target.startsWith("#") || /^(?:https?:|mailto:|tel:|data:|javascript:)/.test(target)) return "";
  return decodeURIComponent(target);
}

for (const file of htmlFiles) {
  const source = readFileSync(join(root, file), "utf8");
  if (!/name=["']viewport["']/.test(source)) report.bad.push(`${file}:viewport`);
  if (!source.includes("26.1.1")) report.bad.push(`${file}:version`);
  if ((source.match(/casual\.js/g) || []).length !== 1) report.bad.push(`${file}:casual-runtime`);
  if (/(?:career|club|auth|stats-v26)\.(?:css|js|html)/i.test(source)) report.bad.push(`${file}:removed-runtime-reference`);

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

for (const page of gamePages) {
  const source = readFileSync(join(root, page), "utf8");
  if (!/href=["'](?:\.\/)?index\.html(?:[#?][^"']*)?["']/.test(source)) report.bad.push(`${page}:home-link`);
}

const home = readFileSync(join(root, "index.html"), "utf8");
const cards = [...home.matchAll(/data-game-card="([^"]+)"/g)].map(match => match[1]);
const cardLinks = [...home.matchAll(/<a class="game-card[^"]*" href="([^"]+)" data-game-card="([^"]+)"/g)].map(match => ({ href: match[1], id: match[2] }));
if (cards.length !== 27 || new Set(cards).size !== 27) report.bad.push("index:catalog-unique-count");
if (cardLinks.length !== 27 || new Set(cardLinks.map(item => item.href)).size !== 27) report.bad.push("index:catalog-links");
for (const page of gamePages) if (!cardLinks.some(item => item.href === page)) report.bad.push(`index:missing-card:${page}`);
for (const { href, id } of cardLinks) {
  const source = readFileSync(join(root, href), "utf8");
  if (!new RegExp(`<body[^>]*data-game=["']${id}["']`, "i").test(source)) report.bad.push(`${href}:game-identity:${id}`);
}
if (!["todos", "cartas", "casino", "party", "palabras", "dados"].every(filter => home.includes(`data-filter="${filter}"`))) report.bad.push("index:filters");
if (!home.includes("data-random-game") || !home.includes('id="gameSearch"')) report.bad.push("index:discovery-controls");

const visibleLegacy = /Carrera de Sala Cero|\bXP\b|trofeos?|logros?|desbloqueables?|campeonatos?|Maestro del salón|los cuatro juegos|22 juegos/i;
for (const file of htmlFiles) {
  const source = readFileSync(join(root, file), "utf8").replace(/<script[\s\S]*?<\/script>/gi, "");
  if (visibleLegacy.test(source)) report.bad.push(`${file}:legacy-copy`);
}
for (const file of removedRuntime) if (existsSync(join(root, file))) report.bad.push(`removed-file-still-present:${file}`);

const manifest = JSON.parse(readFileSync(join(root, "manifest.webmanifest"), "utf8"));
if (!manifest.name.includes("27 juegos")) report.bad.push("manifest:game-count");
for (const page of ["tute.html", "brisca.html", "cinquillo.html", "pocha.html", "charadas.html", "pictionary.html"]) {
  if (!manifest.shortcuts?.some(shortcut => shortcut.url.replace(/^\.\//, "") === page)) report.bad.push(`manifest:shortcut:${page}`);
}

const worker = readFileSync(join(root, "sw.js"), "utf8");
if (!worker.includes('const VERSION = "26.1.1"')) report.bad.push("service-worker:version");
const assetMatch = worker.match(/const CORE_ASSETS = (\[[^;]+\]);/s);
const assets = assetMatch ? JSON.parse(assetMatch[1]) : [];
report.swAssets = assets.length;
report.swMissing = assets.map(asset => asset.replace(/^\.\//, "")).filter(asset => asset && !existsSync(join(root, asset)));
for (const required of [
  "./index.html", "./casual.js", "./game-core.css", "./game-core.js",
  "./brisca.html", "./cinquillo.html", "./cinquillo.js", "./pocha.html", "./pocha.js",
  "./burro.html", "./charadas.html", "./pictionary.html"
]) if (!assets.includes(required)) report.bad.push(`service-worker:${required}`);
for (const removed of removedRuntime.map(file => `./${file}`)) if (assets.includes(removed)) report.bad.push(`service-worker:removed:${removed}`);

for (const file of jsFiles) {
  try {
    // Los scripts del runtime son clásicos (no módulos); compilar la función valida su sintaxis sin ejecutarla.
    new Function(readFileSync(join(root, file), "utf8"));
  } catch (error) {
    report.syntax.push(`${file}: ${error.message}`);
  }
}

console.log(JSON.stringify({
  html: report.html,
  games: report.games,
  refs: report.refs,
  swAssets: report.swAssets,
  missing: report.missing.length,
  swMissing: report.swMissing.length,
  duplicates: report.duplicates.length,
  syntax: report.syntax.length,
  bad: report.bad.length
}, null, 2));

if (report.html !== 32 || report.games !== 27 || report.missing.length || report.swMissing.length || report.duplicates.length || report.syntax.length || report.bad.length) {
  console.error(report);
  process.exit(1);
}
