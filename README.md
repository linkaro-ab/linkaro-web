# linkaro-web

Källkoden till **[linkaro.se](https://linkaro.se)**, webbplatsen för Linkaro AB. Linkaro erbjuder teckenspråkstolkning, dövblindtolkning och distanstolkning.

Webbplatsen är statisk HTML, CSS och lite JavaScript. Sidorna byggs med [Eleventy](https://www.11ty.dev/) av mallarna i `src/` och texterna i `innehall/`. Texterna kan redigeras utan kod i [Pages CMS](https://pagescms.org). GitHub Actions bygger och publicerar webbplatsen på GitHub Pages vid varje ändring.

> Innehåll, logotyp och design är skyddade av upphovsrätt (© Linkaro AB). Repot har därför ingen licensfil. Typsnitten har egna licenser (SIL Open Font License), se `assets/fonts/`.

## Struktur

```
innehall/installningar.yml   Kontaktuppgifter: e-post, sms, org.nr, säte
innehall/sidor/*.yml         Alla texter, en fil per sida (redigeras i Pages CMS)
innehall/bilder/             Foton (laddas upp i Pages CMS)
src/sidor/*.njk              Sidornas mallar: layout, ikoner, tillgänglighet
src/_includes/bas.njk        Gemensamt: <head>, sidhuvud, mobilmeny och sidfot
src/_includes/kort.njk       "Kort om sidan" i Enkelt läge
eleventy.config.js           Byggets inställningar och filter (Markdown, kontaktuppgifter, bilder)
bygg/kontroll.mjs            Kontroll efter bygget (stoppar publiceringen vid fel)
.pages.yml                   Pages CMS: vilka fält som går att redigera
.github/workflows/           Bygg och publicera med GitHub Actions
assets/css/site.css          All stil, inklusive Enkelt läge och rörelser
assets/js/site.js            Enkelt läge, mobilmeny, e-postmallar
assets/fonts/                Outfit och Atkinson Hyperlegible Next (lokalt, woff2)
assets/img/                  Logotyper, appikoner och delningsbild (og-image.png)
assets/video/                Välkomstfilm på teckenspråk och textning (.vtt)
favicon.ico, favicon.svg, apple-touch-icon.png, site.webmanifest, robots.txt, sitemap.xml, CNAME
```

Den byggda webbplatsen hamnar i `_site/`. Mappen finns inte i repot.

## Redigera texter (Pages CMS)

1. Gå till [app.pagescms.org](https://app.pagescms.org) och logga in.
2. Välj **linkaro-ab / linkaro-web** och grenen **main**.
3. Under **Sidor** finns en post per sida. Fälten är grupperade efter sidans avsnitt, i samma ordning som på sidan. Grupper som börjar med "Enkelt läge" är den lättlästa versionen.
4. Under **Kontaktuppgifter** ändras e-post och sms. Ändringen slår igenom på alla sidor.
5. Spara. Webbplatsen byggs och publiceras inom ett par minuter.

I textfälten går det att skriva:

| Skriv | Blir |
|---|---|
| `**ord**` | **fetstil** |
| `[text](/boka/)` | en länk |
| `{epost}` | e-postadressen som länk |
| `{sms}` | sms-numret som länk |
| `{orgnr}`, `{sate}` | organisationsnummer, säte |

Integritetspolicyn och tillgänglighetsredogörelsen har en textredigerare med rubriker och listor. Använd Rubrik 2 och Rubrik 3. Sidan har redan en huvudrubrik, så en Rubrik 1 görs automatiskt om till Rubrik 2.

**Foton.** Porträttet på startsidan och fotona på Om oss och Bli tolk laddas upp i Pages CMS. Bygget skapar själv rätt storlekar i WebP och JPG. Ett foto måste ha en bildtext för skärmläsare (alt-text), annars stoppas publiceringen. Lämnar du fotot tomt på Om oss eller Bli tolk visas en platshållare.

Det som inte går att ändra i Pages CMS är layout, färger, ikoner, menyer, sidfot och knappar. Det ändras i mallarna (se nedan).

### Om något går fel

Efter varje bygge körs `bygg/kontroll.mjs`. Kontrollen stoppar publiceringen om en sida får fler eller färre än en huvudrubrik (h1), om en rubriknivå hoppas över, om en bild saknar alt-text, om en platshållare som `{epost}` är felstavad eller om en intern länk är trasig. Den förra versionen ligger då kvar på linkaro.se. Felet står på svenska under fliken **Actions** på GitHub.

Varje ändring som görs i Pages CMS blir en commit i repot. En ändring går därför alltid att ångra. På GitHub: öppna commiten och välj **Revert**. Eller i terminalen:

```bash
git revert <commit>
```

## Förhandsvisa och bygga lokalt

Du behöver Node.js 20 eller senare. Kör i repots rotmapp:

```bash
npm install
```

```bash
npm start
```

Öppna sedan <http://localhost:8080>. Sidan laddas om av sig själv när du ändrar något. `npm run build` bygger webbplatsen till `_site/` och kör kontrollen.

Enkelt läge kan slås på eller av direkt i adressen, med `?enkelt=1` och `?enkelt=0`.

## Ändra layout och kod

1. Ändra i mallarna i `src/` eller i `assets/css/site.css` och `assets/js/site.js`.
2. Kontrollera ändringen lokalt, både i normalt läge och i Enkelt läge, och i smalt fönster.
3. Gör en commit och en push till `main`. GitHub Actions bygger, kontrollerar och publicerar.

Har du ändrat `site.css` eller `site.js`, räkna då upp versionen i länkarna i `src/_includes/bas.njk` (`site.css?v=9` → `?v=10`, likadant för `site.js`). Annars kan besökare få en gammal fil från webbläsarens cache.

Får en sida ett nytt textfält i `innehall/sidor/*.yml` måste fältet också läggas till i `.pages.yml`. Annars syns det inte i Pages CMS.

### Normalt läge och Enkelt läge

Varje sida innehåller båda lägena. Det läge som inte används får attributet `hidden` (`.simple-only`, `.kort` och texten "är på – stäng av" i normalt läge, och `.normal-only` i Enkelt läge). Därför får skärmläsare, punktskrift och textversioner aldrig innehållet två gånger, och varje sida har bara en `<h1>`. Växeln är en vanlig `<button>` med `aria-pressed`. Skriv aldrig samma text två gånger för dator och mobil. Låt i stället bara de ord som skiljer sig ha `.only-d` eller `.only-m`.

### Sidhuvud och sidfot

Sidhuvudet, mobilmenyn och sidfoten finns på ett ställe: `src/_includes/bas.njk`. Sidan du står på markeras i menyn med `aria-current="page"`.

### Platshållare

Text inom `[hakparentes]` är platshållare som ska bytas ut. De viktigaste:

| Platshållare | Var |
|---|---|
| Namn i välkomstfilmen, foton | Hem, Om oss, Bli tolk |
| Pris, plattformar | Boka, Tjänster |
| Bokningslänk för videosamtal (till exempel Microsoft Bookings) | Kontakt (`#video`) |

**Välkomstfilmen.** Lägg filen i `assets/video/` och följ instruktionen i kommentaren i `src/sidor/hem.njk`. Uppdatera sedan textningen i `valkommen.sv.vtt` och texten under "Läs filmens text". Filmen ska aldrig starta av sig själv. Håll filen under cirka 50 MB, eftersom GitHub tillåter högst 100 MB per fil.

### Kontakt utan formulär

Webbplatsen har inga formulär och samlar inte in några uppgifter. Boka, Kontakt och Bli tolk använder `mailto:`-länkar till e-postadressen i `innehall/installningar.yml`. Mallen som syns på sidan (`<pre>`) läggs automatiskt in i e-postmeddelandet. Den kan också kopieras med knappen "Kopiera mallen", för den som använder webbmejl. Mallarnas text redigeras i Pages CMS.

### Analys (Cloudflare Web Analytics)

Cloudflare Web Analytics är aktiverat sedan november 2026. Skriptet (`beacon.min.js`) ligger i `<head>` i `src/_includes/bas.njk` och sätter inga cookies. Statistiken finns i Cloudflare under **Analytics & Logs → Web Analytics**.

Vill du stänga av statistiken tar du bort raden med `beacon.min.js` och uppdaterar stycket "Besöksstatistik" i integritetspolicyn.

### Engelska (/en/)

Strukturen är förberedd för engelska sidor, men de finns inte än:

1. Skapa mallar och innehållsfiler för de engelska sidorna, med `lang="en"` och permalänkar under `/en/`.
2. Ta bort kommentaren runt `hreflang`-länkarna i `<head>` och runt språkväxlaren "English" i sidhuvudet (`bas.njk`).
3. Lägg till sidorna i `sitemap.xml`.

## Publicering

GitHub Actions (`.github/workflows/publicera.yml`) bygger och kontrollerar webbplatsen vid varje push. Från grenen `main` publiceras den också på GitHub Pages. Inställningen för GitHub Pages ska vara **Source: GitHub Actions**.

### Tillbaka till läget före Pages CMS

Taggen `fore-cms` markerar det sista läget med färdig HTML i repot och publicering direkt från grenen. För att gå tillbaka:

1. Återställ `main` till taggen, till exempel med `git revert` av ändringarna efter den.
2. Ställ om GitHub Pages till **Deploy from a branch** (`main`, mappen `/`).

## Tillgänglighet

Webbplatsen ska följa WCAG 2.2 nivå AA. Tänk på följande när du ändrar något:

- Varje sida har exakt en `<h1>`, och rubriknivåerna hoppar inte över något steg. Kontrollen i bygget säger till om det blir fel.
- Fokusringen är 2 px petrol, och ljus turkos `#7FD1C7` på mörk bakgrund.
- Korall `#FF7A59` används bara på "Boka tolk"-knappar och små prickar, alltid med petrolfärgad text.
- Turkos `#2BA89A` används aldrig som text på ljus bakgrund.
- Information får aldrig visas enbart med färg.
- Rörelser finns bara på dekor (`aria-hidden="true"`) och stängs av med `prefers-reduced-motion` och i Enkelt läge.
- Testa med tangentbordet (Tab, Enter, Esc) och med VoiceOver (Cmd+F5).

## Integritet

Webbplatsen sätter inga cookies. Det enda som hämtas från en annan webbplats är Cloudflares statistikskript. Enkelt läge sparas i besökarens webbläsare (`localStorage`, nyckeln `lk-enkelt`).

## Domän

`linkaro.se` är registrerad hos Loopia, och DNS-tjänsten ligger hos Cloudflare. Den egna domänen är inställd för GitHub Pages i repots inställningar. DNS och domänverifiering sköts utanför det här repot.
