/**
 * Mock reference data for the product creation wizard.
 * Replace with real API calls when integrating.
 */

export interface StatusOption {
  code: string;
  description: string;
}

export interface CountryOption {
  code: string;
  description: string;
}

export interface CurrencyOption {
  code: string;
  description: string;
}

export const MOCK_STATUSES: StatusOption[] = [
  { code: "DESIGN", description: "Design" },
  { code: "FINAL", description: "Final" },
  { code: "DELETE", description: "Delete" },
  { code: "WITHDRAW", description: "Withdrawn" },
];

export const MOCK_COUNTRIES: CountryOption[] = [
  { code: "IE", description: "Ireland" },
  { code: "UK", description: "United Kingdom" },
  { code: "US", description: "United States" },
  { code: "DE", description: "Germany" },
  { code: "FR", description: "France" },
];

/** Currencies per country (mock). When country changes, we use this to filter. */
export const MOCK_CURRENCIES_BY_COUNTRY: Record<string, CurrencyOption[]> = {
  IE: [
    { code: "EUR", description: "Euro" },
    { code: "GBP", description: "British Pound" },
  ],
  UK: [
    { code: "GBP", description: "British Pound" },
    { code: "EUR", description: "Euro" },
  ],
  US: [
    { code: "USD", description: "US Dollar" },
  ],
  DE: [
    { code: "EUR", description: "Euro" },
  ],
  FR: [
    { code: "EUR", description: "Euro" },
  ],
};

/** All currencies for fallback / when no country selected */
export const MOCK_ALL_CURRENCIES: CurrencyOption[] = [
  { code: "EUR", description: "Euro" },
  { code: "GBP", description: "British Pound" },
  { code: "USD", description: "US Dollar" },
];

export function getCurrenciesForCountry(countryCode: string | undefined): CurrencyOption[] {
  if (!countryCode) return MOCK_ALL_CURRENCIES;
  return MOCK_CURRENCIES_BY_COUNTRY[countryCode] ?? MOCK_ALL_CURRENCIES;
}

/** Mock: check if productId already exists (always false for now). */
export function mockProductIdExists(_productId: string): boolean {
  return false;
}

// --- Extended mocks for all wizard steps ---

export interface StateOption {
  code: string;
  description: string;
}

export const MOCK_STATES_US: StateOption[] = [
  { code: "CA", description: "California" },
  { code: "NY", description: "New York" },
  { code: "TX", description: "Texas" },
  { code: "FL", description: "Florida" },
  { code: "IL", description: "Illinois" },
];

export const MOCK_POLICY_TYPES = [
  { code: "STANDARD", description: "Standard" },
  { code: "PERPETUAL", description: "Perpetual" },
];

export const MOCK_REFUND_TYPES = [
  { code: "PRO_RATA", description: "Pro rata" },
  { code: "SHORT_RATE", description: "Short rate" },
];

export const MOCK_RENEWAL_TYPES = [
  { code: "AUTO", description: "Automatic" },
  { code: "MANUAL", description: "Manual" },
];

export const MOCK_COVERAGE_VARIANT_TYPES = [
  { code: "CORE", description: "Core" },
  { code: "OPTIONAL", description: "Optional" },
];

export const MOCK_ATTRIBUTE_TYPES = [
  { code: "STRING", description: "Text" },
  { code: "NUMBER", description: "Number" },
  { code: "BOOLEAN", description: "Yes/No" },
];

export const MOCK_BREAK_DOWN_TYPES = [
  { code: "COVGVAR", description: "By coverage variant" },
  { code: "STDCOVER", description: "By standard cover" },
];

/** Mock product versions for overview step */
export const MOCK_PRODUCT_VERSIONS = [
  { id: "1.0", label: "1.0" },
  { id: "2.0", label: "2.0" },
];
