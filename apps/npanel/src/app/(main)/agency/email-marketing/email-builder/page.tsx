"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TemplatePanel } from "./_components/email-builder/template-panel";
import { InspectorDrawer } from "./_components/email-builder/inspector";

export default function EmailBuilderPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.12)-theme(spacing.12))] -m-4 md:-m-6">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/agency/email-marketing" title="Back to Email Marketing">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Email Builder
            </h1>
            <p className="text-xs text-muted-foreground">
              Custom drag-and-drop editor to design emails
            </p>
          </div>
        </div>
      </div>

      {/* Builder Core */}
      <div className="flex flex-1 overflow-hidden">
        <TemplatePanel />
        <InspectorDrawer />
      </div>
    </div>
  );
}
