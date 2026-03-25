"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import type { YourDetails } from "@/routes/agency.invoicing/types";

export const InvoiceHeaderPreview: React.FC<
  YourDetails & { onClick?: (step: string) => void }
> = ({
  yourEmail,
  yourName,
  yourAddress,
  yourCity,
  yourState,
  yourCountry,
  yourLogo,
  yourTaxId,
  yourZip,
  onClick,
}) => (
  <div className="border-b border-dashed">
    {/* Top row: Logo on left, From on right */}
    <div
      className="py-4 px-10 grid grid-cols-2 gap-8 cursor-pointer relative group"
      onClick={() => onClick && onClick("1")}
    >
      {!!onClick && (
        <>
          <ChevronDown className="animate-pulse w-5 h-5 text-orange-500 rotate-[135deg] group-hover:block hidden absolute top-0 left-0" />
          <ChevronDown className="animate-pulse w-5 h-5 text-orange-500 -rotate-[135deg] group-hover:block hidden absolute top-0 right-0" />
          <ChevronDown className="animate-pulse w-5 h-5 text-orange-500 rotate-45 group-hover:block hidden absolute bottom-0 left-0" />
          <ChevronDown className="animate-pulse w-5 h-5 text-orange-500 -rotate-45 group-hover:block hidden absolute bottom-0 right-0 " />
        </>
      )}
      {/* Logo on left */}
      <div className="flex items-start">
        {yourLogo ? (
          <img src={yourLogo} alt="Company Logo" className="h-12 rounded-md" />
        ) : (
          <div className="rounded-md bg-neutral-100 h-12 w-24 animate-pulse" />
        )}
      </div>
      {/* From details on right */}
      <div className="text-right">
        <p className="text-[11px] text-neutral-400 font-semibold uppercase pb-3.5">
          From
        </p>
        {yourName ? (
          <p className="text-2xl font-medium">{yourName}</p>
        ) : (
          <div className="rounded-md bg-neutral-100 h-5 w-5/6 ml-auto animate-pulse mb-4" />
        )}
        {yourEmail ? (
          <p className="text-neutral-500/90 text-sm mb-3">{yourEmail}</p>
        ) : (
          <div className="rounded-md bg-neutral-100 h-4 w-4/6 ml-auto animate-pulse my-2" />
        )}
        <div className="text-xs text-neutral-500/80 text-right">
          {yourAddress ? (
            <p>{yourAddress}</p>
          ) : (
            <div className="rounded-md bg-neutral-100 h-4 w-3/6 ml-auto animate-pulse my-2" />
          )}
          {yourAddress || yourState || yourZip ? (
            <p className="mb-0.5">
              {yourCity}, {yourState} {yourZip}
            </p>
          ) : (
            <div className="rounded-md bg-neutral-100 h-4 w-4/6 ml-auto animate-pulse my-3" />
          )}
          {yourCountry ? (
            <p className="mb-1">{yourCountry}</p>
          ) : (
            <div className="rounded-md bg-neutral-100 h-4 w-3/6 ml-auto animate-pulse my-2" />
          )}
          {yourTaxId && <p>Tax ID:{yourTaxId}</p>}
        </div>
      </div>
    </div>
    {/* Separator with INVOICE in the middle */}
    <div className="px-10 py-3 flex items-center">
      <div className="flex-1 border-t border-dashed border-gray-300" />
      <span className="px-4 text-sm font-semibold text-gray-700 uppercase">
        Invoice
      </span>
      <div className="flex-1 border-t border-dashed border-gray-300" />
    </div>
  </div>
);


