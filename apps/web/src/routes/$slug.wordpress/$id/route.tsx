"use client";

import { useParams } from "react-router";

import { WordPressDetailPage } from "../_components/wordpress-detail-page";

export default function WordPressDetail() {
  const { id } = useParams();
  if (!id) return null;
  return <WordPressDetailPage installationId={id} />;
}
