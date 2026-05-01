import { useNodeConnections } from "@xyflow/react";
import { AudioPrimitive } from "./primitive";
import { AudioTransform } from "./transform";

export interface AudioNodeProps {
  type: string;
  data: {
    generated?: {
      url: string;
      type: string;
    };
    content?: {
      url: string;
      type: string;
    };
    model?: string;
    updatedAt?: string;
    instructions?: string;
    width?: number;
    height?: number;
  };
  id: string;
}

export const AudioNode = (props: AudioNodeProps) => {
  const connections = useNodeConnections({
    id: props.id,
    handleType: "target",
  });
  const Component = connections.length ? AudioTransform : AudioPrimitive;

  return <Component {...props} title="Audio" />;
};
