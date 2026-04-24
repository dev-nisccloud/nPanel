"use client";

import { Outlet, useParams } from "react-router";

import { HostingDetailPage } from "./$slug.emails/_components/hosting-detail-page";

export default function EmailsHostingDetail() {
  const { id } = useParams();
  if (!id) return null;
  return (
    <>
      <HostingDetailPage subscriptionId={id} />
      <Outlet />
    </>
  );
}
