import { useEffect } from "react";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { pleskSubdomainsResponseSchema, subdomainSchema } from "./subdomains-schema";

/**
 * Transform Plesk subdomains API response to component format
 */
function transformPleskSubdomainsToComponent(
  pleskResponse: z.infer<typeof pleskSubdomainsResponseSchema>
): z.infer<typeof subdomainSchema>[] {
  const results = pleskResponse.parsed.packet.subdomain.get.result;

  // Empty list: Plesk may return `{ status: "ok" }` with no `data` — skip fake "Unknown Subdomain" rows.
  return results
    .filter((result) => result.data != null)
    .map((result) => {
    const data = result.data!;

    // Extract properties from the property array
    const propertyArray = data.property || [];
    const propertyMap = propertyArray.reduce((acc, prop) => {
      if (prop.name && prop.value !== undefined) {
        acc[prop.name] = prop.value;
      }
      return acc;
    }, {} as Record<string, string | boolean>);

    return {
      id: result.id ?? 0,
      name: data.name ?? "Unknown Subdomain",
      parent: data.parent ?? "",
      status: result.status ?? "unknown",
      properties: {
        // Technology properties
        asp: propertyMap.asp === true,
        ssi: propertyMap.ssi === true,
        php: propertyMap.php === true,
        php_handler_id: typeof propertyMap.php_handler_id === "string" ? propertyMap.php_handler_id : undefined,
        cgi: propertyMap.cgi === true,
        perl: propertyMap.perl === true,
        python: propertyMap.python === true,
        fastcgi: propertyMap.fastcgi === true,
        // Security properties
        ssl: propertyMap.ssl === true,
        same_ssl: propertyMap.same_ssl === true,
        // Path properties
        www_root: typeof propertyMap.www_root === "string" ? propertyMap.www_root : undefined,
        // Statistics properties
        webstat: typeof propertyMap.webstat === "string" ? propertyMap.webstat : undefined,
        webstat_protected: typeof propertyMap.webstat_protected === "string" ? propertyMap.webstat_protected : undefined,
        empty_document_root: typeof propertyMap["empty-document-root"] === "string" ? propertyMap["empty-document-root"] : undefined,
      },
    };
  });
}

/**
 * Custom hook to fetch subdomains by domain name
 */
export function useSubdomainsByDomain(domainName: string) {
  const query = trpc.plesk.subdomains.getByParentDomain.useQuery(
    { domain: domainName },
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
          toast.error("Failed to fetch subdomains. Please try again.");
          break;
        default:
          toast.error("An unexpected error occurred while fetching subdomains.");
      }
    }
  }, [query.error]);

  // Transform the data
  let data: z.infer<typeof subdomainSchema>[] = [];
  let transformationError: Error | null = null;

  if (query.data) {
    try {
      // Validate the raw data against our schema
      const validatedData = pleskSubdomainsResponseSchema.parse(query.data);
      data = transformPleskSubdomainsToComponent(validatedData);
    } catch (error) {
      console.error("Subdomain data transformation error:", error);
      transformationError = error instanceof Error ? error : new Error("Unknown transformation error");
      
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", error.issues);
        toast.error("Subdomain data validation failed. Some fields may be missing or invalid.");
      } else {
        toast.error("Failed to process subdomain data. Please try again.");
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
