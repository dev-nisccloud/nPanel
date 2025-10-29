import { cn } from "../utils";
import { Button, type ButtonProps } from "./button";
import { Spinner } from "./spinner";

export function SubmitButton({
  children,
  isSubmitting,
  disabled,
  className,
  ...props
}: {
  children: React.ReactNode;
  isSubmitting: boolean;
  disabled?: boolean;
  className?: string;
} & Omit<ButtonProps, 'className'>) {
  return (
    <Button
      disabled={isSubmitting || disabled}
      {...props}
      className={cn("relative", className)}
    >
      <span className={cn(isSubmitting && "invisible")}>{children}</span>
      {isSubmitting && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </div>
      )}
    </Button>
  );
}
