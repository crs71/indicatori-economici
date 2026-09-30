import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/svelte';
import Calculator from './Calculator.svelte';

afterEach(() => cleanup());

describe('Calculator', () => {
  const currData = { currentRate: 5, startRate: 4.9 };

  it('afișează rezultatele calculate pentru suma implicită a valutei', () => {
    render(Calculator, { props: { activeCurrency: 'EUR', currData } });
    // suma implicită pentru EUR e 10 => costStart 10*4.9=49,00 lei, costNow 10*5=50,00 lei
    expect(screen.getByText('49,00 lei')).toBeInTheDocument();
    expect(screen.getByText('50,00 lei')).toBeInTheDocument();
  });

  it('recalculează rezultatele când utilizatorul editează suma', async () => {
    render(Calculator, { props: { activeCurrency: 'EUR', currData } });
    const input = screen.getByRole('spinbutton');
    await fireEvent.input(input, { target: { value: '100' } });
    expect(screen.getByText('500,00 lei')).toBeInTheDocument();
    expect(screen.getByText('490,00 lei')).toBeInTheDocument();
  });

  it('actualizează suma la un click pe un chip presetat', async () => {
    render(Calculator, { props: { activeCurrency: 'EUR', currData } });
    const chip = screen.getByRole('button', { name: '25 €' });
    await fireEvent.click(chip);
    expect(screen.getByText('125,00 lei')).toBeInTheDocument();
  });

  it('resetează suma la valoarea implicită când se schimbă valuta activă', async () => {
    const { rerender } = render(Calculator, { props: { activeCurrency: 'EUR', currData } });
    await rerender({ activeCurrency: 'USD', currData });
    // valoarea implicită pentru USD e 20
    const input = screen.getByRole('spinbutton');
    expect(input.value).toBe('20');
  });
});
