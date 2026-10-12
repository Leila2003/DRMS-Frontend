// Honeycomb mark: an ink hexagon holding a honey cell.
export function LogoMark({ className = "h-9 w-9" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M20 2 35.6 11v18L20 38 4.4 29V11z" fill="#ffb81f" />
      <path d="M20 10.5 27.8 15v9L20 28.5 12.2 24v-9z" fill="#121826" />
      <path d="M20 16 23 17.75v3.5L20 23l-3-1.75v-3.5z" fill="#ffb81f" />
    </svg>
  );
}

export default function Logo({ inverted = false, subtitle = true }) {
  return (
    <div className="flex items-center gap-3">
      <LogoMark />
      <div className="leading-none">
        <p
          className={`text-[17px] font-extrabold tracking-[-0.03em] ${
            inverted ? "text-white" : "text-slate-900"
          }`}
        >
          DRMS
        </p>
        {subtitle && (
          <p
            className={`mt-1 text-[11px] font-medium ${
              inverted ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Deposit &amp; Rental
          </p>
        )}
      </div>
    </div>
  );
}
