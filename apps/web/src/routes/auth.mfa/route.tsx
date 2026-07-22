"use client";

import { Globe } from "lucide-react";
import { Link, useNavigate } from "react-router";

import { APP_CONFIG } from "@/config/app-config";
import { authPathWithRedirect, redirectToTarget } from "@/lib/auth-redirect";
import { MfaVerifyStep } from "@/routes/auth/_components/mfa-verify-step";

export default function MfaVerifyPage() {
  const navigate = useNavigate();
  const loginHref = authPathWithRedirect("/auth/login");

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <MfaVerifyStep
          bootstrapOnMount
          onVerified={() => redirectToTarget(0, navigate)}
        />
      </div>

      <div className="absolute top-5 flex w-full justify-end px-10">
        <div className="text-muted-foreground text-sm">
          <Link className="text-foreground" to={loginHref}>
            Back to Login
          </Link>
        </div>
      </div>

      <div className="absolute bottom-5 flex w-full justify-between px-10">
        <div className="text-sm">{APP_CONFIG.copyright}</div>
        <div className="flex items-center gap-1 text-sm">
          <Globe className="size-4 text-muted-foreground" />
          ENG
        </div>
      </div>
    </>
  );
}
