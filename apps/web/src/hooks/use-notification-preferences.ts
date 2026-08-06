import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { captureEvent } from "@/lib/posthog";

export function useNotificationPreferences() {
    const utils = trpc.useUtils();

    const {
        data: preferences,
        isLoading,
        isError,
        error
    } = trpc.user.getNotificationPreferences.useQuery(undefined, {
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const updateMutation = trpc.user.updateNotificationPreferences.useMutation({
        onSuccess: (updated) => {
            utils.user.getNotificationPreferences.setData(undefined, updated);
            const enabledChannels: string[] = [];
            if (updated.notificationSoundEnabled) enabledChannels.push("sound");
            if (updated.browserNotificationsEnabled) enabledChannels.push("browser");
            captureEvent("notification_preferences_updated", {
                enabled_channels: enabledChannels,
            });
            toast.success("Notification preferences updated");
        },
        onError: (err) => {
            toast.error(err.message || "Failed to update preferences");
        },
    });

    const updatePreferences = async (input: {
        notificationSoundEnabled?: boolean;
        browserNotificationsEnabled?: boolean;
        notificationSoundVolume?: number;
        browserNotificationPermission?: "default" | "granted" | "denied";
    }) => {
        return updateMutation.mutateAsync(input);
    };

    return {
        preferences,
        isLoading,
        isError,
        error,
        updatePreferences,
        isUpdating: updateMutation.isPending,
    };
}
