"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateNebDesign } from "./agency.nisc-email-builder/_api/use-create-neb-design";
import { ProjectsSection } from "./agency.nisc-email-builder/_components/projects-section";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { useNiscEmailMarketingRoute } from "@/components/nisc-email-marketing/nisc-email-marketing-route-context";
import { NiscEmOrganizationSelect } from "@/components/nisc-email-marketing/nisc-em-organization-select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

export default function NiscEmailBuilderLandingPage() {
	const navigate = useNavigate();
	const route = useNiscEmailMarketingRoute();
	const createMutation = useCreateNebDesign();
	const [isCreating, setIsCreating] = useState(false);
	const [linkOrgOpen, setLinkOrgOpen] = useState(false);
	const [linkedTeamId, setLinkedTeamId] = useState("");

	const createDesign = (teamId?: string) => {
		setIsCreating(true);
		createMutation.mutate(
			{
				name: "Untitled Email",
				...(teamId ? { teamId } : {}),
			},
			{
				onSuccess: (data) => {
					navigate(`${route.emailBuilderBasePath}/${data.id}`);
				},
				onError: () => {
					setIsCreating(false);
				},
			},
		);
	};

	const handleCreate = () => {
		if (route.isCustomer) {
			createDesign(route.teamId ?? undefined);
			return;
		}
		if (route.showAdminFeatures) {
			setLinkedTeamId("");
			setLinkOrgOpen(true);
			return;
		}
		createDesign();
	};

	const handleConfirmOrg = () => {
		setLinkOrgOpen(false);
		createDesign(linkedTeamId || undefined);
	};

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-7xl mx-auto">
				<div className="flex flex-col gap-2">
					<h1 className="text-base font-semibold tracking-tight">AI Email Builder</h1>
					<p className="text-xs text-muted-foreground">
						Design and reuse emails with the AI builder and your image library.
					</p>
				</div>

				<div className="mt-6">
					<ProjectsSection
						toolbarActions={
							<Button size="sm" onClick={handleCreate} disabled={isCreating}>
								{isCreating ? (
									<Spinner size={16} className="mr-2" />
								) : (
									<Plus className="mr-2 h-4 w-4" />
								)}
								{isCreating ? "Creating..." : "Create design"}
							</Button>
						}
					/>
				</div>
			</div>

			{route.showAdminFeatures ? (
			<Dialog open={linkOrgOpen} onOpenChange={setLinkOrgOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Link to organization</DialogTitle>
						<DialogDescription>
							Choose an organization for this design.
						</DialogDescription>
					</DialogHeader>
					<NiscEmOrganizationSelect
						value={linkedTeamId}
						onChange={setLinkedTeamId}
						disabled={isCreating}
					/>
					<DialogFooter>
						<Button variant="outline" onClick={() => setLinkOrgOpen(false)} disabled={isCreating}>
							Cancel
						</Button>
						<Button onClick={handleConfirmOrg} disabled={isCreating}>
							Create design
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			) : null}
		</div>
	);
}
