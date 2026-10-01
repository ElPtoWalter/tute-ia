import {readdirSync,readFileSync} from 'node:fs';
const files=readdirSync('.'), html=files.filter(f=>f.endsWith('.html'));
const links=Object.fromEntries(html.map(file=>[file,[...readFileSync(file,'utf8').matchAll(/href=["']([^"']+\.css)(?:\?[^"']*)?["']/g)].map(m=>m[1])]));
const css=files.filter(f=>f.endsWith('.css')).map(file=>({file,pages:html.filter(page=>links[page].includes(file)),bytes:Buffer.byteLength(readFileSync(file,'utf8'))}));
console.log(JSON.stringify({scope:'Inventario de enlaces HTML, no detector de selectores muertos',removed:['game-core.css: .pass-screen[hidden] redundante','salon-games.css: tres html[data-career-felt] sin consumidores'],isolated:{home:links['index.html'],roulette:links['ruleta-casino.html']},stylesheets:css,unlinked:css.filter(c=>!c.pages.length).map(c=>c.file)},null,2));
