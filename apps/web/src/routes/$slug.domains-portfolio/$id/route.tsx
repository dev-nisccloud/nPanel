"use client";

import { useParams } from "react-router";

import { DomainDetailPage } from "../_components/domain-detail-page";

export default function DomainDetail() {
  const { id } = useParams();
  if (!id) return null;
  return <DomainDetailPage domainId={id} />;
}
