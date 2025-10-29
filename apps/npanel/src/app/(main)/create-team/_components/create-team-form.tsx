"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Users, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { trpc } from "@/utils/trpc";

// Type for the create team mutation input
type CreateTeamInput = {
  name: string;
  baseCurrency: string;
  inviteEmails?: string[];
};

export function CreateTeamForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    teamName: "",
    teamLogo: null as File | null,
    currency: "KES",
    inviteMembers: ""
  });

  // tRPC mutation for creating team
  const createTeamMutation = trpc.teams.create.useMutation({
    onSuccess: (data) => {
      toast.success("Team created successfully!");
      // Redirect to the newly created team's dashboard using its slug
      const teamSlug = data.team.slug;
      router.push(`/${teamSlug}/default` as never);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to create team");
    },
  });

  const handleNext = () => {
    if (currentStep === 1) {
      // Validate team name
      if (!formData.teamName.trim()) {
        toast.error("Team name is required");
        return;
      }
      
      // Validate team name length
      if (formData.teamName.trim().length < 2) {
        toast.error("Team name must be at least 2 characters");
        return;
      }
      
      if (formData.teamName.trim().length > 100) {
        toast.error("Team name must be less than 100 characters");
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
    <Card className="shadow-2xl border-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardContent className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">Create New Team</h1>
          <p className="text-muted-foreground text-sm">
            Set up your team and invite members to get started
          </p>
        </div>

        {/* Step 1: Team Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Team Logo Upload */}
            <div className="flex flex-col items-center space-y-3">
              <Label className="text-sm font-medium">Select your team logo</Label>
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors group">
                  {formData.teamLogo ? (
                    <img 
                      src={URL.createObjectURL(formData.teamLogo)} 
                      alt="Team logo" 
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

            {/* Team Name */}
            <div className="space-y-2">
              <Label htmlFor="teamName" className="text-sm font-medium">
                Team Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="teamName"
                placeholder="Enter your team name"
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
              <h2 className="text-lg font-semibold">Invite Team Members</h2>
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
                {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                {!createTeamMutation.isPending && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
