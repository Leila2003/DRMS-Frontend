import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  PackageOpen,
  Timer,
  Star,
  Building2,
  TrendingUp,
  ShieldCheck,
  Undo2,
  Lock,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { api, apiErrorMessage } from "../lib/api";
import { formatMoney, formatDate, BOOKING_STATUS_STYLES } from "../lib/format";
import Spinner from "../components/Spinner";
import StatCard from "../components/StatCard";
import Badge from "../components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

function WeeklyBookingsChart({ weeks }) {
  const max = Math.max(1, ...weeks.map((w) => w.count));
  return (
    <div className="flex h-52 items-end gap-3">
      {weeks.map((week) => {
        const isPeak = week.count === max && week.count > 0;
        return (
          <div key={week.label} className="group flex h-full flex-1 flex-col items-center gap-2.5">
            <div className="relative flex w-full flex-1 items-end justify-center rounded-xl bg-slate-50">
              <div
                className={`relative w-full max-w-12 rounded-xl transition-colors ${
                  isPeak ? "bg-honey-400" : "bg-slate-900 group-hover:bg-slate-700"
                }`}
                style={{ height: `${Math.max(6, (week.count / max) * 100)}%` }}
                title={`${week.label}: ${week.count} bookings`}
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold tabular-nums text-slate-900">
                  {week.count}
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500">{week.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function BusinessAdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/analytics/summary");
        if (!cancelled) setSummary(data);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load analytics"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (error) {
    return <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={formatMoney(summary.total_revenue)}
          hint="All bookings, caution excluded"
          icon={Wallet}
          featured
        />
        <StatCard
          label="Caution held"
          value={formatMoney(summary.caution_held)}
          hint="On bookings still out"
          icon={ShieldCheck}
        />
        <StatCard
          label="Caution refunded"
          value={formatMoney(summary.caution_refunded)}
          hint="Returned to customers"
          icon={Undo2}
        />
        <StatCard
          label="Caution kept"
          value={formatMoney(summary.caution_kept)}
          hint="Retained by the business"
          icon={Lock}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active rentals" value={summary.active_rentals} icon={PackageOpen} />
        <StatCard
          label="Avg. rental duration"
          value={`${summary.avg_rental_duration_days.toFixed(1)} days`}
          icon={Timer}
        />
        <StatCard
          label="Most rented"
          value={summary.most_rented_category || "—"}
          icon={Star}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Bookings this week</CardTitle>
            <p className="text-[13px] text-slate-500">Peak period highlighted in honey</p>
          </CardHeader>
          <CardContent>
            {summary.weekly_bookings.length > 0 ? (
              <WeeklyBookingsChart weeks={summary.weekly_bookings} />
            ) : (
              <p className="text-sm text-slate-500">No booking activity yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top categories</CardTitle>
            <p className="text-[13px] text-slate-500">By times rented</p>
          </CardHeader>
          <CardContent className="space-y-1">
            {summary.top_categories.length === 0 && (
              <p className="text-sm text-slate-500">Nothing rented out yet.</p>
            )}
            {summary.top_categories.map((cat, i) => (
              <div
                key={cat.category_id}
                className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50"
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-extrabold ${
                    i === 0 ? "bg-honey-400 text-slate-900" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-sm font-semibold text-slate-700">{cat.name}</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-900">
                  {cat.count}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SuperAdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/analytics/platform");
        if (!cancelled) setSummary(data);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load platform analytics"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (error) {
    return <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Businesses" value={summary.total_businesses} icon={Building2} />
        <StatCard label="Active businesses" value={summary.active_businesses} icon={TrendingUp} />
        <StatCard label="Platform revenue" value={formatMoney(summary.total_revenue)} icon={Wallet} />
        <StatCard label="Active rentals" value={summary.active_rentals} icon={Timer} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top businesses</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead className="text-right">Bookings</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.top_businesses.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-slate-500">
                  No businesses yet.
                </TableCell>
              </TableRow>
            )}
            {summary.top_businesses.map((b) => (
              <TableRow key={b.business_id}>
                <TableCell className="font-medium text-slate-900">{b.name}</TableCell>
                <TableCell className="text-right tabular-nums">{b.bookings_count}</TableCell>
                <TableCell className="text-right tabular-nums">{formatMoney(b.revenue)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function StaffDashboard() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/bookings");
        if (!cancelled) setBookings(data);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err, "Could not load bookings"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (error) {
    return <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>;
  }

  const counts = { active: 0, due: 0, overdue: 0 };
  for (const b of bookings) {
    if (b.status in counts) counts[b.status] += 1;
  }
  const recent = bookings.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active rentals" value={counts.active} icon={PackageOpen} featured />
        <StatCard label="Due soon" value={counts.due} icon={Timer} />
        <StatCard label="Overdue" value={counts.overdue} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent bookings</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Return</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recent.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-slate-500">
                  No bookings yet.
                </TableCell>
              </TableRow>
            )}
            {recent.map((b) => (
              <TableRow key={b.booking_id}>
                <TableCell className="font-medium text-slate-900">{b.customer?.name}</TableCell>
                <TableCell>{formatDate(b.return_date)}</TableCell>
                <TableCell>
                  <Badge variant={BOOKING_STATUS_STYLES[b.status]}>{b.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Link
        to="/bookings"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900 underline decoration-honey-400 decoration-2 underline-offset-4 hover:decoration-honey-600"
      >
        View all bookings →
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-honey-700">Overview</p>
      <h1 className="page-title mt-1">
        Welcome back, {user?.name?.split(" ")[0] || "there"}
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">Here&apos;s what&apos;s happening across your rentals right now.</p>

      <div className="mt-8">
        {user?.role === "super_admin" && !user?.business_id && <SuperAdminDashboard />}
        {user?.role === "business_admin" && <BusinessAdminDashboard />}
        {user?.role === "staff" && <StaffDashboard />}
      </div>
    </div>
  );
}
