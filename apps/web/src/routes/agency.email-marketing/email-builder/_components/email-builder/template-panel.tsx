import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    Monitor,
    Smartphone,
    Eye,
    Code,
    FileJson,
    Edit2,
    Download,
    Upload,
    AlertCircle
} from 'lucide-react';
import EditorBlock, { StandardReader } from './core';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import debounce from 'lodash.debounce';

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
    useDocument,
    useSelectedMainTab,
    setSelectedMainTab,
    useSelectedScreenSize,
    setSelectedScreenSize,
    toggleInspectorDrawerOpen,
    useInspectorDrawerOpen,
    resetDocument
} from './store';
import { renderToHtml } from './utils';
import { useUpdateEmailBuilderDesign } from '../../_api/use-update-email-builder-design';

// --- Helpers ---

function formatHtml(html: string) {
    let tab = '  ';
    let result = '';
    let indent = '';

    html.split(/>\s*</).forEach(function (element) {
        if (element.match(/^\/\w/)) {
            indent = indent.substring(tab.length);
        }

        result += indent + '<' + element + '>\r\n';

        if (element.match(/^<?\w[^>]*[^\/]$/) && !element.startsWith("input") && !element.startsWith("img") && !element.startsWith("br") && !element.startsWith("hr")) {
            indent += tab;
        }
    });

    return result.substring(1, result.length - 3);
}

// --- Highlight Component ---

function HighlightedCode({ code, language }: { code: string; language: string }) {
    const highlighted = useMemo(() => {
        return hljs.highlight(code, { language }).value;
    }, [code, language]);

    return (
        <pre
            className="p-4 font-mono text-xs bg-white rounded border h-full overflow-auto custom-scrollbar"
            dangerouslySetInnerHTML={{ __html: highlighted }}
        />
    );
}

// --- Import Dialog ---

function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
    const [value, setValue] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleImport = () => {
        try {
            const data = JSON.parse(value);
            if (typeof data !== 'object' || data === null) {
                throw new Error("Invalid JSON structure");
            }
            resetDocument(data);
            onOpenChange(false);
            setValue('');
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Invalid JSON");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-w-[95vw] overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Import Template JSON</DialogTitle>
                    <DialogDescription>
                        Paste your EmailBuilder.js JSON configuration below. This will overwrite your current work.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Textarea
                        placeholder='{ "root": { ... } }'
                        className="h-[300px] font-mono text-xs shadow-inner bg-muted/30 whitespace-pre-wrap break-all"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleImport}>Import Now</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// --- Main Component ---

interface TemplatePanelProps {
    initialData?: {
        id: string;
        json: string;
        aiStatus?: string;
    };
}

export function TemplatePanel({ initialData }: TemplatePanelProps) {
    const document = useDocument();
    const selectedMainTab = useSelectedMainTab();
    const selectedScreenSize = useSelectedScreenSize();
    const inspectorDrawerOpen = useInspectorDrawerOpen();
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const { mutate: updateDesign } = useUpdateEmailBuilderDesign();
    const isFirstRender = useRef(true);

    const isMobile = selectedScreenSize === 'mobile';

    // Initialize document from DB
    const isInitialized = useRef(false);

    useEffect(() => {
        if (!initialData?.json) return;

        const isAiActive = initialData.aiStatus === "PROCESSING" || initialData.aiStatus === "HYDRATING";
        
        // Always sync if AI is active (real-time updates) 
        // OR sync once on initial load if not already initialized
        if (isAiActive || !isInitialized.current) {
            try {
                const parsed = JSON.parse(initialData.json);
                resetDocument(parsed);
                isInitialized.current = true;
            } catch (e) {
                console.error("Failed to parse initial JSON", e);
            }
        }
    }, [initialData?.json, initialData?.aiStatus]);

    // Auto-save logic
    const debouncedSave = useMemo(
        () =>
            debounce((doc: any, id: string) => {
                updateDesign({
                    id,
                    json: JSON.stringify(doc),
                    thumbnailUrl: undefined // TODO: Generate thumbnail if needed
                });
            }, 1000),
        [updateDesign]
    );

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (initialData?.id && document) {
            debouncedSave(document, initialData.id);
        }
    }, [document, initialData?.id, debouncedSave]);

    const downloadJson = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(document, null, 2));
        const downloadAnchorNode = window.document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "template.json");
        window.document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const downloadHtml = () => {
        const html = renderToHtml(document);
        const dataStr = "data:text/html;charset=utf-8," + encodeURIComponent(html);
        const downloadAnchorNode = window.document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "template.html");
        window.document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const renderContent = () => {
        switch (selectedMainTab) {
            case 'editor':
                return (
                    <div className={`transition-all duration-300 mx-auto ${isMobile ? 'w-[375px] my-8 shadow-2xl h-[812px] overflow-auto border rounded-[3rem] border-[12px] border-gray-800 bg-white' : 'w-full'}`}>
                        <EditorBlock id="root" />
                    </div>
                );
            case 'preview':
                return (
                    <div className={`transition-all duration-300 mx-auto ${isMobile ? 'w-[375px] my-8 shadow-2xl h-[812px] overflow-auto border rounded-[3rem] border-[12px] border-gray-800 bg-white' : 'w-full'}`}>
                        <StandardReader document={document} rootBlockId="root" />
                    </div>
                );
            case 'html':
                return <HighlightedCode code={formatHtml(renderToHtml(document))} language="html" />;
            case 'json':
                return <HighlightedCode code={JSON.stringify(document, null, 2)} language="json" />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col flex-1 h-full overflow-hidden bg-[#f8fafb]">
            {/* Header / Toolbar */}
            <div className="h-14 border-b bg-white flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <Tabs value={selectedMainTab} onValueChange={(v: any) => setSelectedMainTab(v)}>
                        <TabsList className="grid grid-cols-4 w-[400px]">
                            <TabsTrigger value="editor" className="gap-2"><Edit2 className="h-4 w-4" /> Edit</TabsTrigger>
                            <TabsTrigger value="preview" className="gap-2"><Eye className="h-4 w-4" /> Preview</TabsTrigger>
                            <TabsTrigger value="html" className="gap-2"><Code className="h-4 w-4" /> HTML</TabsTrigger>
                            <TabsTrigger value="json" className="gap-2"><FileJson className="h-4 w-4" /> JSON</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="flex items-center gap-3">
                    <TooltipProvider>
                        <div className="flex items-center gap-1.5 mr-4 px-3 py-1 border-r">
                            <DropdownMenu>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Download</TooltipContent>
                                </Tooltip>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={downloadJson} className="gap-2">
                                        <FileJson className="h-4 w-4 text-muted-foreground" />
                                        <span>Download JSON</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={downloadHtml} className="gap-2">
                                        <Code className="h-4 w-4 text-muted-foreground" />
                                        <span>Download HTML</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setImportDialogOpen(true)}>
                                        <Upload className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Import JSON</TooltipContent>
                            </Tooltip>
                        </div>

                        <div className="flex items-center bg-muted rounded-lg p-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={selectedScreenSize === 'desktop' ? 'secondary' : 'ghost'}
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setSelectedScreenSize('desktop')}
                                    >
                                        <Monitor className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Desktop View</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={selectedScreenSize === 'mobile' ? 'secondary' : 'ghost'}
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setSelectedScreenSize('mobile')}
                                    >
                                        <Smartphone className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Mobile View</TooltipContent>
                            </Tooltip>
                        </div>
                    </TooltipProvider>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
                {renderContent()}
            </div>

            <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
        </div >
    );
}
