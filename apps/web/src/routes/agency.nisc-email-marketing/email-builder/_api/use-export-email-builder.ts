import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { captureEvent } from "@/lib/posthog";

/**
 * Hook to export email builder design as HTML (client-side).
 * 
 * The export is done entirely on the user's device:
 * 1. Fetches the design HTML from the server
 * 2. Creates a blob and triggers browser download
 * 3. User can retry if network fails
 * 
 * No background jobs, no QStash, no operations tracking.
 */
export function useExportEmailBuilder() {
    const getDesignHtml = trpc.emailBuilder.getDesignHtml.useQuery(
        { designId: "" },
        { enabled: false } // Manual trigger only
    );

    const exportDesign = async (designId: string, fileName?: string) => {
        try {
            const result = await getDesignHtml.refetch({ 
                designId,
            });

            if (!result.data?.data?.html) {
                throw new Error("No HTML content to export");
            }

            const { html, name } = result.data.data;
            const blob = new Blob([html], { type: "text/html;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName || `${name || "email-design"}.html`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            captureEvent("email_design_exported", { export_format: "html" });
            toast.success("Export completed", {
                description: `Downloaded ${link.download}`,
            });
        } catch (error) {
            toast.error("Failed to export", {
                description: error instanceof Error ? error.message : "Please try again",
            });
        }
    };

    return {
        exportDesign,
        isExporting: getDesignHtml.isFetching,
    };
}
