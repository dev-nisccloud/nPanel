import { Link } from "react-router";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmailMarketingPage() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-base font-semibold tracking-tight">Email Marketing</h1>
          <p className="text-xs text-muted-foreground">
            Manage campaigns, audiences, templates, and build emails.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/agency/email-marketing/email-builder">
            <div className="rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50">
              <Mail className="mb-2 h-8 w-8 text-muted-foreground" />
              <h3 className="font-medium">Email Builder</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create and design emails with the drag-and-drop editor.
              </p>
              <Button variant="link" className="mt-2 h-auto p-0" asChild>
                <span>Open builder →</span>
              </Button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
