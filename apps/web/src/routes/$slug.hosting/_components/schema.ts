import { z } from "zod";

export {
  pleskSubscriptionResponseSchema,
  hostingSubscriptionSchema,
} from "@/components/hosting/plesk-subscription-list-schema";
export type {
  PleskSubscriptionResponse,
  HostingSubscription,
} from "@/components/hosting/plesk-subscription-list-schema";

/** Shape returned by clientSubscriptions.listForTeamHosting (customer hosting list from NiscClientSubscription). */
export const customerHostingListSchema = z.object({
  id: z.string(),
  pleskSubscriptionId: z.string().nullable(),
  subscriptionName: z.string().nullable(),
  status: z.string(),
  productName: z.string().optional(),
  productPlanName: z.string().nullable().optional(),
  /** ISO date strings from API (tRPC serializes dates as strings over the wire) */
  subscriptionDate: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  primaryDomain: z.string().nullable().optional(),
});

export type CustomerHostingListItem = z.infer<typeof customerHostingListSchema>;
