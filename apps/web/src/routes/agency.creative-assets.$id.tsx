"use client";

import * as React from "react";
import { useParams } from "react-router";
import { CreativeAssetsDetailPage } from "./agency.creative-assets/_components/creative-assets-detail-page";

export default function CreativeAssetDetail() {
  const params = useParams();
  const id = params.id as string;

  return <CreativeAssetsDetailPage assetId={id} />;
}

