"use client";

import * as React from "react";
import { ArrowLeft, Palette, Search, Download, Shield, ShieldAlert, ExternalLink, Info, Star, Calendar, User, Code, Eye, Check } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";

interface ThemeMarketplaceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installationId: string;
  onInstallSuccess?: () => void;
}

type ViewMode = "list" | "details";

interface MarketplaceTheme {
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

export function ThemeMarketplaceSheet({
  open,
  onOpenChange,
  installationId,
  onInstallSuccess,
}: ThemeMarketplaceSheetProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [viewMode, setViewMode] = React.useState<ViewMode>("list");
  const [selectedTheme, setSelectedTheme] = React.useState<MarketplaceTheme | null>(null);
  const [page, setPage] = React.useState(1);
  const pageSize = 25;

  // Install confirmation and in-progress state
  const [confirmInstallOpen, setConfirmInstallOpen] = React.useState(false);
  const [themeToInstall, setThemeToInstall] = React.useState<MarketplaceTheme | null>(null);
  const [installActivate, setInstallActivate] = React.useState(true);

  // Fetch theme catalog
  const {
    data: catalogData,
    isLoading,
    isError,
    error,
  } = trpc.plesk.wpThemesList.catalog.useQuery(
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

  // Install theme mutation
  const installTheme = trpc.plesk.wpThemesInstall.install.useMutation({
    onSuccess: () => {
      setThemeToInstall(null);
      toast.success("Theme installed successfully!");
      onInstallSuccess?.();
      onOpenChange(false);
      setViewMode("list");
      setSelectedTheme(null);
    },
    onError: (error: any) => {
      setThemeToInstall(null);
      toast.error(error.message || "Failed to install theme");
    },
  });

  // Activate theme mutation
  const activateTheme = trpc.plesk.wpThemesStatus.setStatus.useMutation({
    onSuccess: () => {
      toast.success("Theme activated successfully!");
      onInstallSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to activate theme");
    },
  });

  // Handle different response structures
  const themes = React.useMemo(() => {
    if (!catalogData?.data) return [];
    // Check if data is an array directly
    if (Array.isArray(catalogData.data)) {
      return catalogData.data;
    }
    // Check if data has items property
    if (catalogData.data.items && Array.isArray(catalogData.data.items)) {
      return catalogData.data.items;
    }
    // Check if data has themes property
    if (catalogData.data.themes && Array.isArray(catalogData.data.themes)) {
      return catalogData.data.themes;
    }
    return [];
  }, [catalogData]);

  const handleThemeClick = (theme: MarketplaceTheme) => {
    setSelectedTheme(theme);
    setViewMode("details");
  };

  const handleBack = () => {
    setViewMode("list");
    setSelectedTheme(null);
  };

  const handleRequestInstall = (theme: MarketplaceTheme, activate: boolean = true) => {
    setThemeToInstall(theme);
    setInstallActivate(activate);
    setConfirmInstallOpen(true);
  };

  const handleConfirmInstall = () => {
    if (!themeToInstall) return;
    setConfirmInstallOpen(false);
    installTheme.mutate({
      installationId: parseInt(installationId),
      slug: themeToInstall.slug,
      status: installActivate,
    });
  };

  const handleCancelInstall = () => {
    installTheme.reset();
    setThemeToInstall(null);
    toast.info("Installation cancelled. The theme may still be installing on the serverÃ¢â‚¬â€check your themes list.");
  };

  const handleActivate = async (theme: MarketplaceTheme) => {
    try {
      await activateTheme.mutateAsync({
        installationId: parseInt(installationId),
        slug: theme.slug,
        status: true,
      });
    } catch (error) {
      console.error("Error activating theme:", error);
    }
  };

  React.useEffect(() => {
    if (!open) {
      setViewMode("list");
      setSelectedTheme(null);
      setSearchTerm("");
      setPage(1);
    }
  }, [open]);

  return (
    <>
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
                <Palette className="h-6 w-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-2xl font-bold">
                  {viewMode === "details" ? selectedTheme?.title || "Theme Details" : "Theme Marketplace"}
                </SheetTitle>
                <SheetDescription className="text-base">
                  {viewMode === "details"
                    ? "View theme details and install"
                    : "Browse and install themes from the WordPress repository"}
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

        <div className="relative flex-1 min-h-0 flex flex-col">
          <ScrollArea className="flex-1 min-h-0 pr-4">
          <div>
          {viewMode === "list" ? (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search themes..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>

              {/* Themes List */}
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Palette className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Failed to load themes</h3>
                  <p className="text-sm text-muted-foreground">
                    {error?.message || "An error occurred while fetching themes."}
                  </p>
                </div>
              ) : themes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Palette className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No themes found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? "Try a different search term." : "No themes available."}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Theme Name</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Downloads</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {themes.map((theme: MarketplaceTheme) => (
                        <TableRow
                          key={theme.slug}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleThemeClick(theme)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{theme.title || theme.slug}</span>
                              {theme.description && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-md">
                                      <p className="text-sm">{theme.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{theme.version || "N/A"}</span>
                          </TableCell>
                          <TableCell>
                            {theme.rating?.score ? (
                              <span className="text-sm flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {typeof theme.rating.score === 'number' 
                                  ? theme.rating.score.toFixed(1) 
                                  : parseFloat(String(theme.rating.score)).toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {theme.downloaded ? (
                              <span className="text-sm">
                                {theme.downloaded.toLocaleString()}
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
                                handleRequestInstall(theme, true);
                              }}
                              disabled={installTheme.isPending}
                            >
                              {installTheme.isPending && themeToInstall?.slug === theme.slug ? (
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
            selectedTheme && (
              <div className="space-y-6">
                {/* Title and Author */}
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">{selectedTheme.title || selectedTheme.slug}</h2>
                  {selectedTheme.author && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      {selectedTheme.author.profile ? (
                        <a
                          href={selectedTheme.author.profile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          {selectedTheme.author.name}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span>{selectedTheme.author.name}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedTheme.installed && (
                      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Installed
                      </Badge>
                    )}
                    {selectedTheme.version && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Code className="h-3 w-3" />
                        v{selectedTheme.version}
                      </Badge>
                    )}
                    {selectedTheme.rating?.score && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {typeof selectedTheme.rating.score === 'number' 
                          ? selectedTheme.rating.score.toFixed(1)
                          : parseFloat(String(selectedTheme.rating.score)).toFixed(1)}
                        {selectedTheme.rating.amount && (
                          <span className="text-xs text-muted-foreground">
                            ({selectedTheme.rating.amount.toLocaleString()})
                          </span>
                        )}
                      </Badge>
                    )}
                    {selectedTheme.downloaded && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Palette className="h-3 w-3" />
                        {selectedTheme.downloaded.toLocaleString()} downloads
                      </Badge>
                    )}
                    {selectedTheme.updated && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(selectedTheme.updated).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Preview Image */}
                {selectedTheme.screenshotUrl || selectedTheme.logoUrl ? (
                  <div className="relative w-full rounded-lg border overflow-hidden bg-muted">
                    <img
                      src={selectedTheme.screenshotUrl || selectedTheme.logoUrl || ''}
                      alt={selectedTheme.title || 'Theme preview'}
                      className="w-full h-auto object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="flex items-center justify-center h-64 text-muted-foreground"><svg class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg></div>';
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-64 rounded-lg border bg-muted flex items-center justify-center">
                    <Palette className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}

                {/* Description */}
                {selectedTheme.shortDescription && (
                  <Card>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3">Description</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {selectedTheme.shortDescription}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleRequestInstall(selectedTheme, true)}
                    disabled={installTheme.isPending || selectedTheme.installed}
                  >
                    {installTheme.isPending ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Installing...
                      </>
                    ) : selectedTheme.installed ? (
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
                  {!selectedTheme.installed && (
                    <Button
                      variant="outline"
                      onClick={() => handleRequestInstall(selectedTheme, false)}
                      disabled={installTheme.isPending}
                    >
                      {installTheme.isPending ? (
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
                  {selectedTheme.previewUrl && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedTheme.previewUrl, '_blank', 'noopener,noreferrer')}
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
        {installTheme.isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10 rounded-lg">
            <div className="flex flex-col items-center gap-4 text-center p-6">
              <Spinner size={40} className="text-primary" />
              <div>
                <p className="font-medium">Installing {themeToInstall?.title || themeToInstall?.slug || "theme"}...</p>
                <p className="text-sm text-muted-foreground mt-1">Please wait, do not close this window.</p>
              </div>
              <Button variant="outline" onClick={handleCancelInstall}>
                Cancel
              </Button>
            </div>
          </div>
        )}
        </div>
        </div>
      </SheetContent>
    </Sheet>
    <AlertDialog
      open={confirmInstallOpen}
      onOpenChange={(open) => {
        setConfirmInstallOpen(open);
        if (!open && !installTheme.isPending) setThemeToInstall(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm theme installation</AlertDialogTitle>
          <AlertDialogDescription>
            Installing <strong>{themeToInstall?.title || themeToInstall?.slug || "this theme"}</strong> will overwrite data of your existing site. Do you want to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmInstall}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
