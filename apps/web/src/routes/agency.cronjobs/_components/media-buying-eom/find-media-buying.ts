"use client";

import type { Product } from "./types";

export function findMediaBuyingProduct(products: Product[]) {
  const needle = "media buying";
  return (
    products.find((p) => p.name.toLowerCase().includes(needle)) ??
    products.find((p) => p.serviceType.toLowerCase().includes(needle)) ??
    null
  );
}

