"use client";

import * as React from "react";
import { Edit, Mail, ShieldCheck, ShieldX, Calendar, User, BadgeCheck, Plug, XIcon, Plus } from "lucide-react";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/utils/trpc";
import { EditClientDialog } from "./edit-client-dialog";
import { ProfileInformation } from "./profile-information";
import { EditProfileDialog } from "./edit-profile-dialog";
import { IntegrationsDisplay } from "./integrations-display";
import { AddIntegrationDialog } from "./add-integration-dialog";
import { captureEvent } from "@/lib/posthog";

interface ClientViewSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
}

export function ClientViewSheet({
    open,
    onOpenChange,
    clientId,
}: ClientViewSheetProps) {
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = React.useState(false);
    const [isAddIntegrationDialogOpen, setIsAddIntegrationDialogOpen] = React.useState(false);

    const utils = trpc.useUtils();

    React.useEffect(() => {
        if (open && clientId) {
            captureEvent("client_profile_viewed", { client_id: clientId });
        }
    }, [open, clientId]);

    // Try to get client from cache first
    const clientsData = utils.clients.getAll.getData();
    const clientFromCache = React.useMemo(() => {
        if (!clientsData) return undefined;
        return clientsData.find((c) => c.id === clientId);
    }, [clientsData, clientId]);

    // Fallback: fetch user info if not in cache
    const { data: userInfo, isLoading: isLoadingUserInfo, error: userInfoError } = trpc.userProfile.getUserById.useQuery(
        { userId: clientId, fields: ["id", "name", "email", "emailVerified", "role", "status", "image", "lastLoginAt", "createdAt", "updatedAt"] },
        { enabled: open && !!clientId && !clientFromCache }
    );

    // Use client from cache or userInfo as fallback
    const displayClient = React.useMemo(() => {
        if (clientFromCache) return clientFromCache;
        if (userInfo) {
            return {
                id: userInfo.id,
                name: userInfo.name || "",
                email: userInfo.email || "",
                emailVerified: userInfo.emailVerified || false,
                role: userInfo.role,
                status: userInfo.status,
                image: userInfo.image,
                lastLoginAt: userInfo.lastLoginAt,
                createdAt: userInfo.createdAt,
                updatedAt: userInfo.updatedAt,
            };
        }
        return undefined;
    }, [clientFromCache, userInfo]);

    const { data: sessions, isLoading: isLoadingSessions, error: sessionsError } = trpc.clients.getSessions.useQuery(
        { userId: clientId },
        { enabled: open && !!clientId }
    );

    const isLoading = !displayClient && isLoadingUserInfo;
    const error = userInfoError || sessionsError || null;

    const handleEditSuccess = React.useCallback(() => {
        utils.clients.getAll.invalidate();
        utils.userProfile.getUserById.invalidate({ userId: clientId });
        utils.clients.getProfile.invalidate({ userId: clientId });
        utils.clients.getIntegrations.invalidate({ userId: clientId });
    }, [utils, clientId]);

    const getStatusBadge = (status: string) => {
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
            ACTIVE: "default",
            SUSPENDED: "secondary",
            BANNED: "destructive",
            DEACTIVATED: "outline",
        };
        return (
            <Badge variant={variants[status] || "secondary"}>
                {status}
            </Badge>
        );
    };

    if (!open) return null;

    return (
        <>
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
                    <SheetHeader className="p-6 border-b flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-full">
                                <User className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="flex items-center gap-2">
                                    {isLoading ? "Loading Client..." : displayClient?.name || "Client Details"}
                                    {displayClient?.emailVerified && (
                                        <BadgeCheck className="h-5 w-5 text-blue-500 fill-blue-500" />
                                    )}
                                </SheetTitle>
                                <SheetDescription>
                                    {isLoading ? "Fetching account details..." : "Account details and management"}
                                </SheetDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {!isLoading && displayClient && (
                                <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(true)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            )}
                            <SheetClose asChild>
                                <Button size="icon" variant="ghost" className="h-8 w-8 p-0">
                                    <XIcon className="h-5 w-5" />
                                </Button>
                            </SheetClose>
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 min-h-0 pr-4">
                        <div className="px-6 py-6 space-y-6">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Spinner size={32} />
                                </div>
                            ) : error || !displayClient ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <p className="text-destructive mb-4">{error?.message || "Client not found"}</p>
                                    <Button onClick={() => onOpenChange(false)} variant="outline">
                                        Close
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {/* Account Overview */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <User className="h-5 w-5" />
                                                Account Overview
                                            </CardTitle>
                                            <CardDescription>Core account information</CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Email Address</span>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium">{displayClient.email}</p>
                                                    {displayClient.emailVerified ? (
                                                        <ShieldCheck className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <ShieldX className="h-4 w-4 text-gray-400" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Account Role</span>
                                                <p className="text-sm font-medium">
                                                    <Badge variant="outline">{displayClient.role}</Badge>
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
                                                <p className="text-sm font-medium">
                                                    {getStatusBadge(displayClient.status)}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Created On</span>
                                                <p className="text-sm font-medium">
                                                    {new Date(displayClient.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                            {displayClient.lastLoginAt && (
                                                <div className="space-y-1">
                                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Last Activity</span>
                                                    <p className="text-sm font-medium">
                                                        {new Date(displayClient.lastLoginAt).toLocaleString()}
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Profile Details */}
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <BadgeCheck className="h-5 w-5" />
                                                    Profile Information
                                                </CardTitle>
                                                <CardDescription>Extended profile data</CardDescription>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => setIsEditProfileDialogOpen(true)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit Profile
                                            </Button>
                                        </CardHeader>
                                        <CardContent>
                                            <ProfileInformation userId={clientId} />
                                        </CardContent>
                                    </Card>

                                    {/* Integrations */}
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <Plug className="h-5 w-5" />
                                                    Platform Integrations
                                                </CardTitle>
                                                <CardDescription>Connected third-party accounts</CardDescription>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => setIsAddIntegrationDialogOpen(true)}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Integration
                                            </Button>
                                        </CardHeader>
                                        <CardContent>
                                            <IntegrationsDisplay userId={clientId} />
                                        </CardContent>
                                    </Card>

                                    {/* Session Management */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <ShieldCheck className="h-5 w-5" />
                                                Active Sessions
                                            </CardTitle>
                                            <CardDescription>Manage active device permissions</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {isLoadingSessions ? (
                                                <div className="flex items-center justify-center py-6">
                                                    <Spinner size={24} />
                                                </div>
                                            ) : !sessions || sessions.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                                                    <p>No active sessions found for this user.</p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-4">
                                                    {sessions.map((session) => (
                                                        <div key={session.id} className="p-4 border rounded-lg space-y-3 bg-muted/30">
                                                            <div className="flex items-center justify-between">
                                                                <div className="space-y-1">
                                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Token Identifier</p>
                                                                    <p className="text-xs font-mono truncate max-w-[200px]">{session.token}</p>
                                                                </div>
                                                                <Badge variant={new Date(session.expiresAt) > new Date() ? "default" : "secondary"}>
                                                                    {new Date(session.expiresAt) > new Date() ? "Active" : "Expired"}
                                                                </Badge>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">Logged in on</p>
                                                                    <p className="text-sm font-medium">{new Date(session.createdAt).toLocaleDateString()}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">Expires on</p>
                                                                    <p className="text-sm font-medium">{new Date(session.expiresAt).toLocaleDateString()}</p>
                                                                </div>
                                                                {session.ipAddress && (
                                                                    <div className="col-span-2">
                                                                        <p className="text-xs text-muted-foreground">IP Address</p>
                                                                        <p className="text-sm font-medium">{session.ipAddress}</p>
                                                                    </div>
                                                                )}
                                                                {session.userAgent && (
                                                                    <div className="col-span-2">
                                                                        <p className="text-xs text-muted-foreground">Device Info</p>
                                                                        <p className="text-xs font-medium line-clamp-1">{session.userAgent}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            {displayClient && (
                <>
                    <EditClientDialog
                        open={isEditDialogOpen}
                        onOpenChange={setIsEditDialogOpen}
                        clientId={displayClient.id}
                        initialData={{
                            name: displayClient.name,
                            email: displayClient.email,
                            role: displayClient.role,
                        }}
                        onSuccess={handleEditSuccess}
                    />
                    <EditProfileDialog
                        open={isEditProfileDialogOpen}
                        onOpenChange={setIsEditProfileDialogOpen}
                        userId={displayClient.id}
                        userName={displayClient.name}
                        onSuccess={handleEditSuccess}
                    />
                    <AddIntegrationDialog
                        open={isAddIntegrationDialogOpen}
                        onOpenChange={setIsAddIntegrationDialogOpen}
                        userId={displayClient.id}
                        onSuccess={handleEditSuccess}
                    />
                </>
            )}
        </>
    );
}
