// API #5 — Frankfurter exchange rates for the OFW budget helper.
import { fetchJson, round2 } from '../utils/format.js';

export const FRANKFURTER_URL = 'https://api.frankfurter.dev/v1/latest';

export const CURRENCIES = [
  { code: 'PHP', label: '₱ PHP — Philippine Peso' },
  { code: 'USD', label: '$ USD — US Dollar' },
  { code: 'AED', label: 'AED — UAE Dirham' },
  { code: 'SAR', label: 'SAR — Saudi Riyal' },
  { code: 'SGD', label: 'S$ SGD — Singapore Dollar' },
  { code: 'JPY', label: '¥ JPY — Japanese Yen' },
];

/**
 * Frankfurter publishes European Central Bank rates, which do NOT include AED or SAR.
 * Both currencies are officially pegged to the US dollar, so we derive them from USD→PHP.
 */
const USD_PEGS = { AED: 3.6725, SAR: 3.75 };

/** Approximate rates used only if Frankfurter is unreachable. */
const FALLBACK = {
  date: 'offline estimate',
  phpPer: { PHP: 1, USD: 58.5, AED: 15.93, SAR: 15.6, SGD: 45.0, JPY: 0.385 },
  derived: ['AED', 'SAR'],
  isFallback: true,
};

let cache = null;

/**
 * How many PHP one unit of each currency buys.
 * @returns {Promise<{date: string, phpPer: Record<string, number>, derived: string[], isFallback: boolean}>}
 */
export async function fetchPhpRates() {
  if (cache) return cache;
  try {
    const data = await fetchJson(`${FRANKFURTER_URL}?base=USD&symbols=PHP,SGD,JPY`, { timeoutMs: 7000 });
    const usdPhp = data.rates?.PHP;
    if (!usdPhp) throw new Error('PHP rate missing');
    cache = {
      date: data.date,
      phpPer: {
        PHP: 1,
        USD: usdPhp,
        SGD: usdPhp / data.rates.SGD,
        JPY: usdPhp / data.rates.JPY,
        AED: usdPhp / USD_PEGS.AED,
        SAR: usdPhp / USD_PEGS.SAR,
      },
      derived: ['AED', 'SAR'],
      isFallback: false,
    };
    return cache;
  } catch (err) {
    console.warn('[currencyApi] Using fallback rates:', err.message);
    return FALLBACK;
  }
}

/** convertToPhp(100, 'USD', rates) → e.g. 5850 */
export const convertToPhp = (amount, from, rates) => round2(Number(amount || 0) * (rates.phpPer[from] ?? 1));
