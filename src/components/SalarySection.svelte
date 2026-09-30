<script>
  import { onMount } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { getSalaryData } from '../salary-service.js';
  import {
    SALARY_SCENARIOS,
    generateSalaryTranslations,
    calculateSalaryImpact,
  } from '../salary-translations.js';
  import { formatRon } from '../translations.js';
  import Sparkline from './Sparkline.svelte';
  import IndicatorSkeleton from './IndicatorSkeleton.svelte';
  import { scrollReveal } from '../scrollReveal.js';

  let data = $state(null);
  let loadError = $state(false);
  let isRetrying = $state(false);
  let amounts = $state(Object.fromEntries(SALARY_SCENARIOS.map((s) => [s.id, s.defaultAmount])));

  let translations = $derived.by(() => (data ? generateSalaryTranslations(data) : null));

  let chartHistory = $derived.by(() => {
    if (!data?.history?.length) return [];
    return data.history.map((h) => ({ date: h.yearMonth, rate: h.value, labelRo: h.monthLabel }));
  });

  let rangeText = $derived.by(() => {
    if (!data?.history?.length) return '—';
    const values = data.history.map((h) => h.value);
    return `min ${Math.min(...values).toLocaleString('ro-RO')} lei • max ${Math.max(...values).toLocaleString('ro-RO')} lei`;
  });

  let scenarios = $derived.by(() => {
    if (!data) return [];
    return SALARY_SCENARIOS.map((scen) => ({
      ...scen,
      amount: amounts[scen.id],
      ...calculateSalaryImpact(amounts[scen.id], data.hourlyRate, data.hourlyRateYearAgo),
    }));
  });

  function setAmount(id, value) {
    amounts = { ...amounts, [id]: Math.max(0, value) };
  }

  const salaryTween = tweened(0, { duration: 700, easing: cubicOut });
  $effect(() => {
    if (data) salaryTween.set(data.current.value);
  });

  async function load() {
    isRetrying = data !== null || loadError;
    loadError = false;
    try {
      data = await getSalaryData();
    } catch (err) {
      console.error(err);
      loadError = true;
    } finally {
      isRetrying = false;
    }
  }

  onMount(load);
</script>

<section class="indicator-section" id="salariu">
  <div class="intro-section reveal-on-scroll" use:scrollReveal>
    <span class="eyebrow">Al patrulea indicator • Piața muncii</span>
    <h2 class="intro-title">Câte ore de muncă costă o cheltuială, azi față de acum un an?</h2>
    <p class="intro-lead">
      Salariul mediu net lunar la nivelul economiei naționale, publicat de INS, tradus într-o rată orară
      (presupunând un program standard de 8 ore/zi, ~21 zile lucrătoare — {data?.standardHours ?? 168} ore/lună).
      Compară puterea de cumpărare în ore de muncă, nu doar în lei.
    </p>
  </div>

  {#if data && translations}
    <div class="indicator-grid reveal-on-scroll" use:scrollReveal={{ delay: 120 }}>
      <div class="calculator-card">
        <div class="rate-hero" aria-live="polite">
          <div class="rate-number-wrap">
            <span class="rate-large tabular">{formatRon($salaryTween)}</span>
            <span class="rate-unit">salariu mediu net / lună</span>
          </div>
          {#if translations.meta.growthFormatted}
            <div class="rate-delta-badge {translations.meta.isUp ? 'down' : translations.meta.isDown ? 'up' : 'neutral'}">
              <span>Salariul {translations.meta.directionText} cu {translations.meta.growthFormatted} față de {translations.meta.yearAgoLabel}</span>
            </div>
          {/if}
        </div>
        <p class="lens-detail">
          Date pentru <strong>{translations.meta.currentLabel}</strong> — rată orară derivată:
          <strong>{translations.meta.hourlyRateFormatted} / oră</strong>.
          {data.isFallback ? `Date de rezervă din ${data.current.monthLabel} (offline).` : 'Date live de la INS.'}
          {#if data.isFallback}
            <button type="button" class="retry-btn" onclick={load} disabled={isRetrying}>
              {isRetrying ? 'Se reîncearcă...' : '↻ Reîncearcă'}
            </button>
          {/if}
        </p>
        <div class="chart-header">
          <span>Salariul mediu net, ultimele 13 luni</span>
          <span class="tabular">{rangeText}</span>
        </div>
        <Sparkline history={chartHistory} redrawKey={data.current.yearMonth} />
        <div class="chart-dates-footer">
          <span>{data.history[0]?.monthLabel}</span>
          <span>{data.current.monthLabel}</span>
        </div>
        <p class="calc-subtitle" style="margin-top: 0.75rem;">
          Serie disponibilă doar din 2025 (clasificare CAEN Rev.3, introdusă atunci) — de-asta graficul e mai
          scurt decât la ceilalți doi indicatori.
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
                  step="10"
                  value={scen.amount}
                  oninput={(e) => setAmount(scen.id, parseFloat(e.target.value) || 0)}
                />
                <span class="calc-currency-symbol">lei</span>
              </span>
            </h3>
            <p class="calc-subtitle">
              La rata orară derivată din salariul mediu, cam atâtea ore de muncă reprezintă suma de mai sus.
            </p>
            {#key scen.amount}
              <div class="calc-results-grid" aria-live="polite">
                <div class="result-item">
                  <span class="result-label">Acum un an</span>
                  <span class="result-val tabular">{scen.hoursYearAgoFormatted ?? '—'}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">Astăzi</span>
                  <span class="result-val tabular">{scen.hoursNowFormatted}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">Concluzie</span>
                  <span
                    class="result-val tabular diff-highlight"
                    style="color: {scen.isEasierNow ? 'var(--diff-down-color)' : scen.isHarderNow ? 'var(--diff-up-color)' : 'inherit'}"
                  >{scen.isEasierNow ? 'mai puțin efort' : scen.isHarderNow ? 'mai mult efort' : 'neschimbat'}</span>
                </div>
              </div>
            {/key}
          </div>
        {/each}
      </div>
    </div>
  {:else if loadError}
    <p class="calc-subtitle" style="text-align:center;">
      Eroare la încărcarea datelor salariale (INS).
      <button type="button" class="retry-btn" onclick={load} disabled={isRetrying}>
        {isRetrying ? 'Se reîncearcă...' : '↻ Reîncearcă'}
      </button>
    </p>
  {:else}
    <IndicatorSkeleton resultCount={3} />
  {/if}
</section>
