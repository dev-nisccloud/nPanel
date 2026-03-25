import AgencyLayout from "./agency/_components/agency-layout";
import { Outlet, isRouteErrorResponse } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function AgencyRouteLayout() {
  return (
    <AgencyLayout>
      <Outlet />
    </AgencyLayout>
  );
}

export function ErrorBoundary({ error }: { error: any }) {
  let message = "An error occurred in the Agency Dashboard";
  let details = "Please try again or contact support if the problem persists.";

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      details = "The page you are looking for does not exist in the Agency section.";
    } else {
      details = error.statusText || details;
    }
  } else if (error instanceof Error) {
    details = error.message;
  }

  return (
    <div className="flex h-full items-center justify-center p-4 bg-muted/20">
      <Card className="w-full max-w-md shadow-lg border-red-100 dark:border-red-900">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-center text-red-600 dark:text-red-400">Application Error</CardTitle>
          <CardDescription className="text-center font-medium mt-1">{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-100 dark:border-red-900/30">
            <p className="text-center text-sm font-mono text-red-700 dark:text-red-300 break-words">{details}</p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={() => window.location.reload()} className="w-full bg-red-600 hover:bg-red-700 text-white">
              Retry Page
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/agency/dashboard")}
              className="w-full"
            >
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
