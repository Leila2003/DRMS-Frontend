import { Link } from "react-router-dom";
import { Bell, AlertTriangle, Info, TriangleAlert } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useNotifications } from "../hooks/useNotifications";

const TYPE_ICON = {
  info: Info,
  warn: TriangleAlert,
  alert: AlertTriangle,
};

const TYPE_COLOR = {
  info: "text-indigo-500",
  warn: "text-amber-500",
  alert: "text-rose-500",
};

export default function NotificationBell({ enabled }) {
  const { notifications, unreadCount, refetch, markRead } = useNotifications(enabled);

  if (!enabled) return null;

  const recent = notifications.slice(0, 6);

  return (
    <DropdownMenu onOpenChange={(open) => open && refetch()}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-[0_1px_2px_rgb(18_24_38/0.04)] transition hover:border-slate-300 hover:text-slate-900"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recent.length === 0 && (
          <p className="px-2.5 py-4 text-center text-sm text-slate-400">You're all caught up.</p>
        )}
        {recent.map((n) => {
          const Icon = TYPE_ICON[n.type] || Info;
          return (
            <DropdownMenuItem
              key={n.notification_id}
              onSelect={(e) => {
                e.preventDefault();
                if (!n.read) markRead(n.notification_id);
              }}
              className="items-start"
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${TYPE_COLOR[n.type] || "text-slate-400"}`} />
              <div className="min-w-0 flex-1">
                <p className={`truncate ${n.read ? "text-slate-500" : "font-medium text-slate-900"}`}>
                  {n.title}
                </p>
                <p className="truncate text-xs text-slate-400">{n.body}</p>
              </div>
              {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-honey-400" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <Link
          to="/notifications"
          className="block rounded-xl px-2.5 py-2 text-center text-sm font-semibold text-slate-900 transition hover:bg-honey-50"
        >
          View all
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
