"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, MapPin } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@npanel/ui/components/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { CountrySelect } from "@/routes/$slug.my-profile/_components/country-select";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
}).refine(
  (data) => {
    // At least one field must be provided
    const hasValue = 
      (data.name !== undefined && data.name.trim() !== "") ||
      (data.firstName !== undefined && data.firstName.trim() !== "") ||
      (data.lastName !== undefined && data.lastName.trim() !== "") ||
      (data.phone !== undefined && data.phone.trim() !== "") ||
      (data.address !== undefined && data.address.trim() !== "") ||
      (data.city !== undefined && data.city.trim() !== "") ||
      (data.state !== undefined && data.state.trim() !== "") ||
      (data.country !== undefined && data.country.trim() !== "") ||
      (data.postalCode !== undefined && data.postalCode.trim() !== "");
    return hasValue;
  },
  {
    message: "Please fill in at least one field to update the profile",
    path: ["root"],
  }
);

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

export function EditProfileDialog({
  open,
  onOpenChange,
  userId,
  userName,
  onSuccess,
}: EditProfileDialogProps) {
  const { data: profile, isLoading: isLoadingProfile } = trpc.manageUsers.getProfile.useQuery(
    { userId },
    { enabled: open && !!userId }
  );

  const { data: userInfo } = trpc.userProfile.getUserById.useQuery(
    { userId, fields: ["name"] },
    { enabled: open && !!userId }
  );

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    },
  });

  React.useEffect(() => {
    if (profile && userInfo) {
      form.reset({
        name: userInfo.name || "",
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        state: profile.state || "",
        country: profile.country || "",
        postalCode: profile.postalCode || "",
      });
    }
  }, [profile, userInfo, form]);

  const utils = trpc.useUtils();

  const updateProfileMutation = trpc.manageUsers.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      utils.manageUsers.getProfile.invalidate({ userId });
      utils.manageUsers.getAll.invalidate();
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    // Only include fields that have values
    const updateData: ProfileFormValues = {};
    if (data.name && data.name.trim()) updateData.name = data.name;
    if (data.firstName && data.firstName.trim()) updateData.firstName = data.firstName;
    if (data.lastName && data.lastName.trim()) updateData.lastName = data.lastName;
    if (data.phone && data.phone.trim()) updateData.phone = data.phone;
    if (data.address && data.address.trim()) updateData.address = data.address;
    if (data.city && data.city.trim()) updateData.city = data.city;
    if (data.state && data.state.trim()) updateData.state = data.state;
    if (data.country && data.country.trim()) updateData.country = data.country;
    if (data.postalCode && data.postalCode.trim()) updateData.postalCode = data.postalCode;

    // Check if there are any fields to update
    if (Object.keys(updateData).length === 0) {
      toast.error("Please fill in at least one field to update");
      return;
    }

    await updateProfileMutation.mutateAsync({
      userId,
      ...updateData,
    });
  };

  if (isLoadingProfile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-8" hideClose>
          <div className="flex items-center justify-center py-12">
            <Spinner size={24} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-8" hideClose>
        <DialogHeader className="pb-6 space-y-2">
          <DialogTitle className="text-xl">Edit Profile</DialogTitle>
          <DialogDescription className="pt-1 text-sm">
            Update profile information for {userName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            {/* Display Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              {/* First Name */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Name */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="+254 700 000 000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-3">
              {/* City */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Nairobi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* State/Province */}
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <FormControl>
                      <Input placeholder="Nairobi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Postal Code */}
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl>
                      <Input placeholder="00100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Country */}
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
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

            <DialogFooter className="gap-2 sm:gap-0 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={updateProfileMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Spinner size={16} className="mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


