import { useEffect } from "react";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { pleskEmailsResponseSchema, emailAccountSchema } from "./emails-schema";

/**
 * Transform Plesk emails API response to component format
 */
function transformPleskEmailsToComponent(
  pleskResponse: z.infer<typeof pleskEmailsResponseSchema>
): z.infer<typeof emailAccountSchema>[] {
  const results = pleskResponse.parsed.packet.mail["get_info"].result;

  // Empty mailbox list: Plesk returns `{ status: "ok" }` only; schema wraps it as one
  // result with no mailname — do not synthesize a fake "Unknown Email" row.
  return results
    .filter((result) => result.mailname != null)
    .map((result) => {
    const mailname = result.mailname!;

    // Handle forwarding addresses (can be string or array)
    const forwardingAddresses = mailname.forwarding?.address;
    const addresses = Array.isArray(forwardingAddresses) 
      ? forwardingAddresses 
      : forwardingAddresses 
        ? [forwardingAddresses] 
        : [];

    // Handle aliases (can be string or array)
    const aliases = mailname.alias;
    const aliasArray = Array.isArray(aliases) 
      ? aliases 
      : aliases 
        ? [aliases] 
        : [];

    return {
      id: mailname.id ?? 0,
      name: mailname.name ?? "Unknown Email",
      mailbox: {
        enabled: mailname.mailbox?.enabled ?? false,
        quota: mailname.mailbox?.quota ?? -1,
        usage: mailname.mailbox?.usage ?? 0,
      },
      forwarding: {
        enabled: mailname.forwarding?.enabled ?? false,
        addresses: addresses,
      },
      aliases: aliasArray,
      autoresponder: {
        enabled: mailname.autoresponder?.enabled ?? false,
        subject: mailname.autoresponder?.subject ?? "",
        content_type: mailname.autoresponder?.content_type ?? "text/plain",
        charset: mailname.autoresponder?.charset ?? "UTF-8",
        text: mailname.autoresponder?.text ?? "",
        end_date: mailname.autoresponder?.end_date ?? "",
      },
      password: {
        value: mailname.password?.value ?? "",
        type: mailname.password?.type ?? "sym",
      },
      antivir: mailname.antivir ?? "off",
      description: mailname.description ?? "",
      outgoingMessagesLimit: mailname["outgoing-messages-mbox-limit"] ? 
        (typeof mailname["outgoing-messages-mbox-limit"] === 'string' ? 
          parseInt(mailname["outgoing-messages-mbox-limit"], 10) : 
          mailname["outgoing-messages-mbox-limit"]) : undefined,
      userGuid: mailname["user-guid"] ?? "",
      status: result.status ?? "unknown",
    };
  });
}

/**
 * Custom hook to fetch emails by site ID
 */
export function useEmailsBySiteId(siteId: number) {
  const query = trpc.plesk.emails.getBySiteId.useQuery(
    { siteId },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: (failureCount, error: any) => {
        // Don't retry on authentication or service unavailable errors
        if (error?.data?.code === 'UNAUTHORIZED' || error?.data?.code === 'SERVICE_UNAVAILABLE') {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );

  // Handle API errors with user-friendly messages
  useEffect(() => {
    if (query.error) {
      const error = query.error as any;
      const errorCode = error?.data?.code;
      
      switch (errorCode) {
        case 'UNAUTHORIZED':
          toast.error("Authentication failed. Please check your credentials.");
          break;
        case 'SERVICE_UNAVAILABLE':
          toast.error("Plesk service is currently unavailable. Please try again later.");
          break;
        case 'INTERNAL_SERVER_ERROR':
          toast.error("Failed to fetch email accounts. Please try again.");
          break;
        default:
          toast.error("An unexpected error occurred while fetching email accounts.");
      }
    }
  }, [query.error]);

  // Transform the data
  let data: z.infer<typeof emailAccountSchema>[] = [];
  let transformationError: Error | null = null;

  if (query.data) {
    try {
      // Validate the raw data against our schema
      const validatedData = pleskEmailsResponseSchema.parse(query.data);
      data = transformPleskEmailsToComponent(validatedData);
    } catch (error) {
      console.error("Email data transformation error:", error);
      transformationError = error instanceof Error ? error : new Error("Unknown transformation error");
      
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.issues);
        toast.error("Email data validation failed. Some fields may be missing or invalid.");
      } else {
        toast.error("Failed to process email data. Please try again.");
      }
    }
  }

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError || !!transformationError,
    error: query.error || transformationError,
    refetch: query.refetch,
    rawData: query.data,
  };
}
