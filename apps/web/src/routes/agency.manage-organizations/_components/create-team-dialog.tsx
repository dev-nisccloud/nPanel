"use client";

import * as React from "react";
import { Upload, Users, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";

// Type for the create team mutation input
type CreateTeamInput = {
  name: string;
  baseCurrency: string;
  inviteEmails?: string[];
};

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateTeamDialog({ open, onOpenChange, onSuccess }: CreateTeamDialogProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [formData, setFormData] = React.useState({
    teamName: "",
    teamLogo: null as File | null,
    currency: "KES",
    inviteMembers: ""
  });

  const utils = trpc.useUtils();

  // tRPC mutation for creating team
  const createTeamMutation = trpc.teams.create.useMutation({
    onSuccess: () => {
      toast.success("Organization created successfully!");
      // Reset form
      setCurrentStep(1);
      setFormData({
        teamName: "",
        teamLogo: null,
        currency: "KES",
        inviteMembers: ""
      });
      // Invalidate teams list to refresh
      utils.teams.getAll.invalidate();
      // Close dialog
      onOpenChange(false);
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to create organization");
    },
  });

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setFormData({
        teamName: "",
        teamLogo: null,
        currency: "KES",
        inviteMembers: ""
      });
    }
  }, [open]);

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate team name
      if (!formData.teamName.trim()) {
        toast.error("Organization name is required");
        return;
      }
      
      // Validate team name length
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
    // Parse invite emails from textarea
    const inviteEmailsRaw = formData.inviteMembers.trim();
    let inviteEmails: string[] = [];
    
    if (inviteEmailsRaw) {
      // Split by comma, newline, or semicolon
      inviteEmails = inviteEmailsRaw
        .split(/[,;\n]/)
        .map(email => email.trim())
        .filter(email => email.length > 0);
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = inviteEmails.filter(email => !emailRegex.test(email));
      
      if (invalidEmails.length > 0) {
        toast.error(`Invalid email addresses: ${invalidEmails.join(", ")}`);
        return;
      }
    }

    // Submit to backend
    const teamData: CreateTeamInput = {
      name: formData.teamName.trim(),
      baseCurrency: formData.currency,
      inviteEmails: inviteEmails,
    };
    
    createTeamMutation.mutate(teamData);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, teamLogo: file }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Set up your organization and invite members to get started
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Organization Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Organization Logo Upload */}
              <div className="flex flex-col items-center space-y-3">
                <Label className="text-sm font-medium">Select your organization logo</Label>
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors group">
                    {formData.teamLogo ? (
                      <img 
                        src={URL.createObjectURL(formData.teamLogo)} 
                        alt="Organization logo" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="teamName" className="text-sm font-medium">
                  Organization Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="teamName"
                  placeholder="Enter your organization name"
                  value={formData.teamName}
                  onChange={(e) => setFormData(prev => ({ ...prev, teamName: e.target.value }))}
                  className="h-11"
                />
              </div>

              {/* Currency Selection */}
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-sm font-medium">Default Currency</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KES">Kenyan Shillings (KES)</SelectItem>
                    <SelectItem value="USD">US Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Next Button */}
              <Button
                onClick={handleNext}
                className="w-full h-11 flex items-center gap-2"
                disabled={createTeamMutation.isPending}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Invite Members */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Invite Organization Members</h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteMembers" className="text-sm font-medium">
                  Email Addresses
                </Label>
                <Textarea
                  id="inviteMembers"
                  placeholder="Enter email addresses separated by commas or new lines&#10;example@company.com, john@company.com"
                  value={formData.inviteMembers}
                  onChange={(e) => setFormData(prev => ({ ...prev, inviteMembers: e.target.value }))}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple email addresses with commas or new lines
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 h-11"
                  disabled={createTeamMutation.isPending}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 h-11 flex items-center gap-2"
                  disabled={createTeamMutation.isPending}
                >
                  {createTeamMutation.isPending ? "Creating..." : "Create Organization"}
                  {!createTeamMutation.isPending && <ArrowRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

