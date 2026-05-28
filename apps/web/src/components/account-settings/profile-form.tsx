"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail } from "lucide-react";
import { toast } from "@/components/ui/sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { CountrySelect } from "./country-select";
import { SettingsSection } from "./settings-section";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function ProfileFormSkeleton() {
  return (
    <div className="space-y-5 rounded-lg border bg-card p-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfileForm() {
  const { data: userInfo, isLoading, refetch } = trpc.userProfile.getUserInfo.useQuery();

  const updateProfileMutation = trpc.userProfile.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      refetch();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: userInfo
      ? {
          name: userInfo.name,
          firstName: userInfo.profile?.firstName || "",
          lastName: userInfo.profile?.lastName || "",
          phone: userInfo.profile?.phone || "",
          address: userInfo.profile?.address || "",
          city: userInfo.profile?.city || "",
          state: userInfo.profile?.state || "",
          country: userInfo.profile?.country || "",
          postalCode: userInfo.profile?.postalCode || "",
        }
      : undefined,
  });

  const onSubmit = async (data: ProfileFormValues) => {
    await updateProfileMutation.mutateAsync(data);
  };

  if (isLoading) {
    return <ProfileFormSkeleton />;
  }

  if (!userInfo) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-card">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="divide-y">
          <div className="space-y-5 p-4">
            <SettingsSection title="Identity" description="How your name appears across the platform">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Display name</FormLabel>
                    <FormControl>
                      <Input className="h-9" placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">First name</FormLabel>
                      <FormControl>
                        <Input className="h-9" placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Last name</FormLabel>
                      <FormControl>
                        <Input className="h-9" placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SettingsSection>

            <Separator />

            <SettingsSection title="Contact">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Phone number</FormLabel>
                    <FormControl>
                      <Input className="h-9" placeholder="+254 700 000 000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-md border bg-muted/40 px-3 py-2">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  Email address
                </p>
                <p className="mt-0.5 text-sm">{userInfo.email}</p>
              </div>
            </SettingsSection>

            <Separator />

            <SettingsSection title="Address" description="Used for billing and service delivery">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Street address</FormLabel>
                    <FormControl>
                      <Input className="h-9" placeholder="123 Main Street" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-3 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">City</FormLabel>
                      <FormControl>
                        <Input className="h-9" placeholder="Nairobi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">State / province</FormLabel>
                      <FormControl>
                        <Input className="h-9" placeholder="Nairobi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Postal code</FormLabel>
                      <FormControl>
                        <Input className="h-9" placeholder="00100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Country</FormLabel>
                    <FormControl>
                      <CountrySelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select country..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SettingsSection>
          </div>

          <div className="flex justify-end bg-muted/30 px-4 py-3">
            <Button type="submit" size="sm" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                  Saving...
                </span>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
