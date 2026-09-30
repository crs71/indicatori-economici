<script>
  import { onMount } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { getUnemploymentData } from '../unemployment-service.js';
  import { generateUnemploymentTranslations } from '../unemployment-translations.js';
  import Sparkline from './Sparkline.svelte';
  import IndicatorSkeleton from './IndicatorSkeleton.svelte';
  import { scrollReveal } from '../scrollReveal.js';

  let data = $state(null);
  let loadError = $state(false);
  let isRetrying = $state(false);

  let translations = $derived.by(() => (data ? generateUnemploymentTranslations(data) : null));

  let chartHistory = $derived.by(() => {
    if (!data?.history?.length) return [];
    return data.history.map((h) => ({ date: h.yearMonth, rate: h.value, labelRo: h.monthLabel }));
  });

  let rangeText = $derived.by(() => {
    if (!data?.history?.length) return '—';
    const rates = data.history.map((h) => h.value);
    return `min ${Math.min(...rates).toFixed(1)}% • max ${Math.max(...rates).toFixed(1)}%`;
  });

  const rateTween = tweened(0, { duration: 700, easing: cubicOut });
  $effect(() => {
    if (data) rateTween.set(data.current.value);
  });

  async function load() {
    isRetrying = data !== null || loadError;
    loadError = false;
    try {
      data = await getUnemploymentData();
    } catch (err) {
      console.error(err);
      loadError = true;
    } finally {
      isRetrying = false;
    }
  }

  onMount(load);
</script>

<section class="indicator-section" id="somaj">
  <div class="intro-section reveal-on-scroll" use:scrollReveal>
    <span class="eyebrow">Al cincilea indicator • Piața muncii</span>
    <h2 class="intro-title">Cât de greu e să-ți găsești un loc de muncă, la vârsta ta?</h2>
    <p class="intro-lead">
      Rata șomajului BIM (definiție internațională, Ancheta Forței de Muncă în Gospodării), publicată lunar de
      INS. Cifra generală apare des în știri — dar pentru cineva aproape de absolvire, rata în rândul tinerilor
      (15-24 ani) spune mult mai mult.
    </p>
  </div>

  {#if data && translations}
    <div class="indicator-grid reveal-on-scroll" use:scrollReveal={{ delay: 120 }}>
      <div class="calculator-card">
        <div class="rate-hero" aria-live="polite">
          <div class="rate-number-wrap">
            <span class="rate-large tabular">{$rateTween.toFixed(1)}%</span>
            <span class="rate-unit">rata șomajului (15-74 ani)</span>
          </div>
          <div class="rate-delta-badge {translations.meta.isUp ? 'up' : translations.meta.isDown ? 'down' : 'neutral'}">
            <span>Rata {translations.meta.trendText} — luna trecută era {data.previous.value.toFixed(1)}%</span>
          </div>
        </div>
        <p class="lens-detail">
          Date pentru <strong>{data.current.monthLabel}</strong>, serie ajustată sezonier.
          {data.isFallback ? `Date de rezervă din ${data.current.monthLabel} (offline).` : 'Date live de la INS.'}
          {#if data.isFallback}
            <button type="button" class="retry-btn" onclick={load} disabled={isRetrying}>
              {isRetrying ? 'Se reîncearcă...' : '↻ Reîncearcă'}
            </button>
          {/if}
        </p>
        <div class="chart-header">
          <span>Rata șomajului, ultimele 13 luni (%)</span>
          <span class="tabular">{rangeText}</span>
        </div>
        <Sparkline history={chartHistory} redrawKey={data.current.yearMonth} />
        <div class="chart-dates-footer">
          <span>{data.history[0]?.monthLabel}</span>
          <span>{data.current.monthLabel}</span>
        </div>
      </div>

      <div class="scenario-list">
        <div class="calculator-card">
          <h3 class="calc-title" style="font-size: 1.1rem;">Rata în rândul tinerilor (15-24 ani)</h3>
          <p class="calc-subtitle">
            Date pentru <strong>{data.currentYouth.monthLabel}</strong> — segmentul cel mai apropiat de vârsta unui
            student aproape de absolvire. Eșantion mai mic decât cel general, de-aceea seria se actualizează cu
            variații mai rare (grupate pe 2-3 luni consecutive).
          </p>
          <div class="calc-results-grid" aria-live="polite" style="grid-template-columns: repeat(2, 1fr);">
            <div class="result-item">
              <span class="result-label">Rata generală (15-74 ani)</span>
              <span class="result-val tabular">{data.current.value.toFixed(1)}%</span>
            </div>
            <div class="result-item">
              <span class="result-label">Rata tinerilor (15-24 ani)</span>
              <span class="result-val tabular diff-highlight">{data.currentYouth.value.toFixed(1)}%</span>
            </div>
          </div>
          <p class="lens-detail" style="margin-top: 1rem;">
            Diferența: <strong>{translations.meta.youthGapFormatted}</strong>, adică rata în rândul tinerilor e de
            <strong>{translations.meta.youthMultipleFormatted}</strong> mai mare decât media generală. Cifra din
            știri (rata generală) subestimează sistematic cât de competitivă e piața muncii pentru cineva la
            început de carieră.
          </p>
        </div>
      </div>
    </div>
  {:else if loadError}
    <p class="calc-subtitle" style="text-align:center;">
      Eroare la încărcarea datelor privind rata șomajului (INS).
      <button type="button" class="retry-btn" onclick={load} disabled={isRetrying}>
        {isRetrying ? 'Se reîncearcă...' : '↻ Reîncearcă'}
      </button>
    </p>
  {:else}
    <IndicatorSkeleton resultCount={2} cardCount={1} />
  {/if}
</section>
