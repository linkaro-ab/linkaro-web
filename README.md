# linkaro-web

Källkoden till **[linkaro.se](https://linkaro.se)**, webbplatsen för Linkaro AB. Linkaro erbjuder teckenspråkstolkning, dövblindtolkning och distanstolkning.

Det är en ren statisk webbplats i HTML, CSS och lite JavaScript. Den har inget byggsteg och inga beroenden, och den publiceras med GitHub Pages.

> Innehåll, logotyp och design är skyddade av upphovsrätt (© Linkaro AB). Repot har därför ingen licensfil. Typsnitten har egna licenser (SIL Open Font License), se `assets/fonts/`.

## Struktur

```
index.html                 Startsidan
tjanster/index.html        Tjänster och vanliga frågor
boka/index.html            Boka tolk (e-postmall, inget formulär)
om-oss/index.html          Om oss, kvalitet och bolagsuppgifter
bli-tolk/index.html        För tolkar som vill frilansa
kontakt/index.html         Kontakt
integritetspolicy/         Integritetspolicy (utkast)
tillganglighet/            Tillgänglighetsredogörelse (utkast)
404.html                   Visas av GitHub Pages när en sida saknas
assets/css/site.css        All stil, inklusive Enkelt läge
assets/js/site.js          Enkelt läge, mobilmeny, e-postmallar
assets/fonts/              Outfit och Atkinson Hyperlegible Next (lokalt, woff2)
assets/img/                Logotyper, appikoner och delningsbild (og-image.png)
assets/video/              Välkomstfilm på teckenspråk och textning (.vtt)
favicon.ico, favicon.svg, apple-touch-icon.png, site.webmanifest
CNAME                      linkaro.se (krävs för egen domän på GitHub Pages)
.nojekyll                  Stänger av Jekyll på GitHub Pages
robots.txt, sitemap.xml
```

## Förhandsvisa lokalt

Du behöver bara Python 3, som redan finns på macOS. Kör i repots rotmapp:

```bash
python3 -m http.server 8080
```

Öppna sedan <http://localhost:8080>. Använd en webbserver och öppna inte filerna direkt, eftersom länkarna börjar med `/`.

Enkelt läge kan slås på eller av direkt i adressen, med `?enkelt=1` och `?enkelt=0`.

## Uppdatera webbplatsen

1. Ändra i HTML-filerna (texter) eller i `assets/css/site.css` (utseende).
2. Kontrollera ändringen lokalt enligt ovan, både i normalt läge och i Enkelt läge, och i smalt fönster.
3. Gör en commit och en push till `main`. GitHub Pages publicerar ändringen inom någon minut.

Har du ändrat `site.css` eller `site.js`, räkna då upp versionen i länkarna (`site.css?v=6` → `?v=7`, likadant för `site.js`) i alla HTML-filer. Annars kan besökare få en gammal fil från webbläsarens cache.

### Normalt läge och Enkelt läge

Varje sida innehåller båda lägena. Det läge som inte används får attributet `hidden` (`.simple-only`, `.kort` och texten "är på – stäng av" i normalt läge, och `.normal-only` i Enkelt läge). Därför får skärmläsare, punktskrift och textversioner aldrig innehållet två gånger, och varje sida har bara en `<h1>`. Växeln är en vanlig `<button>` med `aria-pressed`. Skriv aldrig samma text två gånger för dator och mobil. Låt i stället bara de ord som skiljer sig ha `.only-d` eller `.only-m`.

### Sidhuvud och sidfot

Sidhuvudet och sidfoten finns kopierade i varje HTML-fil, mellan kommentarerna `SIDHUVUD` och `SIDHUVUD SLUT` och mellan `SIDFOT` och `SIDFOT SLUT`. Ändrar du till exempel en menypunkt, en e-postadress eller sms-numret måste ändringen göras i **alla** filer. Det går enklast med sök och ersätt i hela mappen. Sidan du står på markeras i menyn med `aria-current="page"`.

### Platshållare

Text inom `[hakparentes]` är platshållare som ska bytas ut. Sök efter `[` för att hitta dem. De viktigaste:

| Platshållare | Var |
|---|---|
| Merit, namn i välkomstfilmen och foton | Hem, Om oss, Bli tolk |
| Avbokningsvillkor, pris, framförhållning | Boka, Tjänster |
| Bokningslänk för videosamtal (till exempel Microsoft Bookings) | Kontakt (`#video`) |

**Foton.** Byt `<figure class="ph">…</figure>` mot `<img src="/assets/img/…" alt="…" width="…" height="…">`. Skriv en alt-text som beskriver bilden, eller `alt=""` om bilden bara är dekor.

**Välkomstfilmen.** Lägg filen i `assets/video/` och följ instruktionen i kommentaren på startsidan. Uppdatera sedan textningen i `valkommen.sv.vtt` och texten under "Läs filmens text". Filmen ska aldrig starta av sig själv. Håll filen under cirka 50 MB, eftersom GitHub tillåter högst 100 MB per fil.

### Kontakt utan formulär

Webbplatsen har inga formulär och samlar inte in några uppgifter. Boka, Kontakt och Bli tolk använder `mailto:`-länkar till `info@linkaro.se`. Mallen som syns på sidan (`<pre>`) läggs automatiskt in i e-postmeddelandet. Den kan också kopieras med knappen "Kopiera mallen", för den som använder webbmejl. Vill du ändra mallen räcker det att ändra texten i `<pre>`.

Webbplatsen använder bara en e-postadress, `info@linkaro.se`. Alla e-postlänkar är aktiva sedan 18 november 2026.

### Analys (Cloudflare Web Analytics)

Cloudflare Web Analytics är aktiverat sedan november 2026. Skriptet (`beacon.min.js`) ligger i `<head>` på varje sida och sätter inga cookies. Statistiken finns i Cloudflare under **Analytics & Logs → Web Analytics**.

Vill du stänga av statistiken tar du bort raden med `beacon.min.js` i alla HTML-filer och uppdaterar stycket "Besöksstatistik" i integritetspolicyn.

### Engelska (/en/)

Strukturen är förberedd för engelska sidor, men de finns inte än:

1. Skapa `en/index.html`, `en/tjanster/index.html` och så vidare, med `lang="en"` på `<html>`.
2. Ta bort kommentaren runt `hreflang`-länkarna i `<head>` och runt språkväxlaren "English" i sidhuvudet.
3. Lägg till sidorna i `sitemap.xml`.

## Tillgänglighet

Webbplatsen ska följa WCAG 2.2 nivå AA. Tänk på följande när du ändrar något:

- Varje sida har exakt en `<h1>`, och rubriknivåerna hoppar inte över något steg.
- Fokusringen är 2 px petrol, och ljus turkos `#7FD1C7` på mörk bakgrund.
- Korall `#FF7A59` används bara på "Boka tolk"-knappar och små prickar, alltid med petrolfärgad text.
- Turkos `#2BA89A` används aldrig som text på ljus bakgrund.
- Information får aldrig visas enbart med färg.
- Rörelser finns bara på dekor (`aria-hidden="true"`) och stängs av med `prefers-reduced-motion` och i Enkelt läge.
- Testa med tangentbordet (Tab, Enter, Esc) och med VoiceOver (Cmd+F5).

## Integritet

Webbplatsen sätter inga cookies. Det enda som hämtas från en annan webbplats är Cloudflares statistikskript. Enkelt läge sparas i besökarens webbläsare (`localStorage`, nyckeln `lk-enkelt`).

## Domän

`linkaro.se` är registrerad hos Loopia, och DNS-tjänsten ligger hos Cloudflare. Filen `CNAME` talar om för GitHub Pages vilken domän som gäller. DNS och domänverifiering sköts utanför det här repot.
