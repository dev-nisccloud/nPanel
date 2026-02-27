import { ReactNode } from "react";
import { requireAuth } from "@/lib/auth-server";
import { EditorBodyScrollLock } from "../../_components/editor-body-scroll-lock";

export const dynamic = "force-dynamic";

export default async function EditorLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await requireAuth();

  // Agency layout already provides the structure, just return children
  // Editor fills the content area; no padding so it uses full width. Flex + min-h-0 so it doesn't scroll.
  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden">
      <EditorBodyScrollLock />
      {children}
    </div>
  );
}








