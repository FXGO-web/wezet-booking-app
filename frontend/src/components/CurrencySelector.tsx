import { useCurrency } from "../context/CurrencyContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Globe } from "lucide-react";

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-2">
      <Select value={currency} onValueChange={setCurrency}>
        <SelectTrigger className="w-[100px] h-9 bg-background/50 backdrop-blur border-muted">
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="Currency" />
          </div>
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="EUR">EUR (€)</SelectItem>
          <SelectItem value="DKK">DKK (kr)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}