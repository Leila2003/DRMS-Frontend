import { Card } from "./ui/card";
import { cn } from "../lib/utils";

// `featured` renders the ink/honey hero variant — use it for one headline metric per row.
export default function StatCard({ label, value, icon: Icon, hint, featured = false }) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden p-5",
        featured && "honeycomb border-slate-900 bg-slate-900 text-white"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={cn("text-[13px] font-semibold", featured ? "text-slate-400" : "text-slate-500")}>
          {label}
        </p>
        {Icon && (
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              featured ? "bg-honey-400 text-slate-900" : "bg-honey-50 text-honey-700 ring-1 ring-inset ring-honey-200/70"
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-4 truncate text-[28px] font-extrabold leading-none tracking-[-0.03em] tabular-nums",
          featured ? "text-white" : "text-slate-900"
        )}
      >
        {value}
      </p>
      {hint && (
        <p className={cn("mt-2 text-xs font-medium", featured ? "text-honey-300" : "text-slate-500")}>
          {hint}
        </p>
      )}
    </Card>
  );
}
