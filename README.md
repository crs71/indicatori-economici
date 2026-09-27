# Traducător de Indicatori Economici

Un instrument educațional de tip **scrollytelling** care preia date oficiale publice (BNR, INS) și traduce
variațiile lor în consecințe concrete pentru viața de zi cu zi a unui student — nu doar un grafic, ci ce
înseamnă cifra pentru bugetul tău.

Patru indicatori, fiecare cu propriul panou vizual, grafic și traduceri editabile:
1. **Cursul valutar** (EUR/USD/GBP, flux BNR pe 10 zile) — abonamente, cărți, chirie, calculator personalizat.
2. **Rata dobânzii de politică monetară** (BNR) — zile de stabilitate de la ultima decizie CA, dobândă
   acumulată ilustrativă pe un depozit/credit editabil.
3. **Inflația anuală** (IPC, INS) — cât costă azi, față de acum un an, un buget editabil.
4. **Salariul mediu net** (INS) — cât efort (în ore de muncă) cere o cheltuială, azi față de acum un an.

Proiect dezvoltat ca parte din portofoliul personal (student anul 1 la ASE București, CSIE – Cibernetică Economică).

---

## Stack

Svelte 5 (runes: `$state`/`$derived`/`$effect`) + Vite, fără SvelteKit — o singură pagină, nu are nevoie de
routing sau SSR. Vezi `src/App.svelte` pentru orchestrare și `src/components/` pentru cele patru secțiuni.

## Cum rulezi proiectul local

1. **Instalează dependențele:**
   ```bash
   npm install
   ```

2. **Pornește serverul de dezvoltare Vite:**
   ```bash
   npm run dev
   ```
   Aplicația pornește la `http://localhost:3000`. `vite.config.js` redirecționează local toate cererile către
   sursele reale (BNR, INS) prin proxy-uri interne — inclusiv un middleware dedicat pentru `/api/ins-pivot`,
   fiindcă INS cere POST acolo unde noi expunem GET — eliminând orice eroare de CORS/mixed-content în dezvoltare.

3. **Compilare pentru producție:**
   ```bash
   npm run build
   ```

---

## Găzduire pe Cloudflare Pages

Proiectul e pregătit nativ pentru Cloudflare Pages:
- `functions/api/curs.js`, `functions/api/dobanda.js` — proxy dedicat per sursă BNR.
- `functions/api/ins-meta.js`, `functions/api/ins-pivot.js` — proxy generic pentru INS TEMPO Online, parametrizat
  cu `matCode` (folosit atât de inflație, cât și de salariul mediu — vezi `src/ins-tempo-client.js`).
- Toate rulează ca **Cloudflare Pages Functions** (serverless la edge), oferă `Access-Control-Allow-Origin: *`
  și cache edge (1-6h, în funcție de cât de des se schimbă sursa).
- Necesare fiindcă niciuna dintre sursele publice (BNR, INS) nu trimite CORS, iar INS (`statistici.insse.ro`)
  nici măcar nu are HTTPS.

La conectarea depozitului Git în Cloudflare Pages:
- **Build command:** `npm run build`
- **Build output directory:** `dist`

---

## Structura proiectului

- `src/App.svelte` — orchestrare: header, intro, cele patru secțiuni, calculator, footer.
- `src/components/StickyPanel.svelte`, `Sparkline.svelte`, `Calculator.svelte` — indicatorul de curs.
- `src/components/InterestSection.svelte`, `InterestStaircase.svelte` — indicatorul de dobândă.
- `src/components/InflationSection.svelte`, `src/components/SalarySection.svelte` — inflația și salariul mediu
  (ambele reutilizează `Sparkline.svelte` și `src/ins-tempo-client.js`).
- `src/bnr-service.js`, `src/interest-service.js`, `src/inflation-service.js`, `src/salary-service.js` —
  preluare + calcul date, câte un modul per indicator, fără dependențe de framework.
- `src/ins-tempo-client.js` — client generic pentru INS TEMPO Online (fetch metadate + interogare + parsare
  CSV), folosit de inflație și salariu.
- `src/translations.js`, `src/interest-translations.js`, `src/inflation-translations.js`,
  `src/salary-translations.js` — calculul impactului pentru fiecare indicator.
- `src/scrollStep.js` — acțiune Svelte (înlocuiește un `IntersectionObserver` scris manual) pentru pașii de
  scroll ai indicatorului de curs.
- `src/style.css` — stil editorial calm, tipografie lizibilă, grafice SVG, layout responsive.
- `functions/api/*.js` — proxy-uri Cloudflare Pages Functions pentru sursele publice.
