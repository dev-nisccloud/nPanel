"use client";

import * as React from "react";
import { ArrowLeft, Package, Search, Download, Check, Shield, ShieldAlert, ExternalLink, Info, Star, Calendar, User, Code, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { XIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";

interface PluginMarketplaceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installationId: string;
  onInstallSuccess?: () => void;
}

type ViewMode = "list" | "details";

interface MarketplacePlugin {
  slug: string;
  title?: string;
  shortDescription?: string;
  description?: string;
  version?: string;
  rating?: {
    score: number;
    amount: number;
  };
  downloaded?: number;
  downloadCount?: number;
  updated?: string;
  lastUpdatedAt?: string;
  author?: {
    name: string;
    profile?: string | null;
  };
  requires?: string | boolean;
  tested?: string | null;
  installed?: boolean;
  screenshotUrl?: string;
  logoUrl?: string;
  previewUrl?: string;
  compatible?: boolean;
  vulnerable?: boolean;
  [key: string]: any;
}

export function PluginMarketplaceSheet({
  open,
  onOpenChange,
  installationId,
  onInstallSuccess,
}: PluginMarketplaceSheetProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [viewMode, setViewMode] = React.useState<ViewMode>("list");
  const [selectedPlugin, setSelectedPlugin] = React.useState<MarketplacePlugin | null>(null);
  const [page, setPage] = React.useState(1);
  const pageSize = 25;

  // Fetch plugin catalog
  const {
    data: catalogData,
    isLoading,
    isError,
    error,
  } = trpc.plesk.wpPlugins.getCatalog.useQuery(
    {
      installationId: parseInt(installationId),
      page,
      pageSize,
      term: searchTerm || undefined,
    },
    {
      enabled: open && viewMode === "list",
      staleTime: 5 * 60 * 1000,
    }
  );

  // Install plugin mutation
  const installPlugin = trpc.plesk.wpPluginsInstall.install.useMutation({
    onSuccess: () => {    const p = selectedPlugin;
    captureEvent("wordpress_plugin_installed", {
      plugin_name: p?.title || p?.name || p?.slug || "unknown",
      plugin_slug: p?.slug || "unknown",
    });

      toast.success("Plugin installed successfully!");
      onInstallSuccess?.();
      onOpenChange(false);
      setViewMode("list");
      setSelectedPlugin(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to install plugin");
    },
  });

  // Activate plugin mutation
  const activatePlugin = trpc.plesk.wpPluginsStatus.setStatus.useMutation({
    onSuccess: () => {    const p = selectedPlugin;
    captureEvent("wordpress_plugin_activated", {
      plugin_name: p?.title || p?.name || p?.slug || "unknown",
    });

      toast.success("Plugin activated successfully!");
      onInstallSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to activate plugin");
    },
  });

  // Handle different response structures
  const plugins = React.useMemo(() => {
    if (!catalogData?.data) return [];
    // Check if data is an array directly
    if (Array.isArray(catalogData.data)) {
      return catalogData.data;
    }
    // Check if data has items property
    if (catalogData.data.items && Array.isArray(catalogData.data.items)) {
      return catalogData.data.items;
    }
    // Check if data has plugins property
    if (catalogData.data.plugins && Array.isArray(catalogData.data.plugins)) {
      return catalogData.data.plugins;
    }
    return [];
  }, [catalogData]);

  const handlePluginClick = (plugin: MarketplacePlugin) => {
    setSelectedPlugin(plugin);
    setViewMode("details");
  };

  const handleBack = () => {
    setViewMode("list");
    setSelectedPlugin(null);
  };

  const handleInstall = async (plugin: MarketplacePlugin, activate: boolean = true) => {
    try {
      await installPlugin.mutateAsync({
        installationId: parseInt(installationId),
        slug: plugin.slug,
        status: activate,
      });
    } catch (error) {
      console.error("Error installing plugin:", error);
    }
  };

  const handleActivate = async (plugin: MarketplacePlugin) => {
    try {
      await activatePlugin.mutateAsync({
        installationId: parseInt(installationId),
        slug: plugin.slug,
        status: true,
      });
    } catch (error) {
      console.error("Error activating plugin:", error);
    }
  };

  React.useEffect(() => {
    if (!open) {
      setViewMode("list");
      setSelectedPlugin(null);
      setSearchTerm("");
      setPage(1);
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col h-full">
        <div className="flex flex-col h-full">
          <SheetHeader className="mb-6 flex-shrink-0 flex justify-between items-center flex-row border-b pb-4">
            <div className="flex items-center gap-3">
              {viewMode === "details" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-2xl font-bold">
                  {viewMode === "details" ? selectedPlugin?.title || "Plugin Details" : "Plugin Marketplace"}
                </SheetTitle>
                <SheetDescription className="text-base">
                  {viewMode === "details"
                    ? "View plugin details and install"
                    : "Browse and install plugins from the WordPress repository"}
                </SheetDescription>
              </div>
            </div>
            <SheetClose asChild>
              <Button
                size="icon"
                variant="ghost"
                className="p-0 m-0 size-auto hover:bg-transparent"
              >
                <XIcon className="size-5" />
              </Button>
            </SheetClose>
          </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div>
          {viewMode === "list" ? (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search plugins..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              {/* Plugins List */}
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Failed to load plugins</h3>
                  <p className="text-sm text-muted-foreground">
                    {error?.message || "An error occurred while fetching plugins."}
                  </p>
                </div>
              ) : plugins.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No plugins found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? "Try a different search term." : "No plugins available."}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plugin Name</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Downloads</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plugins.map((plugin: MarketplacePlugin) => (
                        <TableRow
                          key={plugin.slug}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handlePluginClick(plugin)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{plugin.title || plugin.slug}</span>
                              {plugin.description && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-md">
                                      <p className="text-sm">{plugin.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{plugin.version || "N/A"}</span>
                          </TableCell>
                          <TableCell>
                            {plugin.rating?.score ? (
                              <span className="text-sm flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {typeof plugin.rating.score === 'number' 
                                  ? plugin.rating.score.toFixed(1) 
                                  : parseFloat(String(plugin.rating.score)).toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {plugin.downloaded ? (
                              <span className="text-sm">
                                {plugin.downloaded.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInstall(plugin);
                              }}
                              disabled={installPlugin.isPending}
                            >
                              {installPlugin.isPending ? (
                                <>
                                  <Spinner className="mr-2 h-4 w-4" />
                                  Installing...
                                </>
                              ) : (
                                <>
                                  <Download className="mr-2 h-4 w-4" />
                                  Install
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </div>
          ) : (
            selectedPlugin && (
              <div className="space-y-6">
                {/* Title and Author */}
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">{selectedPlugin.title || selectedPlugin.slug}</h2>
                  {selectedPlugin.author && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      {selectedPlugin.author.profile ? (
                        <a
                          href={selectedPlugin.author.profile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          {selectedPlugin.author.name}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span>{selectedPlugin.author.name}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedPlugin.installed && (
                      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Installed
                      </Badge>
                    )}
                    {selectedPlugin.version && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Code className="h-3 w-3" />
                        v{selectedPlugin.version}
                      </Badge>
                    )}
                    {selectedPlugin.rating?.score && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {typeof selectedPlugin.rating.score === 'number' 
                          ? selectedPlugin.rating.score.toFixed(1)
                          : parseFloat(String(selectedPlugin.rating.score)).toFixed(1)}
                        {selectedPlugin.rating.amount && (
                          <span className="text-xs text-muted-foreground">
                            ({selectedPlugin.rating.amount.toLocaleString()})
                          </span>
                        )}
                      </Badge>
                    )}
                    {selectedPlugin.downloaded && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {selectedPlugin.downloaded.toLocaleString()} downloads
                      </Badge>
                    )}
                    {selectedPlugin.updated && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(selectedPlugin.updated).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Preview Image */}
                {selectedPlugin.screenshotUrl || selectedPlugin.logoUrl ? (
                  <div className="relative w-full rounded-lg border overflow-hidden bg-muted">
                    <img
                      src={selectedPlugin.screenshotUrl || selectedPlugin.logoUrl || ''}
                      alt={selectedPlugin.title || 'Plugin preview'}
                      className="w-full h-auto object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="flex items-center justify-center h-64 text-muted-foreground"><svg class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>';
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-64 rounded-lg border bg-muted flex items-center justify-center">
                    <Package className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}

                {/* Description */}
                {selectedPlugin.shortDescription && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3">Description</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {selectedPlugin.shortDescription}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleInstall(selectedPlugin, true)}
                    disabled={installPlugin.isPending || selectedPlugin.installed}
                  >
                    {installPlugin.isPending ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Installing...
                      </>
                    ) : selectedPlugin.installed ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Installed
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Install & Activate
                      </>
                    )}
                  </Button>
                  {!selectedPlugin.installed && (
                    <Button
                      variant="outline"
                      onClick={() => handleInstall(selectedPlugin, false)}
                      disabled={installPlugin.isPending}
                    >
                      {installPlugin.isPending ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Installing...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Install Only
                        </>
                      )}
                    </Button>
                  )}
                  {selectedPlugin.previewUrl && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedPlugin.previewUrl, '_blank', 'noopener,noreferrer')}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  )}
                </div>
              </div>
            )
          )}
          </div>
        </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
