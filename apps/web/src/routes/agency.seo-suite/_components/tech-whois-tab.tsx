"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { useCredentialsConfigured } from "./credentials-banner";
import {
  asArray,
  asRecord,
  CREDENTIALS_TOAST,
  formatDate,
  getNested,
  type SeoProject,
} from "./seo-suite-utils";

interface TechWhoisTabProps {
  projectId: string;
  project: SeoProject;
}

export function TechWhoisTab({ projectId, project }: TechWhoisTabProps) {
  const { configured } = useCredentialsConfigured();
  const [tech, setTech] = React.useState<unknown>(null);
  const [whois, setWhois] = React.useState<unknown>(null);

  const technologies = trpc.seoSuite.domainTechnologies.useMutation({
    onSuccess: (data) => {
      setTech(data);
      toast.success("Technologies loaded");
    },
    onError: (e) => toast.error(e.message || "Technologies lookup failed"),
  });

  const whoisMut = trpc.seoSuite.domainWhois.useMutation({
    onSuccess: (data) => {
      setWhois(data);
      toast.success("WHOIS loaded");
    },
    onError: (e) => toast.error(e.message || "WHOIS lookup failed"),
  });

  const guard = (fn: () => void) => {
    if (!configured) {
      toast.error(CREDENTIALS_TOAST);
      return;
    }
    fn();
  };

  const techRec = asRecord(tech);
  const technologiesList = asArray(
    getNested(techRec, "technologies") ??
      getNested(techRec, "items") ??
      getNested(techRec, "technologies_by_category"),
  );

  const whoisRec = asRecord(whois);
  const whoisInner = asRecord(
    asArray(whoisRec.items)[0] ?? getNested(whoisRec, "items.0") ?? whoisRec,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={technologies.isPending}
          onClick={() => guard(() => technologies.mutate({ projectId }))}
        >
          {technologies.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Loading…
            </>
          ) : (
            "Load technologies"
          )}
        </Button>
        <Button
          variant="outline"
          disabled={whoisMut.isPending}
          onClick={() => guard(() => whoisMut.mutate({ projectId }))}
        >
          {whoisMut.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Loading…
            </>
          ) : (
            "Load WHOIS"
          )}
        </Button>
        <p className="text-xs text-muted-foreground self-center">{project.primaryDomain}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold">Technologies</h3>
          {!tech ? (
            <p className="text-sm text-muted-foreground">No technology data yet</p>
          ) : technologiesList.length > 0 ? (
            <ul className="space-y-1 text-sm max-h-80 overflow-auto">
              {technologiesList.slice(0, 80).map((item, i) => {
                const r = asRecord(item);
                return (
                  <li key={i} className="border-b border-border/50 py-1.5 last:border-0">
                    <span className="font-medium">
                      {String(r.name ?? r.technology ?? r.category ?? "")}
                    </span>
                    {r.category != null && r.name != null && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {String(r.category)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <pre className="text-xs rounded-lg border bg-muted/40 p-3 overflow-auto max-h-80">
              {JSON.stringify(tech, null, 2)}
            </pre>
          )}
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold">WHOIS</h3>
          {!whois ? (
            <p className="text-sm text-muted-foreground">No WHOIS data yet</p>
          ) : (
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <Row label="Domain" value={String(whoisInner.domain ?? project.primaryDomain)} />
              <Row
                label="Created"
                value={formatDate(
                  whoisInner.created_datetime ?? whoisInner.creation_date ?? whoisInner.created,
                )}
              />
              <Row
                label="Expires"
                value={formatDate(
                  whoisInner.expiration_datetime ??
                    whoisInner.expiration_date ??
                    whoisInner.expires,
                )}
              />
              <Row
                label="Registrar"
                value={String(
                  whoisInner.registrar ??
                    getNested(whoisInner, "registrar.name") ??
                    "",
                )}
              />
              <Row
                label="Nameservers"
                value={
                  Array.isArray(whoisInner.nameservers)
                    ? whoisInner.nameservers.join(", ")
                    : String(whoisInner.nameservers ?? "")
                }
              />
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 py-1.5 last:border-0">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-right font-medium break-all">{value}</dd>
    </div>
  );
}
