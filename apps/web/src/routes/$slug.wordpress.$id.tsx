"use client";

import { Outlet, useLocation, useParams } from "react-router";

import { WordPressDetailPage } from "@/components/wordpress/detail/wordpress-detail-page";

export default function WordPressDetail() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const teamSlug = pathname.split("/")[1] ?? "";
  if (!id) return null;
  return (
    <>
      <WordPressDetailPage
        installationId={id}
        backTo={`/${teamSlug}/hosting`}
        backLabel="Back to hosting"
      />
      <Outlet />
    </>
  );
}
