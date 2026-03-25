"use client";

import { Navigate } from "react-router";

export default function CreativeBriefsRedirectPage() {
  return <Navigate to="/agency/creative-assets?tab=briefs" replace />;
}
