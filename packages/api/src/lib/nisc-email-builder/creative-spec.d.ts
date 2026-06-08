import { z } from "zod";
import type { NebBrief } from "./types";
import { imageSlotSchema } from "./types";
import type Replicate from "replicate";
export type CreativeDesignSpec = {
    designSpecification: string;
    subject: string;
    preheader: string;
    imageSlots: z.infer<typeof imageSlotSchema>[];
};
export declare function generateCreativeDesignSpec(params: {
    replicate: Replicate;
    brief: NebBrief;
    brandBlock: string;
    creativeDesignUrl: string;
    designNotes?: string;
    webContext?: string | null;
}): Promise<CreativeDesignSpec>;
