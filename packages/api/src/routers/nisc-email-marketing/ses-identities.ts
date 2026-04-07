import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSesClient } from "../../lib/ses-client";
import { protectedProcedure, router } from "../../trpc";

const listInputSchema = z
  .object({
    identityType: z.enum(["Domain", "EmailAddress"]).optional(),
    /** SES returns up to 1000 per page; this caps how many pages we fetch (safety). */
    maxPages: z.number().int().min(1).max(100).optional(),
  })
  .optional()
  .default({});

export const niscEmailMarketingSesIdentitiesRouter = router({
  list: protectedProcedure.input(listInputSchema).query(async ({ input }) => {
    const identityType = input.identityType ?? "Domain";
    const maxPages = input.maxPages ?? 50;
    const ses = getSesClient();

    const identities: string[] = [];
    let marker: string | undefined;
    let pages = 0;

    try {
      do {
        const res = await ses.listIdentities({
          IdentityType: identityType,
          MaxItems: 1000,
          Marker: marker,
        });
        identities.push(...(res.Identities ?? []));
        marker = res.NextMarker;
        pages += 1;
        if (pages >= maxPages) break;
      } while (marker);
    } catch (e) {
      const message = e instanceof Error ? e.message : "SES ListIdentities failed";
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
    }

    return {
      identityType,
      identities,
      count: identities.length,
      truncated: Boolean(marker),
    };
  }),
});
