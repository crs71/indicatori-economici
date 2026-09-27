# Mobil & testare

## Layout mobil (implementat în `src/style.css`)

**Indicatorul de curs** (singurul cu panou sticky):
- Sub 1100px: o singură coloană; panoul vizual (`order: -1`) fix deasupra narațiunii
- Panoul compact (antetul cu perechea/data ascuns, graficul pliat într-un `<details>`)
  ocupă cam 40% din ecran; are scroll intern dacă nu încape
- Pasul activ se alege dintr-o bandă aflată sub panou (acțiunea Svelte `src/scrollStep.js`,
  succesorul lui `scrolly.js` din versiunea vanilla), ca să nu se activeze un card ascuns în spatele lui
- Regulile de compactare de mai sus sunt scopate la `.sticky-display` în CSS — nu se aplică
  și celorlalte două secțiuni (dobândă, inflație), care nu au panou sticky și nu au nevoie de ele

**Indicatoarele de dobândă și inflație** (`.indicator-section`):
- Grid pe 2 coloane peste 900px (grafic + carduri de scenarii), o singură coloană sub
- Fără panou sticky — scroll normal, fără constrângere de înălțime

**General:**
- Butoane / input min 44px (touch)
- Sparkline mai scurt pe ecrane mici; ajustări suplimentare sub 480px
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
