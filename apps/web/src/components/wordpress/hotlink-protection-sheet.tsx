"use client";

import * as React from "react";
import { Link2, Plus, RotateCcw, Trash2, XIcon } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { trpc } from "@/utils/trpc";

interface HotlinkProtectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installationId: number;
}

export function HotlinkProtectionSheet({
  open,
  onOpenChange,
  installationId,
}: HotlinkProtectionSheetProps) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.plesk.wpFeatures.getHotlinkProtectionSettings.useQuery(
    { installationId },
    { enabled: open },
  );

  const [domains, setDomains] = React.useState<string[]>([]);
  const [extensions, setExtensions] = React.useState<string[]>([]);
  const [domainInput, setDomainInput] = React.useState("");
  const [extInput, setExtInput] = React.useState("");

  React.useEffect(() => {
    if (data?.data) {
      setDomains(data.data.domains ?? []);
      setExtensions(data.data.fileExtensions ?? []);
    }
  }, [data]);

  const updateMutation = trpc.plesk.wpFeatures.updateHotlinkProtectionSettings.useMutation({
    onSuccess: () => {
      toast.success("Hotlink protection settings saved");
      utils.plesk.wpFeatures.getHotlinkProtectionSettings.invalidate({ installationId });
      utils.plesk.wordpress.getById.invalidate({ id: installationId });
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const resetMutation = trpc.plesk.wpFeatures.resetHotlinkProtectionSettings.useMutation({
    onSuccess: () => {
      toast.success("Hotlink settings reset to defaults");
      utils.plesk.wpFeatures.getHotlinkProtectionSettings.invalidate({ installationId });
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const addDomain = () => {
    const v = domainInput.trim();
    if (!v) return;
    setDomains((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setDomainInput("");
  };

  const addExtension = () => {
    const v = extInput.trim().replace(/^\./, "").toLowerCase();
    if (!v) return;
    setExtensions((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setExtInput("");
  };

  const applyDefaults = () => {
    const d = data?.data;
    if (!d) return;
    setDomains(d.defaultDomains ?? []);
    setExtensions(d.defaultFileExtensions ?? []);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="mb-6 flex-shrink-0 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Link2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold">Hotlink protection</SheetTitle>
              <SheetDescription className="text-base">
                Allow listed sites to embed your media. Domains are validated server-side (hostname
                only).
              </SheetDescription>
            </div>
          </div>
          <SheetClose asChild>
            <Button
              size="icon"
              variant="ghost"
              className="p-0 m-0 size-auto hover:bg-transparent"
            >
              <XIcon className="size-5" />
            </Button>
          </SheetClose>
        </SheetHeader>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0 pr-4">
            <div className="px-1 pb-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Allowed domains</CardTitle>
                  <CardDescription>
                    Hostnames that may hotlink your protected files (e.g. example.com).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="example.com"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDomain())}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addDomain}
                      aria-label="Add domain"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[2rem]">
                    {domains.map((d) => (
                      <Badge key={d} variant="secondary" className="gap-1 pr-1 py-1">
                        {d}
                        <button
                          type="button"
                          className="rounded-sm p-0.5 hover:bg-muted"
                          onClick={() => setDomains((prev) => prev.filter((x) => x !== d))}
                          aria-label={`Remove ${d}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {domains.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No domains added yet.</p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Protected file extensions</CardTitle>
                  <CardDescription>File types protected from hotlinking.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="png"
                      value={extInput}
                      onChange={(e) => setExtInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addExtension())
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={addExtension}
                      aria-label="Add extension"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[2rem]">
                    {extensions.map((ext) => (
                      <Badge key={ext} variant="outline" className="gap-1 pr-1 py-1">
                        .{ext}
                        <button
                          type="button"
                          className="rounded-sm p-0.5 hover:bg-muted"
                          onClick={() => setExtensions((prev) => prev.filter((x) => x !== ext))}
                          aria-label={`Remove .${ext}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {extensions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No extensions configured.</p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        )}

        <SheetFooter className="flex-shrink-0 flex-col gap-2 sm:flex-col border-t border-border/60 pt-4 mt-4">
          <Button
            type="button"
            className="w-full"
            disabled={updateMutation.isPending || isLoading}
            onClick={() =>
              updateMutation.mutate({
                installationId,
                domains,
                fileExtensions: extensions,
              })
            }
          >
            {updateMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Spinner size={16} />
                Saving…
              </span>
            ) : (
              "Save settings"
            )}
          </Button>
          <div className="flex w-full gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={applyDefaults}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Use defaults
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              disabled={resetMutation.isPending}
              onClick={() => resetMutation.mutate({ installationId })}
            >
              Reset on server
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
