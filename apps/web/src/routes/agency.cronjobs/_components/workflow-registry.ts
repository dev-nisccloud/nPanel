import { CRON_JOB_KEYS } from "./jobs";

export type WorkflowRegistryEntry = {
  jobKey: string;
  label: string;
};

/** Workflows available from "New workflow run" (extend as you add jobs). */
export const WORKFLOW_REGISTRY: WorkflowRegistryEntry[] = [
  {
    jobKey: CRON_JOB_KEYS.MEDIA_BUYING_EOM_TOTAL_SPEND_INVOICES,
    label: "Media Buying",
  },
];

export function workflowLabelForJobKey(jobKey: string): string {
  return WORKFLOW_REGISTRY.find((w) => w.jobKey === jobKey)?.label ?? jobKey;
}
