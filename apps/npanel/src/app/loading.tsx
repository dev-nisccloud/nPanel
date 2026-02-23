import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { APP_CONFIG } from "@/config/app-config";

/**
 * Root loading UI – shown while the root segment is loading (e.g. redirect being computed).
 * Uses explicit colors (slate) so it's visible on first paint and never a white screen.
 */
export default function RootLoading() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <Spinner variant="infinite" className="text-primary" size={40} />
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-lg font-semibold">Loading…</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">{APP_CONFIG.name}</p>
      </div>
    </div>
  );
}
