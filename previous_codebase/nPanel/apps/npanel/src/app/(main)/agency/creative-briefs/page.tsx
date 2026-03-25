import { redirect } from "next/navigation";

export default function CreativeBriefsRedirectPage() {
  redirect("/agency/creative-assets?tab=briefs");
}
