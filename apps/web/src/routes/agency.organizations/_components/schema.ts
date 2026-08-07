import { z } from "zod";

export const teamSchema = z.object({
  id: z.number(),
  teamName: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  status: z.enum(["active", "inactive", "suspended"]),
});

export type Team = z.infer<typeof teamSchema>;
