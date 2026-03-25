"use client";

import * as React from "react";
import {
  Package,
  Shield,
  ShieldAlert,
  Settings,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  MoreHorizontal,
  Trash2,
  Info,
  Plus,
  CheckSquare,
  Square,
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

import { useWordPressPlugins, type WordPressPlugin } from "./use-wordpress-plugins";
import { PluginMarketplaceSheet } from "./plugin-marketplace-sheet";

interface PluginsTableProps {
  installationId: string;
}

// Loading skeleton component
function PluginsTableSkeleton() {
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

// Plugin Table Row Component
function PluginTableRow({
  plugin,
  isSelected,
  onSelect,
  hasUpdate,
  isActive,
  installationId,
  onAction,
  onRefetch,
  updatePluginStatus,
  deletePlugins,
  bulkAutoUpdatePlugins,
  isProcessing,
}: {
  plugin: WordPressPlugin;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  hasUpdate: boolean;
  isActive: boolean;
  installationId: string;
  onAction: (action: string, plugin: WordPressPlugin) => void;
  onRefetch: () => void;
  updatePluginStatus: any;
  deletePlugins: any;
  bulkAutoUpdatePlugins: any;
  isProcessing: boolean;
}) {
  const [uninstallDialogOpen, setUninstallDialogOpen] = React.useState(false);

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
          {isActive ? (
            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
              Active
            </Badge>
          ) : (
            <Badge variant="secondary">Inactive</Badge>
          )}
        </TableCell>
        <TableCell>
          <span className="text-sm">{plugin.version || "N/A"}</span>
        </TableCell>
        <TableCell>
          {hasUpdate ? (
            <div className="flex flex-col gap-1">
              <Badge variant="outline">Update Available</Badge>
              <span className="text-xs text-muted-foreground">
                v{plugin.availableVersion}
              </span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Up to date</span>
          )}
        </TableCell>
        <TableCell>
          {plugin.vulnerable ? (
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
                {plugin.status ? (
                  <DropdownMenuItem
                    onClick={() => onAction('deactivate', plugin)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Deactivate
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() => onAction('activate', plugin)}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Activate
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await bulkAutoUpdatePlugins.mutateAsync({
                        installationId: parseInt(installationId),
                        plugins: [{
                          slug: plugin.slug!,
                          autoUpdates: !plugin.autoUpdates,
                          status: plugin.status || false
                        }]
                      });
                      onRefetch();
                    } catch (error) {
                      console.error("Error updating auto-update:", error);
                    }
                  }}
                >
                  {plugin.autoUpdates ? (
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
                {plugin.changeLogUrl && (
                  <DropdownMenuItem onClick={() => window.open(plugin.changeLogUrl!, '_blank', 'noopener,noreferrer')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Changelog
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setUninstallDialogOpen(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Uninstall
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </TableCell>
      </TableRow>

      {/* Uninstall Confirmation Dialog */}
      <AlertDialog open={uninstallDialogOpen} onOpenChange={setUninstallDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Uninstall Plugin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to uninstall the plugin{" "}
              <span className="font-semibold text-foreground">
                {plugin.title}
              </span>
              ? This action cannot be undone and will permanently remove the plugin
              and all its associated data from your WordPress installation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deletePlugins.isPending}
              onClick={() => setUninstallDialogOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setUninstallDialogOpen(false);
                try {
                  await deletePlugins.mutateAsync({
                    installationId: parseInt(installationId),
                    plugins: [plugin.slug!]
                  });
                } catch (error) {
                  console.error("Error uninstalling plugin:", error);
                }
              }}
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

// Error component
function PluginsTableError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4">
        <Package className="h-12 w-12 text-muted-foreground mx-auto" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">Failed to load plugins</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        {error.message || "An error occurred while fetching WordPress plugins."}
      </p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}

export function PluginsTable({ installationId }: PluginsTableProps) {
  const { data: plugins, isLoading, isError, error, refetch } = useWordPressPlugins(installationId);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedPlugins, setSelectedPlugins] = React.useState<Set<string>>(new Set());
  const [marketplaceOpen, setMarketplaceOpen] = React.useState(false);

  // tRPC mutation for updating plugin status
  const updatePluginStatus = trpc.plesk.wpPluginsStatus.setStatus.useMutation({
    onSuccess: () => {
      toast.success("Plugin status updated successfully!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update plugin status");
    },
  });

  // tRPC mutation for deleting plugins
  const deletePlugins = trpc.plesk.wpPluginsDelete.delete.useMutation({
    onSuccess: () => {
      toast.success("Plugin uninstalled successfully!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to uninstall plugin");
    },
  });

  // tRPC mutation for bulk auto-updating plugins
  const bulkAutoUpdatePlugins = trpc.plesk.wpPluginsAutoupdate.update.useMutation({
    onSuccess: () => {
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
      return plugins.filter(plugin =>
        plugin.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plugin.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plugin.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return plugins;
  }, [plugins, searchTerm]);

  const handleSelectPlugin = (pluginSlug: string, selected: boolean) => {
    setSelectedPlugins(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(pluginSlug);
      } else {
        newSet.delete(pluginSlug);
      }
      return newSet;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedPlugins(new Set(filteredPlugins.map(plugin => plugin.slug!).filter(Boolean)));
    } else {
      setSelectedPlugins(new Set());
    }
  };

  const handleBulkAutoUpdate = async () => {
    const selectedPluginSlugs = Array.from(selectedPlugins);
    if (selectedPluginSlugs.length === 0) {
      toast.error("No plugins selected");
      return;
    }

    try {
      await bulkAutoUpdatePlugins.mutateAsync({
        installationId: parseInt(installationId),
        plugins: selectedPluginSlugs.map(slug => {
          const plugin = plugins?.find(p => p.slug === slug);
          return {
            slug,
            autoUpdates: true,
            status: plugin?.status || false
          };
        })
      });
      setSelectedPlugins(new Set());
    } catch (error) {
      console.error("Error in bulk auto-update:", error);
    }
  };

  const handleAction = async (action: string, plugin: WordPressPlugin) => {
    switch (action) {
      case 'activate':
        try {
          await updatePluginStatus.mutateAsync({
            installationId: parseInt(installationId),
            slug: plugin.slug!,
            status: true
          });
        } catch (error) {
          console.error("Error activating plugin:", error);
        }
        break;
      case 'deactivate':
        try {
          await updatePluginStatus.mutateAsync({
            installationId: parseInt(installationId),
            slug: plugin.slug!,
            status: false
          });
        } catch (error) {
          console.error("Error deactivating plugin:", error);
        }
        break;
      case 'delete':
        // Will be handled by delete dialog
        break;
    }
  };

  const selectedCount = selectedPlugins.size;
  const hasSelection = selectedCount > 0;
  const isAllSelected = filteredPlugins.length > 0 && selectedPlugins.size === filteredPlugins.length;

  if (isLoading) {
    return <PluginsTableSkeleton />;
  }

  if (isError) {
    return <PluginsTableError error={error as Error} onRetry={() => refetch()} />;
  }

  if (!plugins || plugins.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input
                placeholder="Search plugins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
          <Button onClick={() => setMarketplaceOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Plugin
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="mb-2 text-lg font-semibold">No plugins installed</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            This WordPress installation doesn't have any plugins installed yet.
          </p>
        </div>
        <PluginMarketplaceSheet
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
              placeholder="Search plugins..."
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
              disabled={bulkAutoUpdatePlugins.isPending}
            >
              {bulkAutoUpdatePlugins.isPending ? (
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
            Add Plugin
          </Button>
        </div>
      </div>

      {/* Plugins Table */}
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
              <TableHead>Plugin Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Updates</TableHead>
              <TableHead>Vulnerability</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlugins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No plugins found
                </TableCell>
              </TableRow>
            ) : (
              filteredPlugins.map((plugin) => {
                const hasUpdate = !!(plugin.availableVersion && plugin.availableVersion !== plugin.version);
                const isActive = plugin.status === true;

                const isProcessing =
                  (updatePluginStatus.isPending && updatePluginStatus.variables?.slug === plugin.slug) ||
                  (deletePlugins.isPending && deletePlugins.variables?.plugins?.includes(plugin.slug!)) ||
                  (bulkAutoUpdatePlugins.isPending && bulkAutoUpdatePlugins.variables?.plugins?.some(p => p.slug === plugin.slug));

                return (
                  <PluginTableRow
                    key={plugin.slug}
                    plugin={plugin}
                    isSelected={selectedPlugins.has(plugin.slug!)}
                    onSelect={(checked) => handleSelectPlugin(plugin.slug!, checked)}
                    hasUpdate={hasUpdate}
                    isActive={isActive}
                    installationId={installationId}
                    onAction={handleAction}
                    onRefetch={refetch}
                    updatePluginStatus={updatePluginStatus}
                    deletePlugins={deletePlugins}
                    bulkAutoUpdatePlugins={bulkAutoUpdatePlugins}
                    isProcessing={isProcessing}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <PluginMarketplaceSheet
        open={marketplaceOpen}
        onOpenChange={setMarketplaceOpen}
        installationId={installationId}
        onInstallSuccess={() => refetch()}
      />
    </div>
  );
}
