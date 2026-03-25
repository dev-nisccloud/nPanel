"use client";

import { useQuery } from "@tanstack/react-query";

// Mock customer data based on what SelectCustomer expects
const mockCustomers = [
  {
    id: "customer-1",
    name: "Acme Corporation",
    email: "contact@acme.com",
    address: "123 Business St, City, State 12345",
    phone: "+1-555-0123",
  },
  {
    id: "customer-2", 
    name: "Tech Solutions Inc",
    email: "info@techsolutions.com",
    address: "456 Tech Ave, Tech City, TC 67890",
    phone: "+1-555-0456",
  },
  {
    id: "customer-3",
    name: "Global Enterprises",
    email: "hello@global.com", 
    address: "789 Global Blvd, World City, WC 11111",
    phone: "+1-555-0789",
  },
];

export function useCustomersQuery() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: () => Promise.resolve({
      data: mockCustomers,
      total: mockCustomers.length,
    }),
    staleTime: Infinity, // Mock data doesn't change
  });
}
