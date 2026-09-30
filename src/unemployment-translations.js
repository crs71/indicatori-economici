/**
 * unemployment-translations.js
 * Traduce rata șomajului BIM într-un context relevant pentru un student —
 * nu un scenariu de sumă editabilă (n-are sens pentru un procent de piață a
 * muncii), ci o comparație directă între rata generală și cea a tinerilor
 * (15-24 ani), grupa cea mai apropiată de vârsta unui absolvent.
 */
export function generateUnemploymentTranslations(data) {
  const { delta, youthGapPoints, youthMultiple } = data;
  const isUp = delta > 0.05;
  const isDown = delta < -0.05;
  const trendText = isUp ? 'a crescut' : isDown ? 'a scăzut' : 'a rămas stabilă';

  return {
    meta: {
      isUp,
      isDown,
      trendText,
      deltaFormatted: `${delta > 0 ? '+' : ''}${delta.toFixed(1).replace('.', ',')} puncte procentuale`,
      youthGapFormatted: `+${youthGapPoints.toFixed(1).replace('.', ',')} puncte procentuale`,
      youthMultipleFormatted: youthMultiple != null ? `${youthMultiple.toFixed(1).replace('.', ',')}×` : '—',
    },
  };
}
