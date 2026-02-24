"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Mail, XIcon, Plus, Shield, Forward, Reply, Users, RefreshCw, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { DatePicker } from "@/components/npanel-ui/date-picker";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

import { mailAddressSchema } from "./mail-schema";

const FormSchema = z.object({
  name: z.string().min(1, { message: "Email name is required." }),
  password: z.string()
    .trim()
    .min(12, { message: "Password must be at least 12 characters." })
    .max(64, { message: "Password must be at most 64 characters." })
    .refine((val) => /[a-z]/.test(val), { message: "Password must include a lowercase letter." })
    .refine((val) => /[A-Z]/.test(val), { message: "Password must include an uppercase letter." })
    .refine((val) => /\d/.test(val), { message: "Password must include a digit." })
    .refine((val) => /[^\w\s]/.test(val), { message: "Password must include a special character." }),
  description: z.string().optional().or(z.literal("")),
  
  // Mailbox settings
  mailboxEnabled: z.boolean(),
  quota: z.number().min(0),
  
  // Forwarding settings
  forwardingEnabled: z.boolean(),
  forwardingAddresses: z.string().optional().or(z.literal("")),
  
  // Aliases
  aliases: z.string().optional().or(z.literal("")),
  
  // Auto responder settings
  autoresponderEnabled: z.boolean(),
  autoresponderSubject: z.string().optional().or(z.literal("")),
  autoresponderText: z.string().optional().or(z.literal("")),
  autoresponderEndDate: z.string().optional().or(z.literal("")),
  
  // Antivirus settings
  antivir: z.enum(["off", "inout", "in", "out"]),
  
  // Limits
  maxOutgoingMessages: z.number().min(0).max(120, { message: "Maximum outgoing messages cannot exceed 120." }),
});

// Create a conditional schema for edit mode where password and quota are optional
const createFormSchema = (mode: 'create' | 'edit') => {
  if (mode === 'edit') {
    return FormSchema.extend({
      password: z.string()
        .trim()
        .optional()
        .refine((val) => {
          if (!val || val === '') return true; // Allow empty password in edit mode
          if (val.length < 12) return false;
          if (!/[a-z]/.test(val)) return false;
          if (!/[A-Z]/.test(val)) return false;
          if (!/\d/.test(val)) return false;
          if (!/[^\w\s]/.test(val)) return false;
          return true;
        }, { message: "Password must be at least 12 characters and include lowercase, uppercase, digit, and special character." }),
      quota: z.number().min(0).optional(), // Make quota optional in edit mode
      maxOutgoingMessages: z.number().min(0).max(120, { message: "Maximum outgoing messages cannot exceed 120." }).optional(), // Make optional in edit mode
    });
  }
  return FormSchema;
};

interface AddMailAddressSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: number;
  onSuccess?: () => void;
  initialValues?: Partial<z.infer<typeof FormSchema>>;
  mode?: 'create' | 'edit';
}

export function AddMailAddressSheet({ open, onOpenChange, siteId, onSuccess, initialValues, mode = 'create' }: AddMailAddressSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  // tRPC mutation for creating email account
  const createEmailAccount = trpc.plesk.emailsCreate.create.useMutation({
    onSuccess: () => {
      toast.success("Email address added successfully!");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
  });

  // tRPC mutation for updating email account
  const updateEmailAccount = trpc.plesk.emailsUpdate.update.useMutation({
    onSuccess: () => {
      toast.success("Email address updated successfully!");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
  });


  // Password generator function (12-16 chars, upper/lower/digit/special)
  const generatePassword = () => {
    const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowers = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const specials = '!@#$%^&*()-_=+[]{};:,.<>/?';
    const all = uppers + lowers + digits + specials;
    const length = 14; // good default

    // ensure each category present
    let pwd = [
      uppers[Math.floor(Math.random() * uppers.length)],
      lowers[Math.floor(Math.random() * lowers.length)],
      digits[Math.floor(Math.random() * digits.length)],
      specials[Math.floor(Math.random() * specials.length)],
    ];
    for (let i = pwd.length; i < length; i++) {
      pwd.push(all[Math.floor(Math.random() * all.length)]);
    }
    // shuffle
    for (let i = pwd.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
    }
    form.setValue('password', pwd.join(''));
  };

  const formSchema = createFormSchema(mode);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || "",
      password: mode === 'edit' ? "" : "", // Empty password in edit mode, will be filled if user wants to change it
      description: initialValues?.description || "",
      mailboxEnabled: initialValues?.mailboxEnabled ?? true,
      quota: (initialValues?.quota !== undefined && initialValues.quota >= 0) 
        ? initialValues.quota 
        : 53687091200, // 50GB default (50 * 1024 * 1024 * 1024) - ensure always valid
      forwardingEnabled: initialValues?.forwardingEnabled ?? false,
      forwardingAddresses: initialValues?.forwardingAddresses || "",
      aliases: initialValues?.aliases || "",
      autoresponderEnabled: initialValues?.autoresponderEnabled ?? false,
      autoresponderSubject: initialValues?.autoresponderSubject || "",
      autoresponderText: initialValues?.autoresponderText || "",
      autoresponderEndDate: initialValues?.autoresponderEndDate || "",
      antivir: initialValues?.antivir || "off",
      maxOutgoingMessages: (initialValues?.maxOutgoingMessages !== undefined && initialValues.maxOutgoingMessages >= 0)
        ? initialValues.maxOutgoingMessages
        : 100, // Ensure always valid
    },
  });

  // Reset form and states when sheet closes
  React.useEffect(() => {
    if (!open) {
      // Reset all form fields to defaults
      form.reset({
        name: "",
        password: "",
        description: "",
        mailboxEnabled: true,
        quota: 53687091200,
        forwardingEnabled: false,
        forwardingAddresses: "",
        aliases: "",
        autoresponderEnabled: false,
        autoresponderSubject: "",
        autoresponderText: "",
        autoresponderEndDate: "",
        antivir: "off",
        maxOutgoingMessages: 100,
      });
      // Reset other states
      setShowPassword(false);
      setIsSubmitting(false);
      form.clearErrors();
    }
  }, [open, form]);

  // When opening for edit, prefill values without changing the UI structure
  React.useEffect(() => {
    if (!open) return;
    if (mode === 'create') return; // Don't prefill in create mode
    if (!initialValues) return;
    const current = form.getValues();
    form.reset({
      ...current,
      ...initialValues,
      // Ensure booleans/numbers remain valid if undefined in initialValues
      mailboxEnabled: initialValues.mailboxEnabled ?? current.mailboxEnabled ?? true,
      quota: (initialValues.quota !== undefined && initialValues.quota >= 0) 
        ? initialValues.quota 
        : ((current.quota !== undefined && current.quota >= 0) ? current.quota : 53687091200), // Use initial, current, or default 50GB
      forwardingEnabled: initialValues.forwardingEnabled ?? current.forwardingEnabled ?? false,
      aliases: initialValues.aliases ?? current.aliases ?? "",
      forwardingAddresses: initialValues.forwardingAddresses ?? current.forwardingAddresses ?? "",
      autoresponderEnabled: initialValues.autoresponderEnabled ?? current.autoresponderEnabled ?? false,
      antivir: initialValues.antivir ?? current.antivir ?? "off",
      maxOutgoingMessages: (initialValues.maxOutgoingMessages !== undefined && initialValues.maxOutgoingMessages >= 0)
        ? initialValues.maxOutgoingMessages
        : ((current.maxOutgoingMessages !== undefined && current.maxOutgoingMessages >= 0) ? current.maxOutgoingMessages : 100),
      password: "", // Always clear password in edit mode
    });
  }, [open, initialValues, mode, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      form.clearErrors();
      // Prepare the data for the API call
      const apiData = {
        siteId,
        name: data.name,
        password: data.password || "", // Handle optional password in edit mode
        passwordType: 'plain' as const,
        mailbox: {
          enabled: data.mailboxEnabled,
          quota: data.quota,
        },
        forwarding: data.forwardingEnabled ? {
          enabled: true,
          addresses: data.forwardingAddresses ? data.forwardingAddresses.split(',').map(addr => addr.trim()) : [],
        } : undefined,
        // Note: Legacy implementation doesn't include alias in the request
        // alias: data.aliases ? data.aliases.split(',').map(alias => alias.trim()).filter(Boolean)[0] : undefined,
        autoresponder: data.autoresponderEnabled ? {
          enabled: true,
          subject: data.autoresponderSubject,
          contentType: 'text/plain',
          content: data.autoresponderText,
        } : undefined,
        antivir: data.antivir,
        cpAccess: false,
        outgoingMessagesLimit: data.maxOutgoingMessages,
        description: data.description,
      };

      
      // Handle create vs update mode
      if (mode === 'create') {
        // Ensure password is provided for create mode
        if (!data.password || data.password.trim() === '') {
          form.setError('password', {
            type: 'manual',
            message: 'Password is required for creating new email accounts'
          });
          return;
        }
        // Create email account with all settings in one call
        await createEmailAccount.mutateAsync(apiData);
      } else {
        // Update email account - only send fields that are actually provided/changed
        const updateData: any = {
          siteId,
          name: data.name,
        };

        // Only include password if provided
        if (data.password && data.password.trim()) {
          updateData.password = data.password;
          updateData.passwordType = 'plain' as const;
        }

        // Only include antivir if provided
        if (data.antivir) {
          updateData.antivir = data.antivir;
        }

        // Only include outgoingMessagesLimit if provided and valid
        if (data.maxOutgoingMessages !== undefined && data.maxOutgoingMessages >= 0) {
          updateData.outgoingMessagesLimit = data.maxOutgoingMessages;
        }

        // Only include description if provided
        if (data.description !== undefined) {
          updateData.description = data.description;
        }

        // Only include forwarding if enabled and addresses provided
        if (data.forwardingEnabled && data.forwardingAddresses && data.forwardingAddresses.trim()) {
          updateData.forwarding = {
            enabled: true,
            addresses: data.forwardingAddresses.split(',').map(addr => addr.trim()).filter(addr => addr.length > 0),
          };
        }

        // Only include autoresponder if enabled
        if (data.autoresponderEnabled) {
          updateData.autoresponder = {
            enabled: true,
            subject: data.autoresponderSubject,
            content: data.autoresponderText,
            contentType: 'text/plain',
          };
        }

        // Note: Mailbox/quota updates are not supported by the Plesk API in update operations
        // The mailbox field is commented out in the API buildMailUpdateXml function
        // So we don't send mailbox updates even if quota is provided
        
        await updateEmailAccount.mutateAsync(updateData);
      }
    } catch (error) {
      // Handle tRPC errors properly
      
      // Extract error message from tRPC error
      let errorMessage = "Please check your information and try again.";
      
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = error.message as string;
        
        // Handle specific error cases
        const lowerMsg = errorMessage.toLowerCase();
        if (lowerMsg.includes('already exists') || lowerMsg.includes('already exist')) {
          form.setError('name', { 
            type: 'server', 
            message: 'This email address already exists. Please choose a different name.' 
          });
        } else if (lowerMsg.includes('password')) {
          form.setError('password', { type: 'server', message: errorMessage });
        } else {
          // Use a root-level message area for general errors
          (form as any).setError('root', { type: 'server', message: errorMessage });
        }
      }
      
      // Show error toast
      toast.error("Failed to add email address", {
        description: errorMessage,
      });
      
      // Don't reset form or close sheet on error
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatQuota = (bytes: number) => {
    if (bytes === 0) return "0 MB";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const quotaValue = form.watch("quota") ?? 53687091200; // Default to 50GB if undefined

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="mb-6 flex-shrink-0 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold">
                {mode === 'create' ? 'Add Email Address' : 'Edit Email Address'}
              </SheetTitle>
              <SheetDescription className="text-base">
                {mode === 'create' ? 'Create a new email address for your domain' : 'Update email address settings'}
              </SheetDescription>
            </div>
          </div>
          <SheetClose asChild>
            <Button
              size="icon"
              variant="ghost"
              className="p-0 m-0 size-auto hover:bg-transparent"
            >
              <XIcon className="size-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="px-1 pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {form.formState.errors.root?.message && (
                <div className="text-sm text-destructive">
                  {form.formState.errors.root.message}
                </div>
              )}
              {/* General Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    General Information
                  </CardTitle>
                  <CardDescription>Basic email account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="username" 
                            {...field} 
                          />
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
                          <div className="flex gap-2">
                            <Input 
                              type={showPassword ? "text" : "password"}
                              placeholder="Strong password: 12-64 chars, upper/lower/digit/special"
                              maxLength={64}
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowPassword((v) => !v)}
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              className="px-3"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={generatePassword}
                              className="px-3"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <div className="text-xs text-muted-foreground">
                          Must be 12-64 chars and include upper, lower, digit, and special character
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of this email account"
                            className="resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Limits Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Limits & Quotas
                  </CardTitle>
                  <CardDescription>Configure storage and usage limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="quota"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mailbox Size: {formatQuota(quotaValue)}</FormLabel>
                        <FormControl>
                          {mode === 'edit' ? (
                            <div className="space-y-2">
                              <div className="p-4 bg-muted rounded-lg border">
                                <p className="text-sm text-muted-foreground">
                                  <strong>Storage size cannot be modified.</strong>
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Contact your administrator to make changes to the storage size.
                                </p>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Current size: {formatQuota(quotaValue)}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Slider
                                value={[quotaValue]}
                                onValueChange={(value) => field.onChange(value[0])}
                                max={53687091200} // 50GB
                                min={10485760} // 10MB
                                step={10485760} // 10MB steps
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>10 MB</span>
                                <span>50 GB</span>
                              </div>
                            </div>
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxOutgoingMessages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Outgoing Messages per Day</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            min="0"
                            max="120"
                            placeholder="100"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground">
                          Maximum 120 outgoing messages per day
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Forwarding Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Forward className="h-5 w-5" />
                    Email Forwarding
                  </CardTitle>
                  <CardDescription>Forward emails to other addresses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mode === 'edit' ? (
                    <div className="p-4 bg-muted rounded-lg border">
                      <p className="text-sm text-muted-foreground">
                        <strong>Email forwarding cannot be modified in edit mode.</strong>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Contact your administrator to make changes to email forwarding.
                      </p>
                    </div>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="forwardingEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Forwarding</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Forward incoming emails to other addresses
                              </div>
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

                      {form.watch("forwardingEnabled") && (
                        <FormField
                          control={form.control}
                          name="forwardingAddresses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Forward To</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="email1@example.com, email2@example.com"
                                  className="resize-none"
                                  {...field} 
                                />
                              </FormControl>
                              <div className="text-xs text-muted-foreground">
                                Separate multiple email addresses with commas
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Email Aliases Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Email Aliases
                  </CardTitle>
                  <CardDescription>Additional email addresses that point to this account</CardDescription>
                </CardHeader>
                <CardContent>
                  {mode === 'edit' ? (
                    <div className="p-4 bg-muted rounded-lg border">
                      <p className="text-sm text-muted-foreground">
                        <strong>Email aliases cannot be modified in edit mode.</strong>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Contact your administrator to make changes to email aliases.
                      </p>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="aliases"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aliases</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="alias1, alias2, alias3"
                              className="resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <div className="text-xs text-muted-foreground">
                            Separate multiple aliases with commas
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Auto Reply Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Reply className="h-5 w-5" />
                    Auto Reply
                  </CardTitle>
                  <CardDescription>Automatic response to incoming emails</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mode === 'edit' ? (
                    <div className="p-4 bg-muted rounded-lg border">
                      <p className="text-sm text-muted-foreground">
                        <strong>Auto reply cannot be modified in edit mode.</strong>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Contact your administrator to make changes to auto reply settings.
                      </p>
                    </div>
                  ) : (
                    <>
                      <FormField
                        control={form.control}
                        name="autoresponderEnabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Enable Auto Reply</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Send automatic responses to incoming emails
                              </div>
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

                      {form.watch("autoresponderEnabled") && (
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="autoresponderSubject"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Re: <request_subject>"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="autoresponderText"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Message</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Thank you for your email. I will respond as soon as possible."
                                    className="resize-none"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="autoresponderEndDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Date (Optional)</FormLabel>
                                <FormControl>
                                  <DatePicker
                                    value={field.value ? new Date(field.value) : undefined}
                                    onChange={(date) => {
                                      field.onChange(date ? date.toISOString().split('T')[0] : "");
                                    }}
                                    placeholder="Select end date"
                                    fromDate={new Date()} // Don't allow past dates
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Antivirus Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Antivirus Protection
                  </CardTitle>
                  <CardDescription>Configure antivirus scanning for emails</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="antivir"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Antivirus Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select antivirus level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="off">Off - No scanning</SelectItem>
                            <SelectItem value="in">Incoming - Scan incoming emails only</SelectItem>
                            <SelectItem value="out">Outgoing - Scan outgoing emails only</SelectItem>
                            <SelectItem value="inout">Both - Scan all emails</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <SheetFooter className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Spinner variant="ellipsis" className="text-primary-foreground" size="sm" />
                      <span>Adding...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>{mode === 'create' ? 'Add Email Address' : 'Update Email Address'}</span>
                    </div>
                  )}
                </Button>
              </SheetFooter>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
