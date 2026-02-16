"use client";

import * as React from "react";
import { trpc } from "@/utils/trpc";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Info, Settings, Construction } from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/shadcn-io/spinner";

interface ETimsInitializationGuardProps {
    children: React.ReactNode;
}

export function ETimsInitializationGuard({ children }: ETimsInitializationGuardProps) {
    // Check global configuration (teamId: null)
    const { data: configStatus, isLoading } = trpc.etims.auth.getConfiguration.useQuery(
        { teamId: null }
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
                <Spinner size={32} />
                <p className="text-muted-foreground mt-4 text-sm">Checking eTIMS status...</p>
            </div>
        );
    }

    if (!configStatus?.isInitialized) {
        return (
            <div className="flex flex-col items-center justify-center p-4 md:p-12 min-h-[60vh]">
                <Card className="w-full max-w-md shadow-lg border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-amber-100 dark:bg-amber-900/40 p-3 rounded-full mb-4 w-fit">
                            <Construction className="h-8 w-8 text-amber-600 dark:text-amber-500" />
                        </div>
                        <CardTitle className="text-xl text-amber-900 dark:text-amber-100">Device Not Initialized</CardTitle>
                        <CardDescription className="text-amber-700 dark:text-amber-400">
                            eTIMS features are unavailable.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-sm text-amber-800 dark:text-amber-300">
                            You must initialize your eTIMS Virtual Sales Control Unit (VSCU/OSCU) before accessing this dashboard.
                        </p>
                        <Alert className="text-left bg-white/50 dark:bg-black/20 border-amber-200/50">
                            <Info className="h-4 w-4 text-amber-600" />
                            <AlertTitle className="text-amber-800 dark:text-amber-300 text-sm">Required Action</AlertTitle>
                            <AlertDescription className="text-amber-700 dark:text-amber-400 text-xs">
                                Go to Settings to configure your KRA PIN and initialize your device.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="justify-center pt-2 pb-6">
                        <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-md">
                            <Link href="/agency/kra-etims/settings">
                                <Settings className="mr-2 h-4 w-4" />
                                Configure eTIMS Now
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}
