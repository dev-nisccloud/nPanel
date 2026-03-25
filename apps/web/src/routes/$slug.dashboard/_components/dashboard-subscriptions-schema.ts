/**
 * Customer dashboard subscriptions tab Ã¢â‚¬â€ local schema only.
 * Independent from API/client-subscriptions layer; map API responses to these types here.
 */

export type DashboardSubscriptionStatus =
  | "ACTIVE"
  | "PENDING"
  | "SUSPENDED"
  | "CANCELLED"
  | "EXPIRED"
  | "PROCESSING"
  | "FAILED"
  | "UPGRADED"
  | "DOWNGRADED";

export interface DashboardSubscriptionRow {
  id: string;
  planName: string;
  planType: string;
  subscriptionDate: Date | null;
  nextRenewalDate: Date | null;
  status: DashboardSubscriptionStatus;
}
