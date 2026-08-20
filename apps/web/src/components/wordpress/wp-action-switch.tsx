"use client";

import type { ComponentProps } from "react";
import { Switch } from "@/components/ui/switch";

export function isPendingField(
  mutation: { isPending: boolean; variables?: object },
  key: string,
) {
  return Boolean(
    mutation.isPending &&
      mutation.variables &&
      Object.prototype.hasOwnProperty.call(mutation.variables, key),
  );
}

export function WpActionSwitch({
  loading,
  ...props
}: ComponentProps<typeof Switch> & { loading?: boolean }) {
  return <Switch {...props} loading={loading} />;
}
