import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98]",
				destructive:
					"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-[0.98]",
				outline:
					"border border-border bg-background hover:bg-muted hover:text-accent-foreground active:scale-[0.98]",
				secondary:
					"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:scale-[0.98]",
				ghost: "hover:bg-muted hover:text-accent-foreground",
				link: "text-primary underline-offset-4 hover:underline",
				success:
					"bg-success text-success-foreground shadow-sm hover:bg-success/90 active:scale-[0.98]",
				warning:
					"bg-warning text-warning-foreground shadow-sm hover:bg-warning/90 active:scale-[0.98]",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-8 rounded-md px-3 text-xs",
				lg: "h-12 rounded-lg px-8 text-base",
				xl: "h-14 rounded-xl px-10 text-lg",
				icon: "h-10 w-10",
				"icon-sm": "h-8 w-8",
				"icon-lg": "h-12 w-12",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	isLoading?: boolean;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant,
			size,
			asChild = false,
			isLoading = false,
			leftIcon,
			rightIcon,
			children,
			disabled,
			...props
		},
		ref,
	) => {
		// When asChild is true, we render the Slot component which merges props onto its child
		// We should NOT wrap children in fragments or add icons when using asChild
		// because the child element (e.g., Link) should control its own content
		if (asChild) {
			return (
				<Slot
					className={cn(buttonVariants({ variant, size, className }))}
					ref={ref}
					{...props}
				>
					{children}
				</Slot>
			);
		}

		// For regular buttons, we can add loading spinners and icons
		return (
			<button
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				disabled={disabled || isLoading}
				{...props}
			>
				{isLoading ? (
					<>
						<Loader2 className="animate-spin" />
						{children}
					</>
				) : (
					<>
						{leftIcon}
						{children}
						{rightIcon}
					</>
				)}
			</button>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
