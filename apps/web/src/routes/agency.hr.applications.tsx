"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

export default function AgencyHrApplicationsPage() {
	const list = trpc.careers.applications.useQuery();

	async function download(id: string, fileName: string) {
		const response = await fetch(`/api/careers/applications/${id}/cv`, { credentials: "include" });
		if (!response.ok) {
			toast.error("Could not download this CV");
			return;
		}
		const blob = await response.blob();
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = fileName || "cv";
		link.click();
		URL.revokeObjectURL(url);
	}

	return (
		<div className="@container/main flex flex-col gap-4 px-4 py-4 md:px-6 md:py-6 lg:px-8">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
				<div>
					<h1 className="text-xl font-semibold">Applications</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						CVs stay private. Download them from here. They are not published on the website.
					</p>
				</div>
				{list.isLoading ? <p className="text-sm text-muted-foreground">Loading applications…</p> : null}
				{list.error ? <p className="text-sm text-destructive">{list.error.message}</p> : null}
				{list.data?.length === 0 ? <p className="text-sm text-muted-foreground">No applications yet.</p> : null}
				<ul className="grid gap-3">
					{(list.data ?? []).map((application) => (
						<li key={application.id} className="rounded-lg border bg-card p-4">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p className="font-medium">{application.fullName}</p>
									<p className="mt-1 text-sm text-muted-foreground">
										{application.openingTitle} · {application.email}
									</p>
									<p className="mt-1 text-sm text-muted-foreground">
										{application.city}, {application.countryName} · {application.heardFrom}
									</p>
									{application.phone ? (
										<a className="mt-1 block text-sm underline" href={`tel:${application.phone.replace(/[^\d+]/g, "")}`}>
											{application.phone}
										</a>
									) : null}
									<p className="mt-1 text-sm">Salary range: {application.salaryRange}</p>
									{application.availableFrom ? (
										<p className="mt-1 text-sm">
											Can start:{" "}
											{new Date(`${application.availableFrom}T00:00:00Z`).toLocaleDateString("en-GB", {
												day: "numeric",
												month: "long",
												year: "numeric",
												timeZone: "UTC",
											})}
										</p>
									) : null}
									{application.linkedinUrl ? (
										<a className="mt-1 block text-sm underline" href={application.linkedinUrl} target="_blank" rel="noopener noreferrer">
											LinkedIn profile
										</a>
									) : null}
									{application.notes ? <p className="mt-3 whitespace-pre-wrap text-sm">{application.notes}</p> : null}
								</div>
								<Button type="button" variant="outline" onClick={() => download(application.id, application.cvFileName)}>
									Download CV
								</Button>
							</div>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
