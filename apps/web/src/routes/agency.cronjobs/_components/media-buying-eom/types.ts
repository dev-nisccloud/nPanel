"use client";

export type Product = {
  id: string;
  name: string;
  serviceType: string;
};

export type ProductPlan = {
  id: string;
  name: string;
  pricingModel: string;
  commissionRate?: number | string | null;
};

export type MetaCampaign = {
  id: string;
  name?: string | null;
  status?: string | null;
  start_time?: string | null;
  stop_time?: string | null;
  insights?: { spend?: string | null } | null;
};

export type GoogleAdsAccount = {
  customerId: string;
  accountName?: string | null;
};

export type GoogleCampaign = {
  id: string;
  name?: string | null;
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  insights?: { cost?: string | null } | null;
};

export type LinkedInAdsAccount = {
  id: string;
  name?: string | null;
};

export type LinkedInCampaignGroup = {
  id: string | number;
  name?: string | null;
  status?: string | null;
  created?: string | null;
  insights?: { spend?: number | string | null } | null;
};

export type SelectedLine = {
  id: string;
  name: string;
  spend: number;
};

