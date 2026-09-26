<script>
  import { onMount } from 'svelte';
  import { getInterestRateData } from '../interest-service.js';
  import { generateInterestTranslations } from '../interest-translations.js';
  import InterestStaircase from './InterestStaircase.svelte';

  let data = $state(null);
  let loadError = $state(false);

  let translations = $derived.by(() => (data ? generateInterestTranslations(data) : null));

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
    <h2 class="intro-title">Rata dobânzii de politică monetară</h2>
    <p class="intro-lead">
      Spre deosebire de curs, care se mișcă zilnic, rata de politică monetară se schimbă doar la ședințele
      Consiliului de Administrație al BNR — uneori rămâne neschimbată ani la rând.
    </p>
  </div>

  {#if data && translations}
    <div class="indicator-grid">
      <div class="calculator-card">
        <div class="rate-hero">
          <div class="rate-number-wrap">
            <span class="rate-large tabular">{data.current.dpm.toFixed(2)}</span>
            <span class="rate-unit">%</span>
          </div>
          <div class="rate-delta-badge {translations.meta.isNeutral ? 'neutral' : translations.meta.isUp ? 'up' : 'down'}">
            <span>{translations.meta.isNeutral ? 'Neschimbată' : translations.meta.deltaFormatted} din {data.currentDateFormatted}</span>
          </div>
        </div>
        <p class="lens-detail">
          Ultima schimbare: de la <strong>{data.previous.dpm.toFixed(2)}%</strong> ({data.previousDateFormatted}) la
          <strong>{data.current.dpm.toFixed(2)}%</strong> ({data.currentDateFormatted}).
        </p>
        <InterestStaircase history={data.history} />
        <p class="calc-subtitle" style="margin-top: 0.75rem;">
          Istoric din {data.history[0].date.slice(0, 4)} până azi — fiecare treaptă e o decizie CA, nu o zi calendaristică.
        </p>
      </div>

      <div class="scenario-list">
        {#each translations.scenarios as scen}
          <div class="calculator-card">
            <h3 class="calc-title" style="font-size: 1.1rem;">{scen.title} ({scen.amountFormatted})</h3>
            <p class="calc-subtitle">
              Simplificare didactică — dobândă simplă pe un an, nu o ofertă reală de la vreo bancă (băncile aplică
              marje proprii și rate de referință precum ROBOR/IRCC).
            </p>
            <div class="calc-results-grid">
              <div class="result-item">
                <span class="result-label">Înainte ({data.previous.dpm.toFixed(2)}%)</span>
                <span class="result-val tabular">{scen.yearlyBeforeFormatted}</span>
              </div>
              <div class="result-item">
                <span class="result-label">Acum ({data.current.dpm.toFixed(2)}%)</span>
                <span class="result-val tabular">{scen.yearlyAfterFormatted}</span>
              </div>
              <div class="result-item">
                <span class="result-label">Diferență / an ({scen.verb})</span>
                <span
                  class="result-val tabular diff-highlight"
                  style="color: {scen.isMore ? 'var(--diff-up-color)' : 'var(--diff-down-color)'}"
                >{scen.diffFormatted}</span>
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
