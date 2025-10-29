import { ReactNode } from "react";

import { requireAuth } from "@/lib/auth-server";

export default async function CreateTeamLayout({ children }: Readonly<{ children: ReactNode }>) {
  // Server-side auth check - allows both CUSTOMER and AGENCY users
  // This is the page where customers without teams are redirected
  await requireAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
