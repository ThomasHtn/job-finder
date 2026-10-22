import { parseSalary, salaryAmounts } from './job-row.utils';

describe('job row utils', () => {
  it('reads the salary wordings of every source', () => {
    const range = (min: number, max: number, from = false, monthly = false) => ({
      min,
      max,
      from,
      monthly,
    });
    expect(parseSalary('Annuel de 30000.0 Euros à 45000.0 Euros - Primes diverses')).toEqual(
      range(30000, 45000),
    );
    expect(parseSalary('Annuel de 32000.0 Euros à 36000.0 Euros sur 12.0 mois')).toEqual(
      range(32000, 36000),
    );
    expect(parseSalary('42 000 € - 64 000 € par an')).toEqual(range(42000, 64000));
    expect(parseSalary('40 000 € par an')).toEqual(range(40000, 40000));
    expect(parseSalary('40 - 50 k€ brut annuel')).toEqual(range(40000, 50000));
    expect(parseSalary('75k-85k €')).toEqual(range(75000, 85000));
    expect(parseSalary('A partir de 35 k€ brut annuel')).toEqual(range(35000, 35000, true));
    expect(parseSalary('Mensuel de 2750.0 Euros - salaire unique')).toEqual(
      range(2750, 2750, false, true),
    );
  });

  it('leaves alone a wording with no amount it can shorten', () => {
    expect(parseSalary('A négocier')).toBeNull();
    expect(parseSalary('Horaire de 12.5 Euros')).toBeNull();
    expect(parseSalary('$90,000 - $120,000')).toBeNull();
  });

  it('writes yearly amounts in thousands and monthly ones in full', () => {
    expect(salaryAmounts({ min: 30000, max: 45000, from: false, monthly: false }, 'fr-FR')).toBe(
      '30K - 45K',
    );
    expect(salaryAmounts({ min: 32500, max: 32500, from: false, monthly: false }, 'fr-FR')).toBe(
      '32,5K',
    );
    expect(salaryAmounts({ min: 35000, max: 35000, from: true, monthly: false }, 'en-GB')).toBe(
      '35K',
    );
    expect(salaryAmounts({ min: 2750, max: 2750, from: false, monthly: true }, 'en-GB')).toBe(
      '2,750',
    );
  });
});
