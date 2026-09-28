<script>
  import { onMount } from 'svelte';
  import { getExchangeRateData } from './bnr-service.js';
  import { generateStudentTranslations } from './translations.js';
  import { scrollStep } from './scrollStep.js';
  import StickyPanel from './components/StickyPanel.svelte';
  import Calculator from './components/Calculator.svelte';
  import InterestSection from './components/InterestSection.svelte';
  import InflationSection from './components/InflationSection.svelte';
  import SalarySection from './components/SalarySection.svelte';
  import SynthesisSection from './components/SynthesisSection.svelte';

  let exchangeData = $state(null);
  let activeCurrency = $state('EUR');
  let currentStepId = $state('step-intro');
  let statusText = $state('Conectare flux oficial BNR...');
  let scrollPct = $state(0);

  let currData = $derived(exchangeData?.currencies?.[activeCurrency] ?? null);
  let translationsData = $derived.by(() => {
    if (!exchangeData || !currData) return null;
    return generateStudentTranslations(activeCurrency, currData, exchangeData);
  });

  onMount(async () => {
    const onScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollPct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    try {
      exchangeData = await getExchangeRateData();
      statusText = exchangeData.isFallback
        ? `Date de rezervă din ${exchangeData.currentDateFormatted} (offline)`
        : `Flux BNR conectat • ${exchangeData.currentDateFormatted}`;
    } catch (err) {
      console.error(err);
      statusText = 'Eroare la încărcarea datelor';
    }

    return () => window.removeEventListener('scroll', onScroll);
  });
</script>

<div class="scroll-progress-bar" style="width: {scrollPct}%"></div>

<header class="site-header">
  <div class="header-inner">
    <div class="logo-badge">
      <span class="logo-dot"></span>
      <span>Traducător de Indicatori</span>
    </div>
    <div class="header-status">
      <span class="status-indicator"></span>
      <span>{statusText}</span>
    </div>
  </div>
</header>

<main>
  <section class="intro-section">
    <span class="eyebrow">Cibernetică Economică • Portofoliu Personal</span>
    <h1 class="intro-title">Ce înseamnă cursul valutar când ești student?</h1>
    <p class="intro-lead">
      În loc de un grafic rece din buletinele de știri, am tradus cotația oficială a Băncii Naționale a României pe
      ultimele 10 zile bancare în consecințe reale: de la abonamentul de streaming până la plata chiriei sau comanda
      unui manual.
    </p>
    <div class="scroll-hint">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
      </svg>
      <span>Derulează pentru a desface povestea cifrelor</span>
    </div>
  </section>

  <section class="scrolly-container">
    <div class="scrolly-story">
      <article class="step {currentStepId === 'step-intro' ? 'is-active' : ''}" data-step="step-intro" use:scrollStep={{ stepId: 'step-intro', onActive: (id) => (currentStepId = id) }}>
        <div class="step-card">
          <span class="step-tag">Pasul 01 • Cifra Oficială</span>
          <h2 class="step-title">O cifră cu 4 zecimale</h2>
          <p class="step-body">
            Aceasta este cotația de referință publicată de BNR la ora 13:00. În statistici arată ca o simplă
            constantă matematică. Dar în economie, fiecare zecimală reprezintă un punct de ancoră pentru toate
            prețurile importate sau cotate în euro.
          </p>
          <div class="step-insight">
            <strong>De reținut:</strong> Cursul BNR nu este un curs comercial de la ghișeu, ci media ponderată a
            tranzacțiilor din piața valutară interbancară.
          </div>
        </div>
      </article>

      <article class="step {currentStepId === 'step-variation' ? 'is-active' : ''}" data-step="step-variation" use:scrollStep={{ stepId: 'step-variation', onActive: (id) => (currentStepId = id) }}>
        <div class="step-card">
          <span class="step-tag">Pasul 02 • Dinamica pe 10 Zile</span>
          {#if translationsData}
            <h2 class="step-title">
              {translationsData.meta.isNeutral
                ? `Stagnare pe 10 zile (${activeCurrency})`
                : `O ${translationsData.meta.directionText} de ${translationsData.meta.percentFormatted} în 10 zile`}
            </h2>
            <p class="step-body">
              De la <strong>{currData.startRate.toFixed(4)} lei</strong> la <strong>{currData.currentRate.toFixed(4)} lei</strong>
              ({translationsData.meta.deltaFormatted}).
            </p>
          {:else}
            <h2 class="step-title">O creștere de +0,26% în 10 zile</h2>
            <p class="step-body">La începutul intervalului, un euro era cotat diferit față de azi.</p>
          {/if}
          <div class="step-insight">
            <strong>Ce înseamnă în economie:</strong> Variație pe 10 ședințe bancare BNR pentru {activeCurrency}.
          </div>
        </div>
      </article>

      {#if translationsData}
        {#each translationsData.scenarios as scen, idx}
          {@const stepIds = ['step-sub', 'step-books', 'step-rent']}
          {@const stepId = stepIds[idx]}
          <article class="step {currentStepId === stepId ? 'is-active' : ''}" data-step={stepId} use:scrollStep={{ stepId, onActive: (id) => (currentStepId = id) }}>
            <div class="step-card">
              <span class="step-tag">Pasul 0{idx + 3} • Traducere</span>
              <h2 class="step-title">{scen.title} ({scen.amountFormatted})</h2>
              <p class="step-body">Cost start <strong>{scen.costStart}</strong> → azi <strong>{scen.costNow}</strong>.</p>
              <div class="step-insight"><strong>Impact:</strong> {scen.diffFormatted}. {scen.takeaway}</div>
            </div>
          </article>
        {/each}
      {:else}
        <article class="step" data-step="step-sub" use:scrollStep={{ stepId: 'step-sub', onActive: (id) => (currentStepId = id) }}>
          <div class="step-card">
            <span class="step-tag">Pasul 03 • Traducere: Cheltuieli Mici</span>
            <h2 class="step-title">Abonamentul tău digital (10 €)</h2>
          </div>
        </article>
        <article class="step" data-step="step-books" use:scrollStep={{ stepId: 'step-books', onActive: (id) => (currentStepId = id) }}>
          <div class="step-card"><span class="step-tag">Pasul 04</span></div>
        </article>
        <article class="step" data-step="step-rent" use:scrollStep={{ stepId: 'step-rent', onActive: (id) => (currentStepId = id) }}>
          <div class="step-card"><span class="step-tag">Pasul 05</span></div>
        </article>
      {/if}

      <article class="step {currentStepId === 'step-threshold' ? 'is-active' : ''}" data-step="step-threshold" use:scrollStep={{ stepId: 'step-threshold', onActive: (id) => (currentStepId = id) }}>
        <div class="step-card">
          <span class="step-tag">Pasul 06 • Pragul de relevanță</span>
          <h2 class="step-title">Când merită să urmărești cursul?</h2>
          <p class="step-body">
            O regulă practică pentru student: sub ~50 € pe lună, variațiile pe 10 zile sunt zgomot. Peste ~200–300 €
            (chirie, taxe, mobilitate), merită să verifici cursul înainte de un transfer mare.
          </p>
          <div class="step-insight">
            <strong>Prag orientativ:</strong> dacă diferența pe 10 zile depășește costul unei mese la cantină, e
            semnal util — altfel, ignoră micro-mișcările.
          </div>
        </div>
      </article>

      <article class="step {currentStepId === 'step-compare' ? 'is-active' : ''}" data-step="step-compare" use:scrollStep={{ stepId: 'step-compare', onActive: (id) => (currentStepId = id) }}>
        <div class="step-card">
          <span class="step-tag">Pasul 07 • EUR vs USD vs GBP</span>
          <h2 class="step-title">Aceeași sumă, trei valute</h2>
          <p class="step-body">
            Comută EUR / USD / GBP din panoul din dreapta. Scenariile (abonament, unelte, certificări) se rescriu
            automat — vezi care valută te lovește mai tare pe 10 zile.
          </p>
          <div class="step-insight">
            <strong>Exercițiu:</strong> alege 100 unități în fiecare valută și compară diferența în lei. Nu toate
            valutele se mișcă la fel în același interval.
          </div>
        </div>
      </article>
    </div>

    <div class="scrolly-visual-wrapper">
      <StickyPanel {exchangeData} {activeCurrency} {currentStepId} {translationsData} {currData}
        onCurrencyChange={(c) => (activeCurrency = c)} />
    </div>
  </section>

  <Calculator {activeCurrency} {currData} />

  <InterestSection eurHistory={exchangeData?.currencies?.EUR?.history} />

  <InflationSection />

  <SalarySection />

  <SynthesisSection />

  <section class="context-section">
    <div class="context-box">
      <h3 class="context-title">De ce am creat acest instrument?</h3>
      <p class="context-text">
        Urmează să încep anul 1 la ASE (Cibernetică Economică). Acest instrument traduce indicatorii din buletine în
        impact pe bugetul de student.
      </p>
      <p class="context-text">
        O variație de 0,1%–0,5% pare mică în știri; în lei, la chirii și burse, devine vizibilă.
      </p>
    </div>
  </section>
</main>

<footer class="site-footer">
  <p>Traducător de Indicatori Economici • Proiect de portofoliu</p>
  <p class="footer-credits">
    Student CSIE – Cibernetică Economică • ASE București<br />
    Date: flux public BNR (curs.bnr.ro).
  </p>
  <p class="footer-copyright">© 2026 Cristian Costea. Toate drepturile rezervate.</p>
</footer>
