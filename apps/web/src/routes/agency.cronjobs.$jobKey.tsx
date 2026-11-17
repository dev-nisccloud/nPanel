"use client";

import * as React from "react";
import { useNavigate, useParams } from "react-router";

/** Legacy URL `/hq/cronjobs/:jobKey`   workflows now live under saved runs. */
export default function AgencyCronJobLegacyJobKeyRedirect() {
  const navigate = useNavigate();
  const params = useParams();
  const jobKey = (params as { jobKey?: string }).jobKey;

  React.useEffect(() => {
    navigate("/hq/cronjobs", { replace: true, state: { legacyJobKey: jobKey } });
  }, [navigate, jobKey]);

  return null;
}

