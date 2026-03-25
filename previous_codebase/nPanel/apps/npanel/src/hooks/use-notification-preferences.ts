import { trpc } from "@/utils/trpc";
import { toast } from "sonner";

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
