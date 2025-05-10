"use client";
import { createContext, useContext, useState, useEffect } from "react";

interface Notification {
  id: string;
  type: "payment" | "claim";
  title: string;
  description: string;
  time: string;
  date: string;
  read: boolean;
  priority: "high" | "normal";
  transactionId: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, "id" | "time" | "date" | "read">
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    newNotification: Omit<Notification, "id" | "time" | "date" | "read">
  ) => {
    const now = new Date();
    const notification: Notification = {
      ...newNotification,
      id: crypto.randomUUID(),
      time: now.toLocaleTimeString(),
      date: now.toLocaleDateString(),
      read: false,
    };

    setNotifications((prev) => [notification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
};
