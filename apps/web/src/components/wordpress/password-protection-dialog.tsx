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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useConfirm } from "@/hooks/use-confirm";
import { trpc } from "@/utils/trpc";

const passwordProtectionSchema = z.object({
  username: z.string().min(1, "Username is required").max(20, "Username must be 20 characters or less"),
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
    { enabled: open },
  );

  const isActive = Boolean(protection?.data?.status);

  const form = useForm<z.infer<typeof passwordProtectionSchema>>({
    resolver: zodResolver(passwordProtectionSchema),
    defaultValues: { username: "", password: "" },
  });

  React.useEffect(() => {
    if (protection?.data?.credentials) {
      form.reset({
        username: protection.data.credentials.username || "",
        password: protection.data.credentials.password || "",
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
    onError: (error) => toast.error(error.message || "Failed to update password protection"),
  });

  const [DisableProtectionDialog, confirmDisableProtection] = useConfirm(
    "Disable password protection?",
    "Visitors will no longer need a username and password to access this site. The site will become publicly accessible.",
  );

  const onSubmit = (values: z.infer<typeof passwordProtectionSchema>) => {
    updateMutation.mutate({
      installationId,
      status: true,
      credentials: values,
    });
  };

  return (
    <>
      <DisableProtectionDialog />
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Password protection</DialogTitle>
          <DialogDescription>
            Restrict access to your WordPress site with HTTP basic authentication.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <span className="text-sm font-medium">Protection active</span>
                <Switch checked={isActive} disabled />
              </div>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="admin" autoComplete="off" />
                    </FormControl>
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
                      <Input type="password" {...field} placeholder="Strong password" autoComplete="new-password" />
                    </FormControl>
                    <FormDescription>Required when enabling or changing credentials.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
                <Button type="submit" disabled={updateMutation.isPending} className="w-full">
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save and enable
                </Button>
                {isActive ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={updateMutation.isPending}
                    onClick={async () => {
                      const ok = await confirmDisableProtection();
                      if (!ok) return;
                      updateMutation.mutate({ installationId, status: false });
                    }}
                  >
                    Disable protection
                  </Button>
                ) : null}
                <Button type="button" variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
