"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/components/ui/sonner";
import { z } from "zod";
import { Globe, XIcon, Plus } from "lucide-react";

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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";
import { captureEvent } from "@/lib/posthog";

const DEFAULT_PHP_HANDLER = "plesk-php82-fpm";

const FormSchema = z.object({
  subdomainName: z.string().min(1, "Subdomain name is required"),
  parentDomain: z.string(),
  phpEnabled: z.boolean().default(true),
  phpHandler: z.string().min(1, "PHP handler is required"),
});

type FormData = z.infer<typeof FormSchema>;

interface AddSubdomainSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainName?: string;
  onSuccess?: () => void;
}

function localSubdomainName(value: string, parentDomain?: string): string {
  let next = value.trim();
  const parent = parentDomain?.trim().replace(/^\./, "");
  if (parent) {
    const suffix = `.${parent}`;
    if (next.toLowerCase().endsWith(suffix.toLowerCase())) {
      next = next.slice(0, -suffix.length);
    }
  }
  if (next.includes(".")) {
    next = next.split(".")[0] ?? next;
  }
  return next.replace(/^\.+|\.+$/g, "");
}

export function AddSubdomainSheet({ open, onOpenChange, domainName, onSuccess }: AddSubdomainSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      subdomainName: "",
      parentDomain: domainName || "",
      phpEnabled: true,
      phpHandler: DEFAULT_PHP_HANDLER,
    },
  });

  const createSubdomain = trpc.plesk.subdomainsCreate.create.useMutation({
    onSuccess: () => {
      captureEvent("subdomain_created", {
        parent_domain: form.getValues("parentDomain") || domainName || "unknown",
      });

      toast.success("Subdomain created successfully!");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error creating subdomain:", error);

      let errorMessage = "Please check your information and try again.";

      if (error?.data?.code === "BAD_REQUEST") {
        errorMessage = error.message || "Invalid subdomain data.";
      } else if (error?.data?.code === "UNAUTHORIZED") {
        errorMessage = "Authentication failed. Please check your Plesk credentials.";
      } else if (error?.data?.code === "SERVICE_UNAVAILABLE") {
        errorMessage = "Plesk server is currently unavailable. Please try again later.";
      } else if (error?.data?.code === "INTERNAL_SERVER_ERROR") {
        errorMessage = "Server error occurred while creating subdomain.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error("Failed to create subdomain", {
        description: errorMessage,
      });
    },
  });

  React.useEffect(() => {
    if (domainName) {
      form.setValue("parentDomain", domainName);
    }
  }, [domainName, form]);

  const parentDomain = form.watch("parentDomain") || domainName || "";

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      await createSubdomain.mutateAsync({
        parent: data.parentDomain,
        name: localSubdomainName(data.subdomainName, data.parentDomain),
        php: data.phpEnabled ? data.phpHandler : undefined,
        cgi: false,
        perl: false,
        python: false,
      });
    } catch (error) {
      console.error("Error in onSubmit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="mb-6 flex-shrink-0 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold">Add Subdomain</SheetTitle>
              <SheetDescription className="text-base">
                Create a new subdomain for your hosting account
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
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">General Settings</CardTitle>
                    <CardDescription>Configure the subdomain details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="subdomainName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subdomain Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="blog"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                                className={parentDomain ? "pr-40" : undefined}
                                value={field.value}
                                onChange={(e) => {
                                  field.onChange(localSubdomainName(e.target.value, parentDomain));
                                }}
                                onBlur={(e) => {
                                  field.onChange(localSubdomainName(e.target.value, parentDomain));
                                  field.onBlur();
                                }}
                              />
                              {parentDomain ? (
                                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                  <span className="max-w-[10rem] truncate text-sm font-semibold text-foreground/90">
                                    .{parentDomain}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </FormControl>
                          {parentDomain ? (
                            <div className="text-xs text-muted-foreground">
                              Enter only the subdomain name. We’ll add{" "}
                              <span className="font-mono">.{parentDomain}</span> automatically.
                            </div>
                          ) : null}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">PHP Settings</CardTitle>
                    <CardDescription>Configure PHP support and handler</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="phpEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">PHP Support</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Enable PHP support for this subdomain
                            </p>
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

                    <FormField
                      control={form.control}
                      name="phpHandler"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PHP Handler</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!form.watch("phpEnabled")}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select PHP handler" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="plesk-php82-fpm">PHP 8.2 (FPM)</SelectItem>
                              <SelectItem value="plesk-php81-fpm">PHP 8.1 (FPM)</SelectItem>
                              <SelectItem value="plesk-php80-fpm">PHP 8.0 (FPM)</SelectItem>
                              <SelectItem value="plesk-php74-fpm">PHP 7.4 (FPM)</SelectItem>
                              <SelectItem value="alt-php81-cgi">PHP 8.1 (CGI)</SelectItem>
                              <SelectItem value="alt-php80-cgi">PHP 8.0 (CGI)</SelectItem>
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
                        <span>Creating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span>Create Subdomain</span>
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
