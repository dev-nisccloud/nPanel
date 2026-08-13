"use client";

import * as React from "react";
import { z } from "zod";
import { Globe, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/npanel-ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { subdomainSchema } from "./subdomains-schema";

interface ViewSubdomainSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: z.infer<typeof subdomainSchema> | null;
}

const getPhpVersion = (phpHandlerId: string | undefined) => {
  if (!phpHandlerId) return "N/A";
  // Extract version from handler ID like "plesk-php83-fpm-dedicated"
  const match = phpHandlerId.match(/php(\d+)/);
  return match ? `PHP ${match[1]}` : phpHandlerId;
};

export function ViewSubdomainSheet({ open, onOpenChange, data }: ViewSubdomainSheetProps) {
  if (!data) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader className="mb-6 flex-shrink-0 flex justify-between items-center flex-row">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold">Subdomain Details</SheetTitle>
              <SheetDescription className="text-base">
                View complete subdomain information
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

        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="px-1 pb-6 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>Subdomain configuration details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Subdomain Name</p>
                  <p className="text-base font-bold text-primary">
                    {data.name || "Unknown Subdomain"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Parent Domain</p>
                  <p className="text-base">
                    {data.parent || "N/A"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={data.status === "ok" ? "default" : "destructive"}>
                    {data.status === "ok" ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Security & SSL */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Security & SSL</CardTitle>
                <CardDescription>SSL and security configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">SSL Security</p>
                  <Badge variant={data.properties?.ssl ? "default" : "secondary"}>
                    {data.properties?.ssl ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* PHP Configuration */}
            {(data.properties?.php || data.properties?.php_handler_id) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">PHP Configuration</CardTitle>
                  <CardDescription>PHP settings and handler</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.properties?.php !== undefined && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">PHP Enabled</p>
                      <Badge variant={data.properties.php ? "default" : "secondary"}>
                        {data.properties.php ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  )}

                  {data.properties?.php_handler_id && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">PHP Handler</p>
                      <p className="text-base font-bold text-primary">
                        {getPhpVersion(data.properties.php_handler_id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {data.properties.php_handler_id}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Web Server Features */}
            {(data.properties?.webstat || data.properties?.fastcgi || data.properties?.cgi || data.properties?.perl || data.properties?.python) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Web Server Features</CardTitle>
                  <CardDescription>Additional server features and modules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.properties?.webstat && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Web Statistics</p>
                      <Badge variant="outline">
                        {data.properties.webstat}
                      </Badge>
                    </div>
                  )}

                  {(data.properties?.fastcgi || data.properties?.cgi || data.properties?.perl || data.properties?.python) && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Additional Features</p>
                      <div className="flex flex-wrap gap-2">
                        {data.properties?.fastcgi && (
                          <Badge variant="secondary">FastCGI</Badge>
                        )}
                        {data.properties?.cgi && (
                          <Badge variant="secondary">CGI</Badge>
                        )}
                        {data.properties?.perl && (
                          <Badge variant="secondary">Perl</Badge>
                        )}
                        {data.properties?.python && (
                          <Badge variant="secondary">Python</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
