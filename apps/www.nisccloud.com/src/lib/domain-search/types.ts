export interface DomainSearchResult {
  domain: string;
  status: string;
  reason?: string;
  price?: {
    product: { price: number; currency: string };
    reseller: { price: number; currency: string };
    calculated?: CalculatedPrice;
  };
}

export interface CalculatedPrice {
  originalPrice: number;
  marginAmount: number;
  finalPrice: number;
  currency: string;
  marginType: string | null;
  marginValue: string | null;
  convertedPrice?: number;
  convertedOriginalPrice?: number;
  exchangeRate?: number;
  displayCurrency?: string;
}

export interface MarginConfig {
  marginType: string | null;
  percentageMargin: string | null;
  fixedMargin: string | null;
  roundOff: string | null;
}

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}
