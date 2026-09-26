<script>
  import { onMount } from 'svelte';
  import { getInterestRateData, formatDateRo } from '../interest-service.js';
  import { generateInterestTranslations, compareToExchangeRateVolatility } from '../interest-translations.js';
  import InterestStaircase from './InterestStaircase.svelte';

  let { eurHistory } = $props();

  let data = $state(null);
  let loadError = $state(false);

  let translations = $derived.by(() => (data ? generateInterestTranslations(data) : null));
  let contrast = $derived.by(() =>
    data ? compareToExchangeRateVolatility(eurHistory, data.daysSinceChange) : null
  );
  let rangeText = $derived.by(() => {
    if (!data?.history?.length) return '—';
    const rates = data.history.map((p) => p.dpm);
    return `min ${Math.min(...rates).toFixed(2)}% • max ${Math.max(...rates).toFixed(2)}%`;
  });
  let firstDateFormatted = $derived.by(() => (data?.history?.length ? formatDateRo(data.history[0].date) : '—'));

  onMount(async () => {
    try {
      data = await getInterestRateData();
    } catch (err) {
      console.error(err);
      loadError = true;
    }
  });
</script>

<section class="indicator-section">
  <div class="intro-section">
    <span class="eyebrow">Al doilea indicator • Politică monetară</span>
    <h2 class="intro-title">Câte zile a stat pe loc rata BNR?</h2>
    <p class="intro-lead">
      Cursul valutar se recalculează în fiecare zi lucrătoare, pe piață. Rata de politică monetară e altceva: se
      schimbă doar atunci când Consiliul de Administrație al BNR decide explicit acest lucru — uneori rămâne
      neatinsă ani la rând. Stabilitatea în sine e semnalul.
    </p>
  </div>

  {#if data && translations}
    <div class="indicator-grid">
      <div class="calculator-card">
        <div class="rate-hero">
          <div class="rate-number-wrap">
            <span class="rate-large tabular">{translations.meta.daysSinceChange}</span>
            <span class="rate-unit">zile fără schimbare</span>
          </div>
          <div class="rate-delta-badge neutral">
            <span>Rata rămâne la {data.current.dpm.toFixed(2)}% din {data.currentDateFormatted}</span>
          </div>
        </div>
        <p class="lens-detail">
          <strong>Ultima schimbare:</strong> de la {data.previous.dpm.toFixed(2)}% ({data.previousDateFormatted}) la
          {data.current.dpm.toFixed(2)}% ({data.currentDateFormatted}) — {translations.meta.isNeutral ? 'fără mișcare de atunci' : `o ${translations.meta.directionText} de ${translations.meta.deltaFormatted}`}.
        </p>
        {#if contrast}
          <p class="lens-detail">
            Pentru comparație: în ultimele {contrast.sessions} ședințe bancare, cursul EUR s-a schimbat de
            <strong>{contrast.moves} {contrast.moves === 1 ? 'dată' : 'ori'}</strong>. Rata BNR — de
            <strong>{contrast.daysSinceChange} zile</strong>.
          </p>
        {/if}
        <div class="chart-header">
          <span>Evoluție istorică a ratei (% p.a.)</span>
          <span class="tabular">{rangeText}</span>
        </div>
        <InterestStaircase history={data.history} />
        <div class="chart-dates-footer">
          <span>{firstDateFormatted}</span>
          <span>{data.currentDateFormatted}</span>
        </div>
        <p class="calc-subtitle" style="margin-top: 0.75rem;">
          Fiecare treaptă a graficului e o decizie a Consiliului de Administrație BNR, nu o zi calendaristică — de
          aceea segmentele au lungimi diferite (unele decizii au stat ani, altele luni).
        </p>
      </div>

      <div class="scenario-list">
        {#each translations.scenarios as scen}
          <div class="calculator-card">
            <h3 class="calc-title" style="font-size: 1.1rem;">{scen.title} ({scen.amountFormatted})</h3>
            <p class="calc-subtitle">
              Simplificare didactică — dobândă simplă, proporțională cu zilele scurse de la {data.currentDateFormatted}.
              Nu e o ofertă reală de la vreo bancă (băncile aplică marje proprii și rate de referință precum
              ROBOR/IRCC).
            </p>
            <div class="calc-results-grid">
              <div class="result-item">
                <span class="result-label">Ritm zilnic la {data.current.dpm.toFixed(2)}%</span>
                <span class="result-val tabular">{scen.dailyFormatted} / zi</span>
              </div>
              <div class="result-item">
                <span class="result-label">Ai fi {scen.verb} până azi</span>
                <span class="result-val tabular diff-highlight">{scen.accumulatedFormatted}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {:else if loadError}
    <p class="calc-subtitle" style="text-align:center;">Eroare la încărcarea ratelor dobânzii BNR.</p>
  {:else}
    <p class="calc-subtitle" style="text-align:center;">Se încarcă ratele dobânzii BNR...</p>
  {/if}
</section>
