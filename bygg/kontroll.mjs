// Kontroll efter bygget. Hittas ett fel avslutas bygget med felkod, och då publiceras ingenting –
// den förra versionen av webbplatsen ligger kvar. Felen skrivs på svenska så att de går att förstå i GitHub.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'parse5';

const UT = '_site';
const fel = [];
const sidor = [];
(function hitta(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) hitta(p); else if (f.name.endsWith('.html')) sidor.push(p);
  }
})(UT);

const attr = (n, k) => (n.attrs || []).find((a) => a.name === k)?.value;
const klass = (n) => (attr(n, 'class') || '').split(/\s+/);
const text = (n) => (n.nodeName === '#text' ? n.value : (n.childNodes || []).map(text).join('')).replace(/\s+/g, ' ').trim();

const finnsSida = (url) => {
  const p = decodeURIComponent(url.split(/[?#]/)[0]);
  const fil = path.join(UT, p.endsWith('/') ? p + 'index.html' : p);
  return fs.existsSync(fil);
};
const idn = new Map(); // sida -> Set(id)

for (const fil of sidor) {
  const html = fs.readFileSync(fil, 'utf8');
  const sida = '/' + path.relative(UT, fil).replace(/index\.html$/, '');
  // Interna verktyg (tools/) är lösenordsskyddade: de kontrolleras bara för att innehållet är krypterat.
  if (sida.startsWith('/tools/')) {
    if (!/staticryptEncryptedMsgUniqueVariableName/.test(html) || /id="lexdata"|__LEXDATA__/.test(html)) {
      fel.push(`${sida}: sidan är inte krypterad med StatiCrypt och får inte publiceras. Bygg om med npm run build:prep.`);
    }
    continue;
  }
  const doc = parse(html);
  const ids = new Set();
  const lankar = [];
  // Rubriker per läge: normalt läge ser inte .simple-only, Enkelt läge ser inte .normal-only
  const lagen = { normalt: [], 'Enkelt läge': [] };
  (function gå(n, iSimple, iNormal) {
    if (n.nodeName === 'dialog' || n.nodeName === 'template') return;
    const c = klass(n);
    const s = iSimple || c.includes('simple-only'), no = iNormal || c.includes('normal-only');
    if (attr(n, 'id')) ids.add(attr(n, 'id'));
    if (/^h[1-6]$/.test(n.nodeName)) {
      const h = { niva: +n.nodeName[1], text: text(n) };
      if (!s) lagen.normalt.push(h);
      if (!no) lagen['Enkelt läge'].push(h);
      if (!h.text) fel.push(`${sida}: en tom rubrik (${n.nodeName}).`);
    }
    if (n.nodeName === 'img' && attr(n, 'alt') === undefined) fel.push(`${sida}: en bild saknar alt-text (${attr(n, 'src')}).`);
    if (n.nodeName === 'a' && attr(n, 'href')) lankar.push(attr(n, 'href'));
    (n.childNodes || []).forEach((k) => gå(k, s, no));
    if (n.content) gå(n.content, s, no);
  })(doc, false, false);
  idn.set(sida, ids);

  for (const [lage, hs] of Object.entries(lagen)) {
    if (sida.endsWith('404.html') && lage !== 'normalt') continue;
    const h1 = hs.filter((h) => h.niva === 1).length;
    if (h1 !== 1) fel.push(`${sida} (${lage}): sidan ska ha exakt en huvudrubrik (h1), men har ${h1}.`);
    let forra = 1;
    for (const h of hs.filter((x) => !['Tjänster', 'Linkaro', 'Kontakt'].includes(x.text) || x.niva !== 2)) {
      if (h.niva > forra + 1) fel.push(`${sida} (${lage}): rubriken "${h.text}" (h${h.niva}) hoppar över en nivå efter h${forra}.`);
      forra = h.niva;
    }
  }
  const synlig = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  for (const t of synlig.match(/\{(epost|sms|epostadress|orgnr|sate|svarstid)\}|%7B(epost|epostadress)%7D|undefined|\[object Object\]/g) || []) {
    fel.push(`${sida}: texten innehåller "${t}". Kontrollera stavningen av platshållaren.`);
  }
  for (const href of lankar) {
    if (href.startsWith('/') && !href.startsWith('//') && !finnsSida(href)) fel.push(`${sida}: länken ${href} går till en sida som inte finns.`);
    if (href.startsWith('/') && href.includes('#')) lankar.ankare = (lankar.ankare || []).concat([href]);
    if (href.startsWith('#') && href.length > 1 && !ids.has(href.slice(1))) fel.push(`${sida}: länken ${href} pekar på ett ankare som inte finns.`);
  }
  idn.set(sida + ':ankare', lankar.ankare || []);
}
// Ankare till andra sidor
for (const [nyckel, lista] of idn) {
  if (!nyckel.endsWith(':ankare')) continue;
  for (const href of lista) {
    const [p, a] = href.split('#');
    const mal = idn.get(p.endsWith('/') ? p : p);
    if (a && mal && !mal.has(a)) fel.push(`${nyckel.replace(':ankare', '')}: länken ${href} pekar på ett ankare som inte finns.`);
  }
}

if (fel.length) {
  console.error(`\nKontrollen hittade ${fel.length} fel. Webbplatsen publiceras inte förrän de är rättade:\n`);
  for (const f of fel) console.error(' – ' + f);
  process.exit(1);
}
console.log(`Kontroll OK: ${sidor.length} sidor, en h1 per läge, rubrikordning, alt-texter, platshållare och interna länkar.`);
