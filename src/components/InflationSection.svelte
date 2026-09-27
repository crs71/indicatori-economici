<script>
  import { onMount } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { getInflationData } from '../inflation-service.js';
  import {
    INFLATION_SCENARIOS,
    generateInflationTranslations,
    calculateInflationImpact,
  } from '../inflation-translations.js';
  import Sparkline from './Sparkline.svelte';
  import { scrollReveal } from '../scrollReveal.js';

  let data = $state(null);
  let loadError = $state(false);
  let amounts = $state(Object.fromEntries(INFLATION_SCENARIOS.map((s) => [s.id, s.defaultAmount])));

  let translations = $derived.by(() => (data ? generateInflationTranslations(data) : null));

  let chartHistory = $derived.by(() => {
    if (!data?.history?.length) return [];
    return data.history.map((h) => ({ date: h.yearMonth, rate: h.value - 100, labelRo: h.monthLabel }));
  });

  let rangeText = $derived.by(() => {
    if (!data?.history?.length) return '—';
    const rates = data.history.map((h) => h.value - 100);
    return `min ${Math.min(...rates).toFixed(2)}% • max ${Math.max(...rates).toFixed(2)}%`;
  });

  let scenarios = $derived.by(() => {
    if (!data) return [];
    return INFLATION_SCENARIOS.map((scen) => ({
      ...scen,
      amount: amounts[scen.id],
      ...calculateInflationImpact(amounts[scen.id], data.currentRate),
    }));
  });

  function setAmount(id, value) {
    amounts = { ...amounts, [id]: Math.max(0, value) };
  }

  const rateTween = tweened(0, { duration: 700, easing: cubicOut });
  $effect(() => {
    if (data) rateTween.set(data.currentRate);
  });

  onMount(async () => {
    try {
      data = await getInflationData();
    } catch (err) {
      console.error(err);
      loadError = true;
    }
  });
</script>

<section class="indicator-section">
  <div class="intro-section reveal-on-scroll" use:scrollReveal>
    <span class="eyebrow">Al treilea indicator • Inflație</span>
    <h2 class="intro-title">Cât mai scump e coșul tău față de acum un an?</h2>
    <p class="intro-lead">
      Indicele prețurilor de consum (IPC), publicat lunar de Institutul Național de Statistică, compară direct
      costul aceluiași "coș" de cumpărături față de aceeași lună din anul precedent. Nu e o simplificare — e chiar
      definiția inflației.
    </p>
  </div>

  {#if data && translations}
    <div class="indicator-grid reveal-on-scroll" use:scrollReveal={{ delay: 120 }}>
      <div class="calculator-card">
        <div class="rate-hero">
          <div class="rate-number-wrap">
            <span class="rate-large tabular">{$rateTween > 0 ? '+' : ''}{$rateTween.toFixed(2)}</span>
            <span class="rate-unit">% față de acum un an</span>
          </div>
          <div class="rate-delta-badge {translations.meta.isAccelerating ? 'up' : translations.meta.isDecelerating ? 'down' : 'neutral'}">
            <span>Inflația {translations.meta.trendText} — luna trecută era {translations.meta.previousRate > 0 ? '+' : ''}{translations.meta.previousRate.toFixed(2)}%</span>
          </div>
        </div>
        <p class="lens-detail">
          Date pentru <strong>{translations.meta.currentLabel}</strong>, comparativ cu aceeași lună din anul
          precedent. {data.isFallback ? 'Date de rezervă (offline).' : 'Date live de la INS.'}
        </p>
        <div class="chart-header">
          <span>Inflație anuală, ultimele 12 luni (%)</span>
          <span class="tabular">{rangeText}</span>
        </div>
        <Sparkline history={chartHistory} redrawKey={data.current.yearMonth} />
        <div class="chart-dates-footer">
          <span>{data.history[0]?.monthLabel}</span>
          <span>{data.current.monthLabel}</span>
        </div>
        <p class="calc-subtitle" style="margin-top: 0.75rem;">
          Fiecare punct e rata anuală a inflației publicată pentru acea lună — nu inflația lunară, ci variația
          față de aceeași lună din anul anterior.
        </p>
      </div>

      <div class="scenario-list">
        {#each scenarios as scen}
          <div class="calculator-card">
            <h3 class="calc-title" style="font-size: 1.1rem; display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <span>{scen.title}</span>
              <span class="calc-input-wrapper">
                <input
                  type="number"
                  class="calc-input tabular"
                  style="width: 140px; font-size: 1rem;"
                  min="0"
                  max="1000000"
                  step="50"
                  value={scen.amount}
                  oninput={(e) => setAmount(scen.id, parseFloat(e.target.value) || 0)}
                />
                <span class="calc-currency-symbol">lei</span>
              </span>
            </h3>
            <p class="calc-subtitle">
              Ce costa {scen.lastYearFormatted} acum un an, costă azi, la aceeași inflație de
              {translations.meta.currentRate.toFixed(2)}%.
            </p>
            {#key scen.amount}
              <div class="calc-results-grid">
                <div class="result-item">
                  <span class="result-label">Acum un an</span>
                  <span class="result-val tabular">{scen.lastYearFormatted}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">Astăzi</span>
                  <span class="result-val tabular">{scen.nowFormatted}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">Diferență</span>
                  <span class="result-val tabular diff-highlight">{scen.extraFormatted}</span>
                </div>
              </div>
            {/key}
          </div>
        {/each}
      </div>
    </div>
  {:else if loadError}
    <p class="calc-subtitle" style="text-align:center;">Eroare la încărcarea datelor de inflație (INS).</p>
  {:else}
    <p class="calc-subtitle" style="text-align:center;">Se încarcă datele de inflație (INS)...</p>
  {/if}
</section>
