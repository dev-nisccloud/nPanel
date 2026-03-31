import { Outlet, isRouteErrorResponse } from "react-router";
import { APP_CONFIG } from "@/config/app-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { AuthRightPanelCarousel } from "@/routes/auth/_components/auth-right-panel-carousel";

export default function Layout() {
  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="relative order-2 hidden h-full overflow-hidden rounded-3xl lg:flex">
          <AuthRightPanelCarousel />
          <div className="absolute top-10 z-20 space-y-1 px-10 text-black">
            <img
              src="/nisclogooriginal.png"
              alt={`${APP_CONFIG.name} Logo`}
              width={180}
              height={60}
              className="h-15 w-auto max-w-full"
            />
          </div>
        </div>
        <div className="relative order-1 flex h-full">
          <Outlet />
        </div>
      </div>
    </main>
  );
}

export function ErrorBoundary({ error }: { error: any }) {
  let message = "An error occurred while processing your request";
  let details = "Please try again or contact support if the problem persists.";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      details = "The page you are looking for does not exist.";
    } else {
      details = error.statusText || details;
    }
  } else if (error instanceof Error) {
    details = error.message;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-center">Something went wrong</CardTitle>
          <CardDescription className="text-center">{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">{details}</p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/auth/login")}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

