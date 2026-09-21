/**
 * translations.js
 * Motorul de calcul al consecințelor reale pentru EUR, USD și GBP în viața de student.
 */

export const CURRENCY_CONFIG = {
  EUR: {
    symbol: '€',
    nameRo: 'euro',
    pairLabel: '1 EUR / RON • BNR',
    presets: [10, 25, 50, 100, 300, 500],
    defaultAmount: 10,
    scenarios: [
      {
        id: 'subscription',
        title: 'Abonamentul lunar digital',
        amount: 10,
        subtext: 'Servicii uzuale precum muzică, stocare cloud sau instrumente educaționale.',
        takeawayUp: 'Impact minor la o singură factură, dar vizibil când aduni mai multe servicii recurente.',
        takeawayDown: 'O ușoară relaxare a cursului menține cheltuielile lunare previzibile.',
      },
      {
        id: 'books',
        title: 'Cărți sau echipamente de studiu',
        amount: 50,
        subtext: 'Manuale academice internaționale sau accesorii pentru laptop din UE.',
        takeawayUp: 'La achiziții unice mici, fluctuația pe 10 zile nu justifică amânarea comenzii.',
        takeawayDown: 'Un moment favorabil pentru comenzi de materiale de studiu.',
      },
      {
        id: 'rent-mobility',
        title: 'Chiria sau bursa de mobilitate',
        amount: 300,
        subtext: 'Chirie stabilită în euro în București sau bursa de subzistență universitară.',
        takeawayUp: 'La sumele care depășesc câteva sute de euro, zecimalele cursului contează la sfârșit de lună.',
        takeawayDown: 'Economie directă la cheltuiala fixă majoră a lunii.',
      },
    ],
  },
  USD: {
    symbol: '$',
    nameRo: 'dolari',
    pairLabel: '1 USD / RON • BNR',
    presets: [10, 20, 50, 100, 200, 500],
    defaultAmount: 20,
    scenarios: [
      {
        id: 'subscription',
        title: 'Unelte AI & Dezvoltare Software',
        amount: 20,
        subtext: 'Abonament GitHub Copilot, ChatGPT Plus sau servere cloud (AWS/DigitalOcean).',
        takeawayUp: 'Instrumentele cheie pentru un student la informatică/cibernetică sunt adesea cotate în dolari.',
        takeawayDown: 'Costul uneltelor de studiu digital scade ușor în lei.',
      },
      {
        id: 'books',
        title: 'Accesorii & Componente Tech',
        amount: 100,
        subtext: 'Comandă de periferice, kituri Arduino/Raspberry Pi sau căști de pe platforme globale.',
        takeawayUp: 'Fluctuația dolarului se transmite direct în prețurile hardware-ului de import.',
        takeawayDown: 'O oportunitate bună pentru echipamente tech comandate internațional.',
      },
      {
        id: 'rent-mobility',
        title: 'Certificări IT & Licențe Anuale',
        amount: 300,
        subtext: 'Taxa pentru o certificare profesională (ex. Cloud/Data Science) sau pachete software.',
        takeawayUp: 'La bugete de câteva sute de dolari, diferența devine vizibilă în bugetul de economii.',
        takeawayDown: 'O mică relaxare utilă la investițiile mari în carieră.',
      },
    ],
  },
  GBP: {
    symbol: '£',
    nameRo: 'lire sterline',
    pairLabel: '1 GBP / RON • BNR',
    presets: [10, 25, 40, 100, 200, 400],
    defaultAmount: 40,
    scenarios: [
      {
        id: 'subscription',
        title: 'Publicații Academice & Economice',
        amount: 10,
        subtext: 'Abonament digital student la The Economist sau Financial Times.',
        takeawayUp: 'Lecturile internaționale de economie sunt adesea facturate în lire.',
        takeawayDown: 'Accesul la publicații economice britanice devine marginal mai ieftin.',
      },
      {
        id: 'books',
        title: 'Manuale de Economie & Statistică UK',
        amount: 40,
        subtext: 'Manuale de la edituri britanice (Oxford, Cambridge University Press).',
        takeawayUp: 'Cărțile de specialitate comandate din UK reflectă direct cursul GBP/RON.',
        takeawayDown: 'Economie binevenită la bibliografia obligatorie.',
      },
      {
        id: 'rent-mobility',
        title: 'Conferințe Studențești & Călătorii',
        amount: 200,
        subtext: 'Taxe de participare la conferințe internaționale sau un bilet de avion dus-întors.',
        takeawayUp: 'Lira tinde să aibă o cotație nominală ridicată, așa că micile variații adună sume consistente.',
        takeawayDown: 'Bugetul de mobilitate academică rămâne bine protejat.',
      },
    ],
  },
};

export function formatRon(val, showSign = false, decimals = 2) {
  const sign = showSign && val > 0 ? '+' : '';
  return `${sign}${val.toFixed(decimals).replace('.', ',')} lei`;
}

export function formatCurrencyAmount(val, currCode) {
  const cfg = CURRENCY_CONFIG[currCode] || CURRENCY_CONFIG.EUR;
  return `${val.toLocaleString('ro-RO')} ${cfg.symbol}`;
}

export function formatPercent(val, showSign = true) {
  const sign = showSign && val > 0 ? '+' : '';
  return `${sign}${val.toFixed(2).replace('.', ',')}%`;
}

export function generateStudentTranslations(currencyCode, currencyData, commonDates) {
  const cfg = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG.EUR;
  const { currentRate, startRate, delta10Days, percentChange10Days } = currencyData;
  const { startDateFormatted, currentDateFormatted } = commonDates;

  const isUp = delta10Days > 0;
  const isNeutral = Math.abs(delta10Days) < 0.0001;
  const directionText = isUp ? 'creștere' : isNeutral ? 'stagnare' : 'scădere';
  const verbText = isUp ? 'te costă în plus' : isNeutral ? 'rămâne neschimbat' : 'economisești';

  const scenarios = cfg.scenarios.map((scen, idx) => {
    const costNow = scen.amount * currentRate;
    const costStart = scen.amount * startRate;
    const diff = costNow - costStart;
    const yearlyDiff = diff * 9;

    let explanation = '';
    if (isNeutral) {
      explanation = 'Cursul a fost complet stabil în aceste 10 zile, deci suma în lei a rămas identică.';
    } else if (idx === 0) {
      explanation = `La o sumă recurentă de ${formatCurrencyAmount(scen.amount, currencyCode)}, diferența este de ${formatRon(Math.abs(diff))} pe lună (adică ${formatRon(Math.abs(yearlyDiff))} ${isUp ? 'în plus' : 'mai puțin'} pe un an universitar de 9 luni).`;
    } else if (idx === 1) {
      explanation = `Pentru o achiziție unică de ${formatCurrencyAmount(scen.amount, currencyCode)}, diferența acumulată este de ${formatRon(Math.abs(diff))} (${isUp ? 'mai scump' : 'mai ieftin'}).`;
    } else {
      explanation = `La o sumă de ${formatCurrencyAmount(scen.amount, currencyCode)}, schimbarea generează o diferență de ${formatRon(Math.abs(diff))} pe lună. Aici zecimalele cursului încep să se resimtă concret.`;
    }

    return {
      ...scen,
      amountFormatted: formatCurrencyAmount(scen.amount, currencyCode),
      costNow: formatRon(costNow),
      costStart: formatRon(costStart),
      diffFormatted: formatRon(diff, true),
      diffMonthly: formatRon(diff, true),
      diffAcademicYear: formatRon(yearlyDiff, true),
      explanation,
      takeaway: isUp ? scen.takeawayUp : scen.takeawayDown,
    };
  });

  return {
    currencyCode,
    cfg,
    meta: {
      directionText,
      verbText,
      isUp,
      isNeutral,
      percentFormatted: formatPercent(percentChange10Days),
      deltaFormatted: formatRon(delta10Days, true, 4),
      periodSpan: `între ${startDateFormatted} și ${currentDateFormatted}`,
    },
    scenarios,
  };
}

export function calculateCustomImpact(amount, currencyCode, currencyData) {
  const num = parseFloat(amount) || 0;
  const costNow = num * currencyData.currentRate;
  const costStart = num * currencyData.startRate;
  const diff = costNow - costStart;

  return {
    amount: num,
    currencyCode,
    costNow: formatRon(costNow),
    costStart: formatRon(costStart),
    diffFormatted: formatRon(diff, true),
    diffAbsolute: Math.abs(diff),
    isPositive: diff > 0,
    isZero: Math.abs(diff) < 0.001,
  };
}
