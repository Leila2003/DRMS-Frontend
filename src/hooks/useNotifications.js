import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

export function useNotifications(enabled) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(enabled);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const { data } = await api.get("/notifications");
      setNotifications(data);
    } catch {
      // Notifications are a convenience widget — fail quietly.
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const markRead = useCallback(async (notificationId) => {
    const { data } = await api.post(`/notifications/${notificationId}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.notification_id === notificationId ? data : n))
    );
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, loading, unreadCount, refetch, markRead };
}
