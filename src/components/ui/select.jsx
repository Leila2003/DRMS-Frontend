import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

const Select = forwardRef(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full appearance-none px-3.5 py-2 pr-9 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 shadow-[0_1px_2px_rgb(18_24_38/0.04)] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-honey-400 focus:ring-4 focus:ring-honey-100 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
  </div>
));
Select.displayName = "Select";

export default Select;
