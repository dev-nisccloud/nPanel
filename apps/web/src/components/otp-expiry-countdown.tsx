"use client";

import { useEffect, useMemo, useState } from "react";

type OtpExpiryCountdownProps = {
  expiresAt: string | null;
  className?: string;
};

function formatRemaining(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function OtpExpiryCountdown({ expiresAt, className }: OtpExpiryCountdownProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  const parsedExpiryMs = useMemo(() => {
    if (!expiresAt) return null;
    const ms = new Date(expiresAt).getTime();
    return Number.isFinite(ms) ? ms : null;
  }, [expiresAt]);

  if (!parsedExpiryMs) return null;

  const remainingSeconds = Math.max(0, Math.ceil((parsedExpiryMs - nowMs) / 1000));
  const isExpired = remainingSeconds <= 0;
  const isCritical = !isExpired && remainingSeconds <= 60;

  const colorClass = isExpired || isCritical
    ? "text-red-600 dark:text-red-400"
    : "text-green-600 dark:text-green-400";

  return (
    <p className={`text-sm font-medium ${colorClass} ${className ?? ""}`.trim()}>
      {isExpired ? "OTP expired. Please resend code." : `OTP expires in ${formatRemaining(remainingSeconds)}`}
    </p>
  );
}
