"use client";

import * as React from "react";
import {
  AlertTriangle,
  ExternalLink,
  Plus,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CleanListCell } from "@/components/ui/clean-list";
import {
  SearchableCleanList,
  type SearchableCleanListItem,
} from "@/components/ui/searchable-clean-list";
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
import { WORDPRESS_STATUS_ACTIVE_BADGE_CLASS } from "@/components/wordpress/wordpress-list";

import { useWordPressThemes, type WordPressTheme } from "./use-wordpress-themes";
import { ThemeMarketplaceSheet } from "./theme-marketplace-sheet";
import { captureEvent } from "@/lib/posthog";

interface ThemesTableProps {
  installationId: string;
}

function truncateText(text: string, max = 90) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

function themeVersionLine(theme: WordPressTheme) {
  const version = theme.version ? `v${theme.version}` : "vN/A";
  const hasUpdate = !!(
    theme.availableVersion &&
    theme.availableVersion !== theme.version
  );
  if (hasUpdate) {
    return `${version} → v${theme.availableVersion}`;
  }
  return version;
}

export function ThemesTable({ installationId }: ThemesTableProps) {
  const { data: themes, isLoading, isError, error, refetch } =
    useWordPressThemes(installationId);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [marketplaceOpen, setMarketplaceOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [themeToDelete, setThemeToDelete] = React.useState<WordPressTheme | null>(
    null,
  );
  const [activateDialogOpen, setActivateDialogOpen] = React.useState(false);
  const [themeToActivate, setThemeToActivate] =
    React.useState<WordPressTheme | null>(null);

  const updateThemeStatus = trpc.plesk.wpThemesStatus.setStatus.useMutation({
    onSuccess: (_data, variables) => {
      if (variables.status) {
        captureEvent("wordpress_theme_activated", {
          theme_name: variables.slug || "unknown",
        });
      }

      toast.success("Theme status updated successfully!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update theme status");
    },
  });

  const deleteThemes = trpc.plesk.wpThemesDelete.delete.useMutation({
    onSuccess: (_data, variables) => {
      const slugs =
        (variables as { themes?: Array<string | { slug?: string }>; slugs?: string[] })
          ?.themes ||
        (variables as { slugs?: string[] })?.slugs ||
        [];
      const names = Array.isArray(slugs)
        ? slugs
            .map((s) => (typeof s === "string" ? s : s?.slug))
            .filter(Boolean)
        : [];
      captureEvent("wordpress_theme_deleted", {
        theme_name: names.join(",") || "unknown",
      });

      toast.success("Theme deleted successfully!");
      setThemeToDelete(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete theme");
    },
  });

  const bulkAutoUpdateThemes =
    trpc.plesk.wpThemesAutoupdate.update.useMutation({
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
      const q = searchTerm.toLowerCase();
      return themes.filter(
        (theme) =>
          theme.title?.toLowerCase().includes(q) ||
          theme.slug?.toLowerCase().includes(q) ||
          theme.description?.toLowerCase().includes(q),
      );
    }

    return themes;
  }, [themes, searchTerm]);

  const confirmActivate = async (theme: WordPressTheme) => {
    try {
      await updateThemeStatus.mutateAsync({
        installationId: parseInt(installationId),
        slug: theme.slug!,
        status: true,
      });
      setActivateDialogOpen(false);
      setThemeToActivate(null);
    } catch (err) {
      console.error("Error activating theme:", err);
    }
  };

  const handleActivateToggle = async (theme: WordPressTheme) => {
    if (theme.status) {
      try {
        await updateThemeStatus.mutateAsync({
          installationId: parseInt(installationId),
          slug: theme.slug!,
          status: false,
        });
      } catch (err) {
        console.error("Error deactivating theme:", err);
      }
      return;
    }

    const activeTheme = themes?.find((t) => t.status && t.slug !== theme.slug);
    if (activeTheme) {
      setThemeToActivate(theme);
      setActivateDialogOpen(true);
    } else {
      await confirmActivate(theme);
    }
  };

  const handleAutoUpdateToggle = async (theme: WordPressTheme) => {
    try {
      await bulkAutoUpdateThemes.mutateAsync({
        installationId: parseInt(installationId),
        themes: [
          {
            slug: theme.slug!,
            autoUpdates: !theme.autoUpdates,
            status: theme.status || false,
          },
        ],
      });
    } catch (err) {
      console.error("Error updating auto-update:", err);
    }
  };

  const confirmDelete = async () => {
    if (!themeToDelete?.slug) return;
    setDeleteDialogOpen(false);
    try {
      await deleteThemes.mutateAsync({
        installationId: parseInt(installationId),
        themes: [themeToDelete.slug],
      });
    } catch (err) {
      console.error("Error deleting theme:", err);
    }
  };

  const items: SearchableCleanListItem[] = filteredThemes.map((theme, index) => {
    const hasUpdate = !!(
      theme.availableVersion &&
      theme.availableVersion !== theme.version
    );
    const isActive = theme.status === true;
    const isProcessing =
      (updateThemeStatus.isPending &&
        updateThemeStatus.variables?.slug === theme.slug) ||
      (deleteThemes.isPending &&
        deleteThemes.variables?.themes?.includes(theme.slug!)) ||
      (bulkAutoUpdateThemes.isPending &&
        bulkAutoUpdateThemes.variables?.themes?.some(
          (t) => t.slug === theme.slug,
        ));

    const description = theme.description ? truncateText(theme.description) : undefined;

    return {
      key: theme.slug || theme.title || `theme-${index}`,
      title: theme.title || theme.slug || "Unknown theme",
      description: description ? (
        <span className="block truncate">{description}</span>
      ) : undefined,
      cells: {
        version: (
          <CleanListCell>
            {themeVersionLine(theme)}
            {theme.autoUpdates ? " · Auto-update on" : " · Auto-update off"}
          </CleanListCell>
        ),
        status: (
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={isActive ? WORDPRESS_STATUS_ACTIVE_BADGE_CLASS : undefined}
            >
              {isActive ? "Active" : "Inactive"}
            </Badge>
            {hasUpdate ? <Badge variant="outline">Update</Badge> : null}
            {theme.vulnerable ? (
              <Badge variant="destructive">
                <ShieldAlert className="mr-1 h-3 w-3" />
                Vulnerable
              </Badge>
            ) : null}
          </div>
        ),
      },
      actions: isProcessing ? (
        <div className="flex items-center justify-center p-2">
          <Spinner className="h-4 w-4" />
        </div>
      ) : (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => handleActivateToggle(theme)}
          >
            {isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => handleAutoUpdateToggle(theme)}
          >
            {theme.autoUpdates ? "Disable auto-update" : "Enable auto-update"}
          </Button>
          {theme.changeLogUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() =>
                window.open(
                  theme.changeLogUrl!,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              <ExternalLink className="mr-1 h-3.5 w-3.5" />
              Changelog
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs text-destructive hover:text-destructive"
            onClick={() => {
              setThemeToDelete(theme);
              setDeleteDialogOpen(true);
            }}
          >
            Delete
          </Button>
        </>
      ),
    };
  });

  return (
    <>
      <SearchableCleanList
        items={items}
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        totalCount={themes?.length ?? 0}
        isLoading={isLoading}
        isError={isError}
        error={error as Error | null}
        onRetry={() => refetch()}
        searchPlaceholder="Search themes..."
        errorTitle="Failed to load themes"
        emptyMessage={
          searchTerm.trim()
            ? "No themes match your search."
            : "No themes installed on this WordPress site."
        }
        columns={[
          { key: "name", label: "Theme" },
          { key: "version", label: "Version", className: "min-w-0 flex-1", hideBelow: "@lg" },
          { key: "status", label: "Status", className: "w-40 shrink-0", hideBelow: "@xl" },
          { key: "actions", label: "Actions", align: "end" },
        ]}
        toolbarActions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button type="button" size="sm" onClick={() => setMarketplaceOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Theme
            </Button>
          </>
        }
      />

      <ThemeMarketplaceSheet
        open={marketplaceOpen}
        onOpenChange={setMarketplaceOpen}
        installationId={installationId}
        onInstallSuccess={() => refetch()}
      />

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setThemeToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Theme</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the theme{" "}
              <span className="font-semibold text-foreground">
                {themeToDelete?.title}
              </span>
              ? This action cannot be undone and will permanently remove the
              theme and all its associated data from your WordPress
              installation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteThemes.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteThemes.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Theme
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Replace Active Theme?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to activate{" "}
                <strong>&quot;{themeToActivate?.title}&quot;</strong> which will
                replace your currently active theme{" "}
                <strong>
                  &quot;
                  {
                    themes?.find(
                      (t) => t.status && t.slug !== themeToActivate?.slug,
                    )?.title
                  }
                  &quot;
                </strong>
                .
              </p>
              <p className="text-amber-600 dark:text-amber-400">
                This will change your website&apos;s appearance immediately. Make
                sure you have a backup before proceeding.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateThemeStatus.isPending}>
              Cancel
            </AlertDialogCancel>
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
    </>
  );
}
