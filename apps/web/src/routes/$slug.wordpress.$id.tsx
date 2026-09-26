"use client";

import { Outlet, useLocation, useParams, useSearchParams } from "react-router";

import { WordPressDetailPage } from "@/components/wordpress/detail/wordpress-detail-page";
import { resolveHostingWordPressReturnTo } from "@/components/wordpress/wordpress-return-to";

export default function WordPressDetail() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const teamSlug = pathname.split("/")[1] ?? "";
  const hostingReturnTo = resolveHostingWordPressReturnTo(searchParams.get("returnTo"));
  if (!id) return null;
  return (
    <>
      <WordPressDetailPage
        installationId={id}
        backTo={hostingReturnTo ?? `/${teamSlug}/wordpress`}
        backLabel={hostingReturnTo ? "Back to hosting" : "Back to WordPress"}
      />
      <Outlet />
    </>
  );
}
