<script>
  import { onMount } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { getInflationData } from '../inflation-service.js';
  import { getSalaryData } from '../salary-service.js';
  import { scrollReveal } from '../scrollReveal.js';

  let inflation = $state(null);
  let salary = $state(null);
  let loadError = $state(false);
  let isRetrying = $state(false);

  let realGrowth = $derived.by(() => {
    if (!inflation || !salary?.growthPct) return null;
    return salary.growthPct - inflation.currentRate;
  });

  let isPositive = $derived(realGrowth != null && realGrowth > 0.05);
  let isNegative = $derived(realGrowth != null && realGrowth < -0.05);

  const growthTween = tweened(0, { duration: 700, easing: cubicOut });
  $effect(() => {
    if (realGrowth != null) growthTween.set(realGrowth);
  });

  function formatPct(val) {
    if (val == null) return '—';
    return `${val > 0 ? '+' : ''}${val.toFixed(1).replace('.', ',')}%`;
  }

  async function load() {
    isRetrying = inflation !== null || loadError;
    loadError = false;
    try {
      [inflation, salary] = await Promise.all([getInflationData(), getSalaryData()]);
    } catch (err) {
      console.error(err);
      loadError = true;
    } finally {
      isRetrying = false;
    }
  }

  onMount(load);
</script>

<section class="indicator-section" id="sinteza">
  <div class="intro-section reveal-on-scroll" use:scrollReveal>
    <span class="eyebrow">Sinteză • Puterea reală de cumpărare</span>
    <h2 class="intro-title">Câștigi mai mult, sau doar mai mulți lei care valorează mai puțin?</h2>
    <p class="intro-lead">
      Cei patru indicatori de mai sus nu sunt independenți — leagă-i pe doi dintre ei (salariul și inflația) și
      obții răspunsul la întrebarea care contează cu adevărat: crește puterea ta reală de cumpărare, sau doar
      cifra de pe fluturașul de salariu?
    </p>
  </div>

  {#if realGrowth != null}
    <div class="reveal-on-scroll" use:scrollReveal={{ delay: 120 }} style="max-width: 700px; margin: 1.5rem auto 0;">
      <div class="calculator-card">
        <div class="rate-hero" aria-live="polite">
          <div class="rate-number-wrap">
            <span class="rate-large tabular">{formatPct($growthTween)}</span>
            <span class="rate-unit">creștere reală a puterii de cumpărare / an</span>
          </div>
          <div class="rate-delta-badge {isPositive ? 'down' : isNegative ? 'up' : 'neutral'}">
            <span>
              {isPositive ? 'Câștigi mai mult decât cresc prețurile' : isNegative ? 'Prețurile cresc mai repede decât salariul' : 'Aproximativ la egalitate cu inflația'}
            </span>
          </div>
        </div>
        <p class="lens-detail">
          Salariul mediu net a crescut nominal cu <strong>{formatPct(salary.growthPct)}</strong> față de
          {salary.yearAgo?.monthLabel ?? 'acum un an'}. În aceeași perioadă, prețurile (inflația) au crescut cu
          <strong>{formatPct(inflation.currentRate)}</strong>. Diferența dintre cele două — <strong>{formatPct(realGrowth)}</strong> —
          e creșterea reală a puterii tale de cumpărare, nu doar cifra mai mare de pe fluturașul de salariu.
        </p>
        <p class="calc-subtitle">
          Simplificare: comparăm două rate anuale (creșterea salarială și inflația) ca aproximare a câștigului
          real — economiștii folosesc formule ceva mai precise (deflatare compusă, nu scădere simplă), dar
          diferența e neglijabilă la ratele actuale.
        </p>
        <p class="calc-subtitle" style="margin-top: 0.75rem;">
          Cursul valutar și rata dobânzii, din secțiunile de mai sus, influențează ambele fețe ale acestei
          ecuații: cursul afectează costul produselor importate (deci și inflația), iar dobânda determină cât de
          avantajos e să economisești banii care-ți rămân.
        </p>
        {#if inflation.isFallback || salary.isFallback}
          <p class="lens-detail" style="margin: 0.5rem 0 0;">
            O parte din datele folosite mai sus sunt de rezervă (offline).
            <button type="button" class="retry-btn" onclick={load} disabled={isRetrying}>
              {isRetrying ? 'Se reîncearcă...' : '↻ Reîncearcă'}
            </button>
          </p>
        {/if}
      </div>
    </div>
  {:else if loadError}
    <p class="calc-subtitle" style="text-align:center;">
      Eroare la calculul sintezei (necesită date de inflație și salariu).
      <button type="button" class="retry-btn" onclick={load} disabled={isRetrying}>
        {isRetrying ? 'Se reîncearcă...' : '↻ Reîncearcă'}
      </button>
    </p>
  {:else}
    <div class="reveal-on-scroll" style="max-width: 700px; margin: 1.5rem auto 0;">
      <div class="calculator-card">
        <div class="skeleton skeleton-hero"></div>
        <div class="skeleton skeleton-badge"></div>
        <div class="skeleton skeleton-line" style="margin-top: 1rem;"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line short"></div>
      </div>
    </div>
  {/if}
</section>
