import { useState, useEffect } from "react";
import { Transaction } from "./useTransactionStorage";

const NOTIFICATION_KEY = "transaction_notifications";

export function useTransactionNotifications(walletAddress: string | null) {
  const [notifications, setNotifications] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!walletAddress) return;

    // Function to check for new transactions
    const checkForNewTransactions = () => {
      const storedNotifications = JSON.parse(
        localStorage.getItem(NOTIFICATION_KEY) || "[]"
      );

      // Filter notifications for this wallet address
      const userNotifications = storedNotifications.filter(
        (tx: Transaction) =>
          tx.receiver === walletAddress && tx.status === "active"
      );

      setNotifications(userNotifications);
    };

    // Check immediately
    checkForNewTransactions();

    // Set up polling interval (every 30 seconds)
    const interval = setInterval(checkForNewTransactions, 30000);

    return () => clearInterval(interval);
  }, [walletAddress]);

  const markAsRead = (transactionId: string) => {
    const storedNotifications = JSON.parse(
      localStorage.getItem(NOTIFICATION_KEY) || "[]"
    );

    const updatedNotifications = storedNotifications.filter(
      (tx: Transaction) => tx.id !== transactionId
    );

    localStorage.setItem(
      NOTIFICATION_KEY,
      JSON.stringify(updatedNotifications)
    );
    setNotifications((prev) => prev.filter((tx) => tx.id !== transactionId));
  };

  return {
    notifications,
    markAsRead,
  };
}
