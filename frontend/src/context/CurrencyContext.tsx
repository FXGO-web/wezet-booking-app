import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Currency, DEFAULT_CURRENCIES, convertCurrency, formatCurrency } from '../utils/currency';

interface CurrencyContextType {
    currency: string;
    setCurrency: (code: string) => void;
    convertAndFormat: (amount: number, fromCurrency?: string) => string;
    formatFixedPrice: (fixedPrices: Record<string, number> | null, defaultPrice?: number, defaultCurrency?: string) => string;
    rates: Currency[];
    isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrencyState] = useState(() => {
        const saved = localStorage.getItem('wezet_currency');
        return saved || 'EUR';
    });
    const [rates, setRates] = useState<Currency[]>(DEFAULT_CURRENCIES);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch live rates on mount
    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
                const data = await res.json();

                if (data && data.rates) {
                    // Update rates based on API
                    const updatedRates = DEFAULT_CURRENCIES.map(c => ({
                        ...c,
                        rate: data.rates[c.code] || c.rate // Use API rate or fallback
                    }));
                    setRates(updatedRates);
                    console.log("Updated currency rates:", updatedRates);
                }
            } catch (error) {
                console.error("Failed to fetch exchange rates, using defaults:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRates();
    }, []);

    const setCurrency = (code: string) => {
        setCurrencyState(code);
        localStorage.setItem('wezet_currency', code);
    };

    const convertAndFormat = (amount: number, fromCurrency: string = 'EUR') => {
        const converted = convertCurrency(amount, fromCurrency, currency, rates);
        return formatCurrency(converted, currency, rates);
    };

    /**
     * Resolves the price based on current currency and available fixed prices.
     * @param fixedPrices Map of currency code to price (e.g., { "EUR": 100, "DKK": 750 })
     * @param defaultPrice Fallback price (legacy)
     * @param defaultCurrency Fallback currency (legacy)
     */
    const formatFixedPrice = (fixedPrices: Record<string, number> | null, defaultPrice?: number, defaultCurrency: string = 'EUR') => {
        // 1. Try to find exact match for current currency
        if (fixedPrices && fixedPrices[currency] !== undefined) {
            return formatCurrency(fixedPrices[currency], currency, rates);
        }

        // 2. If no exact match, try to convert from valid fixed price (e.g. if we have EUR but user wants USD)
        // Prefer EUR as base if available
        if (fixedPrices && fixedPrices['EUR'] !== undefined) {
            const converted = convertCurrency(fixedPrices['EUR'], 'EUR', currency, rates);
            return formatCurrency(converted, currency, rates);
        }

        // 3. Fallback to legacy single price
        if (defaultPrice !== undefined) {
            const converted = convertCurrency(defaultPrice, defaultCurrency, currency, rates);
            return formatCurrency(converted, currency, rates);
        }

        return formatCurrency(0, currency, rates);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, convertAndFormat, formatFixedPrice, rates, isLoading }}>
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
