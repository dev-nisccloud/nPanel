import React from "react";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

export function useNotification() {
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    // Use a query to get preferences (assuming we'll implement this hook/query)
    const { data: preferences } = trpc.user.getNotificationPreferences.useQuery();

    // Initialize audio and Service Worker
    React.useEffect(() => {
        if (typeof window !== "undefined") {
            audioRef.current = new Audio("/sound_notification.wav");

            // Register Service Worker for better background notifications
            if ("serviceWorker" in navigator) {
                navigator.serviceWorker.register("/sw.js").then((reg) => {
                    console.log("Service Worker registered:", reg.scope);
                }).catch((err) => {
                    console.warn("Service Worker registration failed:", err);
                });
            }
        }
    }, []);

    // Sync volume
    React.useEffect(() => {
        if (audioRef.current && preferences) {
            audioRef.current.volume = (preferences.notificationSoundVolume ?? 100) / 100;
        }
    }, [preferences?.notificationSoundVolume]);

    const playSound = React.useCallback(async () => {
        if (preferences?.notificationSoundEnabled && audioRef.current) {
            try {
                // Ensure audio is loaded
                if (audioRef.current.readyState === 0) {
                    audioRef.current.load();
                }

                // Reset to start if already playing
                audioRef.current.currentTime = 0;
                await audioRef.current.play();
            } catch (error) {
                console.warn("Autoplay prevented or audio playback failed:", error);
            }
        }
    }, [preferences?.notificationSoundEnabled]);

    // Audio Priming and SW Listener
    React.useEffect(() => {
        if (typeof window === "undefined") return;

        // 1. Audio Priming: Unlock audio context on first user interaction
        const unlockAudio = () => {
            if (audioRef.current) {
                // Play and immediately pause/reset to unlock
                audioRef.current.play().then(() => {
                    audioRef.current!.pause();
                }).catch(() => {
                    // Silently ignore - user hasn't interacted enough or browser is strict
                });
            }
            window.removeEventListener('mousedown', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };

        window.addEventListener('mousedown', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);

        // 2. Service Worker Message Listener
        const handleSWMessage = (event: MessageEvent) => {
            if (event.data?.type === 'NEW_MESSAGE') {
                // Background polling found a message - play sound if allowed
                playSound();
            }
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleSWMessage);
        }

        return () => {
            window.removeEventListener('mousedown', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.removeEventListener('message', handleSWMessage);
            }
        };
    }, [playSound]);

    const requestBrowserPermission = React.useCallback(async () => {
        if (typeof window === "undefined" || !("Notification" in window)) {
            toast.error("Browser notifications are not supported in this browser");
            return "denied";
        }

        try {
            const permission = await Notification.requestPermission();
            return permission;
        } catch (error) {
            console.error("Error requesting notification permission:", error);
            return "denied";
        }
    }, []);

    const showBrowserNotification = React.useCallback(async (title: string, options?: NotificationOptions) => {
        if (
            preferences?.browserNotificationsEnabled &&
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
        ) {
            try {
                // Prefer Service Worker for more reliable background notifications
                if ("serviceWorker" in navigator) {
                    const registration = await navigator.serviceWorker.ready;
                    registration.showNotification(title, {
                        ...options,
                        icon: options?.icon || "/favicon.ico",
                    });
                } else {
                    new Notification(title, options);
                }
            } catch (error) {
                console.error("Error showing browser notification:", error);
            }
        }
    }, [preferences?.browserNotificationsEnabled]);

    return {
        playSound,
        showBrowserNotification,
        requestBrowserPermission,
        preferences,
    };
}
