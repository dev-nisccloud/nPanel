import Link from "next/link";
import { redirect } from "next/navigation";

import { ShieldAlert, ShieldBan, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function AccountStatusPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status?.toUpperCase();

  // Redirect if no status provided
  if (!status) {
    redirect("/auth/login");
  }

  // Define status-specific content
  const statusConfig = {
    SUSPENDED: {
      icon: ShieldAlert,
      title: "Account Suspended",
      description: "Your account has been temporarily suspended.",
      message: "Your account access has been temporarily restricted. This may be due to suspicious activity, payment issues, or policy violations.",
      iconColor: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
    BANNED: {
      icon: ShieldBan,
      title: "Account Banned",
      description: "Your account has been permanently banned.",
      message: "Your account has been permanently banned due to severe policy violations. This decision is final unless appealed successfully.",
      iconColor: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950/20",
    },
    DEFAULT: {
      icon: AlertCircle,
      title: "Account Access Restricted",
      description: "Your account status prevents access.",
      message: "Your account is not currently active. Please contact support for more information about your account status.",
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DEFAULT;
  const Icon = config.icon;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <Card className={config.bgColor}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-background">
              <Icon className={`size-8 ${config.iconColor}`} />
            </div>
            <CardTitle className="text-2xl">{config.title}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-center text-sm">
              {config.message}
            </p>

            <div className="space-y-2 rounded-md bg-background p-4">
              <h3 className="font-medium text-sm">Need Help?</h3>
              <div className="text-muted-foreground space-y-1 text-sm">
                <p>
                  <strong>Email:</strong> support@nisccloud.com
                </p>
                <p>
                  <strong>Phone:</strong> +254 748 777 666
                </p>
                <p className="text-xs">
                  Our support team is available Monday - Friday, 8AM - 6PM East African Time
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button asChild>
                <Link href="/auth/login">
                  Back to Login
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

