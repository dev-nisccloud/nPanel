import { useEffect } from "react";
import { initCartStorageSync } from "@npanel/cart-store";

/** Keeps the in-memory cart in sync with shared storage (dashboard ↔ landing page). */
export function CartStorageSync() {
  useEffect(() => initCartStorageSync(), []);
  return null;
}
