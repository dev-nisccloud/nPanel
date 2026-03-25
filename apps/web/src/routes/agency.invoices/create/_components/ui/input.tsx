import { type InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, ...props }, ref) => (
    <div
      className={`flex  items-center relative ${
        label ? "h-[52px]" : "h-[42px]"
      }`}
    >
      {label && (
        <label
          htmlFor={label}
          className="block text-sm font-medium leading-6 text-gray-900 whitespace-nowrap"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        {...props}
        name={label}
        id={label}
        className={`peer block w-full border-0 border-none outline-none bg-transparent py-1.5 text-gray-900 focus:ring-0 focus:outline-none sm:text-sm sm:leading-6 ${
          label ? "text-right" : "p-0"
        }  placeholder:text-neutral-700/40 placeholder:font-medium caret-orange-500 ${
          props.readOnly || props.disabled ? "bg-gray-50 cursor-not-allowed opacity-70" : ""
        }`}
        style={{ border: "none", outline: "none" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 border-t border-gray-300 peer-hover:border-neutral-400 peer-focus:border-t peer-focus:border-orange-500 border-dashed"
        aria-hidden="true"
      />
    </div>
  )
);

Input.displayName = "Input";

export { Input };
