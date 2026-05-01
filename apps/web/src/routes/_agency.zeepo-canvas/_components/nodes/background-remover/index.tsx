import { useNodeConnections } from "@xyflow/react";
import { BackgroundRemoverTransform } from "./transform";
import type { ImageNodeProps } from "../image";

export type BackgroundRemoverNodeProps = ImageNodeProps;

export const BackgroundRemoverNode = (props: BackgroundRemoverNodeProps) => {
  return <BackgroundRemoverTransform {...props} title="Background Remover" />;
};
