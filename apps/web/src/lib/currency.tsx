import {
  US,
  EU,
  KE,
} from "country-flag-icons/react/1x1";

export const currencyList: {
  value: string;
  label: string;
  details: {
    country: string;
    currencySymbol: string;
    currencyName: string;
    currencyShortForm: string;
    icon: any;
    iconName: string;
  };
}[] = [
  {
    value: "USD",
    label: "USD",
    details: {
      country: "United States",
      currencySymbol: "$",
      currencyName: "United States Dollar",
      currencyShortForm: "USD",
      icon: US,
      iconName: "US",
    },
  },
  {
    value: "EUR",
    label: "EUR",
    details: {
      country: "European Union",
      currencySymbol: "Ã¢â€šÂ¬",
      currencyName: "Euro",
      currencyShortForm: "EUR",
      icon: EU,
      iconName: "EU",
    },
  },
  {
    value: "KES",
    label: "KES",
    details: {
      country: "Kenya",
      currencySymbol: "KSh",
      currencyName: "Kenyan Shilling",
      currencyShortForm: "KES",
      icon: KE,
      iconName: "KE",
    },
  },
];
