"use client";

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { BsCloudCheck, BsCloudSlash } from "react-icons/bs";
import { useMutationState } from "@tanstack/react-query";
import debounce from "lodash.debounce";

import { EmailBuilderSaveStatus } from "./email-builder-loading";

import { useUpdateEmailBuilderDesign } from "../_api/use-update-email-builder-design";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface EditorHeaderProps {
    design: {
        id: string;
        name: string;
        saveStatus?: string;
        lastSaveError?: string | null;
        // other props...
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
    // Check both the legacy update mutation and new saveContent mutation
    const updateMutationState = useMutationState({
        filters: {
            mutationKey: [["emailBuilder", "update"]],
        },
        select: (mutation) => mutation.state.status,
    });
    
    const saveContentMutationState = useMutationState({
        filters: {
            mutationKey: [["emailBuilder", "saveContent"]],
        },
        select: (mutation) => mutation.state.status,
    });

    const currentUpdateStatus = updateMutationState[updateMutationState.length - 1];
    const currentSaveContentStatus = saveContentMutationState[saveContentMutationState.length - 1];
    
    // Determine overall save status
    // Priority: DB saveStatus > mutation state > default
    const saveStatus = design.saveStatus || "SAVED";
    const isGlobalPending = 
        saveStatus === "SAVING" || 
        currentUpdateStatus === "pending" || 
        currentSaveContentStatus === "pending";
    const isGlobalError = 
        saveStatus === "SAVE_FAILED" || 
        currentUpdateStatus === "error" || 
        currentSaveContentStatus === "error";

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

                {/* Save Status - Network Resilient */}
                <div className="ml-auto">
                    <EmailBuilderSaveStatus 
                        status={isGlobalPending ? "saving" : isGlobalError ? "failed" : "saved"}
                        error={design.lastSaveError}
                    />
                </div>
            </div>
        </div>
    );
};
