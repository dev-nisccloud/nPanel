"use client";

import * as React from "react";
import {
    ShieldCheck,
    Zap,
    Info,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

export default function ETimsSettingsPage() {
    const utils = trpc.useUtils();

    const { data: configStatus, isLoading: isLoadingConfig } = trpc.etims.auth.getConfiguration.useQuery();

    const initMutation = trpc.etims.initialization.initializeDevice.useMutation({
        onSuccess: (data) => {
            toast.success("eTIMS Initialized Successfully");
            utils.etims.auth.getConfiguration.invalidate();
        },
        onError: (error) => {
            toast.error(`Initialization Failed: ${error.message}`);
        }
    });

    const tokenMutation = trpc.etims.auth.generateToken.useMutation({
        onError: (error) => {
            toast.error(`Token Generation Failed: ${error.message}`);
        }
    });

    const [formData, setFormData] = React.useState({
        kraPin: "",
        branchId: "00",
        deviceSerialNumber: "",
        isSandbox: true
    });

    // Reset form configuration loads
    React.useEffect(() => {
        if (configStatus?.config) {
            setFormData({
                kraPin: configStatus.config.kraPin,
                branchId: configStatus.config.branchId,
                deviceSerialNumber: configStatus.config.deviceSerialNumber,
                isSandbox: configStatus.config.isSandbox
            });
        }
    }, [configStatus]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, isSandbox: checked }));
    };

    const onHandleInitialize = async () => {
        try {
            initMutation.mutate({
                tin: formData.kraPin,
                bhfId: formData.branchId,
                dvcSrlNo: formData.deviceSerialNumber,
                isSandbox: formData.isSandbox
            });
        } catch (error) {
            console.error("Setup flow failed", error);
        }
    };

    return (
        <div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
            <div className="w-full max-w-7xl mx-auto">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-2xl font-semibold tracking-tight">eTIMS Configuration</h1>
                            <p className="text-muted-foreground">
                                Manage your KRA API credentials and device initialization settings.
                            </p>
                        </div>
                    </div>

                    {isLoadingConfig ? (
                        <div className="flex justify-center py-12">
                            <Spinner size={32} />
                        </div>
                    ) : (
                        <>
                            {(!configStatus?.isInitialized) && (
                                <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/50">
                                    <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    <AlertTitle className="text-amber-800 dark:text-amber-400">Action Required</AlertTitle>
                                    <AlertDescription className="text-amber-700 dark:text-amber-500">
                                        Device not initialized. Complete the configuration and click "Initialize Device".
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="grid gap-6 lg:grid-cols-3">
                                {/* Main Settings Form */}
                                <div className="lg:col-span-2 space-y-6">
                                    <Card className="bg-card shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <ShieldCheck className="h-5 w-5 text-primary" />
                                                Taxpayer Details
                                            </CardTitle>
                                            <CardDescription>Basic business information registered with KRA.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="kraPin">KRA PIN</Label>
                                                    <Input id="kraPin" value={formData.kraPin} onChange={handleInputChange} placeholder="P05XXXXXXXX" disabled={configStatus?.isInitialized} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="branchId">Branch ID</Label>
                                                    <Input id="branchId" value={formData.branchId} onChange={handleInputChange} placeholder="00" disabled={configStatus?.isInitialized} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="deviceSerialNumber">Device Serial Number</Label>
                                                <Input id="deviceSerialNumber" value={formData.deviceSerialNumber} onChange={handleInputChange} placeholder="NPCXXXXXXX" disabled={configStatus?.isInitialized} />
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex justify-end gap-3 border-t bg-muted/50 p-4">
                                            {/* Footer content if needed */}
                                        </CardFooter>
                                    </Card>
                                </div>

                                {/* Sidebar Info/Status */}
                                <div className="space-y-6">
                                    <Card className="bg-card shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Zap className="h-4 w-4 text-amber-500" />
                                                System Mode
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label>Sandbox Mode</Label>
                                                    <p className="text-xs text-muted-foreground">Used for testing and verification.</p>
                                                </div>
                                                <Switch checked={formData.isSandbox} onCheckedChange={handleSwitchChange} disabled={configStatus?.isInitialized} />
                                            </div>

                                            <div className="pt-4 border-t">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">Initialization Status:</span>
                                                    <Badge variant={configStatus?.isInitialized ? "outline" : "secondary"}>
                                                        {configStatus?.isInitialized ? "COMPLETE" : "PENDING"}
                                                    </Badge>
                                                </div>
                                                {configStatus?.isInitialized && (
                                                    <div className="mt-3 flex items-center gap-2 lg:flex-row flex-col justify-center">
                                                        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded border border-green-200 dark:border-green-800">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            Device Ready
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                        <CardFooter className="p-4 pt-0">
                                            <Button
                                                className="w-full"
                                                variant={configStatus?.isInitialized ? "secondary" : "default"}
                                                onClick={onHandleInitialize}
                                                disabled={initMutation.isPending || configStatus?.isInitialized}
                                            >
                                                {initMutation.isPending && <Spinner size={16} className="mr-2" />}
                                                {configStatus?.isInitialized ? "Device Initialized" : "Initialize Device"}
                                            </Button>
                                        </CardFooter>
                                    </Card>

                                    <Card className="bg-card shadow-sm border-dashed">
                                        <CardHeader>
                                            <CardTitle className="text-sm">Need Help?</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-xs text-muted-foreground space-y-2">
                                            <p>Initialization requires a unique Device Serial Number and valid Taxpayer details.</p>
                                            <p>The <strong>cmcKey</strong> will be automatically retrieved and stored upon successful initialization.</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
