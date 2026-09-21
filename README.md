# Traducător de Indicatori Economici (EUR/RON BNR)

Un instrument educațional de tip **scrollytelling** care preia cursul oficial de la Banca Națională a României (fluxul XML pe 10 zile) și traduce fluctuațiile într-un impact concret pentru viața de zi cu zi a unui student (abonamente digitale, cărți, chirii, simulator personalizat).

Proiect dezvoltat ca parte din portofoliul personal (student anul 1 la ASE București, CSIE – Cibernetică Economică).

---

## Cum rulezi proiectul local

1. **Instalează dependențele:**
   ```bash
   npm install
   ```

2. **Pornește serverul de dezvoltare Vite:**
   ```bash
   npm run dev
   ```
   Aplicația va porni la `http://localhost:3000`. Serverul Vite redirecționează automat cererile către `https://curs.bnr.ro/nbrfxrates10days.xml` prin proxy-ul intern din `vite.config.js` (eliminând orice eroare de CORS în dezvoltare).

3. **Compilare pentru producție:**
   ```bash
   npm run build
   ```

---

## Găzduire pe Cloudflare Pages

Proiectul este pregătit nativ pentru Cloudflare Pages:
- Fișierul [`functions/api/curs.js`](functions/api/curs.js) rulează automat ca **Cloudflare Pages Function** (serverless la edge).
- Oferă antetul `Access-Control-Allow-Origin: *` pentru browser.
- Aplică cache edge (`Cache-Control: public, max-age=3600`) pentru a proteja împotriva rate limiting-ului impus de serverele BNR.

La conectarea depozitului Git în Cloudflare Pages:
- **Build command:** `npm run build`
- **Build output directory:** `dist`

---

## Structura proiectului

- `index.html` — Structura narativă cu pași secvențiali și panou vizual fix (sticky).
- `src/bnr-service.js` — Preluare, parsare DOM a XML-ului BNR, calcul interval 10 zile și fallback offline.
- `src/translations.js` — Motorul de calcul al impactului (abonament 10€, achiziție 50€, buget 300€, simulator dinamic).
- `src/scrolly.js` — Controler de derulare bazat pe `IntersectionObserver`.
- `src/style.css` — Stil editorial calm, tipografie lizibilă, sparkline SVG și layout responsive.
- `src/main.js` — Coordonarea componentelor și a interacțiunilor utilizatorului.
- `functions/api/curs.js` — Funcție serverless pentru proxy și caching la deploy.
