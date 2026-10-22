import {
  SALARY_AMOUNT,
  SALARY_FOREIGN_CURRENCY,
  SALARY_FROM_HINT,
  SALARY_MIN_AMOUNT,
  SALARY_MONTHLY_HINT,
  SALARY_THOUSANDS_HINT,
} from './job-row.constants';
import { SalaryRange } from './job-row.model';

/**
 * The amounts of a source's salary text, `null` when it names none the row can shorten safely.
 */
export function parseSalary(text: string): SalaryRange | null {
  if (SALARY_FOREIGN_CURRENCY.test(text)) {
    return null;
  }
  const thousands = SALARY_THOUSANDS_HINT.test(text);
  const amounts = [...text.matchAll(SALARY_AMOUNT)]
    .map(([, digits, k]) => {
      const amount = Number(digits.replace(/\D/g, ''));
      return k || (thousands && amount < SALARY_MIN_AMOUNT) ? amount * 1000 : amount;
    })
    .filter((amount) => amount >= SALARY_MIN_AMOUNT);
  if (!amounts.length) {
    return null;
  }
  return {
    min: Math.min(...amounts),
    max: Math.max(...amounts),
    from: SALARY_FROM_HINT.test(text),
    monthly: SALARY_MONTHLY_HINT.test(text),
  };
}

/**
 * "30K - 45K" for a yearly pay, "2 750" for a monthly one, in the reader's number format.
 */
export function salaryAmounts(range: SalaryRange, locale: string): string {
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const amount = (value: number): string =>
    range.monthly ? format.format(value) : `${format.format(value / 1000)}K`;
  return range.min === range.max || range.from
    ? amount(range.min)
    : `${amount(range.min)} - ${amount(range.max)}`;
}
