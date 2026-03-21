"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Plus, XIcon, Globe, Lock, Eye, EyeOff, RefreshCw } from "lucide-react";
import { Icons } from "@/components/icons";

import { Button } from "@/components/ui/button";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { hostingDetailSchema } from "./hosting-detail-schema";
import { useSubdomainsByDomain } from "./use-subdomains-by-domain";
import { useDatabasesBySiteId } from "./use-databases-by-site-id";

const FormSchema = z.object({
  domainName: z.string().min(1, { message: "Domain is required." }),
  username: z.string()
    .min(1, { message: "Username is required." })
    .max(60, { message: "Username must be at most 60 characters." }),
  adminEmail: z.string().email({ message: "Valid email is required." }),
  adminPassword: z.string()
    .min(12, { message: "Password must be at least 12 characters." })
    .max(64, { message: "Password must be at most 64 characters." })
    .refine((val) => /[a-z]/.test(val), { message: "Password must include a lowercase letter." })
    .refine((val) => /[A-Z]/.test(val), { message: "Password must include an uppercase letter." })
    .refine((val) => /\d/.test(val), { message: "Password must include a digit." })
    .refine((val) => /[^\w\s]/.test(val), { message: "Password must include a special character." }),
  wpVersion: z.string().optional().default("latest"),
  siteTitle: z.string().optional(),
  language: z.string().optional().default("en_US"),
  protocol: z.enum(["http", "https"]).optional().default("https"),
  databaseName: z.string().optional(), // Optional: if empty, auto-create
});

interface InstallWordPressSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hostingData: z.infer<typeof hostingDetailSchema>;
  onSuccess?: () => void;
}

// WordPress versions (common ones)
const WORDPRESS_VERSIONS = [
  { value: "latest", label: "Latest" },
  { value: "6.5", label: "6.5" },
  { value: "6.4", label: "6.4" },
  { value: "6.3", label: "6.3" },
  { value: "6.2", label: "6.2" },
  { value: "6.1", label: "6.1" },
  { value: "6.0", label: "6.0" },
];

// Common languages
const LANGUAGES = [
  { value: "en_US", label: "English (US)" },
  { value: "en_GB", label: "English (UK)" },
  { value: "es_ES", label: "Spanish" },
  { value: "fr_FR", label: "French" },
  { value: "de_DE", label: "German" },
  { value: "it_IT", label: "Italian" },
  { value: "pt_BR", label: "Portuguese (Brazil)" },
  { value: "ru_RU", label: "Russian" },
  { value: "ja_JP", label: "Japanese" },
  { value: "zh_CN", label: "Chinese (Simplified)" },
];

// Password generator function that meets all validation requirements
function generateSecurePassword(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  // Ensure at least one of each required character type
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly (total length: 16 characters)
  const allChars = lowercase + uppercase + digits + special;
  for (let i = password.length; i < 16; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export function InstallWordPressSheet({
  open,
  onOpenChange,
  hostingData,
  onSuccess,
}: InstallWordPressSheetProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const domainName = hostingData.gen_info?.name || "";
  const siteId = hostingData.id;

  // Fetch subdomains for domain selection
  const { data: subdomainsData, isLoading: isLoadingSubdomains } = useSubdomainsByDomain(domainName);

  // Fetch databases for database selection (we'll get all databases, not just for this site)
  // This allows users to see databases from other sites
  const { data: databasesData, isLoading: isLoadingDatabases } = useDatabasesBySiteId(siteId);
  
  // Also fetch all databases if we want to show databases from other sites
  // For now, we'll just use the current site's databases and show if they're related

  // Build domain options (main domain + subdomains)
  const domainOptions = React.useMemo(() => {
    const options: Array<{ value: string; label: string; type: "domain" | "subdomain" }> = [
      { value: domainName, label: domainName, type: "domain" },
    ];

    if (subdomainsData && Array.isArray(subdomainsData)) {
      subdomainsData.forEach((subdomain) => {
        const subdomainName = subdomain.name || "";
        if (subdomainName) {
          options.push({
            value: subdomainName,
            label: subdomainName,
            type: "subdomain",
          });
        }
      });
    }

    return options;
  }, [domainName, subdomainsData]);

  // Build database options
  const databaseOptions = React.useMemo(() => {
    if (!databasesData || !Array.isArray(databasesData)) return [];

    return databasesData.map((db) => ({
      value: db.name || "",
      label: db.name || "",
      relatedSite: db["webspace-id"] !== siteId ? undefined : undefined, // We don't have domainName in database schema, will need to check
      isRelated: db["webspace-id"] === siteId,
    }));
  }, [databasesData, siteId]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      domainName: domainName,
      username: "admin",
      adminEmail: "",
      adminPassword: "",
      wpVersion: "latest",
      siteTitle: "",
      language: "en_US",
      protocol: "https",
      databaseName: undefined, // Empty = auto-create
    },
  });

  // Install WordPress mutation
  const installWordPress = trpc.plesk.wpInstall.install.useMutation({
    onSuccess: () => {
      toast.success("WordPress installation started successfully");
      form.reset();
      setIsSubmitting(false);
      if (onSuccess) {
        onSuccess();
      }
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('WordPress installation error:', error);
      toast.error("Failed to install WordPress", {
        description: error.message || "Please try again.",
      });
      setIsSubmitting(false);
    },
  });

  // Reset form when sheet opens/closes
  React.useEffect(() => {
    if (open) {
      form.reset({
        domainName: domainName,
        username: "admin",
        adminEmail: "",
        adminPassword: "",
        wpVersion: "latest",
        siteTitle: "",
        language: "en_US",
        protocol: "https",
        databaseName: undefined,
      });
      setIsSubmitting(false);
      setShowPassword(false);
      form.clearErrors();
    }
  }, [open, domainName, form]);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsSubmitting(true);

    try {
      form.clearErrors();

      await installWordPress.mutateAsync({
        domainName: data.domainName,
        username: data.username,
        adminEmail: data.adminEmail,
        adminPassword: data.adminPassword,
        wpVersion: data.wpVersion || "latest",
        siteTitle: data.siteTitle || undefined,
        language: data.language || "en_US",
        protocol: data.protocol || "https",
        databaseName: data.databaseName || undefined,
        dbUser: data.databaseName ? undefined : undefined, // If database name provided, might need user
      });
    } catch (error) {
      // Error is handled in mutation onError
      console.error('Installation error:', error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[700px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Icons.Wordpress className="h-5 w-5 text-primary" />
            Install WordPress
          </SheetTitle>
          <SheetDescription>
            Install a new WordPress instance on your hosting subscription
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              <div className="space-y-6 py-4">
                {/* Domain Selection */}
                <FormField
                  control={form.control}
                  name="domainName"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Domain
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting || isLoadingSubdomains}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select domain or subdomain" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {domainOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <span>{option.label}</span>
                                {option.type === "subdomain" && (
                                  <Badge variant="outline" className="text-xs">
                                    Subdomain
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Admin Username */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Admin Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="admin"
                          {...field}
                          disabled={isSubmitting}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Admin Email */}
                <FormField
                  control={form.control}
                  name="adminEmail"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Admin Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="admin@example.com"
                          {...field}
                          disabled={isSubmitting}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Admin Password */}
                <FormField
                  control={form.control}
                  name="adminPassword"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Admin Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative w-full">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter secure password"
                            {...field}
                            disabled={isSubmitting}
                            className="w-full pr-20"
                          />
                          <div className="absolute right-0 top-0 flex h-full items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-full px-2"
                              onClick={() => {
                                const newPassword = generateSecurePassword();
                                form.setValue("adminPassword", newPassword);
                                toast.success("Password generated");
                              }}
                              disabled={isSubmitting}
                              title="Generate secure password"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-full px-2"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isSubmitting}
                              title={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Must be at least 12 characters with uppercase, lowercase, digit, and special character
                      </p>
                    </FormItem>
                  )}
                />

                {/* WordPress Version */}
                <FormField
                  control={form.control}
                  name="wpVersion"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>WordPress Version</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select WordPress version" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {WORDPRESS_VERSIONS.map((version) => (
                            <SelectItem key={version.value} value={version.value}>
                              {version.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Site Title */}
                <FormField
                  control={form.control}
                  name="siteTitle"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Site Title (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="My WordPress Site"
                          {...field}
                          disabled={isSubmitting}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Language */}
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Language</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Protocol */}
                <FormField
                  control={form.control}
                  name="protocol"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Protocol</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select protocol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="https">HTTPS (Recommended)</SelectItem>
                          <SelectItem value="http">HTTP</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Database Selection */}
                <FormField
                  control={form.control}
                  name="databaseName"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Database (Optional)</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          if (value === "auto-create") {
                            field.onChange(undefined);
                          } else {
                            field.onChange(value);
                          }
                        }}
                        value={field.value || "auto-create"}
                        disabled={isSubmitting || isLoadingDatabases}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select database or auto-create" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="auto-create">
                            <div className="flex items-center gap-2">
                              <span>Auto-create database</span>
                              <Badge variant="outline" className="text-xs">
                                Recommended
                              </Badge>
                            </div>
                          </SelectItem>
                          {databaseOptions.length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                Existing Databases
                              </div>
                              {databaseOptions.map((db) => (
                                <SelectItem key={db.value} value={db.value}>
                                  <div className="flex items-center gap-2">
                                    <span>{db.label}</span>
                                    {db.isRelated ? (
                                      <Badge variant="default" className="text-xs">
                                        This site
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="text-xs">
                                        Other site
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Leave as "Auto-create" to let WordPress Toolkit automatically create a new database. 
                        Or select an existing database to use.
                      </p>
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>

            <SheetFooter>
              <SheetClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancel
                </Button>
              </SheetClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner size={14} className="mr-2" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Install WordPress
                  </>
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
