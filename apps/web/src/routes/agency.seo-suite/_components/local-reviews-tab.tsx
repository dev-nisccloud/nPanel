"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { toast } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import { useCredentialsConfigured } from "./credentials-banner";
import {
  asArray,
  asRecord,
  CREDENTIALS_TOAST,
  formatNumber,
  getNested,
  type SeoProject,
} from "./seo-suite-utils";

interface LocalReviewsTabProps {
  projectId: string;
  project: SeoProject;
}

export function LocalReviewsTab({ projectId, project }: LocalReviewsTabProps) {
  const { configured } = useCredentialsConfigured();
  const [query, setQuery] = React.useState(`${project.name} ${project.locationName}`);
  const [placeId, setPlaceId] = React.useState("");
  const [listings, setListings] = React.useState<unknown[]>([]);
  const [reviewsTask, setReviewsTask] = React.useState<string | null>(null);

  const search = trpc.seoSuite.businessListings.useMutation({
    onSuccess: (data) => {
      const items = asArray(getNested(data.items, "0.items") ?? data.items);
      const flattened =
        items.length && asRecord(items[0]).items
          ? asArray(asRecord(items[0]).items)
          : items;
      setListings(flattened);
      toast.success(`Found ${flattened.length} listings`);
    },
    onError: (e) => toast.error(e.message || "Business listings failed"),
  });

  const reviews = trpc.seoSuite.googleReviews.useMutation({
    onSuccess: (data) => {
      setReviewsTask(data.taskId);
      toast.success(
        data.taskId
          ? `Reviews task posted: ${data.taskId}`
          : "Reviews task posted (no task id returned)",
      );
    },
    onError: (e) => toast.error(e.message || "Google reviews failed"),
  });

  const guard = (fn: () => void) => {
    if (!configured) {
      toast.error(CREDENTIALS_TOAST);
      return;
    }
    fn();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs text-muted-foreground">Business search</label>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Button
          disabled={search.isPending || !query.trim()}
          onClick={() => guard(() => search.mutate({ projectId, query: query.trim() }))}
        >
          {search.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Searching…
            </>
          ) : (
            "Search listings"
          )}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Title</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Place ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Search for local business listings
                </TableCell>
              </TableRow>
            ) : (
              listings.slice(0, 30).map((item, i) => {
                const r = asRecord(item);
                const pid = String(r.place_id ?? getNested(r, "cid") ?? "");
                return (
                  <TableRow
                    key={i}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => pid && setPlaceId(pid)}
                  >
                    <TableCell className="pl-6 font-medium">
                      {String(r.title ?? r.name ?? "—")}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {String(r.address ?? getNested(r, "address_info.address") ?? "—")}
                    </TableCell>
                    <TableCell>
                      {formatNumber(getNested(r, "rating.value") ?? r.rating)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[140px]">
                      {pid || "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs text-muted-foreground">Google Place ID</label>
          <Input
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            placeholder="Select a listing or paste place_id"
          />
        </div>
        <Button
          variant="outline"
          disabled={reviews.isPending || !placeId.trim()}
          onClick={() =>
            guard(() => reviews.mutate({ projectId, placeId: placeId.trim() }))
          }
        >
          {reviews.isPending ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Posting…
            </>
          ) : (
            "Fetch reviews"
          )}
        </Button>
      </div>

      {reviewsTask && (
        <p className="text-xs text-muted-foreground">
          Reviews task queued: <code>{reviewsTask}</code>. Results arrive asynchronously from
          DataForSEO.
        </p>
      )}
    </div>
  );
}
