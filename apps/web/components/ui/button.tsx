import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-sky-600 text-white shadow-sm hover:bg-sky-500",
        secondary:
          "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50",
        ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
        outline:
          "bg-transparent text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-sm",
        lg: "h-12 px-5 text-base",
        icon: "h-11 w-11",
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
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      type={type}
      {...props}
    />
  ),
);

Button.displayName = "Button";

export { Button, buttonVariants };

