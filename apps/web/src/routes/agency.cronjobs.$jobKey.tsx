"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router";

/** Legacy URL `/agency/cronjobs/:jobKey` — workflows now live under saved runs. */
export default function AgencyCronJobLegacyJobKeyRedirect() {
  const navigate = useNavigate();
  const params = useParams();
  const jobKey = (params as { jobKey?: string }).jobKey;

  React.useEffect(() => {
    navigate("/agency/cronjobs", { replace: true, state: { legacyJobKey: jobKey } });
  }, [navigate, jobKey]);

  return null;
}

