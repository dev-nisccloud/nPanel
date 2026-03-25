"use client";

import * as React from "react";
import { use } from "react";
import { CreativeAssetsDetailPage } from "./agency.creative-assets/_components/creative-assets-detail-page";

interface CreativeAssetDetailProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CreativeAssetDetail({ params }: CreativeAssetDetailProps) {
  const { id } = use(params);

  return <CreativeAssetsDetailPage assetId={id} />;
}

