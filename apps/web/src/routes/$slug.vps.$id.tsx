import { useParams } from "react-router";
import { VpsDetailPage } from "./agency.vps/_components/vps-detail-page";
import React, { Component, ErrorInfo, ReactNode } from "react";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("CRITICAL RENDERING ERROR:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', border: '1px solid red', margin: '20px', backgroundColor: '#fff' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Something went wrong in VpsDetailPage.</h2>
          <p style={{ fontWeight: 'bold' }}>{this.state.error?.message}</p>
          <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '300px', backgroundColor: '#f5f5f5', padding: '10px' }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function VpsDetailRoute() {
  const { slug, id } = useParams();

  if (!id) {
    return (
      <div style={{ padding: "50px", backgroundColor: "#fff" }}>
        <h1>Device ID is missing from URL</h1>
      </div>
    );
  }

  const teamSlug = typeof slug === "string" ? slug : "";
  const vpsListPath = teamSlug ? `/${teamSlug}/vps` : "/agency/vps";
  const subscriptionsPathPrefix = teamSlug ? `/${teamSlug}/subscriptions` : "/agency/subscriptions";

  return (
    <ErrorBoundary>
      <VpsDetailPage
        deviceId={id}
        vpsListPath={vpsListPath}
        subscriptionsPathPrefix={subscriptionsPathPrefix}
        teamHivelocityAccess={
          teamSlug ? { teamSlug, teamResourceCategory: "vps" as const } : null
        }
      />
    </ErrorBoundary>
  );
}
