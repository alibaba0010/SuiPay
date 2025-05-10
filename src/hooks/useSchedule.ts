import { useCallback, useState } from "react";
import { toast } from "@/components/ui/use-toast";

export interface SingleTransactionData {
  _id?: string;
  transactionDigest: string;
  sender: string;
  receiver: string;
  amount: number;
  scheduledDate: Date;
}

export interface BulkTransactionData {
  _id?: string;
  transactionDigest: string;
  sender: string;
  recipients: Array<{
    address: string;
    amount: number;
  }>;
  totalAmount: number;
  scheduledDate: Date;
}

interface TransactionResponse {
  singleTransactions: SingleTransactionData[];
  bulkTransactions: BulkTransactionData[];
}

export function useSchedule() {
  const [isLoading, setIsLoading] = useState(false);

  const scheduleTransaction = async (
    type: "single" | "bulk",
    data: SingleTransactionData | BulkTransactionData
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/schedule-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, ...data }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to schedule transaction");
      }

      return result.data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule transaction",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSchedule = async (id: string, type: "single" | "bulk") => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/schedule-transactions?id=${id}&type=${type}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete transaction");
      }

      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete transaction",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getSchedules = useCallback(async (walletAddress: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/schedule-transactions?address=${walletAddress}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch transactions");
      }

      return result.data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch transactions",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    scheduleTransaction,
    deleteSchedule,
    getSchedules,
  };
}
