import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Input = forwardRef(({ className, type = "text", ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      "flex h-10 w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 shadow-[0_1px_2px_rgb(18_24_38/0.04)] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-honey-400 focus:ring-4 focus:ring-honey-100 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export default Input;
