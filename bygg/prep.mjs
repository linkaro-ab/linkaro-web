// Bygger tolkförberedelsen: hämtar lexikondata, fyller mallen och krypterar sidan med StatiCrypt.
//   STATICRYPT_PASSWORD='…' npm run build:prep
// Okrypterad fil:  tools-src/prep/build/prep.html  (gitignorerad, publiceras aldrig)
// Krypterad fil:   tools/prep.html                  (checkas in och publiceras)
// Lösenordet läses bara från miljövariabeln och skrivs aldrig till någon fil.
// Med --bara-om-andrad hoppas krypteringen över om innehållet är detsamma som förra gången
// (används av den månatliga körningen; StatiCrypt ger annars en ny fil varje gång).
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const KALLA = 'tools-src/prep';
const OKRYPTERAD = `${KALLA}/build/prep.html`;
const UT = 'tools/prep.html';
const SUMMA = `${KALLA}/innehall.sha256`; // kontrollsumma för det okrypterade innehållet (avslöjar inget)

const stopp = (msg) => { console.error(`\n${msg}\n`); process.exit(1); };

if (!process.env.STATICRYPT_PASSWORD) {
  stopp("Ange lösenordet i miljövariabeln STATICRYPT_PASSWORD, till exempel:\n  STATICRYPT_PASSWORD='ditt-lösenord' npm run build:prep");
}

// 1. Data: Python med wordfreq. Använder tools-src/prep/.venv om den finns, annars $PYTHON eller python3.
const venv = `${KALLA}/.venv/bin/python`;
const python = process.env.PYTHON || (fs.existsSync(venv) ? venv : 'python3');
// PYTHONHASHSEED=0 ger samma fil varje gång när lexikondatan är oförändrad (annars varierar ordningen).
execFileSync(python, [`${KALLA}/build_data.py`, '--out', OKRYPTERAD], { stdio: 'inherit', env: { ...process.env, PYTHONHASHSEED: '0' } });
const summa = createHash('sha256').update(fs.readFileSync(OKRYPTERAD)).digest('hex');
if (process.argv.includes('--bara-om-andrad') && fs.existsSync(UT) && fs.existsSync(SUMMA)
    && fs.readFileSync(SUMMA, 'utf8').trim() === summa) {
  console.log('Innehållet är oförändrat. tools/prep.html behålls.');
  process.exit(0);
}

// 2. Kryptera. Saltet ligger i .staticrypt.json (inte hemligt) så att "Kom ihåg mig" fungerar mellan byggen.
execFileSync('npx', ['--no-install', 'staticrypt', OKRYPTERAD,
  '-d', path.dirname(UT),
  '--short',
  '--remember', '30',
  '--template-title', 'Linkaro – Tolkförberedelse',
  '--template-instructions', 'Det här verktyget är under test. Ange lösenordet du har fått från Linkaro.',
  '--template-button', 'Öppna',
  '--template-placeholder', 'Lösenord',
  '--template-remember', 'Kom ihåg mig i 30 dagar',
  '--template-error', 'Fel lösenord',
  '--template-toggle-show', 'Visa lösenord',
  '--template-toggle-hide', 'Dölj lösenord',
  '--template-color-primary', '#0E4A58',
  '--template-color-secondary', '#F2F7F7',
], { stdio: 'inherit' });

// 3. Spärr: den publicerade filen måste vara krypterad.
const fel = kontrolleraKrypterad(fs.readFileSync(UT, 'utf8'));
if (fel) { fs.rmSync(UT); stopp(`${UT} är inte krypterad (${fel}). Filen är borttagen.`); }
fs.writeFileSync(SUMMA, summa + '\n');
console.log(`Klart: ${UT} är krypterad (${(fs.statSync(UT).size / 1e6).toFixed(2)} MB).`);

function kontrolleraKrypterad(html) {
  if (!/staticryptEncryptedMsgUniqueVariableName/.test(html)) return 'StatiCrypts krypterade innehåll saknas';
  if (/id="lexdata"|__LEXDATA__|Förbered ordförrådet/.test(html)) return 'okrypterat innehåll hittades';
  return null;
}
