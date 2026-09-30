<script>
  import { scrollReveal } from '../scrollReveal.js';

  const SOURCES = [
    {
      title: 'Curs valutar (EUR / USD / GBP)',
      source: 'Banca Națională a României — flux public de curs valutar',
      detail: 'Ultimele 10 zile bancare, publicate zilnic la ora 13:00.',
      cadence: 'Zilnic (în zilele bancare)',
      url: 'https://www.bnr.ro/',
    },
    {
      title: 'Rata dobânzii de politică monetară',
      source: 'Banca Națională a României — seria ratelor de dobândă (din 2003)',
      detail: 'O intrare la fiecare decizie a Consiliului de Administrație, nu la fiecare zi calendaristică.',
      cadence: 'Doar la decizii CA (poate rămâne neschimbată ani la rând)',
      url: 'https://www.bnr.ro/',
    },
    {
      title: 'Inflația (IPC)',
      source: 'Institutul Național de Statistică — TEMPO Online, matricea IPC102E',
      detail: 'Categoria "TOTAL", variație anuală (față de aceeași lună din anul precedent).',
      cadence: 'Lunar, cu decalaj de câteva săptămâni față de luna raportată',
      url: 'https://insse.ro/',
    },
    {
      title: 'Salariul mediu net',
      source: 'Institutul Național de Statistică — TEMPO Online, matricea FOM106G',
      detail: 'Categoria "TOTAL ECONOMIE". Serie disponibilă doar din 2025 (clasificare CAEN Rev.3).',
      cadence: 'Lunar, cu decalaj de câteva săptămâni față de luna raportată',
      url: 'https://insse.ro/',
    },
    {
      title: 'Rata șomajului (BIM)',
      source: 'Institutul Național de Statistică — TEMPO Online, matricea AMG157H',
      detail: 'Grupele de vârstă "15-74 ani" (generală) și "15-24 ani" (tineri), serie ajustată sezonier.',
      cadence: 'Lunar (seria pentru tineri, cu eșantion mai mic, poate avea decalaj suplimentar)',
      url: 'https://insse.ro/',
    },
  ];
</script>

<section class="indicator-section" id="surse">
  <div class="intro-section reveal-on-scroll" use:scrollReveal>
    <span class="eyebrow">Surse • Metodologie</span>
    <h2 class="intro-title">De unde vin cifrele?</h2>
    <p class="intro-lead">
      Toate cele cinci serii sunt publice, oficiale, și preluate live de fiecare dată când deschizi pagina — nu
      sunt introduse manual. Când o sursă e temporar indisponibilă, aplicația trece automat pe cea mai recentă
      valoare oficială cunoscută și marchează explicit acest lucru ("date de rezervă / offline").
    </p>
  </div>

  <div class="sources-list reveal-on-scroll" use:scrollReveal={{ delay: 120 }}>
    {#each SOURCES as src}
      <div class="calculator-card source-item">
        <h3 class="calc-title" style="font-size: 1.05rem;">{src.title}</h3>
        <p class="calc-subtitle" style="margin-bottom: 0.75rem;">{src.source}</p>
        <p class="lens-detail" style="margin-bottom: 0.5rem;">{src.detail}</p>
        <div class="source-meta">
          <span class="source-cadence">{src.cadence}</span>
          <a href={src.url} target="_blank" rel="noopener noreferrer" class="source-link">Sursă oficială ↗</a>
        </div>
      </div>
    {/each}
  </div>
</section>
