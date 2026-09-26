<script>
  let { history } = $props();

  const W = 340, H = 90, PAD = 14;

  let coords = $derived.by(() => {
    if (!history?.length) return [];
    const rates = history.map((p) => p.dpm);
    const min = Math.min(...rates), max = Math.max(...rates);
    const span = max - min || 0.01;
    return history.map((p, i) => ({
      x: PAD + (i / (history.length - 1 || 1)) * (W - PAD * 2),
      y: PAD + (1 - (p.dpm - min) / span) * (H - PAD * 2),
      point: p,
    }));
  });

  // linie "în trepte": orizontal (rata rămâne constantă) apoi vertical (decizia CA)
  let stepPath = $derived.by(() => {
    if (!coords.length) return '';
    let d = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
    for (let i = 1; i < coords.length; i++) {
      d += ` L ${coords[i].x.toFixed(1)} ${coords[i - 1].y.toFixed(1)} L ${coords[i].x.toFixed(1)} ${coords[i].y.toFixed(1)}`;
    }
    return d;
  });
</script>

<svg class="sparkline-svg" viewBox="0 0 {W} {H}" preserveAspectRatio="none">
  <path class="sparkline-path animate-draw" d={stepPath} />
  {#each coords as c, i}
    <circle
      cx={c.x.toFixed(1)}
      cy={c.y.toFixed(1)}
      r="2.5"
      class="sparkline-point {i === coords.length - 1 ? 'is-highlighted' : ''}"
    >
      <title>{c.point.date}: {c.point.dpm.toFixed(2)}%</title>
    </circle>
  {/each}
</svg>
