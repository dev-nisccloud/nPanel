import { z } from "zod";

import { ingestWebsiteLead } from "../../lib/website-lead-ingest";
import { publicProcedure, router } from "../../trpc";

const submitLeadSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(200).optional(),
  service: z.string().trim().max(80).optional(),
  serviceName: z.string().trim().max(200).optional(),
  budget: z.string().trim().max(40).optional(),
  message: z.string().trim().max(5000).optional(),
  plan: z.string().trim().max(200).optional(),
  planPrice: z.string().trim().max(40).optional(),
  source: z.enum(["contact", "chat"]).default("contact"),
});

export const storefrontLeadsRouter = router({
  submit: publicProcedure.input(submitLeadSchema).mutation(async ({ input }) => {
    return ingestWebsiteLead(input);
  }),
});
