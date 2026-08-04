"use client";

import * as React from "react";
import { Download, FileCode } from "lucide-react";
import { EmailBuilderSpinner } from "./email-builder-loading";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useExportEmailBuilder } from "../_api/use-export-email-builder";

interface ExportPanelProps {
    designId: string;
    designName?: string;
}

export function ExportPanel({ designId, designName }: ExportPanelProps) {
    const [open, setOpen] = React.useState(false);
    const [fileName, setFileName] = React.useState("");
    const { exportDesign, isExporting } = useExportEmailBuilder();

    // Set default filename when dialog opens
    React.useEffect(() => {
        if (open && !fileName) {
            setFileName(designName ? `${designName}.html` : "email-design.html");
        }
    }, [open, designName, fileName]);

    const handleExport = async () => {
        await exportDesign(designId, fileName);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Export Email Template</DialogTitle>
                    <DialogDescription>
                        Download your email design as HTML.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="fileName">File Name</Label>
                        <Input
                            id="fileName"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            placeholder="email-design.html"
                        />
                    </div>

                    <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                        <FileCode className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p>
                            The HTML file will download to your device. 
                            You can retry the download at any time.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleExport}
                        disabled={isExporting || !fileName}
                    >
                        {isExporting ? (
                            <>
                                <EmailBuilderSpinner context="button" className="mr-2" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                Export HTML
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
