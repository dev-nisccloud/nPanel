"use client";

import * as React from "react";
import {
  Palette,
  ShieldAlert,
  Download,
  Settings,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { ThemesTable } from "./themes-table";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface WordPressThemesProps {
  installationId: string;
}

// Expandable description component
function ExpandableDescription({ description }: { description?: string }) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!description) return null;

  const shouldShowToggle = description.length > 150; // Show toggle if description is long
  const displayText = isExpanded || !shouldShowToggle
    ? description
    : description.substring(0, 150) + "...";

  return (
    <div className="text-sm text-muted-foreground">
      <p className="whitespace-pre-wrap leading-relaxed">{displayText}</p>
      {shouldShowToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-auto p-0 mt-1 text-xs text-blue-600 hover:text-blue-700"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Read more
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// Loading skeleton component
function ThemesSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Error component
function ThemesError({ error, onRetry }: { error: Error; onRetry: () => void }) {
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

// Individual theme card
function ThemeCard({
  theme,
  isSelected,
  onSelect,
  installationId,
  onRefetch,
  allThemes
}: {
  theme: WordPressTheme;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  installationId: string;
  onRefetch?: () => void;
  allThemes?: WordPressTheme[];
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = React.useState(false);

  // tRPC mutation for updating theme status
  const updateThemeStatus = trpc.plesk.wpThemesStatus.setStatus.useMutation({
    onSuccess: () => {
      toast.success(`Theme ${theme.status ? 'deactivated' : 'activated'} successfully!`);
      // Refetch data to update the UI
      onRefetch?.();
    },
    onError: (error: any) => {
      console.error("Error updating theme status:", error);

      let errorMessage = "Please try again.";

      if (error?.data?.code === "BAD_REQUEST") {
        errorMessage = error.message || "Invalid theme data.";
      } else if (error?.data?.code === "UNAUTHORIZED") {
        errorMessage = "Authentication failed. Please check your Plesk credentials.";
      } else if (error?.data?.code === "SERVICE_UNAVAILABLE") {
        errorMessage = "Plesk server is currently unavailable. Please try again later.";
      } else if (error?.data?.code === "NOT_FOUND") {
        errorMessage = "Theme not found.";
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        errorMessage = "Server error occurred while updating theme.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error("Failed to update theme", {
        description: errorMessage,
      });
    },
  });

  // tRPC mutation for deleting themes
  const deleteThemes = trpc.plesk.wpThemesDelete.delete.useMutation({
    onSuccess: () => {
      toast.success("Theme deleted successfully!");
      setDeleteDialogOpen(false);
      // Refetch data to update the UI
      onRefetch?.();
    },
    onError: (error: any) => {
      console.error("Error deleting theme:", error);

      let errorMessage = "Please try again.";

      if (error?.data?.code === "BAD_REQUEST") {
        errorMessage = error.message || "Invalid theme data.";
      } else if (error?.data?.code === "UNAUTHORIZED") {
        errorMessage = "Authentication failed. Please check your Plesk credentials.";
      } else if (error?.data?.code === "SERVICE_UNAVAILABLE") {
        errorMessage = "Plesk server is currently unavailable. Please try again later.";
      } else if (error?.data?.code === "NOT_FOUND") {
        errorMessage = "WordPress installation not found.";
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        errorMessage = "Server error occurred while deleting theme.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error("Failed to delete theme", {
        description: errorMessage,
      });
    },
  });
  const getStatusBadge = () => {
    if (theme.vulnerable) {
      return <Badge variant="destructive">Vulnerable</Badge>;
    }
    if (theme.status) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const getUpdateBadge = () => {
    if (theme.availableVersion && theme.availableVersion !== theme.version) {
      return <Badge variant="outline">Update Available</Badge>;
    }
    return null;
  };

  const handleAction = async (action: string) => {
    switch (action) {
      case 'activate':
        // Check if there's already an active theme
        const activeTheme = allThemes?.find(t => t.status && t.slug !== theme.slug);
        if (activeTheme) {
          // Show confirmation dialog
          setActivateDialogOpen(true);
        } else {
          // No active theme, proceed directly
          await confirmActivate();
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
          // Error handling is done in the mutation's onError callback
          console.error("Error in handleAction deactivate:", error);
        }
        break;
      case 'delete':
        setDeleteDialogOpen(true);
        break;
    }
  };

  const confirmActivate = async () => {
    try {
      await updateThemeStatus.mutateAsync({
        installationId: parseInt(installationId),
        slug: theme.slug!,
        status: true
      });
      setActivateDialogOpen(false);
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      console.error("Error in confirmActivate:", error);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteThemes.mutateAsync({
        installationId: parseInt(installationId),
        themes: [theme.slug!]
      });
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      console.error("Error in confirmDelete:", error);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="flex-shrink-0 pt-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
            />
          </div>

          {/* Theme Icon */}
          <div className="flex-shrink-0">
            <Palette className="h-8 w-8 text-muted-foreground" />
          </div>

          {/* Theme Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-medium">{theme.title}</h3>
              {theme.vulnerable && (
                <ShieldAlert className="h-4 w-4 text-red-500" />
              )}
            </div>

            <ExpandableDescription description={theme.description} />

            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">
                v{theme.version}
              </span>
              {theme.availableVersion && theme.availableVersion !== theme.version && (
                <>
                  <span className="text-xs text-muted-foreground">→</span>
                  <span className="text-xs text-blue-600">
                    v{theme.availableVersion}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Badges and Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1">
              {getStatusBadge()}
              {getUpdateBadge()}
            </div>

            {/* Action Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {theme.status ? (
                  <DropdownMenuItem
                    onClick={() => handleAction('deactivate')}
                    disabled={updateThemeStatus.isPending}
                  >
                    {updateThemeStatus.isPending ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Deactivating...
                      </>
                    ) : (
                      <>
                        <Settings className="mr-2 h-4 w-4" />
                        Deactivate
                      </>
                    )}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => handleAction('activate')}
                    disabled={updateThemeStatus.isPending}
                  >
                    {updateThemeStatus.isPending ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Activating...
                      </>
                    ) : (
                      <>
                        <Palette className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {theme.changeLogUrl && (
                  <DropdownMenuItem onClick={() => window.open(theme.changeLogUrl!, '_blank', 'noopener,noreferrer')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Changelog
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => handleAction('delete')}
                  className="text-red-600 focus:text-red-600"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Theme</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{theme.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteThemes.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteThemes.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                You are about to activate <strong>"{theme.title}"</strong> which will replace your currently active theme{" "}
                <strong>"{allThemes?.find(t => t.status && t.slug !== theme.slug)?.title}"</strong>.
              </p>
              <p className="text-amber-600 dark:text-amber-400">
                This will change your website's appearance immediately. Make sure you have a backup before proceeding.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateThemeStatus.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmActivate}
              disabled={updateThemeStatus.isPending}
              className="bg-blue-600 hover:bg-blue-700"
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
    </Card>
  );
}

export function WordPressThemes({ installationId }: WordPressThemesProps) {
  return <ThemesTable installationId={installationId} />;
}

// Legacy component - keeping for reference but not used
function WordPressThemesLegacy({ installationId }: WordPressThemesProps) {
  const { data: themes, isLoading, isError, error, refetch } = useWordPressThemes(installationId);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedThemes, setSelectedThemes] = React.useState<Set<string>>(new Set());

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

  const handleBulkAction = (action: string) => {
    const selectedThemeSlugs = Array.from(selectedThemes);
    console.log(`Bulk ${action} for themes:`, selectedThemeSlugs);

    switch (action) {
      case 'update':
        // Handle bulk update
        break;
      case 'delete':
        // Handle bulk delete
        break;
      case 'deactivate':
        // Handle bulk deactivate
        break;
    }

    // Clear selection after action
    setSelectedThemes(new Set());
  };

  const selectedCount = selectedThemes.size;
  const hasSelection = selectedCount > 0;

  if (isLoading) {
    return <ThemesSkeleton />;
  }

  if (isError) {
    return <ThemesError error={error as Error} onRetry={() => refetch()} />;
  }

  // Handle empty themes array (not an error, just no themes installed)
  if (!themes || themes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4">
          <Palette className="h-12 w-12 text-muted-foreground mx-auto" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No themes installed</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          This WordPress installation doesn't have any themes installed yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedThemes.size === filteredThemes.length && filteredThemes.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              Select All ({selectedThemes.size})
            </span>
          </div>
          <div className="relative">
            <Input
              placeholder="Search themes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredThemes.length} of {themes.length} themes
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Bulk Action Buttons */}
          {hasSelection && (
            <div className="flex items-center gap-2 mr-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('update')}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Update ({selectedCount})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('deactivate')}
                className="text-orange-600 border-orange-200 hover:bg-orange-50"
              >
                <Settings className="mr-2 h-4 w-4" />
                Deactivate ({selectedCount})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete')}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Delete ({selectedCount})
              </Button>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Themes List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {filteredThemes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Palette className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No themes found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? "No themes match your search criteria." : "No themes are installed."}
              </p>
            </div>
          ) : (
            filteredThemes.map((theme) => (
              <ThemeCard
                key={theme.slug}
                theme={theme}
                isSelected={selectedThemes.has(theme.slug!)}
                onSelect={(selected) => handleSelectTheme(theme.slug!, selected)}
                installationId={installationId}
                onRefetch={refetch}
                allThemes={themes}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
