import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarClock,
  Users,
  Boxes,
  Bell,
  Building2,
  UserCog,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { ROLE_LABELS } from "../lib/format";
import NotificationBell from "./NotificationBell";
import Logo from "./Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const BUSINESS_NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true, icon: LayoutDashboard },
  { to: "/bookings", label: "Bookings", icon: CalendarClock },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/categories", label: "Categories", icon: Boxes },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/staff", label: "Staff", icon: UserCog, roles: ["business_admin"] },
];

const PLATFORM_NAV_ITEMS = [
  { to: "/", label: "Dashboard", end: true, icon: LayoutDashboard },
  { to: "/businesses", label: "Businesses", icon: Building2 },
];

function navClass({ isActive }) {
  return [
    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
    isActive
      ? "bg-white/[0.08] text-white before:absolute before:-left-4 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-honey-400"
      : "text-slate-400 hover:bg-white/[0.04] hover:text-white",
  ].join(" ");
}

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const today = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isBusinessMember = Boolean(user?.business_id);
  const navItems = (isBusinessMember ? BUSINESS_NAV_ITEMS : PLATFORM_NAV_ITEMS).filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="honeycomb sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-slate-950 px-4 py-6">
        <div className="px-2">
          <Logo inverted />
        </div>

        {user?.business_name && (
          <div className="mt-6 flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
            <Building2 className="h-4 w-4 shrink-0 text-honey-400" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Business
              </p>
              <p className="truncate text-sm font-semibold text-white" title={user.business_name}>
                {user.business_name}
              </p>
            </div>
          </div>
        )}

        <p className="mb-2 mt-7 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          Workspace
        </p>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`h-[18px] w-[18px] ${
                      isActive ? "text-honey-400" : "text-slate-500 group-hover:text-slate-300"
                    }`}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-honey-400 text-xs font-extrabold text-slate-900">
              {initials(user?.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">
                {ROLE_LABELS[user?.role] || user?.role}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-100/85 px-8 backdrop-blur-md">
          <p className="text-sm font-medium text-slate-500">{today}</p>

          <div className="flex items-center gap-2">
            <NotificationBell enabled={isBusinessMember} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 items-center gap-2.5 rounded-xl border border-slate-200 bg-white py-1 pl-1 pr-3 text-left shadow-[0_1px_2px_rgb(18_24_38/0.04)] transition hover:border-slate-300"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-bold text-honey-300">
                    {initials(user?.name)}
                  </span>
                  <span className="hidden max-w-40 truncate text-sm font-semibold sm:block">
                    {user?.name}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <div className="px-2.5 py-2">
                  <p className="truncate text-sm font-bold text-slate-900">{user?.name}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  {user?.business_name && (
                    <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs font-medium text-slate-600">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {user.business_name}
                    </p>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleLogout} className="text-rose-600 data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-700">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-8 py-9">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
