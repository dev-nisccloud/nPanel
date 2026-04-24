"use client";

import { Outlet, useParams } from "react-router";

import { WordPressDetailPage } from "./$slug.wordpress/_components/wordpress-detail-page";

export default function WordPressDetail() {
  const { id } = useParams();
  if (!id) return null;
  return (
    <>
      <WordPressDetailPage installationId={id} />
      <Outlet />
    </>
  );
}
