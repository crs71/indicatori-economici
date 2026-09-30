import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte';
import InterestSection from './InterestSection.svelte';

const LIVE_DATA = {
  isFallback: false,
  current: { date: '2024-08-08', dpm: 6.5, dfc: 7.5, dfd: 5.5 },
  previous: { date: '2024-07-08', dpm: 6.75, dfc: 7.75, dfd: 5.75 },
  delta: -0.25,
  daysSinceChange: 100,
  currentDateFormatted: '8 august 2024',
  previousDateFormatted: '8 iulie 2024',
  history: [
    { date: '2024-07-08', dpm: 6.75, dfc: 7.75, dfd: 5.75 },
    { date: '2024-08-08', dpm: 6.5, dfc: 7.5, dfd: 5.5 },
  ],
};

const FALLBACK_DATA = { ...LIVE_DATA, isFallback: true };

vi.mock('../interest-service.js', async () => {
  const actual = await vi.importActual('../interest-service.js');
  return { ...actual, getInterestRateData: vi.fn() };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('InterestSection', () => {
  it('afișează rata curentă și recalculează impactul la editarea sumei', async () => {
    const { getInterestRateData } = await import('../interest-service.js');
    getInterestRateData.mockResolvedValue(LIVE_DATA);

    render(InterestSection, { props: { eurHistory: [] } });
    await screen.findByText(/zile fără schimbare/);

    // implicit: 5000 lei la 6,50% pe 100 zile => 10000*... calculat separat;
    // verificăm doar că suma implicită apare corect în input
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[0].value).toBe('5000');

    await fireEvent.input(inputs[0], { target: { value: '20000' } });

    // 20000 * 6.5 / 100 / 365 ≈ 3,56 lei/zi; * 100 zile ≈ 356,16 lei
    await waitFor(() => {
      expect(screen.getByText('3,56 lei / zi')).toBeInTheDocument();
      expect(screen.getByText('356,16 lei')).toBeInTheDocument();
    });
  });

  it('arată mesajul offline și un buton de reîncercare când datele sunt de rezervă', async () => {
    const { getInterestRateData } = await import('../interest-service.js');
    getInterestRateData.mockResolvedValue(FALLBACK_DATA);

    render(InterestSection, { props: { eurHistory: [] } });
    const retryBtn = await screen.findByRole('button', { name: /reîncearcă/i });
    expect(screen.getByText(/offline/)).toBeInTheDocument();

    // la click, reapelează sursa de date
    getInterestRateData.mockResolvedValue(LIVE_DATA);
    await fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(getInterestRateData).toHaveBeenCalledTimes(2);
      expect(screen.getByText(/Date live de la BNR/)).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /reîncearcă/i })).not.toBeInTheDocument();
  });
});
