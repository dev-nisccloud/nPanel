import { ReactNode } from "react";
export const dynamic = "force-dynamic";

import Image from "next/image";

import { Separator } from "@/components/ui/separator";
import { APP_CONFIG } from "@/config/app-config";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  // Note: Middleware already handles redirecting authenticated users away from auth pages
  // No need to call redirectIfAuthenticated() here as it conflicts with middleware
  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="bg-primary relative order-2 hidden h-full rounded-3xl lg:flex">
          <div className="text-primary-foreground absolute top-10 space-y-1 px-10">
            <Image
              src="/nisclogowhite.png"
              alt={`${APP_CONFIG.name} Logo`}
              width={300}
              height={100}
              className="h-auto w-auto"
              style={{ width: "auto", height: "auto", maxWidth: "100%" }}
              priority
            />
            {/* <h1 className="text-2xl font-medium">{APP_CONFIG.name}</h1>
            <p className="text-sm">Design. Build. Launch. Repeat.</p> */}
          </div>

          <div className="absolute bottom-10 flex w-full justify-between px-10">
            <div className="text-primary-foreground flex-1 space-y-1">
              <h2 className="font-medium">Manage your cloud.</h2>
              <p className="text-sm">
                Control your hosting, emails, VPS, and digital marketing all in one dashboard.
              </p>
            </div>
            <Separator orientation="vertical" className="mx-3 !h-auto" />
            <div className="text-primary-foreground flex-1 space-y-1">
              <h2 className="font-medium">Need help?</h2>
              <p className="text-sm">
                For support, reach out via +254748777666 or email us at support@nisccloud.com
              </p>
            </div>
          </div>
        </div>
        <div className="relative order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}
