"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
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
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedCurrencyData = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency);

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className || ''}`}>
      {/* Main Currency Selector Button - Large and Prominent */}
      <Button
        variant="default"
        size="lg"
        className="h-16 px-8 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 hover:from-blue-700 hover:via-blue-800 hover:to-blue-700 text-white font-bold text-xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 border-0 rounded-2xl min-w-[240px] justify-between gap-5 ring-2 ring-blue-500/20 hover:ring-blue-400/40"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoadingRates || isConverting}
      >
        <div className="flex items-center gap-3">
          {(isLoadingRates || isConverting) ? (
            <Spinner variant="ellipsis" className="h-5 w-5 text-white" />
          ) : (
            <span className="text-2xl font-bold">
              {selectedCurrencyData?.symbol || '$'}
            </span>
          )}
          <div className="flex flex-col items-start">
            <span className="text-xl font-extrabold leading-tight tracking-wide">
              {selectedCurrency}
            </span>
            <span className="text-xs font-medium opacity-95 leading-tight">
              {selectedCurrencyData?.name || 'Currency'}
            </span>
          </div>
        </div>
        <ChevronDown 
          className={`h-6 w-6 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`} 
        />
      </Button>
    
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-4 w-72 bg-white border-2 border-blue-100 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-2">
            {SUPPORTED_CURRENCIES.map((currency) => {
              const isSelected = currency.code === selectedCurrency;
              return (
                <button
                  key={currency.code}
                  className={`w-full px-5 py-4 text-left rounded-xl transition-all duration-200 flex items-center gap-4 ${
                    isSelected 
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-bold border-2 border-blue-300 shadow-md' 
                      : 'hover:bg-gray-50 text-gray-700 hover:border-blue-200 border-2 border-transparent hover:shadow-sm'
                  }`}
                  onClick={() => {
                    setSelectedCurrency(currency.code);
                    setIsOpen(false);
                  }}
                >
                  <span className="text-3xl font-bold">
                    {currency.symbol}
                  </span>
                  <div className="flex flex-col items-start flex-1">
                    <span className={`text-base font-bold ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                      {currency.code}
                    </span>
                    <span className={`text-sm font-medium ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                      {currency.name}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="h-3 w-3 rounded-full bg-blue-600 shadow-lg ring-2 ring-blue-200"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
