import { cn } from "@nPanel/ui/cn";
import { Input as BaseInput, type InputProps } from "@nPanel/ui/input";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

interface CustomInputProps extends InputProps {
  name: string;
  className?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export function Input({ className, name, onBlur, onFocus, ...props }: CustomInputProps) {
  const { register, watch } = useFormContext();
  const [isFocused, setIsFocused] = useState(false);
  const fieldName = name;
  const fieldValue = watch(fieldName);

  const { ref, ...rest } = register(fieldName, {
    valueAsNumber: (props as any).type === "number",
  });

  const isPlaceholder = !fieldValue && !isFocused;

  return (
    <div className="relative">
      <BaseInput
        {...props}
        {...rest}
        ref={ref}
        autoComplete="off"
        value={fieldValue || ""}
        className={cn(
          "border-0 p-0 h-6 border-b border-transparent focus:border-border font-mono text-xs",
          isPlaceholder && "opacity-0",
          className,
        )}
        onFocus={(evt: React.FocusEvent<HTMLInputElement>) => {
          setIsFocused(true);
          onFocus?.(evt);
        }}
        onBlur={(evt: React.FocusEvent<HTMLInputElement>) => {
          setIsFocused(false);
          onBlur?.(evt);
        }}
      />
      {isPlaceholder && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full w-full bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]" />
        </div>
      )}
    </div>
  );
}
