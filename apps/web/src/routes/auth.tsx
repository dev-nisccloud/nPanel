import { Outlet, isRouteErrorResponse } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { AuthRightPanelCarousel } from "@/routes/auth/_components/auth-right-panel-carousel";

export default function Layout() {
  return (
    <main>
      <div className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.92fr)]">
        <div className="relative order-1 flex min-h-dvh flex-col px-6 py-6 sm:px-12">
          <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col">
            <div className="flex flex-1 flex-col justify-center gap-8">
              <img
                src="/nisclogooriginal.png"
                alt="Nisc Cloud"
                width={148}
                height={40}
                className="h-8 w-auto max-w-full self-start"
              />
              <Outlet />
            </div>
            <p className="pt-8 text-left text-xs text-muted-foreground">
            © {new Date().getFullYear()} Nisc Cloud Limited. All rights reserved.{" "}
            <a
              href="https://nisccloud.com/privacy"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Privacy Policy
            </a>
            {" and "}
            <a
              href="https://nisccloud.com/terms"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Terms of Service
            </a>
            </p>
          </div>
        </div>
        <div className="relative order-2 hidden min-h-dvh p-3 lg:block">
          <AuthRightPanelCarousel />
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

