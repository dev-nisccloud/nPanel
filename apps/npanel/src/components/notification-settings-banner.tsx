"use client";

import React from "react";
import { Bell, BellRing, Volume2, Settings, Info, Check, X, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { useNotification } from "@/hooks/use-notification";

export function NotificationSettingsBanner() {
    const [step, setStep] = React.useState<"overview" | "sound" | "browser" | "final">("overview");
    const [isExpanded, setIsExpanded] = React.useState(false);
    const { preferences, isLoading, updatePreferences, isUpdating } = useNotificationPreferences();
    const { playSound, requestBrowserPermission } = useNotification();

    // If preferences are already configured (e.g., both attempted or sound enabled), 
    // we can show a compact view if not expanded, or the full settings if expanded.
    const isConfigured = preferences?.notificationPreferencesUpdatedAt !== null;

    const handleEnableSound = async () => {
        await updatePreferences({ notificationSoundEnabled: true });
        playSound(); // Test play
        setStep("browser");
    };

    const handleEnableBrowser = async () => {
        const permission = await requestBrowserPermission();
        await updatePreferences({
            browserNotificationsEnabled: permission === "granted",
            browserNotificationPermission: permission as "default" | "granted" | "denied"
        });
        setStep("final");
    };

    const skipStep = () => {
        if (step === "overview") setStep("sound");
        else if (step === "sound") setStep("browser");
        else if (step === "browser") setStep("final");
    };

    if (isLoading) {
        return (
            <div className="p-4 border-b animate-pulse bg-muted/20">
                <div className="h-10 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
        );
    }

    // Not configured yet - show step-by-step guide
    if (!isConfigured && step !== "final") {
        return (
            <Card className="m-4 border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">Enhance your Chat Experience</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {step === "overview" && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Enable notifications to stay updated when customers message you. We'll guide you through setting up sound and browser alerts.
                            </p>
                            <div className="flex flex-col gap-2">
                                <Button onClick={() => setStep("sound")} className="w-full">
                                    Get Started
                                </Button>
                                <Button variant="ghost" onClick={skipStep} className="w-full">Maybe Later</Button>
                            </div>
                        </div>
                    )}

                    {step === "sound" && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Volume2 className="h-4 w-4" />
                                Step 1: Sound Notifications
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Play a sound when a new message arrives.
                            </p>
                            <div className="flex flex-col gap-2">
                                <Button onClick={handleEnableSound} className="w-full" disabled={isUpdating}>
                                    {isUpdating ? <Spinner size={16} className="mr-2" /> : <Check className="mr-2 h-4 w-4" />}
                                    Enable Sound
                                </Button>
                                <Button variant="ghost" onClick={skipStep} className="w-full">Skip</Button>
                            </div>
                        </div>
                    )}

                    {step === "browser" && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <BellRing className="h-4 w-4" />
                                Step 2: Browser Notifications
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Get desktop alerts even when the tab is in the background.
                            </p>
                            <div className="flex flex-col gap-2">
                                <Button onClick={handleEnableBrowser} className="w-full" disabled={isUpdating}>
                                    {isUpdating ? <Spinner size={16} className="mr-2" /> : <BellRing className="mr-2 h-4 w-4" />}
                                    Allow Browser Alerts
                                </Button>
                                <Button variant="ghost" onClick={skipStep} className="w-full">Skip</Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Final confirmation or Compact view
    return (
        <div className="border-b bg-muted/30">
            <div className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                    {preferences?.notificationSoundEnabled ? (
                        <Volume2 className="h-4 w-4 text-primary" />
                    ) : (
                        <Bell className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-xs font-medium">
                        {preferences?.notificationSoundEnabled && preferences?.browserNotificationsEnabled
                            ? "All notifications active"
                            : preferences?.notificationSoundEnabled
                                ? "Sound active"
                                : preferences?.browserNotificationsEnabled
                                    ? "Browser alerts active"
                                    : "Notifications disabled"}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[10px] uppercase tracking-wider"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? "Close Settings" : "Settings"}
                    <Settings className={cn("ml-1 h-3 w-3 transition-transform", isExpanded && "rotate-90")} />
                </Button>
            </div>

            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t pt-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <div className="text-sm font-medium">Sound Notifications</div>
                                <div className="text-[11px] text-muted-foreground">Play a sound on new messages</div>
                            </div>
                            <Switch
                                checked={preferences?.notificationSoundEnabled}
                                onCheckedChange={(checked) => updatePreferences({ notificationSoundEnabled: checked })}
                                disabled={isUpdating}
                            />
                        </div>

                        {preferences?.notificationSoundEnabled && (
                            <VolumeControl
                                initialVolume={preferences.notificationSoundVolume}
                                onSave={async (volume) => { await updatePreferences({ notificationSoundVolume: volume }); }}
                                isUpdating={isUpdating}
                                playSound={playSound}
                            />
                        )}

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <div className="text-sm font-medium">Browser Alerts</div>
                                <div className="text-[11px] text-muted-foreground">Desktop notifications</div>
                            </div>
                            <Switch
                                checked={preferences?.browserNotificationsEnabled}
                                onCheckedChange={async (checked) => {
                                    if (checked && Notification.permission !== "granted") {
                                        const perm = await requestBrowserPermission();
                                        updatePreferences({
                                            browserNotificationsEnabled: perm === "granted",
                                            browserNotificationPermission: perm as any
                                        });
                                    } else {
                                        updatePreferences({ browserNotificationsEnabled: checked });
                                    }
                                }}
                                disabled={isUpdating}
                            />
                        </div>

                        {preferences?.browserNotificationPermission === "denied" && (
                            <Alert variant="destructive" className="py-2 px-3">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-[10px]">
                                    Notifications are blocked by your browser. Please enable them in your browser settings.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function VolumeControl({
    initialVolume,
    onSave,
    isUpdating,
    playSound
}: {
    initialVolume: number;
    onSave: (vol: number) => Promise<void>;
    isUpdating: boolean;
    playSound: () => void;
}) {
    const [localVolume, setLocalVolume] = React.useState(initialVolume);
    const isDirty = localVolume !== initialVolume;

    // Sync local volume if initial volume changes externally (and we are not editing potentially?)
    // Actually, good practice to sync if the DB value changes to reflect it, 
    // unless the user is actively dragging. For simplicity, we sync on mount or if initial changes.
    React.useEffect(() => {
        setLocalVolume(initialVolume);
    }, [initialVolume]);

    const handleSave = async () => {
        await onSave(localVolume);
        // Sound check on save
        playSound();
    };

    return (
        <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-[11px] h-6">
                <span className="text-muted-foreground">Volume</span>
                {isDirty ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                        <span className="text-primary font-medium">{localVolume}%</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-5 w-5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 hover:text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        onClick={handleSave}
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? (
                                            <Spinner size={10} />
                                        ) : (
                                            <Check className="h-3 w-3" />
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="text-[10px]">
                                    Save changes
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                ) : (
                    <span className="animate-in fade-in duration-200">{localVolume}%</span>
                )}
            </div>
            <Slider
                value={[localVolume]}
                max={100}
                step={1}
                onValueChange={([val]) => setLocalVolume(val)}
                className="py-1"
            />
            {/* Removed the separate Test Sound button since we confirm with the tick now, 
                or maybe play sound on release? The user asked for "slide without updating DB". 
                We can play sound on slide end if we want, but let's stick to the confirm logic first.
                Actually, the requirements said "tooltip to confirm the update instead with proper loader".
            */}
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ");
}
