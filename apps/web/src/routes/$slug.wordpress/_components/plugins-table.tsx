"use client";

import * as React from "react";
import {
  ExternalLink,
  Plus,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

import { useWordPressPlugins, type WordPressPlugin } from "./use-wordpress-plugins";
import { PluginMarketplaceSheet } from "./plugin-marketplace-sheet";
import { captureEvent } from "@/lib/posthog";

interface PluginsTableProps {
  installationId: string;
}

function truncateText(text: string, max = 90) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}

function pluginVersionLine(plugin: WordPressPlugin) {
  const version = plugin.version ? `v${plugin.version}` : "vN/A";
  const hasUpdate = !!(
    plugin.availableVersion &&
    plugin.availableVersion !== plugin.version
  );
  if (hasUpdate) {
    return `${version} → v${plugin.availableVersion}`;
  }
  return version;
}

export function PluginsTable({ installationId }: PluginsTableProps) {
  const { data: plugins, isLoading, isError, error, refetch } =
    useWordPressPlugins(installationId);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [marketplaceOpen, setMarketplaceOpen] = React.useState(false);
  const [uninstallDialogOpen, setUninstallDialogOpen] = React.useState(false);
  const [pluginToUninstall, setPluginToUninstall] =
    React.useState<WordPressPlugin | null>(null);

  const updatePluginStatus = trpc.plesk.wpPluginsStatus.setStatus.useMutation({
    onSuccess: (_data, variables) => {
      captureEvent(
        variables.status
          ? "wordpress_plugin_activated"
          : "wordpress_plugin_deactivated",
        {
          plugin_name: variables.slug || "unknown",
        },
      );

      toast.success("Plugin status updated successfully!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update plugin status");
    },
  });

  const deletePlugins = trpc.plesk.wpPluginsDelete.delete.useMutation({
    onSuccess: (_data, variables) => {
      const slugs =
        (variables as { plugins?: Array<string | { slug?: string }>; slugs?: string[] })
          ?.plugins ||
        (variables as { slugs?: string[] })?.slugs ||
        [];
      const names = Array.isArray(slugs)
        ? slugs
            .map((s) => (typeof s === "string" ? s : s?.slug))
            .filter(Boolean)
        : [];
      captureEvent("wordpress_plugin_deleted", {
        plugin_name: names.join(",") || "unknown",
      });

      toast.success("Plugin uninstalled successfully!");
      setPluginToUninstall(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to uninstall plugin");
    },
  });

  const bulkAutoUpdatePlugins =
    trpc.plesk.wpPluginsAutoupdate.update.useMutation({
      onSuccess: (_data, variables) => {
        const pluginList =
          (variables as { plugins?: Array<{ slug?: string; autoUpdates?: boolean }> })
            ?.plugins || [];
        for (const p of pluginList) {
          if (p?.autoUpdates) {
            captureEvent("wordpress_plugin_updated", {
              plugin_name: p.slug || "unknown",
            });
          }
        }

        toast.success("Auto-update settings updated successfully!");
        refetch();
      },
      onError: (error: any) => {
        toast.error(error.message || "Failed to update auto-update settings");
      },
    });

  const filteredPlugins = React.useMemo(() => {
    if (!plugins) return [];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return plugins.filter(
        (plugin) =>
          plugin.title?.toLowerCase().includes(q) ||
          plugin.slug?.toLowerCase().includes(q) ||
          plugin.description?.toLowerCase().includes(q),
      );
    }

    return plugins;
  }, [plugins, searchTerm]);

  const handleActivateToggle = async (plugin: WordPressPlugin) => {
    try {
      await updatePluginStatus.mutateAsync({
        installationId: parseInt(installationId),
        slug: plugin.slug!,
        status: !plugin.status,
      });
    } catch (err) {
      console.error("Error updating plugin status:", err);
    }
  };

  const handleAutoUpdateToggle = async (plugin: WordPressPlugin) => {
    try {
      await bulkAutoUpdatePlugins.mutateAsync({
        installationId: parseInt(installationId),
        plugins: [
          {
            slug: plugin.slug!,
            autoUpdates: !plugin.autoUpdates,
            status: plugin.status || false,
          },
        ],
      });
    } catch (err) {
      console.error("Error updating auto-update:", err);
    }
  };

  const confirmUninstall = async () => {
    if (!pluginToUninstall?.slug) return;
    setUninstallDialogOpen(false);
    try {
      await deletePlugins.mutateAsync({
        installationId: parseInt(installationId),
        plugins: [pluginToUninstall.slug],
      });
    } catch (err) {
      console.error("Error uninstalling plugin:", err);
    }
  };

  const items: SearchableCleanListItem[] = filteredPlugins.map((plugin, index) => {
    const hasUpdate = !!(
      plugin.availableVersion &&
      plugin.availableVersion !== plugin.version
    );
    const isActive = plugin.status === true;
    const isProcessing =
      (updatePluginStatus.isPending &&
        updatePluginStatus.variables?.slug === plugin.slug) ||
      (deletePlugins.isPending &&
        deletePlugins.variables?.plugins?.includes(plugin.slug!)) ||
      (bulkAutoUpdatePlugins.isPending &&
        bulkAutoUpdatePlugins.variables?.plugins?.some(
          (p) => p.slug === plugin.slug,
        ));

    const descriptionParts = [
      plugin.description ? truncateText(plugin.description) : null,
      pluginVersionLine(plugin),
      plugin.autoUpdates ? "Auto-update on" : "Auto-update off",
    ].filter(Boolean);

    return {
      key: plugin.slug || plugin.title || `plugin-${index}`,
      title: plugin.title || plugin.slug || "Unknown plugin",
      description: (
        <span className="block truncate">{descriptionParts.join(" · ")}</span>
      ),
      trailing: (
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={isActive ? WORDPRESS_STATUS_ACTIVE_BADGE_CLASS : undefined}
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
          {hasUpdate ? <Badge variant="outline">Update</Badge> : null}
          {plugin.vulnerable ? (
            <Badge variant="destructive">
              <ShieldAlert className="mr-1 h-3 w-3" />
              Vulnerable
            </Badge>
          ) : null}
        </div>
      ),
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
            onClick={() => handleActivateToggle(plugin)}
          >
            {isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => handleAutoUpdateToggle(plugin)}
          >
            {plugin.autoUpdates ? "Disable auto-update" : "Enable auto-update"}
          </Button>
          {plugin.changeLogUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() =>
                window.open(
                  plugin.changeLogUrl!,
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
              setPluginToUninstall(plugin);
              setUninstallDialogOpen(true);
            }}
          >
            Uninstall
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
        totalCount={plugins?.length ?? 0}
        isLoading={isLoading}
        isError={isError}
        error={error as Error | null}
        onRetry={() => refetch()}
        searchPlaceholder="Search plugins..."
        errorTitle="Failed to load plugins"
        emptyMessage={
          searchTerm.trim()
            ? "No plugins match your search."
            : "No plugins installed on this WordPress site."
        }
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
              Add Plugin
            </Button>
          </>
        }
      />

      <PluginMarketplaceSheet
        open={marketplaceOpen}
        onOpenChange={setMarketplaceOpen}
        installationId={installationId}
        onInstallSuccess={() => refetch()}
      />

      <AlertDialog
        open={uninstallDialogOpen}
        onOpenChange={(open) => {
          setUninstallDialogOpen(open);
          if (!open) setPluginToUninstall(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Uninstall Plugin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to uninstall the plugin{" "}
              <span className="font-semibold text-foreground">
                {pluginToUninstall?.title}
              </span>
              ? This action cannot be undone and will permanently remove the
              plugin and all its associated data from your WordPress
              installation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePlugins.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUninstall}
              disabled={deletePlugins.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Uninstall Plugin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
