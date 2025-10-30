import { redirect } from "next/navigation";
import { redirectIfAuthenticated } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function HomeResolver() {
  // If authenticated, this will redirect to the correct dashboard
  await redirectIfAuthenticated();

  // Not authenticated -> go to login
  redirect("/auth/login");
}


