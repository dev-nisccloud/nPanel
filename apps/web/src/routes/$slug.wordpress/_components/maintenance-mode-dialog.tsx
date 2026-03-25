"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/utils/trpc";

const maintenanceSchema = z.object({
    fullMode: z.boolean().default(true),
    texts: z.object({
        title: z.string().optional(),
        header: z.string().optional(),
        subheader: z.string().optional(),
    }),
    timer: z.object({
        enabled: z.boolean().default(false),
        days: z.coerce.number().min(0).optional(),
        hours: z.coerce.number().min(0).max(23).optional(),
        minutes: z.coerce.number().min(0).max(59).optional(),
    }),
});

interface MaintenanceModeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    installationId: number;
}

export function MaintenanceModeDialog({
    open,
    onOpenChange,
    installationId,
}: MaintenanceModeDialogProps) {
    const utils = trpc.useUtils();
    const { data: settings, isLoading } = trpc.plesk.wpFeatures.getMaintenanceSettings.useQuery(
        { installationId },
        { enabled: open }
    );

    const form = useForm<z.infer<typeof maintenanceSchema>>({
        resolver: zodResolver(maintenanceSchema),
        defaultValues: {
            fullMode: true,
            texts: { title: "", header: "", subheader: "" },
            timer: { enabled: false, days: 0, hours: 0, minutes: 0 },
        },
    });

    React.useEffect(() => {
        if (settings) {
            form.reset({
                fullMode: settings.data?.fullMode ?? true,
                texts: {
                    title: settings.data?.texts?.title ?? "",
                    header: settings.data?.texts?.header ?? "",
                    subheader: settings.data?.texts?.subheader ?? "",
                },
                timer: {
                    enabled: settings.data?.timer?.enabled ?? false,
                    days: settings.data?.timer?.days ?? 0,
                    hours: settings.data?.timer?.hours ?? 0,
                    minutes: settings.data?.timer?.minutes ?? 0,
                },
            });
        }
    }, [settings, form]);

    const updateMutation = trpc.plesk.wpFeatures.updateMaintenanceSettings.useMutation({
        onSuccess: () => {
            toast.success("Maintenance settings updated");
            onOpenChange(false);
            utils.plesk.wpFeatures.getMaintenanceSettings.invalidate({ installationId });
            // Also invalidate the main installation query if it shows maintenance status
            // Also invalidate the main installation query if it shows maintenance status
            utils.plesk.wordpress.getById.invalidate({ id: installationId });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update maintenance settings");
        },
    });

    const onSubmit = (values: z.infer<typeof maintenanceSchema>) => {
        updateMutation.mutate({
            installationId,
            ...values,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Maintenance Mode Settings</DialogTitle>
                    <DialogDescription>
                        Configure the maintenance page shown to visitors.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="fullMode"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Full Maintenance Mode</FormLabel>
                                            <FormDescription>
                                                Return 503 Service Unavailable status code.
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <div className="space-y-4">
                                <h4 className="font-medium">Page Content</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="texts.title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Browser Title</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Scheduled Maintenance" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="texts.header"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Header</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="The website is undergoing scheduled maintenance." />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="texts.subheader"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description</FormLabel>
                                                <FormControl>
                                                    <Textarea {...field} placeholder="Sorry for the inconvenience..." />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 rounded-lg border p-4">
                                <FormField
                                    control={form.control}
                                    name="timer.enabled"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between">
                                            <div className="space-y-0.5">
                                                <FormLabel>Countdown Timer</FormLabel>
                                                <FormDescription>
                                                    Show a countdown on the maintenance page.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                {form.watch("timer.enabled") && (
                                    <div className="grid grid-cols-3 gap-4 pt-2">
                                        <FormField
                                            control={form.control}
                                            name="timer.days"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Days</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="timer.hours"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Hours</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" max="23" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="timer.minutes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Minutes</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min="0" max="59" {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
