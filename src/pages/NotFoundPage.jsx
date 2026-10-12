import { Link } from "react-router-dom";
import { LogoMark } from "../components/Logo";

export default function NotFoundPage() {
  return (
    <div className="honeycomb grid min-h-screen place-items-center bg-slate-950 p-6 text-center">
      <div>
        <LogoMark className="mx-auto h-14 w-14" />
        <p className="mt-8 text-[96px] font-extrabold leading-none tracking-[-0.05em] text-white">
          4<span className="text-honey-400">0</span>4
        </p>
        <p className="mt-4 text-[15px] font-medium text-slate-400">
          This page doesn&apos;t exist — it may have been moved or returned.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex h-11 items-center rounded-xl bg-honey-400 px-5 text-sm font-bold text-slate-900 transition hover:bg-honey-300"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
