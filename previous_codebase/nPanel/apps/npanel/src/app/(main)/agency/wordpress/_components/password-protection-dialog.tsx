"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";

const passwordProtectionSchema = z.object({
    username: z.string().min(1, "Username is required").max(20, "Username must be 20 chars or less"),
    password: z.string().min(1, "Password is required"),
});

interface PasswordProtectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    installationId: number;
}

export function PasswordProtectionDialog({
    open,
    onOpenChange,
    installationId,
}: PasswordProtectionDialogProps) {
    const utils = trpc.useUtils();
    const { data: protection, isLoading } = trpc.plesk.wpFeatures.getPasswordProtection.useQuery(
        { installationId },
        { enabled: open }
    );

    const form = useForm<z.infer<typeof passwordProtectionSchema>>({
        resolver: zodResolver(passwordProtectionSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    React.useEffect(() => {
        if (protection?.data?.credentials) {
            form.reset({
                username: protection.data.credentials.username || "",
                password: protection.data.credentials.password || "", // API usually doesn't return password, but maps it
            });
        }
    }, [protection, form]);

    const updateMutation = trpc.plesk.wpFeatures.updatePasswordProtection.useMutation({
        onSuccess: () => {
            toast.success("Password protection updated");
            onOpenChange(false);
            utils.plesk.wpFeatures.getPasswordProtection.invalidate({ installationId });
            utils.plesk.wordpress.getById.invalidate({ id: installationId });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update password protection");
        },
    });

    const onSubmit = (values: z.infer<typeof passwordProtectionSchema>) => {
        updateMutation.mutate({
            installationId,
            status: true, // Enabling it implicitly when saving credentials
            credentials: values,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Password Protection</DialogTitle>
                    <DialogDescription>
                        Restrict access to your WordPress site with a username and password.
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="admin" />
                                        </FormControl>
                                        <FormDescription>
                                            Username for accessing the directory.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} placeholder="Strong password" />
                                        </FormControl>
                                        <FormDescription>
                                            The password is required to enable protection.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Enable Protection
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
