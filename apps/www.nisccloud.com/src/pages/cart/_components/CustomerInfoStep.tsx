import * as React from "react";
import { Eye, EyeOff, Building2, User, Mail, Phone, Lock, ArrowLeft, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { cn } from "@/lib/utils.ts";

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

interface CustomerInfoStepProps {
  onBack: () => void;
  onSubmit: (info: CustomerInfo) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
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
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomerInfoStep({
  onBack,
  onSubmit,
  isSubmitting,
  submitLabel = "Create Account & Complete Order",
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

  const inputBase = "h-11 rounded-xl text-sm";
  const inputError = "border-destructive focus-visible:ring-destructive";

  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
      {/* Header */}
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
          <h2 className="text-lg font-bold text-foreground">Your account details</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            We'll create a free nPanel account so you can manage your services.
          </p>
        </div>
      </div>

      {/* Already have an account — prominent card */}
      <a
        href={`${import.meta.env.VITE_NPANEL_APP_URL ?? "https://npanel.nisccloud.com"}/auth/login`}
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
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              value={info.companyName}
              onChange={(e) => set("companyName", e.target.value)}
              onBlur={() => blur("companyName")}
              placeholder="Acme Ltd"
              className={cn(inputBase, "pl-9", errors.companyName && inputError)}
              autoComplete="organization"
            />
          </div>
          <p className="text-xs text-gray-400">
            Used as your workspace name in nPanel. Can be changed later.
          </p>
        </Field>

        <Separator />

        {/* Password */}
        <Field label="Create a password" required error={errors.password}>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
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
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              onClick={() => setShowConfirm((v) => !v)}
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-400">
            A temporary password will also be emailed to you right after.
          </p>
        </Field>

        {/* Info card about temp password email */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-sm text-foreground flex gap-2.5">
          <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>
            After your order we will email you your{" "}
            <strong>account credentials and an email verification link</strong>. You can
            log in right away — email verification is not required to access your services.
          </span>
        </div>

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
            <p className="text-xs text-red-500 ml-6">{errors.agreedToTerms}</p>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-sm"
        >
          {isSubmitting ? "Creating your account…" : submitLabel}
        </Button>
      </form>
    </div>
  );
}
