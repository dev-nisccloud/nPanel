import React from "react";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";

export function useNotification() {
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    // Use a query to get preferences (assuming we'll implement this hook/query)
    const { data: preferences } = trpc.user.getNotificationPreferences.useQuery();

    // Initialize audio and Service Worker
    React.useEffect(() => {
        if (typeof window !== "undefined") {
            audioRef.current = new Audio("/sound_notification.wav");

            // Register Service Worker (version in URL so production always gets latest after deploy)
            if ("serviceWorker" in navigator) {
                // First, aggressively unregister any old/foreign Service Workers (like Vite/Workbox)
                // that might be intercepting requests to / and caching old HTML.
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                    for (const registration of registrations) {
                        const sw = registration.installing || registration.waiting || registration.active;
                        if (sw && sw.scriptURL && !sw.scriptURL.includes('/sw.js')) {
                            console.warn("Unregistering legacy Service Worker:", sw.scriptURL);
                            registration.unregister();
                        }
                    }
                }).catch(console.error);

                const swUrl = "/sw.js?v=4";
                navigator.serviceWorker.register(swUrl).then((reg) => {
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
        // Play sound by default (true) if preferences haven't loaded yet
        const shouldPlaySound = preferences?.notificationSoundEnabled ?? true;

        if (shouldPlaySound && audioRef.current) {
            try {
                // Ensure audio is loaded
                if (audioRef.current.readyState === 0) {
                    audioRef.current.load();
                }

                // Reset to start if already playing
                audioRef.current.currentTime = 0;
                await audioRef.current.play();
            } catch (error) {
                console.warn("Audio playback failed:", error);
            }
        }
    }, [preferences?.notificationSoundEnabled, preferences]);

    // Audio Priming and SW Listener
    React.useEffect(() => {
        if (typeof window === "undefined") return;

        // 1. Audio Priming: Unlock audio context on first user interaction
        const unlockAudio = () => {
            if (audioRef.current) {
                // Mute for priming
                audioRef.current.volume = 0;

                // Play and immediately pause to unlock
                audioRef.current.play().then(() => {
                    if (audioRef.current) {
                        audioRef.current.pause();
                        // Restore volume from preferences (not original volume which might be 0)
                        const targetVolume = (preferences?.notificationSoundVolume ?? 100) / 100;
                        audioRef.current.volume = targetVolume;
                    }
                }).catch(() => {
                    // Even if priming fails, restore volume
                    if (audioRef.current) {
                        const targetVolume = (preferences?.notificationSoundVolume ?? 100) / 100;
                        audioRef.current.volume = targetVolume;
                    }
                });
            }
            window.removeEventListener('mousedown', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
            window.removeEventListener('click', unlockAudio);
        };

        window.addEventListener('mousedown', unlockAudio, { once: true });
        window.addEventListener('keydown', unlockAudio, { once: true });
        window.addEventListener('touchstart', unlockAudio, { once: true });
        window.addEventListener('click', unlockAudio, { once: true });

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
            window.removeEventListener('click', unlockAudio);
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.removeEventListener('message', handleSWMessage);
            }
        };
    }, [playSound, preferences]);

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
