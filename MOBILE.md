# Mobil & testare

## Layout mobil (implementat în `src/style.css`)

- Sub 900px: o singură coloană; panoul vizual (`order: -1`) deasupra narațiunii
- Panou sticky limitat la ~48vh, scroll intern dacă e nevoie
- Butoane / input min 44px (touch)
- Sparkline mai scurt pe ecrane mici
- `prefers-reduced-motion` respectat

## Cum testezi schimbările din GitHub

### Varianta cea mai ușoară (recomandată)
1. Conectează repo-ul la **Cloudflare Pages** (dash.cloudflare.com → Workers & Pages → Create → Connect Git)
2. Build command: `npm run build`
3. Output directory: `dist`
4. La fiecare `git push` pe `main`, site-ul se rebuild-uiește automat
5. Deschizi URL-ul `*.pages.dev` pe telefon

### Local (rapid, offline)
```bash
git clone https://github.com/crs71/indicatori-economici.git
cd indicatori-economici
npm install
npm run dev
```
Apoi pe telefon (aceeași rețea Wi‑Fi): `http://IP-ul-PC-ului:3000`

### Doar după ce am push-uit pe GitHub
```bash
cd indicatori-economici
git pull
npm run dev
```

## Fișiere încă de completat pe GitHub
Dacă lipsește `index.html` / `src/main.js` / `src/style.css`, copiază-le din arhiva locală `indicatori-economici.zip` peste clone, apoi:
```bash
git add -A && git commit -m "Add remaining app sources" && git push
```
