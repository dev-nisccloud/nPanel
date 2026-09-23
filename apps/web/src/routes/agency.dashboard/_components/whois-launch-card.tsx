"use client";

import { FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowUpRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function sanitizeDomain(raw: string): string {
	return raw
		.trim()
		.toLowerCase()
		.replace(/^https?:\/\//i, "")
		.replace(/\/.*$/, "")
		.replace(/\s/g, "");
}

export function WhoisLaunchCard() {
	const navigate = useNavigate();
	const [domain, setDomain] = useState("");

	const openLookup = (event?: FormEvent) => {
		event?.preventDefault();
		const next = sanitizeDomain(domain);
		navigate(next ? `/agency/whois?domain=${encodeURIComponent(next)}` : "/agency/whois");
	};

	return (
		<section className="flex h-full flex-col rounded-xl border bg-card p-5">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h2 className="text-base font-semibold">Whois lookup</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Check registration, nameservers, and expiry for any domain.
					</p>
				</div>
				<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
					<Search className="size-4" aria-hidden />
				</span>
			</div>

			<form onSubmit={openLookup} className="mt-5 flex flex-col gap-2 sm:flex-row">
				<Input
					value={domain}
					onChange={(event) => setDomain(event.target.value)}
					placeholder="example.co.ke"
					aria-label="Domain to look up"
					autoComplete="off"
					spellCheck={false}
				/>
				<Button type="submit" className="shrink-0">
					Look up
					<ArrowUpRight className="size-4" />
				</Button>
			</form>

			<Button variant="ghost" size="sm" className="mt-auto w-fit px-0" onClick={() => navigate("/agency/whois")}>
				Open full Whois
			</Button>
		</section>
	);
}
