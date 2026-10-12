import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import Logo from "../components/Logo";
import { useAuth } from "../hooks/useAuth";
import { api, apiErrorMessage, setToken } from "../lib/api";
import Spinner from "../components/Spinner";
import Button from "../components/ui/button";
import Input from "../components/ui/input";
import Label from "../components/ui/label";

const EMPTY_FORM = {
  business_name: "",
  business_phone: "",
  owner_name: "",
  owner_email: "",
  owner_phone: "",
  owner_password: "",
};

export default function RegisterPage() {
  const { user, loading, reloadUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/auth/register-business", form);
      const { data } = await api.post("/auth/login", {
        email: form.owner_email,
        password: form.owner_password,
      });
      setToken(data.access_token);
      await reloadUser();
      navigate("/", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Could not create your business account"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="honeycomb grid min-h-screen place-items-center bg-slate-950 p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Logo inverted />
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-float sm:p-10">
        <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-honey-700">Get started</p>
        <h1 className="mt-1 text-[28px] font-extrabold tracking-[-0.03em]">Register your business</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Creates your business and its first owner account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="business_name">Business name</Label>
            <Input id="business_name" required value={form.business_name} onChange={update("business_name")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="business_phone">Business phone</Label>
            <Input id="business_phone" value={form.business_phone} onChange={update("business_phone")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="owner_name">Your name</Label>
              <Input id="owner_name" required value={form.owner_name} onChange={update("owner_name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="owner_phone">Your phone</Label>
              <Input id="owner_phone" value={form.owner_phone} onChange={update("owner_phone")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="owner_email">Your email</Label>
            <Input
              id="owner_email"
              type="email"
              autoComplete="username"
              required
              value={form.owner_email}
              onChange={update("owner_email")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="owner_password">Password</Label>
            <div className="relative">
              <Input
                id="owner_password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={form.owner_password}
                onChange={update("owner_password")}
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

          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <Button type="submit" size="lg" disabled={submitting} className="w-full">
            {submitting && <Spinner className="h-4 w-4 text-white" />}
            Create business account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already registered?{" "}
          <Link
            to="/login"
            className="font-bold text-slate-900 underline decoration-honey-400 decoration-2 underline-offset-4 hover:decoration-honey-600"
          >
            Sign in
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
