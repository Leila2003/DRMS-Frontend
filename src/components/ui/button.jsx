import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-honey-200 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-white shadow-[0_1px_2px_rgb(18_24_38/0.2),inset_0_1px_0_rgb(255_255_255/0.08)] hover:bg-slate-800",
        primary:
          "bg-honey-400 text-slate-900 shadow-[0_1px_2px_rgb(161_98_7/0.25),inset_0_1px_0_rgb(255_255_255/0.35)] hover:bg-honey-300",
        outline:
          "border border-slate-200 bg-white text-slate-700 shadow-[0_1px_2px_rgb(18_24_38/0.04)] hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        destructive: "bg-rose-600 text-white shadow-[0_1px_2px_rgb(180_35_24/0.3)] hover:bg-rose-700",
        subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-[15px]",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export default Button;
