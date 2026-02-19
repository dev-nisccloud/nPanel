import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { APP_CONFIG } from "@/config/app-config";

/**
 * Root loading UI – shown while the root segment is loading (e.g. compiling or resolving).
 * Replaces a blank screen or browser error with a clear "Preparing your app..." state.
 */
export default function RootLoading() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <Spinner variant="infinite" className="text-primary" size={40} />
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-lg font-semibold text-foreground">
          Preparing your app...
        </p>
        <p className="text-sm text-muted-foreground">{APP_CONFIG.name}</p>
      </div>
    </div>
  );
}
