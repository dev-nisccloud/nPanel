import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { computeStorefrontCartQuote, isDomainYearlyBillingCycle, storefrontCartMainLineSchema, storefrontCartQuoteInputSchema, } from "./storefront-cart-pricing";
import { handoffPayloadToQuoteMain, verifyStorefrontCartHandoff, } from "./storefront-cart-handoff";
export const storefrontCartQuoteRequestSchema = z
    .object({
    handoff: z.string().min(1).optional(),
    main: storefrontCartMainLineSchema.partial().optional(),
    transferAuthCode: storefrontCartQuoteInputSchema.shape.transferAuthCode,
    upsellDomain: storefrontCartQuoteInputSchema.shape.upsellDomain,
    upsellHosting: storefrontCartQuoteInputSchema.shape.upsellHosting,
    hivelocity: storefrontCartQuoteInputSchema.shape.hivelocity,
})
    .superRefine((data, ctx) => {
    if (!data.handoff && !data.main?.serviceType) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Cart handoff token or main line is required.",
            path: ["handoff"],
        });
    }
});
export function resolveStorefrontCartQuoteInput(input) {
    if (input.handoff) {
        const verified = verifyStorefrontCartHandoff(input.handoff);
        if (!verified.ok) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: verified.reason === "expired"
                    ? "This checkout link has expired. Please select your plan again."
                    : "Invalid checkout link. Please select your plan again.",
            });
        }
        const baseMain = handoffPayloadToQuoteMain(verified.payload);
        const mergedMain = {
            ...baseMain,
            ...(input.main ?? {}),
            serviceType: input.main?.serviceType ?? baseMain.serviceType,
            billingCycle: input.main?.billingCycle ?? baseMain.billingCycle,
        };
        // Transfers are always 1 year. Domain registration allows multi-year terms (never monthly).
        if (mergedMain.serviceType === "domain_transfer") {
            mergedMain.billingCycle = "YEARLY";
        }
        else if (mergedMain.serviceType === "domain_registration") {
            mergedMain.billingCycle = isDomainYearlyBillingCycle(mergedMain.billingCycle)
                ? mergedMain.billingCycle
                : "YEARLY";
        }
        return storefrontCartQuoteInputSchema.parse({
            main: mergedMain,
            transferAuthCode: input.transferAuthCode,
            upsellDomain: input.upsellDomain,
            upsellHosting: input.upsellHosting,
            hivelocity: input.hivelocity,
        });
    }
    return storefrontCartQuoteInputSchema.parse({
        main: input.main,
        transferAuthCode: input.transferAuthCode,
        upsellDomain: input.upsellDomain,
        upsellHosting: input.upsellHosting,
        hivelocity: input.hivelocity,
    });
}
