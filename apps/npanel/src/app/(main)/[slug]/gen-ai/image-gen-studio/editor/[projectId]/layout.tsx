import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireRole, verifyTeamAccess } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function CustomerEditorLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ slug: string; projectId: string }>;
}>) {
  const { slug } = await params;

  // Server-side auth check
  await requireRole(["CUSTOMER"]);

  // Verify user has access to this team
  const team = await verifyTeamAccess(slug);

  if (!team) {
    redirect("/create-team");
  }

  return <div className="h-screen w-screen overflow-hidden">{children}</div>;
}


