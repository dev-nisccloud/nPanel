"use client";

import * as React from "react";
import {
  Palette,
  Shield,
  ShieldAlert,
  Settings,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  MoreHorizontal,
  Info,
  Plus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
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

import { useWordPressThemes } from "./use-wordpress-themes";
import type { WordPressTheme } from "./use-wordpress-themes";
import { ThemeMarketplaceSheet } from "./theme-marketplace-sheet";
import { captureEvent } from "@/lib/posthog";

interface ThemesTableProps {
  installationId: string;
}

// Loading skeleton component
function ThemesTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><Skeleton className="h-4 w-4" /></TableHead>
              <TableHead><Skeleton className="h-4 w-32" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Error component
function ThemesTableError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4">
        <Palette className="h-12 w-12 text-muted-foreground mx-auto" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">Failed to load themes</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        {error.message || "An error occurred while fetching WordPress themes."}
      </p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}

// Theme Table Row Component
function ThemeTableRow({
  theme,
  isSelected,
  onSelect,
  hasUpdate,
  isActive,
  installationId,
  onAction,
  onRefetch,
  updateThemeStatus,
  deleteThemes,
  bulkAutoUpdateThemes,
  isProcessing,
}: {
  theme: WordPressTheme;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  hasUpdate: boolean;
  isActive: boolean;
  installationId: string;
  onAction: (action: string, theme: WordPressTheme) => void;
  onRefetch: () => void;
  updateThemeStatus: any;
  deleteThemes: any;
  bulkAutoUpdateThemes: any;
  isProcessing: boolean;
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  return (
    <>
      <TableRow>
        <TableCell>
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
          />
        </TableCell>
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
          {isActive ? (
            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
              Active
            </Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </TableCell>
        <TableCell>
          <span className="text-sm">{theme.version || "N/A"}</span>
        </TableCell>
        <TableCell>
          {hasUpdate ? (
            <div className="flex flex-col gap-1">
              <Badge variant="outline">Update Available</Badge>
              <span className="text-xs text-muted-foreground">
                v{theme.availableVersion}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Up to date</span>
          )}
        </TableCell>
        <TableCell>
          {theme.vulnerable ? (
            <Badge variant="destructive">
              <ShieldAlert className="h-3 w-3 mr-1" />
              Vulnerable
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              <Shield className="h-3 w-3 mr-1" />
              Secure
            </Badge>
          )}
        </TableCell>
        <TableCell>
          {isProcessing ? (
            <div className="flex items-center justify-center p-2">
              <Spinner className="h-4 w-4" />
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {theme.status ? (
                  <DropdownMenuItem
                    onClick={() => onAction('deactivate', theme)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => onAction('activate', theme)}
                  >
                    <Palette className="mr-2 h-4 w-4" />
                    Activate
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await bulkAutoUpdateThemes.mutateAsync({
                        installationId: parseInt(installationId),
                        themes: [{
                          slug: theme.slug!,
                          autoUpdates: !theme.autoUpdates,
                          status: theme.status || false
                        }]
                      });
                      onRefetch();
                    } catch (error) {
                      console.error("Error updating auto-update:", error);
                    }
                  }}
                >
                  {theme.autoUpdates ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Disable Auto-Update
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Enable Auto-Update
                    </>
                  )}
                </DropdownMenuItem>
                {theme.changeLogUrl && (
                  <DropdownMenuItem onClick={() => window.open(theme.changeLogUrl!, '_blank', 'noopener,noreferrer')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Changelog
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TableCell>
      </TableRow>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Theme</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the theme{" "}
              <span className="font-semibold text-foreground">
                {theme.title}
              </span>
              ? This action cannot be undone and will permanently remove the theme
              and all its associated data from your WordPress installation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteThemes.isPending}
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setDeleteDialogOpen(false);
                try {
                  await deleteThemes.mutateAsync({
                    installationId: parseInt(installationId),
                    themes: [theme.slug!]
                  });
                } catch (error) {
                  console.error("Error deleting theme:", error);
                }
              }}
              disabled={deleteThemes.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Theme
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ThemesTable({ installationId }: ThemesTableProps) {
  const { data: themes, isLoading, isError, error, refetch } = useWordPressThemes(installationId);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedThemes, setSelectedThemes] = React.useState<Set<string>>(new Set());
  const [marketplaceOpen, setMarketplaceOpen] = React.useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = React.useState(false);
  const [themeToActivate, setThemeToActivate] = React.useState<WordPressTheme | null>(null);

  // tRPC mutation for updating theme status
  const updateThemeStatus = trpc.plesk.wpThemesStatus.setStatus.useMutation({
    onSuccess: (_data, variables) => {    if (variables.status) {
      captureEvent("wordpress_theme_activated", { theme_name: variables.slug || "unknown" });
    }

      toast.success("Theme status updated successfully!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update theme status");
    },
  });

  // tRPC mutation for deleting themes
  const deleteThemes = trpc.plesk.wpThemesDelete.delete.useMutation({
    onSuccess: (_data, variables) => {    const slugs = (variables as { themes?: Array<string | { slug?: string }>; slugs?: string[] })?.themes
      || (variables as { slugs?: string[] })?.slugs
      || [];
    const names = Array.isArray(slugs) ? slugs.map((s) => (typeof s === "string" ? s : s?.slug)).filter(Boolean) : [];
    captureEvent("wordpress_theme_deleted", { theme_name: names.join(",") || "unknown" });

      toast.success("Theme deleted successfully!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete theme");
    },
  });

  // tRPC mutation for bulk auto-updating themes
  const bulkAutoUpdateThemes = trpc.plesk.wpThemesAutoupdate.update.useMutation({
    onSuccess: () => {
      toast.success("Auto-update settings updated successfully!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update auto-update settings");
    },
  });

  const filteredThemes = React.useMemo(() => {
    if (!themes) return [];

    if (searchTerm.trim()) {
      return themes.filter(theme =>
        theme.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        theme.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        theme.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return themes;
  }, [themes, searchTerm]);

  const handleSelectTheme = (themeSlug: string, selected: boolean) => {
    setSelectedThemes(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(themeSlug);
      } else {
        newSet.delete(themeSlug);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedThemes(new Set(filteredThemes.map(theme => theme.slug!).filter(Boolean)));
    } else {
      setSelectedThemes(new Set());
    }
  };

  const handleBulkAutoUpdate = async () => {
    const selectedThemeSlugs = Array.from(selectedThemes);
    if (selectedThemeSlugs.length === 0) {
      toast.error("No themes selected");
      return;
    }

    try {
      await bulkAutoUpdateThemes.mutateAsync({
        installationId: parseInt(installationId),
        themes: selectedThemeSlugs.map(slug => {
          const theme = themes?.find(t => t.slug === slug);
          return {
            slug,
            autoUpdates: true,
            status: theme?.status || false
          };
        })
      });
      setSelectedThemes(new Set());
    } catch (error) {
      console.error("Error in bulk auto-update:", error);
    }
  };

  const handleAction = async (action: string, theme: WordPressTheme) => {
    switch (action) {
      case 'activate':
        // Check if there's already an active theme
        const activeTheme = themes?.find(t => t.status && t.slug !== theme.slug);
        if (activeTheme) {
          setThemeToActivate(theme);
          setActivateDialogOpen(true);
        } else {
          await confirmActivate(theme);
        }
        break;
      case 'deactivate':
        try {
          await updateThemeStatus.mutateAsync({
            installationId: parseInt(installationId),
            slug: theme.slug!,
            status: false
          });
        } catch (error) {
          console.error("Error deactivating theme:", error);
        }
        break;
      case 'delete':
        // Will be handled by delete dialog
        break;
    }
  };

  const confirmActivate = async (theme: WordPressTheme) => {
    try {
      await updateThemeStatus.mutateAsync({
        installationId: parseInt(installationId),
        slug: theme.slug!,
        status: true
      });
      setActivateDialogOpen(false);
    } catch (error) {
      console.error("Error activating theme:", error);
    }
  };

  const selectedCount = selectedThemes.size;
  const hasSelection = selectedCount > 0;
  const isAllSelected = filteredThemes.length > 0 && selectedThemes.size === filteredThemes.length;

  if (isLoading) {
    return <ThemesTableSkeleton />;
  }

  if (isError) {
    return <ThemesTableError error={error as Error} onRetry={() => refetch()} />;
  }

  if (!themes || themes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                placeholder="Search themes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
          <Button onClick={() => setMarketplaceOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Theme
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Palette className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="mb-2 text-lg font-semibold">No themes installed</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            This WordPress installation doesn't have any themes installed yet.
          </p>
        </div>
        <ThemeMarketplaceSheet
          open={marketplaceOpen}
          onOpenChange={setMarketplaceOpen}
          installationId={installationId}
          onInstallSuccess={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Input
              placeholder="Search themes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          {hasSelection && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkAutoUpdate}
              disabled={bulkAutoUpdateThemes.isPending}
            >
              {bulkAutoUpdateThemes.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Enabling...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Enable Auto-Update ({selectedCount})
                </>
              )}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setMarketplaceOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Theme
          </Button>
        </div>
      </div>

      {/* Themes Table */}
      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Theme Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Updates</TableHead>
              <TableHead>Vulnerability</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredThemes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No themes found
                </TableCell>
              </TableRow>
            ) : (
              filteredThemes.map((theme) => {
                const hasUpdate = !!(theme.availableVersion && theme.availableVersion !== theme.version);
                const isActive = theme.status === true;

                const isProcessing =
                  (updateThemeStatus.isPending && updateThemeStatus.variables?.slug === theme.slug) ||
                  (deleteThemes.isPending && deleteThemes.variables?.themes?.includes(theme.slug!)) ||
                  (bulkAutoUpdateThemes.isPending && bulkAutoUpdateThemes.variables?.themes?.some(t => t.slug === theme.slug));

                return (
                  <ThemeTableRow
                    key={theme.slug}
                    theme={theme}
                    isSelected={selectedThemes.has(theme.slug!)}
                    onSelect={(checked) => handleSelectTheme(theme.slug!, checked)}
                    hasUpdate={hasUpdate}
                    isActive={isActive}
                    installationId={installationId}
                    onAction={handleAction}
                    onRefetch={refetch}
                    updateThemeStatus={updateThemeStatus}
                    deleteThemes={deleteThemes}
                    bulkAutoUpdateThemes={bulkAutoUpdateThemes}
                    isProcessing={isProcessing}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ThemeMarketplaceSheet
        open={marketplaceOpen}
        onOpenChange={setMarketplaceOpen}
        installationId={installationId}
        onInstallSuccess={() => refetch()}
      />

      {/* Activation Confirmation Dialog */}
      <AlertDialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Replace Active Theme?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to activate <strong>"{themeToActivate?.title}"</strong> which will replace your currently active theme{" "}
                <strong>"{themes?.find(t => t.status && t.slug !== themeToActivate?.slug)?.title}"</strong>.
              </p>
              <p className="text-amber-600 dark:text-amber-400">
                This will change your website's appearance immediately. Make sure you have a backup before proceeding.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateThemeStatus.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => themeToActivate && confirmActivate(themeToActivate)}
              disabled={updateThemeStatus.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateThemeStatus.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Activating...
                </>
              ) : (
                "Activate Theme"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
