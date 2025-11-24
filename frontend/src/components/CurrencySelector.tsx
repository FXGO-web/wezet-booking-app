import { useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Globe, Check } from "lucide-react";
import { CURRENCIES } from "../utils/currency";

export interface CurrencySelectorProps {
  selectedCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
}

export function CurrencySelector({
  selectedCurrency = "EUR",
  onCurrencyChange,
}: CurrencySelectorProps) {
  const [currency, setCurrency] = useState(selectedCurrency);

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    onCurrencyChange?.(newCurrency);
  };

  const currentCurrency = CURRENCIES.find((c) => c.code === currency);

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span>{currentCurrency?.code}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {CURRENCIES.map((curr) => (
            <DropdownMenuItem
              key={curr.code}
              onClick={() => handleCurrencyChange(curr.code)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{curr.symbol}</span>
                <div>
                  <div>{curr.code}</div>
                  <div className="text-xs text-muted-foreground">
                    {curr.name}
                  </div>
                </div>
              </div>
              {currency === curr.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <p className="text-sm text-muted-foreground">
        Prices shown in {currentCurrency?.name}
      </p>
    </div>
  );
}