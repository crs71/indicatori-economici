<script>
  let { resultCount = 3, cardCount = 2 } = $props();
</script>

<div class="indicator-grid">
  <div class="calculator-card">
    <div class="skeleton skeleton-hero"></div>
    <div class="skeleton skeleton-badge"></div>
    <div class="skeleton skeleton-line" style="margin-top: 1rem;"></div>
    <div class="skeleton skeleton-line short"></div>
    <div class="skeleton skeleton-chart"></div>
  </div>
  <div class="scenario-list">
    {#each Array(cardCount) as _}
      <div class="calculator-card">
        <div class="skeleton skeleton-line" style="width: 50%; height: 1.1rem; margin-top: 0;"></div>
        <div class="skeleton skeleton-line short"></div>
        <div class="calc-results-grid" style="margin-top: 0.75rem;">
          {#each Array(resultCount) as _}
            <div class="result-item">
              <div class="skeleton skeleton-line" style="height: 0.65rem; width: 70%; margin: 0 0 0.5rem;"></div>
              <div class="skeleton skeleton-line" style="height: 1.05rem; width: 85%; margin: 0;"></div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
