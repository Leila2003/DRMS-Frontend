import { cn } from "../../lib/utils";

export function Table({ className, ...props }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("min-w-full text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }) {
  return (
    <thead
      className={cn("border-b border-slate-200 bg-slate-50/80 text-left text-[11px] uppercase tracking-[0.08em] text-slate-500", className)}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn("divide-y divide-slate-100", className)} {...props} />;
}

export function TableRow({ className, ...props }) {
  return <tr className={cn("transition-colors hover:bg-honey-50/50", className)} {...props} />;
}

export function TableHead({ className, ...props }) {
  return <th className={cn("px-5 py-3 font-semibold", className)} {...props} />;
}

export function TableCell({ className, ...props }) {
  return <td className={cn("px-5 py-3.5 text-slate-600", className)} {...props} />;
}
