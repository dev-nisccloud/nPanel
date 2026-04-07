"use client";

import * as React from "react";
import { Link, useParams } from "react-router";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Spinner } from "@/components/ui/shadcn-io/spinner";

import { useGetEmailBuilderDesign } from "@/routes/agency.email-marketing/email-builder/_api/use-get-email-builder-design";
import { TemplatePanel } from "@/routes/agency.email-marketing/email-builder/_components/email-builder/template-panel";
import { InspectorDrawer } from "@/routes/agency.email-marketing/email-builder/_components/email-builder/inspector";
import { EditorHeader } from "@/routes/agency.email-marketing/email-builder/_components/editor-header";

export default function EmailEditorPage() {
    const { designId } = useParams() as { designId: string };
    const { data, isLoading, isError } = useGetEmailBuilderDesign(designId);

    if (isLoading || !data) {
        return (
            <div className="flex h-[calc(100vh-theme(spacing.12)-theme(spacing.12))] flex-col items-center justify-center">
                <Spinner size={24} />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex h-[calc(100vh-theme(spacing.12)-theme(spacing.12))] flex-col items-center justify-center gap-y-5">
                <TriangleAlert className="text-muted-foreground size-6" />
                <p className="text-muted-foreground text-sm">Failed to fetch email design</p>
                <Button asChild variant="secondary">
                    <Link to="/agency/email-marketing/email-builder">Back to Dashboard</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.12)-theme(spacing.12))] -m-4 md:-m-6">
            {/* Header */}
            <EditorHeader design={data.data} />

            {/* Builder Core */}
            <div className="flex flex-1 overflow-hidden">
                <TemplatePanel initialData={data.data} />
                <InspectorDrawer />
            </div>
        </div>
    );
}
