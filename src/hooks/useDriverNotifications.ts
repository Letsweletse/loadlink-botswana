import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";

export default function useDriverNotifications() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    // No user = no notifications to load
    if (!user) {
      setUnread(0);
      return;
    }

    // Only drivers need driver notifications
    if (user.role !== "driver") {
      setUnread(0);
      return;
    }

    let mounted = true;

    async function loadNotifications() {
      try {
        // Put your existing notification fetching logic here
        // Keep it inside this try/catch so it cannot crash the app

        if (mounted) {
          setUnread(0);
        }
      } catch (error) {
        console.error("Notification loading failed:", error);

        if (mounted) {
          setUnread(0);
        }
      }
    }

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, [user]);

  return {
    unread,
  };
}
