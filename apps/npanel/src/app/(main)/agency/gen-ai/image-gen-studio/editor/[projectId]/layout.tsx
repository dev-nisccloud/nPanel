import { ReactNode } from "react";
import { requireAuth } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function EditorLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireAuth();

  // Agency layout already provides the structure, just return children
  // The editor component will handle its own layout within the agency layout's content area
  return <div className="h-full w-full overflow-hidden -m-4 md:-m-6">{children}</div>;
}








