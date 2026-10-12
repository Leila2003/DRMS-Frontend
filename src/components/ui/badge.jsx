import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full py-0.5 pl-2 pr-2.5 text-xs font-semibold capitalize ring-1 ring-inset before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:content-['']",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-600 ring-slate-500/15",
        primary: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
        success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
        danger: "bg-rose-50 text-rose-700 ring-rose-600/20",
        purple: "bg-purple-50 text-purple-700 ring-purple-600/20",
        outline: "text-slate-600 ring-slate-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export default function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
