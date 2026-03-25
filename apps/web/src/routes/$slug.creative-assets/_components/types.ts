import { z } from "zod";
import { creativeAssetStatusSchema, versionApprovalStatusSchema } from "./schema";

export type CreativeAssetStatus = z.infer<typeof creativeAssetStatusSchema>;
export type VersionApprovalStatus = z.infer<typeof versionApprovalStatusSchema>;

