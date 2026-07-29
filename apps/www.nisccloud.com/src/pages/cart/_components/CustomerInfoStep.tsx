import * as React from "react";
import {
  Eye,
  EyeOff,
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  ArrowLeft,
  LogIn,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { cn } from "@/lib/utils.ts";
import {
  buildStorefrontSignInUrl,
  type StorefrontCheckoutTeam,
  type StorefrontProfilePrefill,
} from "@/lib/storefront-checkout-api.ts";
import { CountrySelect, resolveCountryName } from "@/components/country-select.tsx";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

export const CUSTOMER_INFO_FORM_ID = "storefront-customer-form";
export const SIGNED_IN_CHECKOUT_FORM_ID = "storefront-signed-in-form";
export const SIGNED_IN_PROFILE_FORM_ID = "storefront-profile-form";
export const SIGNED_IN_ORG_FORM_ID = "storefront-org-form";

export type CustomerInfoIdentity =
  | { status: "loading" }
  | { status: "guest" }
  | {
      status: "signed-in";
      userName: string;
      profileComplete: boolean;
      profilePrefill: StorefrontProfilePrefill;
      teams: StorefrontCheckoutTeam[];
    };

interface CustomerInfoStepProps {
  onBack: () => void;
  onSubmit: (info: CustomerInfo) => void;
  onSignedInSubmit?: (teamId: string) => void;
  onCompleteProfile?: (profile: StorefrontProfilePrefill) => Promise<void> | void;
  onCreateOrganization?: (name: string) => Promise<void> | void;
  /** Flush cart draft to sessionStorage immediately before navigating to login. */
  onBeforeSignIn?: () => void;
  identity?: CustomerInfoIdentity;
  prefillEmail?: string;
}

type FieldErrors = Partial<Record<keyof CustomerInfo, string>>;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(info: CustomerInfo): FieldErrors {
  const errors: FieldErrors = {};
  if (!info.firstName.trim()) errors.firstName = "First name is required";
  if (!info.lastName.trim()) errors.lastName = "Last name is required";
  if (!info.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) {
    errors.email = "Enter a valid email address";
  }
  if (!info.phone.trim()) {
    errors.phone = "Phone number is required";
  } else if (info.phone.replace(/\D/g, "").length < 9) {
    errors.phone = "Enter a valid phone number";
  }
  if (!info.companyName.trim()) errors.companyName = "Company / business name is required";
  if (!info.password) {
    errors.password = "Password is required";
  } else if (info.password.length < 8) {
    errors.password = "Password must be at least 8 characters";
  }
  if (!info.confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (info.password !== info.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }
  if (!info.agreedToTerms) errors.agreedToTerms = "You must agree to the terms";
  return errors;
}

// ---------------------------------------------------------------------------
// Field wrapper
// ---------------------------------------------------------------------------

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function StepHeader({
  onBack,
  title,
  subtitle,
}: {
  onBack: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <button
        type="button"
        onClick={onBack}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Back to cart"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomerInfoStep({
  onBack,
  onSubmit,
  onSignedInSubmit,
  onCompleteProfile,
  onCreateOrganization,
  onBeforeSignIn,
  identity = { status: "guest" },
  prefillEmail,
}: CustomerInfoStepProps) {
  const [info, setInfo] = React.useState<CustomerInfo>({
    firstName: "",
    lastName: "",
    email: prefillEmail ?? "",
    phone: "",
    companyName: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  });
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [touched, setTouched] = React.useState<Partial<Record<keyof CustomerInfo, boolean>>>({});
  const [selectedTeamId, setSelectedTeamId] = React.useState("");
  const [teamError, setTeamError] = React.useState<string | undefined>();
  const [orgName, setOrgName] = React.useState("");
  const [orgError, setOrgError] = React.useState<string | undefined>();
  const [profile, setProfile] = React.useState<StorefrontProfilePrefill>({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "Kenya",
    postalCode: "",
  });
  const [profileErrors, setProfileErrors] = React.useState<
    Partial<Record<keyof StorefrontProfilePrefill, string>>
  >({});
  const [localBusy, setLocalBusy] = React.useState(false);

  React.useEffect(() => {
    if (identity.status !== "signed-in") return;
    setProfile({
      ...identity.profilePrefill,
      country: resolveCountryName(identity.profilePrefill.country) || "Kenya",
    });
    if (identity.teams.length === 1) {
      setSelectedTeamId(identity.teams[0]!.id);
    } else if (
      selectedTeamId &&
      !identity.teams.some((t) => t.id === selectedTeamId)
    ) {
      setSelectedTeamId("");
    }
  }, [identity, selectedTeamId]);

  const set = (field: keyof CustomerInfo, value: string | boolean) => {
    setInfo((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const next = { ...info, [field]: value };
      const errs = validate(next);
      setErrors((prev) => ({ ...prev, [field]: errs[field] }));
    }
  };

  const blur = (field: keyof CustomerInfo) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate(info);
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(info);
    setErrors(errs);
    setTouched({
      firstName: true, lastName: true, email: true, phone: true,
      companyName: true, password: true, confirmPassword: true, agreedToTerms: true,
    });
    if (Object.keys(errs).length === 0) {
      onSubmit(info);
    }
  };

  const handleSignedInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) {
      setTeamError("Select an organization for this purchase");
      return;
    }
    setTeamError(undefined);
    onSignedInSubmit?.(selectedTeamId);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Partial<Record<keyof StorefrontProfilePrefill, string>> = {};
    if (!profile.firstName.trim()) nextErrors.firstName = "First name is required";
    if (!profile.lastName.trim()) nextErrors.lastName = "Last name is required";
    if (!profile.phone.trim() || profile.phone.replace(/\D/g, "").length < 9) {
      nextErrors.phone = "Enter a valid phone number";
    }
    if (!profile.address.trim()) nextErrors.address = "Address is required";
    if (!profile.city.trim()) nextErrors.city = "City is required";
    if (!resolveCountryName(profile.country)) {
      nextErrors.country = "Select a country from the list";
    }
    if (!profile.postalCode.trim()) nextErrors.postalCode = "Postal code is required";
    setProfileErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setLocalBusy(true);
    try {
      await onCompleteProfile?.(profile);
    } finally {
      setLocalBusy(false);
    }
  };

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      setOrgError("Organization name is required");
      return;
    }
    setOrgError(undefined);
    setLocalBusy(true);
    try {
      await onCreateOrganization?.(orgName.trim());
      setOrgName("");
    } finally {
      setLocalBusy(false);
    }
  };

  const inputBase = "h-11 rounded-xl text-sm";
  const inputError = "border-destructive focus-visible:ring-destructive";
  const signInHref = buildStorefrontSignInUrl();

  if (identity.status === "loading") {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <StepHeader
          onBack={onBack}
          title="Your account details"
          subtitle="Checking whether you're signed in to nPanel…"
        />
        <div className="space-y-3" aria-busy="true">
          <div className="h-16 rounded-xl bg-muted animate-pulse" />
          <div className="h-11 rounded-xl bg-muted animate-pulse" />
          <div className="h-11 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (identity.status === "signed-in") {
    const hasOrgs = identity.teams.length > 0;
    const needsProfile = !identity.profileComplete;

    return (
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <StepHeader
          onBack={onBack}
          title="Confirm your purchase"
          subtitle={
            needsProfile
              ? "Complete your profile so we can provision domains and other regulated services."
              : hasOrgs
                ? "You're signed in  choose which organization this service belongs to."
                : "Create an organization to purchase and manage this service under."
          }
        />

        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-muted/40 mb-6">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="text-sm font-semibold text-foreground truncate">{identity.userName}</p>
          </div>
        </div>

        {needsProfile ? (
          <form
            id={SIGNED_IN_PROFILE_FORM_ID}
            onSubmit={handleProfileSubmit}
            className="space-y-4"
            noValidate
          >
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Your profile is incomplete. Full contact details are required before checkout.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name" required error={profileErrors.firstName}>
                <Input
                  value={profile.firstName}
                  onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                  className={cn(inputBase, profileErrors.firstName && inputError)}
                  autoComplete="given-name"
                />
              </Field>
              <Field label="Last name" required error={profileErrors.lastName}>
                <Input
                  value={profile.lastName}
                  onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                  className={cn(inputBase, profileErrors.lastName && inputError)}
                  autoComplete="family-name"
                />
              </Field>
            </div>
            <Field label="Phone number" required error={profileErrors.phone}>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  className={cn(inputBase, "pl-9", profileErrors.phone && inputError)}
                  autoComplete="tel"
                  placeholder="+254 7XX XXX XXX"
                />
              </div>
            </Field>
            <Field label="Street address" required error={profileErrors.address}>
              <Input
                value={profile.address}
                onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                className={cn(inputBase, profileErrors.address && inputError)}
                autoComplete="street-address"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="City" required error={profileErrors.city}>
                <Input
                  value={profile.city}
                  onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                  className={cn(inputBase, profileErrors.city && inputError)}
                  autoComplete="address-level2"
                />
              </Field>
              <Field label="State / county" error={profileErrors.state}>
                <Input
                  value={profile.state}
                  onChange={(e) => setProfile((p) => ({ ...p, state: e.target.value }))}
                  className={cn(inputBase, profileErrors.state && inputError)}
                  autoComplete="address-level1"
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Country" required error={profileErrors.country}>
                <CountrySelect
                  value={profile.country}
                  onValueChange={(value) => {
                    setProfile((p) => ({ ...p, country: value }));
                    setProfileErrors((prev) => ({ ...prev, country: undefined }));
                  }}
                  invalid={Boolean(profileErrors.country)}
                />
              </Field>
              <Field label="Postal code" required error={profileErrors.postalCode}>
                <Input
                  value={profile.postalCode}
                  onChange={(e) => setProfile((p) => ({ ...p, postalCode: e.target.value }))}
                  className={cn(inputBase, profileErrors.postalCode && inputError)}
                  autoComplete="postal-code"
                />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">
              {localBusy ? "Saving your profile…" : "These details are saved to your nPanel profile."}
            </p>
          </form>
        ) : hasOrgs ? (
          <form
            id={SIGNED_IN_CHECKOUT_FORM_ID}
            onSubmit={handleSignedInSubmit}
            className="space-y-5"
          >
            <Field label="Purchase under organization" required error={teamError}>
              <Select
                value={selectedTeamId || undefined}
                onValueChange={(value) => {
                  setSelectedTeamId(value);
                  setTeamError(undefined);
                }}
              >
                <SelectTrigger
                  className={cn(
                    "h-11 w-full rounded-xl text-sm",
                    teamError && inputError,
                  )}
                >
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent>
                  {identity.teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <p className="text-xs text-muted-foreground">
              The service will be provisioned in the selected nPanel organization.
            </p>
          </form>
        ) : (
          <form
            id={SIGNED_IN_ORG_FORM_ID}
            onSubmit={handleOrgSubmit}
            className="space-y-4"
            noValidate
          >
            <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
              <Users className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Create an organization</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You need an organization to own this purchase. You will be the owner.
                </p>
              </div>
            </div>
            <Field label="Organization name" required error={orgError}>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={orgName}
                  onChange={(e) => {
                    setOrgName(e.target.value);
                    setOrgError(undefined);
                  }}
                  className={cn(inputBase, "pl-9", orgError && inputError)}
                  placeholder="Acme Ltd"
                  autoComplete="organization"
                />
              </div>
            </Field>
            <p className="text-xs text-muted-foreground">
              {localBusy ? "Creating organization…" : "You can rename it later in nPanel."}
            </p>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <StepHeader
        onBack={onBack}
        title="Your account details"
        subtitle="We'll create a free nPanel account so you can manage your services."
      />

      {/* Already have an account  prominent card */}
      <a
        href={signInHref}
        onClick={() => onBeforeSignIn?.()}
        className="flex items-center justify-between gap-3 p-4 rounded-xl border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all mb-6 group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <LogIn className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Already have an account?</p>
            <p className="text-xs text-muted-foreground">Sign in to nPanel to complete your purchase</p>
          </div>
        </div>
        <span className="text-sm font-semibold text-primary whitespace-nowrap group-hover:underline">
          Sign in →
        </span>
      </a>

      <form id={CUSTOMER_INFO_FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name" required error={errors.firstName}>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={info.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                onBlur={() => blur("firstName")}
                placeholder="Jane"
                className={cn(inputBase, "pl-9", errors.firstName && inputError)}
                autoComplete="given-name"
              />
            </div>
          </Field>
          <Field label="Last name" required error={errors.lastName}>
            <Input
              value={info.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              onBlur={() => blur("lastName")}
              placeholder="Doe"
              className={cn(inputBase, errors.lastName && inputError)}
              autoComplete="family-name"
            />
          </Field>
        </div>

        {/* Email */}
        <Field label="Email address" required error={errors.email}>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="email"
              value={info.email}
              onChange={(e) => set("email", e.target.value)}
              onBlur={() => blur("email")}
              placeholder="jane@company.com"
              className={cn(inputBase, "pl-9", errors.email && inputError)}
              autoComplete="email"
            />
          </div>
        </Field>

        {/* Phone */}
        <Field label="Phone number" required error={errors.phone}>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="tel"
              value={info.phone}
              onChange={(e) => set("phone", e.target.value)}
              onBlur={() => blur("phone")}
              placeholder="+254 7XX XXX XXX"
              className={cn(inputBase, "pl-9", errors.phone && inputError)}
              autoComplete="tel"
            />
          </div>
        </Field>

        {/* Company name */}
        <Field label="Company / business name" required error={errors.companyName}>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={info.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              onBlur={() => blur("companyName")}
              placeholder="Acme Ltd"
              className={cn(inputBase, "pl-9", errors.companyName && inputError)}
              autoComplete="organization"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Used as your workspace name in nPanel. Can be changed later.
          </p>
        </Field>

        <Separator />

        {/* Password */}
        <Field label="Create a password" required error={errors.password}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type={showPassword ? "text" : "password"}
              value={info.password}
              onChange={(e) => set("password", e.target.value)}
              onBlur={() => blur("password")}
              placeholder="At least 8 characters"
              className={cn(inputBase, "pl-9 pr-10", errors.password && inputError)}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        {/* Confirm password */}
        <Field label="Confirm password" required error={errors.confirmPassword}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type={showConfirm ? "text" : "password"}
              value={info.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
              onBlur={() => blur("confirmPassword")}
              placeholder="Re-enter your password"
              className={cn(inputBase, "pl-9 pr-10", errors.confirmPassword && inputError)}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowConfirm((v) => !v)}
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>

        {/* Terms */}
        <div className="space-y-1.5">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={info.agreedToTerms === true}
              onCheckedChange={(checked) => set("agreedToTerms", checked === true)}
              aria-required="true"
              className="mt-0.5"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              I agree to the{" "}
              <a href="/terms" target="_blank" className="text-primary underline hover:no-underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" target="_blank" className="text-primary underline hover:no-underline">
                Privacy Policy
              </a>
              <span className="text-destructive ml-0.5" aria-hidden="true">*</span>
            </label>
          </div>
          {errors.agreedToTerms && (
            <p className="text-xs text-destructive ml-6">{errors.agreedToTerms}</p>
          )}
        </div>
      </form>
    </div>
  );
}
