// Eleventy bygger webbplatsen från mallarna i src/ och texterna i innehall/.
// Texter redigeras i Pages CMS (se .pages.yml) eller direkt i YAML-filerna.
import fs from 'node:fs';
import { load as loadYaml } from 'js-yaml';
import MarkdownIt from 'markdown-it';
import Image from '@11ty/eleventy-img';

const md = new MarkdownIt({ html: false, linkify: false, typographer: false, breaks: false });

// Kontaktuppgifter och annat som återkommer på många sidor.
function installningar() {
  const i = loadYaml(fs.readFileSync('innehall/installningar.yml', 'utf8'));
  const smsNummer = '+46' + String(i.sms).replace(/\D/g, '').replace(/^0/, '');
  return {
    ...i,
    smsNummer,
    smsLank: `<a href="sms:${smsNummer}">${md.utils.escapeHtml(i.sms)}</a>`,
    epostLank: `<a href="mailto:${md.utils.escapeHtml(i.epost)}">${md.utils.escapeHtml(i.epost)}</a>`,
  };
}

// {epost}, {sms}, {epostadress}, {orgnr}, {sate}, {svarstid} i texterna byts mot värdena i inställningarna.
function tokens(html, k) {
  const enc = (s) => encodeURIComponent(s).replace(/%40/g, '@');
  return html
    .replace(/\{epost\}/g, k.epostLank)
    .replace(/\{sms\}/g, k.smsLank)
    .replace(/(%7B|\{)epostadress(%7D|\})/g, (m, a) => (a === '{' ? md.utils.escapeHtml(k.epost) : enc(k.epost)))
    .replace(/\{orgnr\}/g, md.utils.escapeHtml(k.orgnr))
    .replace(/\{sate\}/g, md.utils.escapeHtml(k.sate))
    .replace(/\{svarstid\}/g, md.utils.escapeHtml(k.svarstid || ''));
}

const MANADER = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];

export default function (eleventyConfig) {
  const k = installningar();
  eleventyConfig.addGlobalData('k', k);
  eleventyConfig.addDataExtension('yml,yaml', (contents) => loadYaml(contents));
  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true, throwOnUndefined: true });

  // Text på en rad (rubriker, stycken, listpunkter): **fet**, *kursiv*, [länk](adress)
  eleventyConfig.addFilter('mdi', (s) => tokens(md.renderInline(String(s ?? '')), k));
  // Längre text med rubriker och listor. En h1 blir h2, eftersom sidan redan har en h1.
  eleventyConfig.addFilter('md', (s) =>
    tokens(md.render(String(s ?? '')), k).replace(/<(\/?)h1>/g, '<$1h2>'));
  // E-postmallar: ren text, bara kontaktuppgifterna byts ut
  eleventyConfig.addFilter('tok', (s) => {
    const esc = md.utils.escapeHtml(String(s ?? ''));
    return esc.replace(/\{epost\}|\{epostadress\}/g, md.utils.escapeHtml(k.epost)).replace(/\{sms\}/g, md.utils.escapeHtml(k.sms))
      .replace(/\{orgnr\}/g, md.utils.escapeHtml(k.orgnr));
  });
  eleventyConfig.addFilter('svdatum', (d) => {
    const t = d instanceof Date ? d : new Date(String(d) + 'T12:00:00Z');
    return `${t.getUTCDate()} ${MANADER[t.getUTCMonth()]} ${t.getUTCFullYear()}`;
  });
  eleventyConfig.addFilter('isodatum', (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d)));

  // Foto från innehall/bilder i flera storlekar (WebP + JPG). Bygget stoppas om alt-text saknas.
  eleventyConfig.addAsyncShortcode('bild', async (src, alt, klass, sizes, widths = [480, 960, 1440], forst = false) => {
    if (!alt || !String(alt).trim()) throw new Error(`Bilden ${src} saknar alternativtext. Skriv vad bilden visar.`);
    const fil = 'innehall/bilder/' + String(src).replace(/^\/?bilder\//, '');
    const meta = await Image(fil, { widths, formats: ['webp', 'jpeg'], outputDir: '_site/bilder/', urlPath: '/bilder/' });
    return Image.generateHTML(meta, {
      alt: String(alt).trim(), sizes, class: klass, decoding: 'async',
      ...(forst ? { fetchpriority: 'high' } : { loading: 'lazy' }),
    });
  });

  // Filer som kopieras oförändrade
  for (const p of ['assets', 'favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'site.webmanifest', 'CNAME', 'robots.txt', 'sitemap.xml', 'tools']) {
    eleventyConfig.addPassthroughCopy(p);
  }
  eleventyConfig.addPassthroughCopy({ 'innehall/bilder': 'bilder' });

  return {
    dir: { input: 'src', includes: '_includes', data: '../innehall', output: '_site' },
    templateFormats: ['njk'],
    htmlTemplateEngine: 'njk',
  };
}
