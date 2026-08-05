"use client";

import { useState } from "react";
import { Building2, Users, ArrowRight, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import posthog from "posthog-js";
import { trpc } from "@/utils/trpc";

type CreateTeamInput = {
  name: string;
  baseCurrency: string;
  inviteEmails?: string[];
};

const STEPS = [
  { key: 1, label: "Organization details", icon: Building2 },
  { key: 2, label: "Invite members", icon: Users },
] as const;

export function CreateTeamForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    teamName: "",
    currency: "KES",
    inviteMembers: "",
  });

  const createTeamMutation = trpc.teams.create.useMutation({
    onSuccess: (data) => {
      if (
        import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN &&
        import.meta.env.VITE_PUBLIC_POSTHOG_HOST
      ) {
        posthog.capture("organization_created", {
          base_currency: formData.currency,
          invited_member_count: formData.inviteMembers.trim()
            ? formData.inviteMembers.split(/[,;\n]/).filter((email) => email.trim()).length
            : 0,
        });
      }
      toast.success("Organization created successfully!");
      const teamSlug = data.team.slug;
      const destination = data.isFirstTeam
        ? `/${teamSlug}/my-profile?completeProfile=1`
        : `/${teamSlug}/dashboard`;
      // Full page navigation so server re-runs and sees the new team (avoids staying on create-team)
      window.location.assign(destination);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to create organization");
    },
  });

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.teamName.trim()) {
        toast.error("Organization name is required");
        return;
      }
      if (formData.teamName.trim().length < 2) {
        toast.error("Organization name must be at least 2 characters");
        return;
      }
      if (formData.teamName.trim().length > 100) {
        toast.error("Organization name must be less than 100 characters");
        return;
      }
    }
    setCurrentStep(2);
  };

  const handleSubmit = () => {
    const inviteEmailsRaw = formData.inviteMembers.trim();
    let inviteEmails: string[] = [];

    if (inviteEmailsRaw) {
      inviteEmails = inviteEmailsRaw
        .split(/[,;\n]/)
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = inviteEmails.filter((email) => !emailRegex.test(email));

      if (invalidEmails.length > 0) {
        toast.error(`Invalid email addresses: ${invalidEmails.join(", ")}`);
        return;
      }
    }

    const teamData: CreateTeamInput = {
      name: formData.teamName.trim(),
      baseCurrency: formData.currency,
      inviteEmails: inviteEmails.length > 0 ? inviteEmails : undefined,
    };

    createTeamMutation.mutate(teamData);
  };

  return (
    <div className="w-full max-w-full sm:max-w-lg mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.key;
          const isPast = currentStep > step.key;
          return (
            <div key={step.key} className="flex items-center">
              <div
                className={`
                  flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all duration-200
                  ${isActive ? "border-primary bg-primary text-primary-foreground shadow-md" : ""}
                  ${isPast ? "border-primary bg-primary/10 text-primary" : ""}
                  ${!isActive && !isPast ? "border-muted-foreground/30 bg-muted/50 text-muted-foreground" : ""}
                `}
              >
                <StepIcon className="h-4 w-4" />
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-0.5 rounded-full transition-colors ${
                    isPast ? "bg-primary/40" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xl shadow-black/5 overflow-hidden">
        <div className="px-8 pt-8 pb-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {currentStep === 1 ? "Create your organization" : "Invite your team"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5 max-w-[320px] mx-auto leading-relaxed">
              {currentStep === 1
                ? "An organization keeps your domains, hosting, subscriptions, and team in one private workspace."
                : "Invited people will only see this organization’s resources. Add them now or skip and do it later."}
            </p>
          </div>

          {/* Step 1: Organization Details */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="space-y-2 w-full">
                <Label htmlFor="teamName" className="text-sm font-medium">
                  Organization name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="teamName"
                  placeholder="e.g. Acme Inc."
                  value={formData.teamName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, teamName: e.target.value }))
                  }
                  className="h-11 w-full rounded-lg border-border/80 focus-visible:ring-2"
                  autoFocus
                />
              </div>

              <div className="space-y-2 w-full">
                <Label htmlFor="currency" className="text-sm font-medium">
                  Default currency
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, currency: value }))
                  }
                >
                  <SelectTrigger className="h-11 w-full rounded-lg border-border/80">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KES">Kenyan Shillings (KES)</SelectItem>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Invite Members */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
              <div className="space-y-2 w-full">
                <Label htmlFor="inviteMembers" className="text-sm font-medium">
                  Email addresses
                </Label>
                <Textarea
                  id="inviteMembers"
                  placeholder="colleague@company.com, another@company.com"
                  value={formData.inviteMembers}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, inviteMembers: e.target.value }))
                  }
                  className="min-h-[120px] w-full resize-none rounded-lg border-border/80 focus-visible:ring-2"
                />
                <p className="text-xs text-muted-foreground">
                  Separate with commas or new lines. They’ll only get access to this
                  organization   you can always invite more people later.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-8 pb-8 pt-2 flex gap-3">
          {currentStep === 2 ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex-1 h-11 rounded-lg"
                disabled={createTeamMutation.isPending}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                className="flex-1 h-11 rounded-lg gap-2"
                disabled={createTeamMutation.isPending}
              >
                {createTeamMutation.isPending ? "Creating…" : "Create organization"}
                {!createTeamMutation.isPending && (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={handleNext}
              className="w-full h-11 rounded-lg gap-2"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Step {currentStep} of {STEPS.length}
      </p>
    </div>
  );
}
