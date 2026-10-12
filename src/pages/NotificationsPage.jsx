import { useMemo, useState } from "react";
import { AlertTriangle, Check, Info, TriangleAlert } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { NOTIFICATION_TYPE_STYLES } from "../lib/format";
import Spinner from "../components/Spinner";
import Badge from "../components/ui/badge";
import Button from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";

const TYPE_ICON = { info: Info, warn: TriangleAlert, alert: AlertTriangle };

export default function NotificationsPage() {
  const { notifications, loading, unreadCount, markRead } = useNotifications(true);
  const [group, setGroup] = useState("all");

  const groups = useMemo(() => {
    const set = new Set(notifications.map((n) => n.group));
    return ["all", ...Array.from(set)];
  }, [notifications]);

  const filtered = useMemo(() => {
    if (group === "all") return notifications;
    return notifications.filter((n) => n.group === group);
  }, [notifications, group]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <Tabs value={group} onValueChange={setGroup}>
          <TabsList>
            {groups.map((g) => (
              <TabsTrigger key={g} value={g}>
                {g}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Spinner className="h-6 w-6" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <p className="mt-10 text-center text-sm text-slate-500">No notifications here.</p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="mt-4 space-y-2">
          {filtered.map((n) => {
            const Icon = TYPE_ICON[n.type] || Info;
            return (
              <Card
                key={n.notification_id}
                className={`flex items-start gap-3 p-4 ${n.read ? "" : "border-honey-200 bg-honey-50/60"}`}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${n.read ? "text-slate-700" : "font-semibold text-slate-900"}`}>
                      {n.title}
                    </p>
                    <Badge variant={NOTIFICATION_TYPE_STYLES[n.type]}>{n.group}</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{n.time}</p>
                </div>
                {!n.read && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => markRead(n.notification_id)}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark read
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
