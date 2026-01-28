"use client";

import { Calendar, Key, Unlock } from "lucide-react";

export function TransferPrerequisites() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Get your domain ready for transfer</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Make sure these conditions are met before starting the transfer.
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">The domain can be transferred</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              It&apos;s been 60+ days since its registration or latest transfer.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Unlock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">The domain is unlocked</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Transfer lock must be off at your current provider.{" "}
              <a
                href="https://support.openprovider.eu/hc/en-us/articles/360019068300-Whois-Statuses-Explained"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4 hover:no-underline"
              >
                Here&apos;s how to unlock a domain
              </a>
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
              Get a transfer (EPP) code from your current provider. You&apos;ll enter it when completing the purchase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
