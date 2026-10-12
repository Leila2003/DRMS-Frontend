import { useState } from "react";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { CalendarCheck2, ShieldCheck, Boxes, Eye, EyeOff } from "lucide-react";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";
import { apiErrorMessage } from "../lib/api";
import Spinner from "../components/Spinner";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import Label from "../components/ui/label";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || "/";

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to sign in"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="honeycomb relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-honey-400/20 blur-3xl" />
        <Logo inverted />
        <div className="relative">
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-honey-400">
            Deposit &amp; rental management
          </p>
          <h2 className="mt-4 max-w-lg text-[44px] font-extrabold leading-[1.05] tracking-[-0.035em]">
            Every rental, deposit and return in one place.
          </h2>
          <ul className="mt-9 space-y-4">
            {[
              { icon: CalendarCheck2, text: "Bookings that track their own due dates" },
              { icon: ShieldCheck, text: "Customer history and reputation at a glance" },
              { icon: Boxes, text: "Stock that updates on every pickup and return" },
            ].map((feature) => (
              <li key={feature.text} className="flex items-center gap-3.5 text-[15px] font-medium text-slate-300">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-honey-400 ring-1 ring-inset ring-white/10">
                  <feature.icon className="h-[18px] w-[18px]" />
                </span>
                {feature.text}
              </li>
            ))}
          </ul>
        </div>
        <div />
      </div>

      <div className="grid place-items-center bg-white p-6">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-[30px] font-extrabold tracking-[-0.03em]">Welcome back</h1>
          <p className="mt-1.5 text-sm text-slate-500">Sign in with your business or platform account.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-slate-700 focus-visible:text-slate-700 focus-visible:outline-none"
                >
                  {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
            )}

            <Button type="submit" size="lg" disabled={submitting} className="w-full">
              {submitting && <Spinner className="h-4 w-4 text-white" />}
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Registering a new business?{" "}
            <Link to="/register" className="font-bold text-slate-900 underline decoration-honey-400 decoration-2 underline-offset-4 hover:decoration-honey-600">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
