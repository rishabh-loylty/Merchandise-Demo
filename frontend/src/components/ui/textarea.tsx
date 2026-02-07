import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-lg border bg-background text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none",
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
      textareaSize: {
        default: "px-3 py-2",
        sm: "px-2.5 py-1.5 text-xs min-h-[60px]",
        lg: "px-4 py-3 text-base min-h-[120px]",
      },
    },
    defaultVariants: {
      variant: "default",
      textareaSize: "default",
    },
  }
);

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    VariantProps<typeof textareaVariants> {
  error?: string;
  label?: string;
  helperText?: string;
  showCount?: boolean;
  maxLength?: number;
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      textareaSize,
      error,
      label,
      helperText,
      showCount,
      maxLength,
      autoResize,
      id,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const textareaId = id || React.useId();
    const hasError = !!error;
    const textareaVariant = hasError ? "error" : variant;
    const [internalValue, setInternalValue] = React.useState(value || "");

    React.useEffect(() => {
      setInternalValue(value || "");
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInternalValue(e.target.value);
      onChange?.(e);

      if (autoResize) {
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;
      }
    };

    const currentLength = String(internalValue).length;

    const textareaElement = (
      <div className="relative">
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            textareaVariants({ variant: textareaVariant, textareaSize, className }),
            autoResize && "overflow-hidden"
          )}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
          {...props}
        />
        {showCount && (
          <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">
            {currentLength}
            {maxLength && `/${maxLength}`}
          </div>
        )}
      </div>
    );

    if (!label && !error && !helperText) {
      return textareaElement;
    }

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        {textareaElement}
        {hasError ? (
          <p
            id={`${textareaId}-error`}
            className="text-xs text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : helperText ? (
          <p
            id={`${textareaId}-helper`}
            className="text-xs text-muted-foreground"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea, textareaVariants };
