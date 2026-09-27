<script>
  import { CURRENCY_CONFIG, calculateCustomImpact } from '../translations.js';

  let { activeCurrency, currData } = $props();

  let cfg = $derived(CURRENCY_CONFIG[activeCurrency] ?? CURRENCY_CONFIG.EUR);
  // svelte-ignore state_referenced_locally -- valoare inițială, intenționat necontinuu reactivă
  let amount = $state(cfg.defaultAmount);

  // la schimbarea valutei, resetează suma la valoarea implicită a acelei valute
  // svelte-ignore state_referenced_locally -- captăm valoarea inițială, nu urmărim reactiv
  let lastCurrency = activeCurrency;
  $effect(() => {
    if (activeCurrency !== lastCurrency) {
      lastCurrency = activeCurrency;
      amount = CURRENCY_CONFIG[activeCurrency]?.defaultAmount ?? 10;
    }
  });

  let impact = $derived.by(() => {
    if (!currData) return null;
    return calculateCustomImpact(amount, activeCurrency, currData);
  });

  function setAmount(val) {
    amount = val;
  }
</script>

<section class="calculator-section">
  <div class="calculator-card">
    <h2 class="calc-title">Calculează pentru orice sumă proprie</h2>
    <p class="calc-subtitle">
      Ai o cheltuială în valută? Introdu suma și vezi diferența în lei față de începutul celor 10 zile bancare.
    </p>
    <div class="calc-controls">
      <div class="calc-input-row">
        <div class="calc-input-wrapper">
          <input
            type="number"
            class="calc-input tabular"
            min="1"
            max="5000"
            step="1"
            value={amount}
            oninput={(e) => setAmount(parseFloat(e.target.value) || 0)}
          />
          <span class="calc-currency-symbol">{cfg.symbol}</span>
        </div>
        <div class="calc-preset-chips">
          {#each cfg.presets as val}
            <button type="button" class="chip-btn" onclick={() => setAmount(val)}>{val} {cfg.symbol}</button>
          {/each}
        </div>
      </div>
      <input
        type="range"
        class="calc-slider"
        min="5"
        max="1000"
        step="5"
        value={Math.min(amount, 1000)}
        oninput={(e) => setAmount(parseFloat(e.target.value) || 0)}
      />
    </div>
    <div class="calc-results-grid">
      <div class="result-item">
        <span class="result-label">Cost la startul celor 10 zile</span>
        <span class="result-val tabular">{impact?.costStart ?? '—'}</span>
      </div>
      <div class="result-item">
        <span class="result-label">Cost la cursul de azi</span>
        <span class="result-val tabular">{impact?.costNow ?? '—'}</span>
      </div>
      <div class="result-item">
        <span
          class="result-label"
        >Diferența în lei</span>
        <span
          class="result-val tabular diff-highlight"
          style="color: {impact ? (impact.isPositive ? 'var(--diff-up-color)' : impact.isZero ? 'var(--diff-neutral-color)' : 'var(--diff-down-color)') : 'inherit'}"
        >{impact?.diffFormatted ?? '—'}</span>
      </div>
    </div>
  </div>
</section>
