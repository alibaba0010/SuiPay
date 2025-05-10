"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink, RotateCw, Download } from "lucide-react";
import { formatDistanceToNow, format, isToday, isTomorrow } from "date-fns";
import { StatusBadge } from "./StatusBadge";
import { StatusIcon } from "./StatusIcon";
import { exportTransactions } from "@/lib/utils/export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNetwork } from "@/contexts/network-context";

interface UpdatedDigestMapping {
  address: string;
  digest: string;
}

interface Transaction {
  transactionDigest: string;
  sender: string;
  receiver: string;
  amount: number;
  status: "active" | "completed" | "claimed" | "rejected" | "refunded";
  verificationCode?: string;
  timestamp: Date;
  updatedDigest?: string;
  updatedDigests?: UpdatedDigestMapping[];
  id?: string;
  token?: string;
  type?: "sent" | "received";
  isBulk?: boolean;
  plainCode?: string;
  scheduledDate?: Date;
}

interface TransactionListProps {
  transactions: Transaction[];
  walletAddress: string;
  showAll: boolean;
  onShowAllChange: (show: boolean) => void;
  onTransactionClick: (transaction: Transaction) => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

const getTransactionDigest = (transaction: Transaction) => {
  if (
    transaction.isBulk &&
    (transaction.status === "claimed" || transaction.status === "refunded")
  ) {
    // For bulk transactions, find matching digest from updatedDigests array
    const updatedDigestMapping = transaction.updatedDigests?.find(
      (mapping) => mapping.address === transaction.receiver
    );
    return updatedDigestMapping?.digest || transaction.transactionDigest;
  } else if (
    !transaction.isBulk &&
    (transaction.status === "claimed" || transaction.status === "refunded")
  ) {
    // For single transactions, use updatedDigest if status is claimed or refunded
    return transaction.updatedDigest || transaction.transactionDigest;
  }
  return transaction.transactionDigest;
};

const getScheduledDayText = (date: Date): string => {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, MMM dd"); // Returns "Monday, Jan 01" format
};

export function TransactionList({
  transactions,
  walletAddress,
  showAll,
  onShowAllChange,
  onTransactionClick,
  onRefresh,
  isRefreshing,
}: TransactionListProps) {
  const { currentNetwork } = useNetwork();
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-gray-500 mx-auto mb-3" />
        <p className="text-gray-400">No transactions yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Your transaction history will appear here
        </p>
      </div>
    );
  }

  const displayedTransactions = showAll
    ? transactions
    : transactions.slice(0, 5);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Recent Transactions</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 text-gray-400 hover:text-blue-400"
            title="Refresh"
          >
            <RotateCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="blueWhite"
                size="sm"
                className="border-[#1a2a40] hover:bg-[#0a1930]"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0a1930] border-[#1a2a40] text-white">
              <DropdownMenuItem
                onClick={() => exportTransactions(transactions, "csv")}
                className="cursor-pointer"
              >
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportTransactions(transactions, "json")}
                className="cursor-pointer"
              >
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {displayedTransactions.map((transaction, index) => (
        <motion.div
          key={`${transaction.transactionDigest}-${transaction.type}-${transaction.receiver}`}
          className={`flex items-center justify-between p-4 border border-[#1a2a40] rounded-lg hover:bg-[#061020]/50 transition-colors ${
            transaction.status === "active" ||
            (transaction.status === "rejected" &&
              transaction.sender === walletAddress)
              ? "cursor-pointer"
              : ""
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          onClick={() => {
            if (
              transaction.status === "active" ||
              (transaction.status === "rejected" &&
                transaction.sender === walletAddress)
            ) {
              onTransactionClick(transaction);
            }
          }}
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <StatusIcon status={transaction.status} />
            </div>
            <div>
              <p className="font-medium text-white">{transaction.amount} SUI</p>
              <p className="text-sm text-gray-400">
                {transaction.receiver === walletAddress
                  ? `Received from ${transaction.sender.slice(0, 6)}...${transaction.sender.slice(-4)}`
                  : `Sent to ${transaction.receiver.slice(0, 6)}...${transaction.receiver.slice(-4)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-gray-400">
                {transaction.scheduledDate
                  ? getScheduledDayText(new Date(transaction.scheduledDate))
                  : formatDistanceToNow(new Date(transaction.timestamp), {
                      addSuffix: true,
                    })}
              </p>
              <StatusBadge status={transaction.status} />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-blue-400"
              onClick={(e) => {
                e.stopPropagation();
                const digest = getTransactionDigest(transaction);
                window.open(
                  `https://suiscan.xyz/${currentNetwork}/tx/${digest}`,
                  "_blank"
                );
              }}
              title="View on Explorer"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      ))}

      {transactions.length > 5 && (
        <div className="mt-4 text-center">
          <Button
            variant="link"
            className="text-blue-400 hover:text-blue-300"
            onClick={() => onShowAllChange(!showAll)}
          >
            {showAll ? "Show Less" : "View All Transactions"}
          </Button>
        </div>
      )}
    </div>
  );
}
