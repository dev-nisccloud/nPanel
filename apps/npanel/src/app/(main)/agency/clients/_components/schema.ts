import { z } from "zod";

export const clientSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  companyName: z.string().nullable().optional(),
  email: z.string().email(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postCode: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  howDidYouFindUs: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  stateRegion: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type Client = z.infer<typeof clientSchema>;
