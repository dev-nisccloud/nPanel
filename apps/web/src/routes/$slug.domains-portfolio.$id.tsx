"use client";

import { Outlet, useParams } from "react-router";

import { DomainDetailPage } from "./$slug.domains-portfolio/_components/domain-detail-page";

export default function DomainDetail() {
  const { id } = useParams();
  if (!id) return null;
  return (
    <>
      <DomainDetailPage domainId={id} />
      <Outlet />
    </>
  );
}
