"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, ChevronDown } from "lucide-react";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useCurrency, SUPPORTED_CURRENCIES } from "./currency-context";

interface CurrencySelectorProps {
  className?: string;
}

export function CurrencySelector({ className }: CurrencySelectorProps) {
  const { 
    selectedCurrency, 
    setSelectedCurrency, 
    isConversionAvailable, 
    isLoadingRates,
    isConverting 
  } = useCurrency();
  const [isOpen, setIsOpen] = React.useState(false);

  // Compute status efficiently
  const conversionStatus = React.useMemo(() => {
    if (isLoadingRates) {
      return {
        message: 'Loading exchange rates...',
        type: 'warning' as const,
      };
    }
    if (isConverting) {
      return {
        message: 'Converting prices...',
        type: 'warning' as const,
      };
    }
    if (!isConversionAvailable) {
      return {
        message: 'Currency conversion unavailable',
        type: 'warning' as const,
      };
    }
    return {
      message: 'Currency conversion active',
      type: 'success' as const,
    };
  }, [isConversionAvailable, isLoadingRates, isConverting]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Currency Label */}
      <span className="text-sm font-medium text-muted-foreground">Currency:</span>
      
       {/* Custom Currency Selector - No Select component */}
       <div className="relative">
         <Button
           variant="outline"
           className="w-40 justify-between"
           onClick={() => setIsOpen(!isOpen)}
           disabled={isLoadingRates || isConverting}
         >
           <div className="flex items-center gap-2">
             {(isLoadingRates || isConverting) ? (
               <Spinner variant="ellipsis" className="h-4 w-4" />
             ) : (
               <span className="font-medium">
                 {SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency)?.symbol || '$'}
               </span>
             )}
             <span>{selectedCurrency}</span>
           </div>
           <ChevronDown className="h-4 w-4 opacity-50" />
         </Button>
        
         {isOpen && (
           <div className="absolute top-full left-0 z-50 w-40 mt-1 bg-popover border border-border rounded-md shadow-lg">
             {SUPPORTED_CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 text-sm"
                onClick={() => {
                  setSelectedCurrency(currency.code);
                  setIsOpen(false);
                }}
              >
                <span className="font-medium">{currency.symbol}</span>
                <span>{currency.code}</span>
                <span className="text-muted-foreground text-xs">
                  {currency.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Static Status Indicators - No reactive updates */}
      <div className="flex items-center gap-2">
        {/* Conversion Status */}
        <div className="flex items-center gap-1">
          {conversionStatus.type === 'success' && (
            <CheckCircle className="h-3 w-3 text-green-500" />
          )}
          {conversionStatus.type === 'warning' && (
            <AlertCircle className="h-3 w-3 text-yellow-500" />
          )}
          <span className={`text-xs ${
            conversionStatus.type === 'success' ? 'text-green-600' :
            'text-yellow-600'
          }`}>
            {conversionStatus.message}
          </span>
        </div>
      </div>
    </div>
  );
}
