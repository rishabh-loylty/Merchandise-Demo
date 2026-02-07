import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-lg border bg-background text-sm text-foreground transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-border focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        error:
          "border-destructive focus-visible:border-destructive focus-visible:ring-2 focus-visible:ring-destructive/20",
        success:
          "border-success focus-visible:border-success focus-visible:ring-2 focus-visible:ring-success/20",
        ghost:
          "border-transparent bg-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
      },
      inputSize: {
        default: "h-10 px-3 py-2",
        sm: "h-8 px-2.5 py-1.5 text-xs",
        lg: "h-12 px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  label?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant,
      inputSize,
      leftIcon,
      rightIcon,
      error,
      label,
      helperText,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const hasError = !!error;
    const inputVariant = hasError ? "error" : variant;

    const inputElement = (
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            inputVariants({ variant: inputVariant, inputSize, className }),
            leftIcon && "pl-10",
            rightIcon && "pr-10"
          )}
          ref={ref}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {rightIcon && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </div>
        )}
      </div>
    );

    if (!label && !error && !helperText) {
      return inputElement;
    }

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        {inputElement}
        {hasError ? (
          <p
            id={`${inputId}-error`}
            className="text-xs text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={`${inputId}-helper`}
            className="text-xs text-muted-foreground"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
