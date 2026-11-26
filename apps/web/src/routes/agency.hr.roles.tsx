"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Opening = {
	id: string;
	slug: string;
	title: string;
	location: string;
	employmentType: string;
	summary: string;
	description: string;
	responsibilities: string | null;
	requirements: string | null;
	niceToHave: string | null;
	salaryRange: string | null;
	applyEmail: string;
	opensOn: string | null;
	closesOn: string | null;
	status: "draft" | "scheduled" | "published" | "closed";
	onWebsite: boolean;
	createdOn: string | null;
};

type Draft = {
	id: string | null;
	title: string;
	location: string;
	employmentType: string;
	summary: string;
	description: string;
	responsibilities: string;
	requirements: string;
	niceToHave: string;
	salaryRange: string;
	applyEmail: string;
	status: Opening["status"];
	opensOn: string;
	closesOn: string;
};

const WEBSITE = (
	(import.meta.env.VITE_LANDING_PAGE_URL as string | undefined)?.trim() || "https://nisccloud.com"
).replace(/\/$/, "");

function toLocalInput(iso: string | null) {
	if (!iso) return "";
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";
	const pad = (value: number) => String(value).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIso(local: string) {
	if (!local) return null;
	const date = new Date(local);
	return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function nairobiTime(local: string) {
	const date = new Date(local);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleString("en-GB", {
		weekday: "long",
		day: "numeric",
		month: "long",
		hour: "2-digit",
		minute: "2-digit",
		timeZone: "Africa/Nairobi",
	});
}

const emptyDraft = (): Draft => ({
	id: null,
	title: "",
	location: "Nairobi, Kenya",
	employmentType: "Full-time",
	summary: "",
	description: "",
	responsibilities: "",
	requirements: "",
	niceToHave: "",
	salaryRange: "",
	applyEmail: "sales@nisccloud.com",
	status: "draft",
	opensOn: "",
	closesOn: "",
});

const STATUS_LABEL: Record<Opening["status"], string> = {
	draft: "Draft",
	scheduled: "Scheduled",
	published: "Published",
	closed: "Closed",
};

function visibilityLabel(role: Opening) {
	if (role.onWebsite) return "On the website";
	if (role.status === "scheduled") return "Hidden until the open date";
	if (role.status === "published" && role.closesOn) return "Hidden because the close date has passed";
	if (role.status === "closed") return "Closed. Applications are kept";
	return "Hidden draft";
}

export default function AgencyCareersPage() {
	const list = trpc.careers.adminList.useQuery();
	const [draft, setDraft] = React.useState<Draft>(emptyDraft);
	const create = trpc.careers.create.useMutation();
	const update = trpc.careers.update.useMutation();
	const remove = trpc.careers.remove.useMutation();
	const formRef = React.useRef<HTMLFormElement>(null);
	const [scheduleOpen, setScheduleOpen] = React.useState(false);
	const saving = create.isPending || update.isPending;

	const set = (key: keyof Draft, value: string | boolean) => {
		setDraft((current) => ({ ...current, [key]: value }));
	};

	async function save(status: Opening["status"]) {
		if (formRef.current && !formRef.current.reportValidity()) return;
		if (status === "scheduled") {
			if (!draft.opensOn) {
				toast.error("Choose the date and time this role should appear.");
				return;
			}
			if (new Date(draft.opensOn).getTime() <= Date.now()) {
				toast.error("Choose a future date and time. Publish shows the role immediately.");
				return;
			}
			if (draft.closesOn && new Date(draft.closesOn).getTime() <= new Date(draft.opensOn).getTime()) {
				toast.error("The closing time has to be after the role appears.");
				return;
			}
		}
		const body = {
			title: draft.title.trim(),
			location: draft.location.trim(),
			employmentType: draft.employmentType.trim(),
			summary: draft.summary.trim(),
			description: draft.description.trim(),
			responsibilities: draft.responsibilities.trim() || null,
			requirements: draft.requirements.trim() || null,
			niceToHave: draft.niceToHave.trim() || null,
			salaryRange: draft.salaryRange.trim() || null,
			applyEmail: draft.applyEmail.trim(),
			status,
			opensOn: status === "scheduled" ? toIso(draft.opensOn) : null,
			closesOn: status === "scheduled" ? toIso(draft.closesOn) : null,
		};
		try {
			if (draft.id) await update.mutateAsync({ id: draft.id, ...body });
			else await create.mutateAsync(body);
			toast.success(
				status === "published"
					? "Published. It is on the website now."
					: status === "scheduled"
						? "Scheduled. It stays hidden until that time."
						: status === "closed"
							? "Closed. Applications are kept."
							: "Draft saved.",
			);
			setDraft(emptyDraft());
			setScheduleOpen(false);
			await list.refetch();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Could not save this role");
		}
	}

	function edit(role: Opening) {
		setDraft({
			id: role.id,
			title: role.title,
			location: role.location,
			employmentType: role.employmentType,
			summary: role.summary,
			description: role.description,
			responsibilities: role.responsibilities ?? "",
			requirements: role.requirements ?? "",
			niceToHave: role.niceToHave ?? "",
			salaryRange: role.salaryRange ?? "",
			applyEmail: role.applyEmail,
			status: role.status,
			opensOn: toLocalInput(role.opensOn),
			closesOn: toLocalInput(role.closesOn),
		});
		setScheduleOpen(role.status === "scheduled");
	}

	async function onRemove(role: Opening) {
		if (!window.confirm(`Remove “${role.title}”?`)) return;
		try {
			await remove.mutateAsync({ id: role.id });
			if (draft.id === role.id) setDraft(emptyDraft());
			toast.success("Role removed");
			await list.refetch();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Could not remove this role");
		}
	}

	return (
		<div className="@container/main flex flex-col gap-4 md:gap-6 px-4 md:px-6 lg:px-8 py-4 md:py-6">
			<div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
				<div>
					<h1 className="text-xl font-semibold">Open roles</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Draft stays private. Scheduled appears on the open date. Published is on the website now. Closed means the vacancy is filled or hiring has stopped, and the applications stay. Remove deletes the role.
					</p>
				</div>

				<form
					ref={formRef}
					onSubmit={(event) => {
						event.preventDefault();
						void save(scheduleOpen ? "scheduled" : "draft");
					}}
					className="grid gap-4 rounded-lg border bg-card p-4 md:p-6"
				>
					<p className="text-sm font-medium">{draft.id ? "Edit role" : "Add a role"}</p>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="grid gap-2">
							<Label htmlFor="career-title">Role</Label>
							<Input id="career-title" value={draft.title} onChange={(event) => set("title", event.target.value)} required />
						</div>
						<div className="grid gap-2">
							<Label htmlFor="career-location">Location</Label>
							<Input id="career-location" value={draft.location} onChange={(event) => set("location", event.target.value)} required />
						</div>
						<div className="grid gap-2">
							<Label htmlFor="career-type">Employment type</Label>
							<Input id="career-type" value={draft.employmentType} onChange={(event) => set("employmentType", event.target.value)} required />
						</div>
						<div className="grid gap-2">
							<Label htmlFor="career-email">Application email</Label>
							<Input id="career-email" type="email" value={draft.applyEmail} onChange={(event) => set("applyEmail", event.target.value)} required />
						</div>
						<div className="grid gap-2 md:col-span-2">
							<Label htmlFor="career-salary">Salary range (optional)</Label>
							<Input
								id="career-salary"
								value={draft.salaryRange}
								onChange={(event) => set("salaryRange", event.target.value)}
								placeholder="KES 120,000 – 180,000 gross per month"
							/>
							<p className="text-xs text-muted-foreground">Shown on the job page and in the Apply bar. Leave empty to hide it.</p>
						</div>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="career-summary">Summary</Label>
						<Textarea id="career-summary" value={draft.summary} onChange={(event) => set("summary", event.target.value)} required rows={3} />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="career-description">About the role</Label>
						<Textarea id="career-description" value={draft.description} onChange={(event) => set("description", event.target.value)} required rows={5} />
					</div>
					<p className="text-xs text-muted-foreground">Put one point per line in the lists below. Each line becomes a bullet on the job page.</p>
					<div className="grid gap-2">
						<Label htmlFor="career-responsibilities">Responsibilities</Label>
						<Textarea id="career-responsibilities" value={draft.responsibilities} onChange={(event) => set("responsibilities", event.target.value)} rows={6} />
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="grid gap-2">
							<Label htmlFor="career-requirements">Requirements</Label>
							<Textarea id="career-requirements" value={draft.requirements} onChange={(event) => set("requirements", event.target.value)} rows={6} />
						</div>
						<div className="grid gap-2">
							<Label htmlFor="career-nice">Nice to have (optional)</Label>
							<Textarea id="career-nice" value={draft.niceToHave} onChange={(event) => set("niceToHave", event.target.value)} rows={6} />
						</div>
					</div>
					<div className="grid gap-3 rounded-xl border bg-muted/30 p-4">
						<p className="text-sm font-medium">What should happen to this role?</p>
						<div className="flex flex-wrap gap-2">
							<Button type="button" variant="outline" disabled={saving} onClick={() => void save("draft")}>
								Save draft
							</Button>
							<Button type="button" disabled={saving} onClick={() => void save("published")}>
								Publish now
							</Button>
							<Button
								type="button"
								variant={scheduleOpen ? "default" : "outline"}
								disabled={saving}
								onClick={() => setScheduleOpen((open) => !open)}
							>
								Schedule
							</Button>
							{draft.id ? (
								<Button type="button" variant="outline" disabled={saving} onClick={() => void save("closed")}>
									Close role
								</Button>
							) : null}
						</div>
						{scheduleOpen ? (
							<div className="grid gap-3 rounded-lg border bg-background p-4">
								<p className="text-sm text-muted-foreground">
									The role stays off the website until the time you choose, then it appears on its own.
								</p>
								<div className="grid gap-3 md:grid-cols-2">
									<div className="grid gap-2">
										<Label htmlFor="career-opens">Appears on</Label>
										<Input id="career-opens" type="datetime-local" value={draft.opensOn} onChange={(event) => set("opensOn", event.target.value)} />
									</div>
									<div className="grid gap-2">
										<Label htmlFor="career-closes">Stops accepting</Label>
										<Input id="career-closes" type="datetime-local" value={draft.closesOn} onChange={(event) => set("closesOn", event.target.value)} />
									</div>
								</div>
								{draft.opensOn ? (
									<p className="text-sm">Appears {nairobiTime(draft.opensOn)} Nairobi time.</p>
								) : (
									<p className="text-sm text-muted-foreground">Choose a date and a time before scheduling.</p>
								)}
								<Button type="submit" disabled={saving || !draft.opensOn}>
									Schedule this role
								</Button>
							</div>
						) : null}
						{draft.id ? (
							<Button type="button" variant="ghost" onClick={() => { setDraft(emptyDraft()); setScheduleOpen(false); }}>
								Cancel editing
							</Button>
						) : null}
					</div>
				</form>

				{list.isLoading ? <p className="text-sm text-muted-foreground">Loading roles…</p> : null}
				{list.error ? <p className="text-sm text-destructive">{list.error.message}</p> : null}

				<ul className="grid gap-3">
					{(list.data ?? []).map((role) => (
						<li key={role.id} className="rounded-lg border bg-card p-4">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<div>
									<p className="font-medium">{role.title}</p>
									<p className="mt-1 text-sm text-muted-foreground">
										{role.location} · {role.employmentType} · {STATUS_LABEL[role.status]} · {visibilityLabel(role)}
									</p>
									<p className="mt-1 text-sm text-muted-foreground">
										{role.opensOn ? `Opens ${role.opensOn}` : "No open date"}
										{" · "}
										{role.closesOn ? `Closes ${role.closesOn}` : "No close date"}
									</p>
									{role.onWebsite ? (
										<a
											className="mt-1 inline-block text-sm underline"
											href={`${WEBSITE}/careers?role=${encodeURIComponent(role.slug)}`}
											target="_blank"
											rel="noopener noreferrer"
										>
											View on the website
										</a>
									) : null}
								</div>
								<div className="flex gap-2">
									<Button type="button" variant="outline" onClick={() => edit(role)}>
										Edit
									</Button>
									<Button type="button" variant="outline" onClick={() => onRemove(role)} disabled={remove.isPending}>
										Remove
									</Button>
								</div>
							</div>
							<p className="mt-3 text-sm">{role.summary}</p>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
