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

const FormSchema = z.object({
  subdomainName: z.string().min(1, "Subdomain name is required"),
  parentDomain: z.string(), // Fixed value, no validation needed
  phpEnabled: z.boolean().default(true),
  phpHandler: z.string().min(1, "PHP handler is required"),
  sslEnabled: z.boolean().default(true),
  fastcgiEnabled: z.boolean().default(true),
  ssiEnabled: z.boolean().default(true),
  cgiEnabled: z.boolean().default(false),
  perlEnabled: z.boolean().default(false),
  pythonEnabled: z.boolean().default(false),
  webstat: z.enum(['none', 'awstats', 'webalizer', 'analog', 'custom']).default("none"),
});

type FormData = z.infer<typeof FormSchema>;

interface AddSubdomainSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainName?: string;
  onSuccess?: () => void;
}

export function AddSubdomainSheet({ open, onOpenChange, domainName, onSuccess }: AddSubdomainSheetProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // tRPC mutation for creating subdomain
  const createSubdomain = trpc.plesk.subdomainsCreate.create.useMutation({
    onSuccess: () => {
      toast.success("Subdomain created successfully!");
      form.reset();
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error creating subdomain:", error);
      
      // Handle different types of errors
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

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      subdomainName: "",
      parentDomain: domainName || "nisccloud.com",
      phpEnabled: true,
      phpHandler: "plesk-php82-fpm",
      sslEnabled: true,
      fastcgiEnabled: true,
      ssiEnabled: true,
      cgiEnabled: false,
      perlEnabled: false,
      pythonEnabled: false,
      webstat: "none",
    },
  });

  // Update parent domain when domainName prop changes
  React.useEffect(() => {
    if (domainName) {
      form.setValue("parentDomain", domainName);
    }
  }, [domainName, form]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      // Prepare the data for the API call
      const apiData: {
        parent: string;
        name: string;
        php?: string;
        cgi?: boolean;
        perl?: boolean;
        python?: boolean;
        webstat?: 'none' | 'awstats' | 'webalizer' | 'analog' | 'custom';
      } = {
        parent: data.parentDomain,
        name: data.subdomainName,
        php: data.phpEnabled ? data.phpHandler : undefined,
        cgi: data.cgiEnabled,
        perl: data.perlEnabled,
        python: data.pythonEnabled,
        webstat: data.webstat === 'none' ? undefined : data.webstat,
        // Note: SSL, FastCGI, SSI are not supported by the current API
        // These would need to be added to the API if required
      };

      await createSubdomain.mutateAsync(apiData);
    } catch (error) {
      // Error handling is done in the mutation's onError callback
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
              {/* General Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">General Settings</CardTitle>
                  <CardDescription>Configure the subdomain details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="subdomainName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subdomain Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., blog" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parentDomain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Domain</FormLabel>
                        <FormControl>
                          <Input 
                            value={field.value}
                            disabled
                            className="bg-muted"
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground">
                          Subdomain will be created under this domain
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* PHP Settings */}
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

              {/* Security Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Security Settings</CardTitle>
                  <CardDescription>Configure SSL and security options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="sslEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">SSL Certificate</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Enable SSL certificate for this subdomain
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      SSL configuration is not available in the current API implementation.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Advanced Settings</CardTitle>
                  <CardDescription>Configure additional server features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fastcgiEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">FastCGI</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Enable FastCGI support
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ssiEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Server-Side Includes (SSI)</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Enable SSI support
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="webstat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Web Statistics</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select web statistics" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="awstats">AWStats</SelectItem>
                            <SelectItem value="webalizer">Webalizer</SelectItem>
                            <SelectItem value="analog">Analog</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      FastCGI and SSI configuration are not available in the current API implementation.
                    </p>
                  </div>
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
