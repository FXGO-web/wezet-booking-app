import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Badge } from "./ui/badge";
import { Calendar } from "./ui/calendar";
import {
  Filter,
  X,
  Search,
  Calendar as CalendarIcon,
  Download,
  RotateCcw,
  Star,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'dateRange' | 'number';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface FilterValues {
  [key: string]: any;
}

interface AdvancedFiltersProps {
  filters: FilterConfig[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onReset: () => void;
  onExport?: () => void;
  searchPlaceholder?: string;
  showExport?: boolean;
  showSaveFilter?: boolean;
}

export function AdvancedFilters({
  filters,
  values,
  onChange,
  onReset,
  onExport,
  searchPlaceholder = "Search...",
  showExport = true,
  showSaveFilter = false,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(values.search || "");

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      onChange({ ...values, search: value });
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const handleFilterChange = (key: string, value: any) => {
    onChange({ ...values, [key]: value });
  };

  const handleRemoveFilter = (key: string) => {
    const newValues = { ...values };
    delete newValues[key];
    onChange(newValues);
  };

  const activeFiltersCount = Object.keys(values).filter(
    key => key !== 'search' && values[key] !== undefined && values[key] !== ''
  ).length;

  const getFilterLabel = (key: string, value: any) => {
    const filter = filters.find(f => f.key === key);
    if (!filter) return null;

    if (filter.type === 'select' && filter.options) {
      const option = filter.options.find(o => o.value === value);
      return option ? option.label : value;
    }

    if (filter.type === 'date') {
      return new Date(value).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric' 
      });
    }

    return value;
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search Bar and Filter Button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>

            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="ml-2 h-5 min-w-5 px-1 bg-primary text-white"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Advanced Filters</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onReset();
                        setSearchValue("");
                      }}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {filters.map((filter) => (
                      <div key={filter.key} className="space-y-1.5">
                        <Label className="text-xs">{filter.label}</Label>
                        
                        {filter.type === 'text' && (
                          <Input
                            value={values[filter.key] || ''}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                            placeholder={filter.placeholder}
                          />
                        )}

                        {filter.type === 'number' && (
                          <Input
                            type="number"
                            value={values[filter.key] || ''}
                            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                            placeholder={filter.placeholder}
                          />
                        )}

                        {filter.type === 'select' && filter.options && (
                          <Select
                            value={values[filter.key] || ''}
                            onValueChange={(value) => handleFilterChange(filter.key, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={filter.placeholder || 'Select...'} />
                            </SelectTrigger>
                            <SelectContent>
                              {filter.options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {filter.type === 'date' && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {values[filter.key] ? (
                                  new Date(values[filter.key]).toLocaleDateString()
                                ) : (
                                  <span className="text-muted-foreground">Pick a date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={values[filter.key] ? new Date(values[filter.key]) : undefined}
                                onSelect={(date) => handleFilterChange(filter.key, date?.toISOString())}
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    ))}
                  </div>

                  {showSaveFilter && (
                    <Button variant="outline" size="sm" className="w-full">
                      <Star className="h-3 w-3 mr-2" />
                      Save Filter Preset
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {showExport && onExport && (
              <Button variant="outline" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>

          {/* Active Filters Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(values).map(([key, value]) => {
                if (key === 'search' || !value) return null;
                
                const filter = filters.find(f => f.key === key);
                if (!filter) return null;

                return (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/20 pr-1"
                  >
                    <span className="text-xs">
                      {filter.label}: {getFilterLabel(key, value)}
                    </span>
                    <button
                      onClick={() => handleRemoveFilter(key)}
                      className="ml-1 hover:bg-primary/30 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onReset();
                  setSearchValue("");
                }}
                className="h-6 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
