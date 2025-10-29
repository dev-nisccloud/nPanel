import { z } from "zod";

export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  role: z.enum(["CUSTOMER", "AGENCY_ADMIN", "AGENCY_SUPER_ADMIN", "AGENCY_USER"]),
  status: z.enum(["active", "suspended", "banned", "deactivated"]),
  lastLoginAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type User = z.infer<typeof userSchema>;
