import { Calendar, Key, Unlock } from "lucide-react";

export function TransferPrerequisites() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Get your domain ready</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Check these three things before you start. If any step is unclear, our team can walk you through it.
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">It is old enough to move</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Most domains need 60 or more days since registration or the last transfer before they can move again.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Unlock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Transfer lock is off</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Turn off transfer lock at your current provider. If you cannot find the setting, ask them or contact us for help.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">You have an authorization code</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get a transfer (EPP) code from your current provider. You will enter it on the cart page before payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
