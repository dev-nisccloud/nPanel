"use client";

import * as React from "react";
import { Link, useParams } from "react-router";
import { TriangleAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

import { useIsMutating } from "@tanstack/react-query";
import { useGetEmailBuilderDesign } from "@/routes/agency.email-marketing/email-builder/_api/use-get-email-builder-design";
import { TemplatePanel } from "@/routes/agency.email-marketing/email-builder/_components/email-builder/template-panel";
import { InspectorDrawer } from "@/routes/agency.email-marketing/email-builder/_components/email-builder/inspector";
import { EditorHeader } from "@/routes/agency.email-marketing/email-builder/_components/editor-header";

export default function EmailEditorPage() {
    const { designId } = useParams() as { designId: string };
    const { data, isLoading, isError, refetch } = useGetEmailBuilderDesign(designId);

    const isMutatingAi = useIsMutating({
        mutationKey: ["emailBuilder", "generateWithAi", designId],
    }) > 0;

    const [isStartingAi, setIsStartingAi] = React.useState(false);
    
    // Sync starting state with mutation
    React.useEffect(() => {
        if (isMutatingAi) setIsStartingAi(true);
    }, [isMutatingAi]);

    const aiStatus = data?.data?.aiStatus;
    
    // Only show full-page overlay during the initial architectural phase (PROCESSING)
    // or when we just clicked the button (isStartingAi/isMutatingAi)
    const isAiProcessing = aiStatus === "PROCESSING" || isStartingAi || isMutatingAi;
    const isHydrating = aiStatus === "HYDRATING";
    
    // Once we move to HYDRATING, we can clear the local "starting" flag
    React.useEffect(() => {
        if (aiStatus === "HYDRATING" || aiStatus === "COMPLETED") {
            setIsStartingAi(false);
        }
    }, [aiStatus]);
    
    const isPolling = isAiProcessing || isHydrating;

    // Poll for changes when AI is processing or hydrating
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPolling) {
            interval = setInterval(() => {
                refetch();
            }, 3000); // Poll every 3 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPolling, refetch]);


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
        <div className="flex flex-col h-[calc(100vh-theme(spacing.12)-theme(spacing.12))] -m-4 md:-m-6 relative">
            {/* AI Processing Overlay */}
            {isAiProcessing && (
                <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-md transition-all animate-in fade-in duration-700">
                    <div className="relative mb-12">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse scale-150" />
                        <div className="relative size-32 bg-white rounded-[2rem] border shadow-2xl flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500">
                            <Sparkles className="size-14 text-primary animate-bounce" />
                        </div>
                    </div>
                    
                    <div className="text-center space-y-4 max-w-md px-6">
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Our AI Agent is Building</h2>
                        <div className="h-8 flex items-center justify-center overflow-hidden">
                            <p className="text-muted-foreground text-lg font-medium animate-in slide-in-from-bottom-4 duration-500">
                                <LoadingText />
                            </p>
                        </div>

                        <div className="mt-12 w-72 h-2 bg-gray-100 rounded-full overflow-hidden mx-auto">
                            <div className="h-full bg-primary animate-progress-indefinite rounded-full" />
                        </div>
                        
                        <div className="pt-8 flex items-center justify-center gap-6">
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Est. Time</span>
                                <span className="text-sm font-semibold text-gray-600">45 Seconds</span>
                            </div>
                            <div className="w-px h-8 bg-gray-200" />
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Phase</span>
                                <span className="text-sm font-semibold text-gray-600">
                                    {data.data.json ? "Hydrating Images" : "Layout Design"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

function LoadingText() {
    const [index, setIndex] = React.useState(0);
    const texts = [
        "Analyzing your brand profile...",
        "Coming up with conversion-focused content...",
        "Architecting the visual layout...",
        "Generating high-quality custom imagery...",
        "Assembling the design blocks...",
        "Fine-tuning colors and typography...",
        "Finalizing the production-ready email...",
    ];

    React.useEffect(() => {
        const interval = setInterval(() => {
            setIndex((i) => (i + 1) % texts.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return <span key={index}>{texts[index]}</span>;
}
