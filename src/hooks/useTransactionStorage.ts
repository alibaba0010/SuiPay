import { create } from "zustand";

import axios from "axios";
import { useNotifications } from "@/contexts/notifications-context";
import { useContract } from "./useContract";
import { useUserProfile } from "./useUserProfile";
export interface Transaction {
  transactionDigest: string;
  sender: string;
  receiver: string;
  amount: number;
  status: "active" | "completed" | "claimed" | "rejected" | "refunded";
  verificationCode?: string;
  timestamp: Date;
  updatedDigest?: string;
  id?: string;
  token?: string;
  type?: "sent" | "received";
  isBulk?: boolean;
  tokenType: "SUI" | "USDC";
}

interface Recipient {
  address: string;
  amount: number;
  status: "active" | "completed" | "claimed" | "rejected" | "refunded";
  plainCode?: string;
  verificationCode?: string;
}

interface UpdatedDigestMapping {
  address: string;
  digest: string;
}

interface BulkTransaction {
  transactionDigest: string;
  sender: string;
  recipients: Recipient[];
  totalAmount: number;
  timestamp: Date;
  updatedDigests?: UpdatedDigestMapping[];
  tokenType: "SUI" | "USDC";
}

interface TransactionStore {
  transactions: Transaction[];
  bulkTransactions: BulkTransaction[];
  addTransaction: (
    transaction: Omit<Transaction, "timestamp">
  ) => Promise<void>;
  updateTransactionStatus: (
    digest: string,
    status: Transaction["status"],
    newDigest?: string
  ) => Promise<void>;
  verifyTransaction: (
    digest: string,
    code: string,
    receiverAddress: string
  ) => Promise<boolean>;
  getTransactionsByAddress: (address: string) => Promise<Transaction[]>;

  addBulkTransaction: (
    transaction: Omit<BulkTransaction, "timestamp">
  ) => Promise<Recipient[]>;
  updateBulkTransactionStatus: (
    digest: string,
    recipientAddress: string,
    status: Recipient["status"],
    newDigest?: string
  ) => Promise<void>;
  verifyBulkTransaction: (
    digest: string,
    code: string,
    receiverAddress: string
  ) => Promise<boolean>;
  getBulkTransactionsByAddress: (address: string) => Promise<BulkTransaction[]>;
}

export const useTransactionStorage = create<TransactionStore>()((set, get) => ({
  transactions: [],
  bulkTransactions: [],

  addTransaction: async (transaction) => {
    try {
      const response = await axios.post("/api/transactions", transaction);
      set((state) => ({
        transactions: [...state.transactions, response.data],
      }));
    } catch (error) {
      console.error("Error adding transaction:", error);
      throw error;
    }
  },

  updateTransactionStatus: async (digest, status, newDigest) => {
    try {
      await axios.put(`/api/transactions/${digest}`, {
        status,
        updatedDigest: newDigest,
      });

      set((state) => ({
        transactions: state.transactions.map((tx) =>
          tx.transactionDigest === digest
            ? {
                ...tx,
                status,
                updatedDigest: newDigest || tx.updatedDigest,
              }
            : tx
        ),
      }));
    } catch (error) {
      console.error("Error updating transaction:", error);
      throw error;
    }
  },

  verifyTransaction: async (digest, code, receiverAddress) => {
    try {
      const response = await axios.post(`/api/transactions/${digest}/verify`, {
        code,
        receiverAddress,
      });

      return response.data.success;
    } catch (error) {
      console.error("Error verifying transaction:", error);
      return false;
    }
  },

  getTransactionsByAddress: async (address) => {
    try {
      const response = await axios.get(`/api/transactions?address=${address}`);
      set(() => ({ transactions: response.data }));
      return response.data;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  },

  addBulkTransaction: async (transaction) => {
    try {
      const response = await axios.post("/api/bulk-transactions", transaction);
      set((state) => ({
        bulkTransactions: [...(state.bulkTransactions || []), response.data],
      }));
      // Return recipients with their plain codes
      return response.data.recipients;
    } catch (error) {
      console.error("Error adding bulk transaction:", error);
      throw error;
    }
  },

  updateBulkTransactionStatus: async (
    digest: string,
    recipientAddress: string,
    status: Recipient["status"],
    newDigest?: string
  ) => {
    try {
      await axios.put(`/api/bulk-transactions/${digest}`, {
        recipientAddress,
        status,
        newDigest,
      });

      set((state) => ({
        bulkTransactions: state.bulkTransactions.map((tx) =>
          tx.transactionDigest === digest
            ? {
                ...tx,
                recipients: tx.recipients.map((r) =>
                  r.address === recipientAddress ? { ...r, status } : r
                ),
                updatedDigests: newDigest
                  ? [
                      ...(tx.updatedDigests || []),
                      { address: recipientAddress, digest: newDigest },
                    ]
                  : tx.updatedDigests,
              }
            : tx
        ),
      }));
    } catch (error) {
      console.error("Error updating bulk transaction:", error);
      throw error;
    }
  },

  verifyBulkTransaction: async (digest, code, receiverAddress) => {
    try {
      const response = await axios.post(
        `/api/bulk-transactions/${digest}/verify`,
        {
          code,
          receiverAddress,
        }
      );

      return response.data.success;
    } catch (error) {
      console.error("Error verifying bulk transaction:", error);
      return false;
    }
  },

  getBulkTransactionsByAddress: async (address) => {
    try {
      const response = await axios.get(
        `/api/bulk-transactions?address=${address}`
      );
      const transactions = response.data.map((tx: BulkTransaction) => ({
        ...tx,
        timestamp: new Date(tx.timestamp),
      }));

      set({ bulkTransactions: transactions });
      return transactions;
    } catch (error) {
      console.error("Error fetching bulk transactions:", error);
      return [];
    }
  },
}));

export function useTransaction() {
  const { addNotification } = useNotifications();
  const { fetchUserByAddress } = useUserProfile();

  const addTransaction = async (transaction: any) => {
    // Existing addTransaction logic...

    // Get sender info
    const senderInfo = await fetchUserByAddress(transaction.sender);
    const senderDisplay =
      senderInfo?.username ||
      transaction.sender.slice(0, 6) + "..." + transaction.sender.slice(-4);

    // Add notification for receiver
    addNotification({
      type: transaction.status === "completed" ? "payment" : "claim",
      title:
        transaction.status === "completed"
          ? "Payment Received"
          : "Payment Available to Claim",
      description:
        transaction.status === "completed"
          ? `You received ${transaction.amount} SUI from ${senderDisplay}`
          : `${senderDisplay} sent you ${transaction.amount} SUI. Click to claim.`,
      priority: "normal",
      transactionId: transaction.transactionDigest,
    });
  };

  const addBulkTransaction = async (transaction: any) => {
    // Existing addBulkTransaction logic...

    // Get sender info
    const senderInfo = await fetchUserByAddress(transaction.sender);
    const senderDisplay =
      senderInfo?.username ||
      transaction.sender.slice(0, 6) + "..." + transaction.sender.slice(-4);

    // Add notifications for each recipient
    transaction.recipients.forEach((recipient: any) => {
      addNotification({
        type: recipient.status === "completed" ? "payment" : "claim",
        title:
          recipient.status === "completed"
            ? "Payment Received"
            : "Payment Available to Claim",
        description:
          recipient.status === "completed"
            ? `You received ${recipient.amount} SUI from ${senderDisplay}`
            : `${senderDisplay} sent you ${recipient.amount} SUI. Click to claim.`,
        priority: "normal",
        transactionId: transaction.transactionDigest,
      });
    });
  };

  return { addTransaction, addBulkTransaction };
}
