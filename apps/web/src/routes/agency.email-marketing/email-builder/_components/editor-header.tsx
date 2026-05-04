"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { BsCloudCheck, BsCloudSlash } from "react-icons/bs";
import { useMutationState } from "@tanstack/react-query";
import debounce from "lodash.debounce";

import { Spinner } from "@/components/ui/shadcn-io/spinner";

import { useUpdateEmailBuilderDesign } from "../_api/use-update-email-builder-design";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sparkles } from "lucide-react";
import { AiGenerateDialog } from "./email-builder/ai-generate-dialog";

interface EditorHeaderProps {
    design: {
        id: string;
        name: string;
        aiStatus?: string;
    };
}

export const EditorHeader = ({ design }: EditorHeaderProps) => {
    const [isEditingName, setIsEditingName] = useState(false);
    const [designName, setDesignName] = useState(design.name);
    const inputRef = useRef<HTMLInputElement>(null);
    const { mutate: updateDesign, isPending: isUpdatingName } = useUpdateEmailBuilderDesign();

    // Focus input when entering edit mode
    useEffect(() => {
        if (isEditingName && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditingName]);

    // Debounced save function for name updates
    const debouncedSaveName = useRef(
        debounce((newName: string) => {
            if (newName.trim() === "") return;
            updateDesign({ id: design.id, name: newName });
        }, 500)
    ).current;

    const handleNameChange = (newName: string) => {
        setDesignName(newName);
        debouncedSaveName(newName);
    };

    const handleNameBlur = () => {
        setIsEditingName(false);
        if (designName.trim() === "") {
            setDesignName(design.name); // Revert if empty
        }
    };

    const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.currentTarget.blur();
        } else if (e.key === "Escape") {
            setDesignName(design.name);
            setIsEditingName(false);
        }
    };

    // Monitor global mutation state for this design to show 'Saving...'
    const mutationState = useMutationState({
        filters: {
            mutationKey: [["emailBuilder", "update"]],
        },
        select: (mutation) => mutation.state.status,
    });

    const currentStatus = mutationState[mutationState.length - 1];
    const isGlobalPending = currentStatus === "pending";
    const isGlobalError = currentStatus === "error";

    return (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b bg-white px-4 py-3">
            <div className="flex items-center gap-2 w-full">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/agency/email-marketing/email-builder" title="Back to Email Builder">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <Separator orientation="vertical" className="h-6" />

                {/* Name Editing */}
                <div className="flex items-center gap-x-2 min-w-0">
                    {isEditingName ? (
                        <div className="flex items-center gap-x-2 min-w-[200px]">
                            <Input
                                ref={inputRef}
                                value={designName}
                                onChange={(e) => handleNameChange(e.target.value)}
                                onBlur={handleNameBlur}
                                onKeyDown={handleNameKeyDown}
                                className="h-8 text-sm"
                                disabled={isUpdatingName}
                            />
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsEditingName(true)}
                            className="px-2 py-1 text-sm font-semibold hover:bg-muted rounded transition-colors min-w-0 truncate max-w-[300px]"
                            title="Click to rename"
                        >
                            {designName}
                        </button>
                    )}
                </div>

                {/* Save Status */}
                <div className="ml-auto flex items-center gap-x-4">
                    <AiGenerateButton designId={design.id} />
                    
                    <Separator orientation="vertical" className="h-6" />

                    {design.aiStatus === "HYDRATING" && (
                        <div className="flex items-center gap-x-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full animate-pulse">
                            <Spinner size={14} className="text-amber-600" />
                            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-tight">
                                AI Hydrating Images...
                            </span>
                        </div>
                    )}

                    {isGlobalPending ? (
                        <div className="flex items-center gap-x-2">
                            <Spinner size={16} />
                            <div className="text-xs text-muted-foreground">
                                Saving...
                            </div>
                        </div>
                    ) : isGlobalError ? (
                        <div className="flex items-center gap-x-2">
                            <BsCloudSlash className="size-[20px] text-muted-foreground" />
                            <div className="text-xs text-muted-foreground">
                                Failed to save
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-x-2">
                            <BsCloudCheck className="size-[20px] text-muted-foreground" />
                            <div className="text-xs text-muted-foreground">
                                Saved
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

function AiGenerateButton({ designId }: { designId: string }) {
    const [open, setOpen] = React.useState(false);

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="gap-2 border-blue-200 bg-blue-50/50 hover:bg-blue-100/50 hover:border-blue-300 transition-all"
                onClick={() => setOpen(true)}
            >
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-blue-700 font-medium">AI Generate</span>
            </Button>
            <AiGenerateDialog designId={designId} open={open} onOpenChange={setOpen} />
        </>
    );
}
