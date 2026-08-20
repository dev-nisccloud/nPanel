"use client";

import * as React from "react";
import {
    Shield,
    Settings,
    Terminal,
    Construction,
    RefreshCw,
    Lock,
    Search,
    Globe,
    Activity,
    CheckCircle,
    AlertCircle
} from "lucide-react";
import { toast } from "@/components/ui/sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { WpActionSwitch, isPendingField } from "@/components/wordpress/wp-action-switch";

import { trpc } from "@/utils/trpc";
import { MaintenanceModeDialog } from "./maintenance-mode-dialog";
import { PasswordProtectionDialog } from "./password-protection-dialog";
import { captureEvent } from "@/lib/posthog";

interface WordPressToolsProps {
    installationId: string;
}

export function WordPressTools({ installationId }: WordPressToolsProps) {
    const id = parseInt(installationId);
    const utils = trpc.useUtils();

    const [maintenanceOpen, setMaintenanceOpen] = React.useState(false);
    const [passwordOpen, setPasswordOpen] = React.useState(false);

    // Queries
    // Queries: use getById with numeric id
    const { data: features, isLoading: featuresLoading } = trpc.plesk.wordpress.getById.useQuery({ id });
    const { data: debugSettings, isLoading: debugLoading } = trpc.plesk.wpFeatures.getDebugSettings.useQuery({ installationId: id });

    // TODO: Add Integrity, etc. queries as needed or rely on main `features` from `wordpress.get` if it contains everything, 
    // but usually `wordpress.get` only has status summaries. We might need specific queries for details.
    // Actually, the user provided APIs show specific endpoints for settings.
    // We can load them on demand or in this component. Let's rely on individual queries for the Settings cards to be robust.

    // Mutations
    // Helper for optimistic updates
    const updateLocalCache = (path: string[], value: any) => {
        utils.plesk.wordpress.getById.setData({ id }, (old) => {
            if (!old?.data?.features) return old;
            const newData = JSON.parse(JSON.stringify(old));
            let current = newData.data.features;
            for (let i = 0; i < path.length - 1; i++) {
                if (!current[path[i]]) current[path[i]] = {};
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return newData;
        });
    };

    // Mutations
    const updateDebug = trpc.plesk.wpFeatures.updateDebugStatus.useMutation({
        onMutate: async (vars) => {
            await utils.plesk.wordpress.getById.cancel({ id });
            const prev = utils.plesk.wordpress.getById.getData({ id });
            updateLocalCache(['debug', 'status'], vars.status);
            return { prev };
        },
        onSuccess: () => {
            toast.success("Debug status updated");
            utils.plesk.wordpress.getById.invalidate({ id });
        },
        onError: (e, vars, context) => {
            toast.error(e.message);
            if (context?.prev) utils.plesk.wordpress.getById.setData({ id }, context.prev);
        }
    });

    const updateDebugSettings = trpc.plesk.wpFeatures.updateDebugSettings.useMutation({
        onSuccess: () => {
            toast.success("Debug settings saved");
            utils.plesk.wpFeatures.getDebugSettings.invalidate();
        },
        onError: (e) => toast.error(e.message)
    });

    const toggleMaintenance = trpc.plesk.wpFeatures.toggleMaintenanceMode.useMutation({
        onMutate: async (vars) => {
            await utils.plesk.wordpress.getById.cancel({ id });
            const prev = utils.plesk.wordpress.getById.getData({ id });
            updateLocalCache(['maintenance', 'status'], vars.status);
            return { prev };
        },
        onSuccess: (_data, variables) => {
            captureEvent(variables.status ? "wordpress_maintenance_enabled" : "wordpress_maintenance_disabled");

            toast.success("Maintenance mode toggled");
            utils.plesk.wordpress.getById.invalidate({ id });
        },
        onError: (e, vars, context) => {
            toast.error(e.message);
            if (context?.prev) utils.plesk.wordpress.getById.setData({ id }, context.prev);
        }
    });

    const toggleIndexing = trpc.plesk.wpFeatures.toggleIndexing.useMutation({
        onMutate: async (vars) => {
            await utils.plesk.wordpress.getById.cancel({ id });
            const prev = utils.plesk.wordpress.getById.getData({ id });
            updateLocalCache(['indexing', 'status'], vars.status);
            return { prev };
        },
        onSuccess: () => {
            toast.success("Search indexing updated");
            utils.plesk.wordpress.getById.invalidate({ id });
        },
        onError: (e, vars, context) => {
            toast.error(e.message);
            if (context?.prev) utils.plesk.wordpress.getById.setData({ id }, context.prev);
        }
    });

    const toggleNginx = trpc.plesk.wpFeatures.toggleNginxCaching.useMutation({
        onMutate: async (vars) => {
            await utils.plesk.wordpress.getById.cancel({ id });
            const prev = utils.plesk.wordpress.getById.getData({ id });
            updateLocalCache(['nginxCaching', 'status'], vars.status);
            return { prev };
        },
        onSuccess: () => {
            toast.success("Nginx caching updated");
            utils.plesk.wordpress.getById.invalidate({ id });
        },
        onError: (e, vars, context) => {
            toast.error(e.message);
            if (context?.prev) utils.plesk.wordpress.getById.setData({ id }, context.prev);
        }
    });

    const toggleHotlink = trpc.plesk.wpFeatures.updateHotlinkProtectionStatus.useMutation({
        onMutate: async (vars) => {
            await utils.plesk.wordpress.getById.cancel({ id });
            const prev = utils.plesk.wordpress.getById.getData({ id });
            // API expects 'status' but WordPress object structure for hotlinkProtection might be { status: boolean, available: boolean }
            // Verify structure from wordpress.ts output or standard
            updateLocalCache(['hotlinkProtection', 'status'], vars.status);
            return { prev };
        },
        onSuccess: () => {
            toast.success("Hotlink protection updated");
            utils.plesk.wordpress.getById.invalidate({ id });
        },
        onError: (e, vars, context) => {
            toast.error(e.message);
            if (context?.prev) utils.plesk.wordpress.getById.setData({ id }, context.prev);
        }
    });

    const runSmartUpdate = trpc.plesk.wpFeatures.applySmartUpdate.useMutation({
        onSuccess: () => {
          captureEvent("wordpress_updated");

            toast.success("Smart update started");
        },
        onError: (e) => toast.error(e.message)
    });

    if (featuresLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        );
    }

    // Safely access nested feature flags from the structure { data: installation, metadata: ... }
    const f = features?.data?.features;

    return (
        <div className="space-y-6">

            {/* 1. Debugging & Development */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Terminal className="h-5 w-5" />
                        Debugging & Development
                    </CardTitle>
                    <CardDescription>
                        Configure WordPress debugging constants and development tools.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Debug Mode</Label>
                            <p className="text-sm text-muted-foreground">
                                Enable WP_DEBUG constant to see errors.
                            </p>
                        </div>
                        <WpActionSwitch
                            checked={f?.debug?.status || false}
                            loading={updateDebug.isPending}
                            onCheckedChange={(val) => updateDebug.mutate({ installationId: id, status: val })}
                        />
                    </div>

                    {f?.debug?.status && (
                        <div className="pl-4 border-l-2 border-muted space-y-4">
                            {debugLoading ? <Spinner size={16} /> : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <Label className="font-normal">WP_DEBUG_LOG (Save errors to debug.log)</Label>
                                        <WpActionSwitch
                                            checked={debugSettings?.data?.wpDebugLog || false}
                                            loading={isPendingField(updateDebugSettings, "wpDebugLog")}
                                            onCheckedChange={(val) => updateDebugSettings.mutate({ installationId: id, wpDebugLog: val })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="font-normal">WP_DEBUG_DISPLAY (Show errors on screen)</Label>
                                        <WpActionSwitch
                                            checked={debugSettings?.data?.wpDebugDisplay || false}
                                            loading={isPendingField(updateDebugSettings, "wpDebugDisplay")}
                                            onCheckedChange={(val) => updateDebugSettings.mutate({ installationId: id, wpDebugDisplay: val })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="font-normal">SCRIPT_DEBUG (Use non-minified scripts)</Label>
                                        <WpActionSwitch
                                            checked={debugSettings?.data?.scriptDebug || false}
                                            loading={isPendingField(updateDebugSettings, "scriptDebug")}
                                            onCheckedChange={(val) => updateDebugSettings.mutate({ installationId: id, scriptDebug: val })}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 2. Security & Access */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security & Access
                    </CardTitle>
                    <CardDescription>
                        Manage access restrictions and security headers.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Hotlink Protection</Label>
                            <p className="text-sm text-muted-foreground">
                                Prevent other sites from linking directly to your images.
                            </p>
                        </div>
                        <WpActionSwitch
                            checked={f?.hotlinkProtection?.status || false}
                            loading={toggleHotlink.isPending}
                            onCheckedChange={(val) => toggleHotlink.mutate({ installationId: id, status: val })}
                        />
                    </div>
                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Password Protection</Label>
                            <p className="text-sm text-muted-foreground">
                                Restrict access to the entire website using Basic Auth.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {f?.passwordProtection?.status ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                            ) : (
                                <Badge variant="secondary">Inactive</Badge>
                            )}
                            <Button variant="outline" size="sm" onClick={() => setPasswordOpen(true)}>
                                <Lock className="mr-2 h-3.5 w-3.5" />
                                Configure
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Performance & SEO */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Performance & SEO
                    </CardTitle>
                    <CardDescription>
                        Optimize delivery and search engine visibility.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Search Engine Indexing</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow search engines to crawl and index your site.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant={f?.indexing?.status ? "default" : "secondary"}>
                                {f?.indexing?.status ? "Indexed" : "No-Index"}
                            </Badge>
                            <WpActionSwitch
                                checked={f?.indexing?.status || false}
                                loading={toggleIndexing.isPending}
                                onCheckedChange={(val) => toggleIndexing.mutate({ installationId: id, status: val })}
                            />
                        </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Nginx Caching</Label>
                            <p className="text-sm text-muted-foreground">
                                Enable Nginx-level caching for faster load times.
                            </p>
                        </div>
                        <WpActionSwitch
                            checked={f?.nginxCaching?.status || false}
                            loading={toggleNginx.isPending}
                            onCheckedChange={(val) => toggleNginx.mutate({ installationId: id, status: val })}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 4. Maintenance & Operations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Construction className="h-5 w-5" />
                        Maintenance & Operations
                    </CardTitle>
                    <CardDescription>
                        Tools for site updates and maintenance.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Maintenance Mode</Label>
                            <p className="text-sm text-muted-foreground">
                                Show a custom "Under Construction" page to visitors.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {f?.maintenance?.status && <Badge variant="secondary">Active</Badge>}
                            <WpActionSwitch
                                checked={f?.maintenance?.status || false}
                                loading={toggleMaintenance.isPending}
                                onCheckedChange={(val) => toggleMaintenance.mutate({ installationId: id, status: val })}
                            />
                            <Button variant="outline" size="icon" onClick={() => setMaintenanceOpen(true)}>
                                <Settings className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Smart Updates</Label>
                            <p className="text-sm text-muted-foreground">
                                AI-powered update mechanism that tests changes safely.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => runSmartUpdate.mutate({ installationId: id })}
                            disabled={runSmartUpdate.isPending}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Run Smart Update
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Dialogs */}
            <MaintenanceModeDialog
                open={maintenanceOpen}
                onOpenChange={setMaintenanceOpen}
                installationId={id}
            />
            <PasswordProtectionDialog
                open={passwordOpen}
                onOpenChange={setPasswordOpen}
                installationId={id}
            />
        </div>
    );
}
