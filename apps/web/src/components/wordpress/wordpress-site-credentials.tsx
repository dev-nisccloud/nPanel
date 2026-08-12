"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  KeyRound,
  Languages,
  Link2,
  Lock,
  LogIn,
  Mail,
  RefreshCw,
  Save,
  Settings2,
  Shield,
  User,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/sonner";
import { copyTextToClipboard } from "@/lib/copy-to-clipboard";
import { generateSecurePassword } from "@/lib/generate-secure-password";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

import { useWordPressAccount } from "@/components/wordpress/use-wordpress-account";
import { useWordPressCredentials } from "@/components/wordpress/use-wordpress-credentials";
import { openWordPressAdminLogin } from "@/components/wordpress/wordpress-login";

interface WordPressSiteCredentialsProps {
  installationId: string;
}

const accountSettingsSchema = z.object({
  login: z.string().min(1, "Login is required"),
  password: z.string().optional(),
  email: z.string().email("Enter a valid email address"),
  language: z.string().min(1, "Language is required"),
}).superRefine((data, ctx) => {
  if (data.password && data.password.length > 0 && data.password.length < 8) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password must be at least 8 characters",
      path: ["password"],
    });
  }
});

type AccountSettingsFormValues = z.infer<typeof accountSettingsSchema>;

function CredentialRow({
  label,
  description,
  value,
  masked,
  icon: Icon,
  onCopy,
  onToggleMask,
  isMasked,
  extraAction,
}: {
  label: string;
  description?: string;
  value: string;
  masked?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  onCopy: () => void;
  onToggleMask?: () => void;
  isMasked?: boolean;
  extraAction?: React.ReactNode;
}) {
  const displayValue = masked && !isMasked ? "••••••••••••••••" : value;

  return (
    <div className="group rounded-md border border-border/60 bg-muted/20 px-3 py-2.5 transition-colors hover:bg-muted/30">
      <div className="flex gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-background">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div>
            <p className="text-sm font-medium">{label}</p>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5">
            <p
              className={cn(
                "min-w-0 flex-1 truncate rounded-md border border-border/50 bg-background px-2.5 py-1.5 text-sm",
                masked && "font-mono tracking-wider"
              )}
              title={masked && !isMasked ? undefined : value}
            >
              {displayValue}
            </p>
            <div className="flex shrink-0 items-center gap-0.5">
              {onToggleMask ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={onToggleMask}
                    >
                      {isMasked ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">{isMasked ? "Hide" : "Show"} {label}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isMasked ? "Hide" : "Show"}</TooltipContent>
                </Tooltip>
              ) : null}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={onCopy}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy {label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy</TooltipContent>
              </Tooltip>
              {extraAction}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CredentialsSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <CardContent className="space-y-3 p-6 md:p-8">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </CardContent>
      </Card>
      <Skeleton className="h-14 w-full rounded-lg" />
    </div>
  );
}

function CredentialsError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight">Could not load credentials</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {error.message || "An error occurred while fetching WordPress credentials."}
        </p>
        <Button onClick={onRetry} variant="outline" className="mt-6">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

export function WordPressSiteCredentials({ installationId }: WordPressSiteCredentialsProps) {
  const installationIdNumber = parseInt(installationId, 10);
  const utils = trpc.useUtils();

  const { data: credentials, isLoading, isError, error, refetch } = useWordPressCredentials(installationId);
  const {
    account,
    isLoading: isAccountLoading,
    isError: isAccountError,
    refetch: refetchAccount,
  } = useWordPressAccount(installationId);

  const [showPassword, setShowPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const accountFormKey = account
    ? [
        account.currentLogin ?? "",
        account.currentEmail ?? "",
        account.currentLanguage ?? "",
        account.availableLogins?.map((l) => l.login).join(",") ?? "",
        account.availableLanguages?.map((l) => l.code).join(",") ?? "",
      ].join("|")
    : "";

  const form = useForm<AccountSettingsFormValues>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      login: "",
      password: "",
      email: "",
      language: "",
    },
  });

  const lastSyncedAccountKeyRef = React.useRef("");

  React.useEffect(() => {
    if (!account || !accountFormKey) return;
    if (lastSyncedAccountKeyRef.current === accountFormKey) return;
    lastSyncedAccountKeyRef.current = accountFormKey;

    form.reset({
      login: account.currentLogin || account.availableLogins?.[0]?.login || "",
      password: "",
      email: account.currentEmail || "",
      language: account.currentLanguage || account.availableLanguages?.[0]?.code || "",
    });
  }, [account, accountFormKey]);

  const updateAccountMutation = trpc.plesk.wpCredentials.updateAccount.useMutation({
    onSuccess: async () => {
      toast.success("WordPress account settings updated");
      lastSyncedAccountKeyRef.current = "";
      form.setValue("password", "");
      await Promise.all([
        refetch(),
        refetchAccount(),
        utils.plesk.wpCredentials.get.invalidate({ installationId: installationIdNumber }),
        utils.plesk.wpCredentials.getAccount.invalidate({ installationId: installationIdNumber }),
      ]);
    },
    onError: (mutationError) => {
      toast.error(mutationError.message || "Failed to update WordPress account settings");
    },
  });

  const hasPassword = credentials?.hasPassword ?? false;

  const copyToClipboard = async (text: string, label: string) => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      toast.success(`${label} copied`);
    } else {
      toast.error("Could not copy. Try selecting the value and copying manually.");
    }
  };

  const handleLoginToWordPress = () => {
    if (!credentials?.hasPassword || !credentials.password) return;
    openWordPressAdminLogin({
      login: credentials.login,
      password: credentials.password,
      loginUrl: credentials.loginUrl,
    });
  };

  const handleUpdateAccount = (values: AccountSettingsFormValues) => {
    if (isNaN(installationIdNumber) || installationIdNumber <= 0) {
      toast.error("Invalid WordPress installation.");
      return;
    }

    const trimmedPassword = values.password?.trim() ?? "";
    const loginChanged = values.login !== account?.currentLogin;
    const emailChanged = values.email.trim() !== (account?.currentEmail ?? "").trim();
    const languageChanged = values.language !== account?.currentLanguage;
    const passwordChanged = trimmedPassword.length > 0;

    if (!loginChanged && !emailChanged && !languageChanged && !passwordChanged) {
      toast.info("No changes to save.");
      return;
    }

    if (!passwordChanged && !hasPassword && (loginChanged || emailChanged || languageChanged)) {
      toast.error("Set a new password below before saving other account changes.");
      return;
    }

    updateAccountMutation.mutate({
      installationId: installationIdNumber,
      ...(loginChanged ? { login: values.login } : {}),
      ...(passwordChanged ? { password: trimmedPassword } : hasPassword && credentials.password ? { retainPassword: credentials.password } : {}),
      ...(emailChanged ? { email: values.email.trim() } : {}),
      ...(languageChanged ? { language: values.language } : {}),
    });
  };

  if (isLoading || isAccountLoading) {
    return <CredentialsSkeleton />;
  }

  if (isError || !credentials) {
    return <CredentialsError error={error as Error} onRetry={() => refetch()} />;
  }

  const loginOptions =
    account?.availableLogins && account.availableLogins.length > 0
      ? account.availableLogins
      : credentials.login
        ? [{ login: credentials.login, title: "Administrator" }]
        : [];

  const languageOptions = account?.availableLanguages ?? [];
  const currentLanguageLabel =
    languageOptions.find((l) => l.code === account?.currentLanguage)?.title ??
    account?.currentLanguage;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-4">
        <Card className="overflow-hidden shadow-sm">
          <div className="flex flex-col gap-3 border-b bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                <Shield className="h-4 w-4 text-primary" aria-hidden />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">WordPress admin access</h2>
                <p className="text-xs text-muted-foreground">
                  Log in directly or copy credentials below.
                </p>
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <Button size="sm" className="shrink-0" onClick={handleLoginToWordPress} disabled={!hasPassword}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Log in to WordPress
                  </Button>
                </span>
              </TooltipTrigger>
              {!hasPassword ? (
                <TooltipContent>
                  Set a password in Account settings below to enable one-click login.
                </TooltipContent>
              ) : null}
            </Tooltip>
          </div>

          <CardContent className="grid grid-cols-1 gap-2 p-4 @md/main:grid-cols-2 @xl/main:grid-cols-3">
            <CredentialRow
              label="Administrator login"
              description="Username for wp-admin"
              value={credentials.login}
              icon={User}
              onCopy={() => copyToClipboard(credentials.login, "Login")}
            />
            <CredentialRow
              label="Password"
              description={
                hasPassword
                  ? "Stored securely in WP Toolkit"
                  : "Not available from WP Toolkit — set a new password in Account settings below"
              }
              value={hasPassword && credentials.password ? credentials.password : "Not available"}
              masked={hasPassword}
              isMasked={hasPassword ? !showPassword : undefined}
              icon={KeyRound}
              onCopy={
                hasPassword && credentials.password
                  ? () => copyToClipboard(credentials.password!, "Password")
                  : () => {}
              }
              onToggleMask={hasPassword ? () => setShowPassword(!showPassword) : undefined}
            />
            <CredentialRow
              label="Login URL"
              description="WordPress sign-in page for this site"
              value={credentials.loginUrl}
              icon={Link2}
              onCopy={() => copyToClipboard(credentials.loginUrl, "Login URL")}
              extraAction={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        window.open(credentials.loginUrl, "_blank", "noopener,noreferrer")
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">Open login URL</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open in new tab</TooltipContent>
                </Tooltip>
              }
            />
          </CardContent>
        </Card>

        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <Card className="overflow-hidden">
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/30">
                    <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Account settings</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Update login, password, email, or site language
                      {currentLanguageLabel ? ` · ${currentLanguageLabel}` : ""}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
                    settingsOpen && "rotate-180"
                  )}
                />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <Separator />
              <CardContent className="p-4">
                {isAccountLoading ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : isAccountError ? (
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
                    <p className="text-sm text-muted-foreground">
                      Account settings could not be loaded.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => refetchAccount()}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry
                    </Button>
                  </div>
                ) : !account ? null : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleUpdateAccount)} className="space-y-4">
                      <div className="rounded-md border border-border/60 bg-muted/20 p-3 md:p-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="login"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                                  Administrator login
                                </FormLabel>
                                {loginOptions.length > 0 ? (
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value || undefined}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select login" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {loginOptions.map((option) => (
                                        <SelectItem key={option.login} value={option.login}>
                                          {option.title} ({option.login})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                                  New password
                                </FormLabel>
                                <FormControl>
                                  <div className="flex gap-2">
                                    <div className="relative min-w-0 flex-1">
                                      <Input
                                        {...field}
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Leave blank to keep current"
                                        autoComplete="new-password"
                                        className="pr-10"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                      >
                                        {showNewPassword ? (
                                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                          <Eye className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="sr-only">Toggle password visibility</span>
                                      </Button>
                                    </div>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="icon"
                                          className="shrink-0"
                                          onClick={() => {
                                            const generated = generateSecurePassword();
                                            form.setValue("password", generated, {
                                              shouldDirty: true,
                                              shouldValidate: true,
                                            });
                                            setShowNewPassword(true);
                                            toast.success("Password generated");
                                          }}
                                          aria-label="Generate secure password"
                                        >
                                          <RefreshCw className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Generate secure password</TooltipContent>
                                    </Tooltip>
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  Leave blank to keep your current password when updating other fields.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                  Email
                                </FormLabel>
                                <FormControl>
                                  <Input {...field} type="email" autoComplete="email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="language"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2">
                                  <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                                  Language
                                </FormLabel>
                                {languageOptions.length > 0 ? (
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value || undefined}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select language" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {languageOptions.map((option) => (
                                        <SelectItem key={option.code} value={option.code}>
                                          {option.title}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                )}
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button type="submit" disabled={updateAccountMutation.isPending}>
                          {updateAccountMutation.isPending ? (
                            <Spinner className="mr-2 h-4 w-4" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Save changes
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Alert>
          <Lock className="h-4 w-4" />
          <AlertTitle>Keep these credentials private</AlertTitle>
          <AlertDescription>
            Anyone with this login can manage your WordPress site. Use a strong, unique password and
            update it periodically from account settings above.
          </AlertDescription>
        </Alert>
      </div>
    </TooltipProvider>
  );
}
