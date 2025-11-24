import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CURRENCIES, convertCurrency, formatCurrency } from '../utils/currency';

interface CurrencyContextType {
    currency: string;
    setCurrency: (code: string) => void;
    convertAndFormat: (amount: number, fromCurrency?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
    // Try to get saved currency from localStorage, default to EUR
    const [currency, setCurrencyState] = useState(() => {
        const saved = localStorage.getItem('wezet_currency');
        return saved || 'EUR';
    });

    const setCurrency = (code: string) => {
        setCurrencyState(code);
        localStorage.setItem('wezet_currency', code);
    };

    const convertAndFormat = (amount: number, fromCurrency: string = 'EUR') => {
        const converted = convertCurrency(amount, fromCurrency, currency);
        return formatCurrency(converted, currency);
    };

    return (
        <CurrencyContext.Provider value={{ currency, setCurrency, convertAndFormat }}>
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
