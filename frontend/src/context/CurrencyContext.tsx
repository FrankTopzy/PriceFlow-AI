import { createContext, useContext, useState, type ReactNode } from 'react';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'NGN';

export interface Currency {
  code: CurrencyCode;
  symbol: string;
  rate: number; // Rate relative to USD base of 1.0
}

export const CURRENCIES: Record<CurrencyCode, Currency> = {
  USD: { code: 'USD', symbol: '$', rate: 1.0 },
  EUR: { code: 'EUR', symbol: '€', rate: 0.92 },
  GBP: { code: 'GBP', symbol: '£', rate: 0.79 },
  NGN: { code: 'NGN', symbol: '₦', rate: 1150.0 }, // Mock conversion rate
};

interface CurrencyContextType {
  currencyCode: CurrencyCode;
  setCurrencyCode: (code: CurrencyCode) => void;
  formatPrice: (usdValue: number, includeDecimals?: boolean) => string;
  currency: Currency;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>('USD');
  const currency = CURRENCIES[currencyCode];

  const formatPrice = (usdValue: number, includeDecimals = true) => {
    const convertedValue = usdValue * currency.rate;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: includeDecimals ? 2 : 0,
      maximumFractionDigits: includeDecimals ? 2 : 0,
    }).format(convertedValue).replace(currency.code, currency.symbol).trim();
  };

  return (
    <CurrencyContext.Provider value={{ currencyCode, setCurrencyCode, formatPrice, currency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
