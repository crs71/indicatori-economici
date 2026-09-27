<script>
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import Sparkline from './Sparkline.svelte';
  import { formatRon } from '../translations.js';

  let { exchangeData, activeCurrency, onCurrencyChange, currentStepId, translationsData, currData } = $props();

  const STEP_DOTS = [
    { id: 'step-intro', label: 'Pasul 1' },
    { id: 'step-variation', label: 'Pasul 2' },
    { id: 'step-sub', label: 'Pasul 3' },
    { id: 'step-books', label: 'Pasul 4' },
    { id: 'step-rent', label: 'Pasul 5' },
    { id: 'step-threshold', label: 'Pasul 6' },
    { id: 'step-compare', label: 'Pasul 7' },
  ];

  const CURRENCIES = ['EUR', 'USD', 'GBP'];

  function goToStep(stepId) {
    document.querySelector(`[data-step="${stepId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  let rangeText = $derived.by(() => {
    const h = currData?.history;
    if (!h?.length) return '—';
    const rates = h.map((p) => p.rate);
    return `min: ${Math.min(...rates).toFixed(4)} • max: ${Math.max(...rates).toFixed(4)}`;
  });

  // --- panou "lens" dinamic, în funcție de pasul narativ activ ---
  let lensSpec = $derived.by(() => {
    if (!currData || !translationsData) {
      return { label: 'Perspectivă curentă', detail: 'Derulează pașii pentru context.', staticValue: '—', numeric: null, comparison: null };
    }
    const { scenarios, meta } = translationsData;
    switch (currentStepId) {
      case 'step-intro':
        return {
          label: `Perspectivă: 1 ${activeCurrency}`,
          staticValue: `1 ${activeCurrency} = ${currData.currentRate.toFixed(4)} lei`,
          detail: `Fixing BNR • ${exchangeData.currentDateFormatted}.`,
          numeric: null,
          comparison: { baseVal: 0, diffVal: 0 },
        };
      case 'step-variation':
        return {
          label: `Interval 10 zile (${activeCurrency})`,
          staticValue: `${meta.deltaFormatted} (${meta.percentFormatted})`,
          detail: `De la ${currData.startRate.toFixed(4)} la cursul de azi.`,
          numeric: null,
          comparison: { baseVal: currData.startRate, diffVal: currData.delta10Days },
        };
      case 'step-sub':
        return {
          label: scenarios[0].title,
          numeric: scenarios[0].amount * currData.currentRate,
          format: (v) => `${formatRon(v)} / lună`,
          detail: `Diferență: ${scenarios[0].diffMonthly}/lună (${scenarios[0].diffAcademicYear}/an univ.).`,
          comparison: { baseVal: scenarios[0].amount * currData.startRate, diffVal: scenarios[0].amount * currData.delta10Days },
        };
      case 'step-books':
        return {
          label: scenarios[1].title,
          numeric: scenarios[1].amount * currData.currentRate,
          format: (v) => formatRon(v),
          detail: `Diferență 10 zile: ${scenarios[1].diffFormatted}.`,
          comparison: { baseVal: scenarios[1].amount * currData.startRate, diffVal: scenarios[1].amount * currData.delta10Days },
        };
      case 'step-rent':
        return {
          label: scenarios[2].title,
          numeric: scenarios[2].amount * currData.currentRate,
          format: (v) => `${formatRon(v)} / lună`,
          detail: `Diferență lunară: ${scenarios[2].diffFormatted}.`,
          comparison: { baseVal: scenarios[2].amount * currData.startRate, diffVal: scenarios[2].amount * currData.delta10Days },
        };
      case 'step-threshold': {
        const at200 = 200 * Math.abs(currData.delta10Days);
        return {
          label: 'Pragul de relevanță',
          staticValue: at200 < 2 ? 'Sub ~2 lei la 200 unități' : `${formatRon(at200)} la 200 unități`,
          detail: 'Sub ~50/lună: zgomot. Peste ~200–300: verifică înainte de transfer mare.',
          numeric: null,
          comparison: { baseVal: 200 * currData.startRate, diffVal: 200 * currData.delta10Days },
        };
      }
      case 'step-compare':
        return {
          label: `Compară valute (${activeCurrency})`,
          staticValue: `1 ${activeCurrency} = ${currData.currentRate.toFixed(4)} lei`,
          detail: 'Comută EUR / USD / GBP — scenariile se rescriu automat.',
          numeric: null,
          comparison: { baseVal: currData.startRate, diffVal: currData.delta10Days },
        };
      default:
        return { label: 'Perspectivă curentă', staticValue: '—', detail: '', numeric: null, comparison: null };
    }
  });

  const lensTween = tweened(0, { duration: 450, easing: cubicOut });
  $effect(() => {
    if (lensSpec.numeric !== null && lensSpec.numeric !== undefined) {
      lensTween.set(lensSpec.numeric);
    }
  });
  let lensValueDisplay = $derived(
    lensSpec.numeric !== null && lensSpec.numeric !== undefined ? lensSpec.format($lensTween) : lensSpec.staticValue
  );

  // --- animație de tip "puls" la schimbarea pasului / valutei ---
  function usePulse(dep, ms) {
    let active = $state(false);
    $effect(() => {
      dep;
      active = true;
      const t = setTimeout(() => (active = false), ms);
      return () => clearTimeout(t);
    });
    return {
      get value() {
        return active;
      },
    };
  }
  const stickyPulse = usePulse(() => currentStepId, 550);
  const lensPulse = usePulse(() => currentStepId, 500);
  const ratePop = usePulse(() => activeCurrency, 450);
  const badgePop = usePulse(() => activeCurrency, 400);

  const rateTween = tweened(0, { duration: 450, easing: cubicOut });
  $effect(() => {
    if (currData) rateTween.set(currData.currentRate);
  });

  let isUpDelta = $derived(currData ? currData.delta10Days > 0 : false);
  let isNeutralDelta = $derived(currData ? Math.abs(currData.delta10Days) < 0.0001 : true);

  // --- panoul cu graficul: deschis implicit pe desktop, pliabil pe mobil ---
  let chartOpen = $state(true);
  let userToggledChart = $state(false);
  $effect(() => {
    const mq = window.matchMedia('(min-width: 1101px)');
    const sync = () => {
      if (mq.matches) chartOpen = true;
      else if (!userToggledChart) chartOpen = false;
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  });
  function onChartToggle(e) {
    userToggledChart = true;
    chartOpen = e.target.open;
  }

  let comparisonVisual = $derived.by(() => {
    const c = lensSpec.comparison;
    if (!c || Math.abs(c.diffVal) < 0.0001) return null;
    const absDiff = Math.abs(c.diffVal);
    const total = c.baseVal + absDiff;
    const pct = Math.max(4, Math.min(22, (absDiff / total) * 100 * 4));
    return { basePct: 100 - pct, diffPct: pct, isUp: c.diffVal > 0, baseVal: c.baseVal, diffVal: c.diffVal };
  });
</script>

<div class="sticky-display" class:is-updating={stickyPulse.value}>
  <div class="display-header">
    <div>
      <div class="header-top-row">
        <span class="currency-pair">1 {activeCurrency} / RON • BNR</span>
        <div class="currency-switcher" role="tablist" aria-label="Alege valuta">
          {#each CURRENCIES as curr}
            <button
              type="button"
              class="curr-btn {curr === activeCurrency ? 'is-active' : ''}"
              onclick={() => onCurrencyChange(curr)}
            >{curr}</button>
          {/each}
        </div>
      </div>
      <div class="data-date tabular">{exchangeData?.currentDateFormatted ?? '—'}</div>
    </div>
    <div class="timeline-tracker" title="Progres pași narațiune">
      {#each STEP_DOTS as dot}
        <button
          type="button"
          class="step-dot {dot.id === currentStepId ? 'is-active' : ''}"
          aria-label={dot.label}
          title={dot.label}
          onclick={() => goToStep(dot.id)}
        ></button>
      {/each}
    </div>
  </div>

  <div class="rate-hero">
    <div class="rate-number-wrap">
      <span class="rate-large tabular {ratePop.value ? 'is-popping' : ''}">{$rateTween.toFixed(4)}</span>
      <span class="rate-unit">lei</span>
    </div>
    {#if currData}
      <div class="rate-delta-badge {badgePop.value ? 'is-popping' : ''} {isUpDelta ? 'up' : isNeutralDelta ? 'neutral' : 'down'}">
        <span>{isUpDelta ? '+' : ''}{currData.delta10Days.toFixed(4)} lei ({isUpDelta ? '+' : ''}{currData.percentChange10Days.toFixed(2)}%) în 10 zile</span>
      </div>
    {/if}
  </div>

  <details class="chart-details" open={chartOpen} ontoggle={onChartToggle}>
    <summary class="chart-summary">
      <span class="chart-summary-label">Evoluție 10 ședințe bancare</span>
      <span class="chart-summary-hint">{rangeText}</span>
      <span class="chart-chevron" aria-hidden="true"></span>
    </summary>
    <div class="chart-container">
      <div class="chart-header chart-header-desktop">
        <span>Evoluție 10 ședințe bancare</span>
        <span class="tabular">{rangeText}</span>
      </div>
      {#if currData}
        <Sparkline history={currData.history} redrawKey={activeCurrency} />
      {/if}
    </div>
  </details>

  <div class="lens-container {lensPulse.value ? 'is-updating' : ''}">
    <span class="lens-label">{lensSpec.label}</span>
    <div class="lens-main-val tabular">{lensValueDisplay}</div>
    <p class="lens-detail">{lensSpec.detail}</p>
    <div class="lens-comparison" style="opacity: {comparisonVisual ? 1 : 0.4}">
      <div class="comparison-track">
        <div class="comp-bar-base" style="width: {comparisonVisual ? comparisonVisual.basePct : 98}%;"></div>
        <div class="comp-bar-diff {comparisonVisual && !comparisonVisual.isUp ? 'down' : ''}" style="width: {comparisonVisual ? comparisonVisual.diffPct : 2}%;"></div>
      </div>
      <div class="comparison-legend">
        <span class="leg-item"><span class="dot-base"></span> {comparisonVisual ? `Cost start: ${formatRon(comparisonVisual.baseVal)}` : '—'}</span>
        <span class="leg-item"><span class="dot-diff"></span> {comparisonVisual ? `${formatRon(comparisonVisual.diffVal, true)} variație` : '—'}</span>
      </div>
    </div>
  </div>
</div>
