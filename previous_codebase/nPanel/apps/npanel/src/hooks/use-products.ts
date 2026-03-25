"use client";

import { useQuery } from "@tanstack/react-query";

// Mock product data based on what ProductAutocomplete expects
const mockProducts = [
  {
    id: "product-1",
    name: "Web Development",
    description: "Custom web application development",
    price: 150,
    currency: "USD",
    unit: "hour",
    usageCount: 15,
  },
  {
    id: "product-2",
    name: "Consulting Services",
    description: "Technical consulting and advisory",
    price: 200,
    currency: "USD", 
    unit: "hour",
    usageCount: 8,
  },
  {
    id: "product-3",
    name: "Hosting Service",
    description: "Cloud hosting and maintenance",
    price: 99,
    currency: "USD",
    unit: "month",
    usageCount: 25,
  },
  {
    id: "product-4",
    name: "Domain Registration",
    description: "Domain name registration service",
    price: 15,
    currency: "USD",
    unit: "year",
    usageCount: 12,
  },
];

export function useProductsQuery(currency?: string) {
  return useQuery({
    queryKey: ["products", currency],
    queryFn: () => Promise.resolve(
      currency 
        ? mockProducts.filter(p => p.currency === currency)
        : mockProducts
    ),
    staleTime: Infinity, // Mock data doesn't change
  });
}
