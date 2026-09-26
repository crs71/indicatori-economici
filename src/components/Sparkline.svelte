<script>
  let { history, redrawKey } = $props();

  const W = 340, H = 90, PAD = 14;

  let coords = $derived.by(() => {
    if (!history?.length) return [];
    const rates = history.map((p) => p.rate);
    const min = Math.min(...rates), max = Math.max(...rates);
    const span = max - min || 0.01;
    return history.map((p, i) => ({
      x: PAD + (i / (history.length - 1 || 1)) * (W - PAD * 2),
      y: PAD + (1 - (p.rate - min) / span) * (H - PAD * 2),
      point: p,
    }));
  });

  let linePath = $derived(
    coords.map((c, i) => `${i ? 'L' : 'M'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
  );

  let areaPath = $derived.by(() => {
    if (!coords.length) return '';
    const last = coords[coords.length - 1], first = coords[0];
    return `${linePath} L ${last.x.toFixed(1)} ${H} L ${first.x.toFixed(1)} ${H} Z`;
  });
</script>

<svg class="sparkline-svg" viewBox="0 0 {W} {H}" preserveAspectRatio="none">
  <defs>
    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2563eb" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#2563eb" stop-opacity="0" />
    </linearGradient>
  </defs>
  {#key redrawKey}
    <path class="sparkline-area is-visible" d={areaPath} />
    <path class="sparkline-path animate-draw" d={linePath} />
    <g>
      {#each coords as c, i}
        <circle
          cx={c.x.toFixed(1)}
          cy={c.y.toFixed(1)}
          r="3"
          class="sparkline-point {i === coords.length - 1 ? 'is-highlighted' : ''}"
        >
          <title>{c.point.labelRo || c.point.date}: {c.point.rate.toFixed(4)} lei</title>
        </circle>
      {/each}
    </g>
  {/key}
</svg>
