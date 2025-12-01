// Currency conversion utilities
// Base currency: EUR

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Conversion rate from EUR
}

export const DEFAULT_CURRENCIES: Currency[] = [
  { code: "EUR", symbol: "€", name: "Euro", rate: 1.0 },
  { code: "DKK", symbol: "kr", name: "Danish Krone", rate: 7.45 }, // Fallback
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1.08 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.86 },
];

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Currency[] = DEFAULT_CURRENCIES
): number {
  const from = rates.find((c) => c.code === fromCurrency);
  const to = rates.find((c) => c.code === toCurrency);

  if (!from || !to) {
    console.warn(`Currency not found: ${fromCurrency} or ${toCurrency}`);
    return amount;
  }

  // Convert to EUR first, then to target currency
  const amountInEUR = amount / from.rate;
  const convertedAmount = amountInEUR * to.rate;

  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimals
}

export function formatCurrency(
  amount: number,
  currencyCode: string,
  rates: Currency[] = DEFAULT_CURRENCIES
): string {
  const currency = rates.find((c) => c.code === currencyCode);

  if (!currency) {
    return `${amount} ${currencyCode}`;
  }

  // Format with proper thousand separators
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${formatted} ${currency.symbol}`;
}

export function getCurrencySymbol(
  currencyCode: string,
  rates: Currency[] = DEFAULT_CURRENCIES
): string {
  const currency = rates.find((c) => c.code === currencyCode);
  return currency?.symbol || currencyCode;
}
