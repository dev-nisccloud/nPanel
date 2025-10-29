"use client";

import React from "react";

interface OpenURLProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

export function OpenURL({ href, className, children }: OpenURLProps) {
  const handleClick = () => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={className}
    >
      {children}
    </button>
  );
}
