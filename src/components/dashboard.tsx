"use client";
import {
  Activity,
  Calendar,
  DollarSign,
  Wallet,
  Clock,
  ExternalLink,
  RotateCw,
} from "lucide-react";
import type React from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { motion } from "framer-motion";
import { useWalletContext } from "@/lib/wallet-context";
import { useContract } from "@/hooks/useContract";
import { useEffect, useState, useCallback } from "react";

import { formatDistanceToNow, format, isToday, isTomorrow } from "date-fns";
import { useSuiPrice } from "@/hooks/useSuiPrice";
import { useTransactionStorage } from "@/hooks/useTransactionStorage";
import TransactionModal from "./TransactionModal/transaction-modal";
import { SummaryCard } from "./dashboard/SummaryCard";
import { StatusBadge } from "./dashboard/StatusBadge";
import { TransactionList } from "./dashboard/TransactionList";
import { ScheduleList } from "./dashboard/ScheduleList";

import {
  BulkTransactionData,
  SingleTransactionData,
  useSchedule,
} from "@/hooks/useSchedule";
import { useNetwork } from "@/contexts/network-context";
import { formatBalance } from "@/utils/helpers";
import { useScheduleContext } from "@/contexts/schedule-context";

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
  plainCode?: string;
}

interface Recipient {
  address: string;
  amount: number;
  status: string;
  verificationCode?: string;
  plainCode?: string;
}

interface BulkTransaction {
  transactionDigest: string;
  sender: string;
  recipients: Recipient[];
  timestamp: Date;
}

const getNextPaymentText = (date: Date): string => {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE"); // Returns day name like "Monday", "Tuesday", etc.
};

export default function Dashboard() {
  const { currentNetwork } = useNetwork();
  const { walletAddress } = useWalletContext() || {};
  const {
    getUserBalance,
    claimFunds,
    refundFunds,
    refundUSDCFunds,
    claimUSDCFunds,
  } = useContract();
  const {
    getTransactionsByAddress,
    getBulkTransactionsByAddress,
    verifyTransaction,
    verifyBulkTransaction,
    updateBulkTransactionStatus,
    updateTransactionStatus,
  } = useTransactionStorage();
  const { getSchedules } = useSchedule();
  const [suiBalance, setSuiBalance] = useState<string>("0");
  const [usdcBalance, setUsdcBalance] = useState<string>("0");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [, setBulkTransactions] = useState<BulkTransaction[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [escrowAmount, setEscrowAmount] = useState(0);
  const [totalFundsSent, setTotalFundsSent] = useState(0);
  const [totalFundsReceived, setTotalFundsReceived] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [totalUsdValue, setTotalUsdValue] = useState(0);
  const [nextScheduledPayment, setNextScheduledPayment] = useState<Date | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("transactions");
  const suiPrice = useSuiPrice();
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showAllPending, setShowAllPending] = useState(false);
  const [showAllScheduled, setShowAllScheduled] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { setUpcomingCount: setGlobalUpcomingCount } = useScheduleContext();

  const [escrowUSDCAmount, setEscrowUSDCAmount] = useState(0);
  const [totalUSDCSent, setTotalUSDCSent] = useState(0);
  const [totalUSDCReceived, setTotalUSDCReceived] = useState(0);

  const refreshTransactions = useCallback(async () => {
    if (!walletAddress) return;
    setIsRefreshing(true);
    try {
      const [userTransactions, userBulkTransactions] = await Promise.all([
        getTransactionsByAddress(walletAddress),
        getBulkTransactionsByAddress(walletAddress),
      ]);

      const processedTransactions = userTransactions.map((tx) => ({
        ...tx,
        id: tx.transactionDigest,
        token: tx.tokenType,
        type:
          tx.sender === walletAddress
            ? ("sent" as const)
            : ("received" as const),
      }));

      const flattenedBulkTransactions =
        userBulkTransactions.flatMap<Transaction>((bulkTx) => {
          if (bulkTx.sender === walletAddress) {
            return bulkTx.recipients.map((recipient) => ({
              transactionDigest: bulkTx.transactionDigest,
              sender: bulkTx.sender,
              receiver: recipient.address,
              amount: recipient.amount,
              status: recipient.status,
              timestamp: bulkTx.timestamp,
              id: `${bulkTx.transactionDigest}-${recipient.address}`,
              token: bulkTx.tokenType,
              type: "sent" as const,
              isBulk: true,
              plainCode: recipient.plainCode,
            }));
          } else {
            const relevantRecipient = bulkTx.recipients.find(
              (r) => r.address === walletAddress
            );

            if (!relevantRecipient) return [];

            return [
              {
                transactionDigest: bulkTx.transactionDigest,
                sender: bulkTx.sender,
                receiver: walletAddress,
                amount: relevantRecipient.amount,
                status: relevantRecipient.status,
                timestamp: bulkTx.timestamp,
                id: `${bulkTx.transactionDigest}-${walletAddress}`,
                token: bulkTx.tokenType,
                type: "received" as const,
                isBulk: true,
                plainCode: relevantRecipient.plainCode,
              },
            ];
          }
        });

      const allTransactions = [
        ...processedTransactions,
        ...flattenedBulkTransactions,
      ].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setTransactions(allTransactions);
      setBulkTransactions(userBulkTransactions);

      // Calculate pending transactions
      const pending = allTransactions.filter(
        (tx) => tx.status === "active"
      ).length;
      setPendingCount(pending);

      // Calculate escrow amounts
      const escrowSui = allTransactions
        .filter((tx) => tx.status === "active" && tx.token === "SUI")
        .reduce((sum, tx) => sum + tx.amount, 0);
      const escrowUsdc = allTransactions
        .filter((tx) => tx.status === "active" && tx.token === "USDC")
        .reduce((sum, tx) => sum + tx.amount, 0);
      setEscrowAmount(escrowSui);
      setEscrowUSDCAmount(escrowUsdc);

      // Calculate total funds sent
      const sentSui = allTransactions
        .filter(
          (tx) =>
            tx.sender === walletAddress &&
            (tx.status === "completed" || tx.status === "claimed") &&
            tx.token === "SUI"
        )
        .reduce((sum, tx) => sum + tx.amount, 0);
      const sentUsdc = allTransactions
        .filter(
          (tx) =>
            tx.sender === walletAddress &&
            (tx.status === "completed" || tx.status === "claimed") &&
            tx.token === "USDC"
        )
        .reduce((sum, tx) => sum + tx.amount, 0);
      setTotalFundsSent(sentSui);
      setTotalUSDCSent(sentUsdc);

      // Calculate total funds received
      const receivedSui = allTransactions
        .filter(
          (tx) =>
            tx.receiver === walletAddress &&
            (tx.status === "claimed" || tx.status === "completed") &&
            tx.token === "SUI"
        )
        .reduce((sum, tx) => sum + tx.amount, 0);
      const receivedUsdc = allTransactions
        .filter(
          (tx) =>
            tx.receiver === walletAddress &&
            (tx.status === "claimed" || tx.status === "completed") &&
            tx.token === "USDC"
        )
        .reduce((sum, tx) => sum + tx.amount, 0);
      setTotalFundsReceived(receivedSui);
      setTotalUSDCReceived(receivedUsdc);
    } catch (error) {
      console.error("Error refreshing transactions:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (walletAddress) {
        setIsLoading(true);
        try {
          await refreshTransactions();

          // Get scheduled payments
          const response = await getSchedules(walletAddress);
          interface ScheduledTransaction {
            scheduledDate: string;
          }

          const scheduledDates: Date[] = [
            ...response.singleTransactions.map(
              (tx: SingleTransactionData) =>
                new Date(tx.scheduledDate.toString())
            ),
            ...response.bulkTransactions.map(
              (tx: BulkTransactionData) => new Date(tx.scheduledDate.toString())
            ),
          ].sort((a: Date, b: Date) => a.getTime() - b.getTime());

          setUpcomingCount(scheduledDates.length);
          setGlobalUpcomingCount(scheduledDates.length); // Add this line
          setNextScheduledPayment(scheduledDates[0] || null);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchTransactions();
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress) return;
    const fetchBalance = async () => {
      try {
        const { suiBalance, usdcBalance } = await getUserBalance(walletAddress);
        const formattedSuiBalance = formatBalance(suiBalance);
        const formattedUsdcBalance = formatBalance(usdcBalance);
        setSuiBalance(formattedSuiBalance);
        setUsdcBalance(formattedUsdcBalance);
      } catch (error) {
        console.error("Error fetching user balance:", error);
      }
    };
    fetchBalance();
  }, [walletAddress, getUserBalance]);

  const usdValue = (Number(suiBalance) * suiPrice).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5 },
    },
    hover: {
      y: -5,
      boxShadow: "0 10px 30px -15px rgba(0, 0, 0, 0.3)",
      transition: { duration: 0.2 },
    },
  };
  useEffect(() => {
    const totalUsdValue = Number(usdValue) + Number(usdcBalance) * 0.99;
    setTotalUsdValue(totalUsdValue);
  }, [suiBalance, usdcBalance]);
  const handleClaim = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleTransactionClick = (transaction: Transaction) => {
    if (transaction.status === "active" || transaction.status === "rejected") {
      setSelectedTransaction(transaction);
      setIsModalOpen(true);
    }
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
    refreshTransactions();
  };

  if (isLoading) {
    return (
      <div className="w-full h-[80vh] flex items-center justify-center">
        <RotateCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        initial="hidden"
        animate="show"
        variants={containerVariants}
      >
        <motion.h1 className="text-2xl font-bold" variants={itemVariants}>
          Dashboard
        </motion.h1>
        <motion.div
          className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"
          variants={itemVariants}
        >
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            <Link href="/payment-creation">Send Payment</Link>
          </Button>
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700 transition-colors w-full sm:w-auto"
          >
            <Link href="/send-bulk-payment">Send Bulk Payment</Link>
          </Button>
          <Button
            variant="blueWhite"
            asChild
            className="border-[#1a2a40] hover:bg-[#0a1930]/80 transition-colors w-full sm:w-auto"
          >
            <Link href="/schedule-payments">Schedule Payment</Link>
          </Button>
          <Button
            variant="blueWhite"
            asChild
            className="border-[#1a2a40] hover:bg-[#0a1930]/80 transition-colors w-full sm:w-auto"
          >
            <Link href="/payroll-management">Payroll Mgt</Link>
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4"
        initial="hidden"
        animate="show"
        variants={containerVariants}
      >
        <SummaryCard
          title="Total Balance"
          value={
            <div className="flex flex-col gap-1">
              <div>{`${suiBalance} SUI`}</div>
              <div className="text-sm text-gray-300">{`${usdcBalance} USDC`}</div>
            </div>
          }
          description={`≈ ${totalUsdValue.toFixed(2)} USD`}
          icon={<Wallet className="h-5 w-5" />}
          variants={cardVariants}
          color="from-blue-700 to-blue-900"
        />
        <SummaryCard
          title="Pending Transactions"
          value={pendingCount.toString()}
          description={
            <div className="flex flex-col gap-1 text-sm text-gray-300">
              <div>{`≈ ${escrowAmount.toFixed(1)} SUI`}</div>
              <div>{`≈ ${escrowUSDCAmount.toFixed(1)} USDC`}</div>
            </div>
          }
          icon={<Activity className="h-5 w-5" />}
          variants={cardVariants}
          color="from-indigo-700 to-indigo-900"
        />
        <SummaryCard
          title="Total Funds Sent"
          value={
            <div className="flex flex-col gap-2">
              <div className="text-sm">{`${totalFundsSent.toFixed(2)} SUI`}</div>
              <div className="text-sm text-gray-300">{`${totalUSDCSent.toFixed(2)} USDC`}</div>
            </div>
          }
          description={`≈ ${(totalFundsSent * suiPrice + totalUSDCSent * 0.99).toFixed(2)} USD`}
          icon={<DollarSign className="h-5 w-5" />}
          variants={cardVariants}
          color="from-blue-700 to-blue-900"
        />
        <SummaryCard
          title="Total Funds Received"
          value={
            <div className="flex flex-col gap-2">
              <div className="text-sm">{`${totalFundsReceived.toFixed(2)} SUI`}</div>
              <div className="text-sm text-gray-300">{`${totalUSDCReceived.toFixed(2)} USDC`}</div>
            </div>
          }
          description={`≈ ${(totalFundsReceived * suiPrice + totalUSDCReceived * 0.99).toFixed(2)} USD`}
          icon={<DollarSign className="h-5 w-5" />}
          variants={cardVariants}
          color="from-blue-700 to-blue-900"
        />
        <SummaryCard
          title="Upcoming Payments"
          value={
            <div className="flex flex-col gap-4">
              <div>{upcomingCount.toString()}</div>
              <div className="text-sm text-gray-300">
                {nextScheduledPayment
                  ? `Next: ${getNextPaymentText(nextScheduledPayment)}`
                  : "No upcoming payments"}
              </div>
            </div>
          }
          description=""
          icon={<Calendar className="h-5 w-5" />}
          variants={cardVariants}
          color="from-indigo-700 to-indigo-900"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Tabs
          defaultValue="transactions"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="overflow-x-auto pb-2">
            <TabsList className="bg-[#0a1930] border border-[#1a2a40] w-full sm:w-auto">
              <TabsTrigger
                value="transactions"
                className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
              >
                All Transactions
              </TabsTrigger>

              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
              >
                Pending Approvals
              </TabsTrigger>
              <TabsTrigger
                value="scheduled"
                className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
              >
                Schedule Payments
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="transactions"
            className="border border-[#1a2a40] rounded-md overflow-hidden bg-[#0a1930]/50 backdrop-blur-sm"
          >
            <div className="p-4">
              <TransactionList
                transactions={transactions}
                walletAddress={walletAddress || ""}
                showAll={showAllTransactions}
                onShowAllChange={setShowAllTransactions}
                onTransactionClick={handleTransactionClick}
                onRefresh={refreshTransactions}
                isRefreshing={isRefreshing}
              />
            </div>
          </TabsContent>

          <TabsContent
            value="pending"
            className="border border-[#1a2a40] rounded-md overflow-hidden bg-[#0a1930]/50 backdrop-blur-sm"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Pending Approvals</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refreshTransactions}
                  disabled={isRefreshing}
                  className="h-8 w-8 text-gray-400 hover:text-blue-400"
                  title="Refresh"
                >
                  <RotateCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
              <div className="space-y-0">
                {transactions
                  .filter((tx) => tx.status === "active")
                  .sort(
                    (a, b) =>
                      new Date(b.timestamp).getTime() -
                      new Date(a.timestamp).getTime()
                  )
                  .slice(0, showAllPending ? transactions.length : 5)
                  .map((transaction, index) => (
                    <motion.div
                      key={`${transaction.transactionDigest}-${transaction.type}-${transaction.receiver}`}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-[#1a2a40] last:border-0 hover:bg-[#0a1930]/80 transition-colors cursor-pointer"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      onClick={() => handleTransactionClick(transaction)}
                    >
                      <div className="flex items-center gap-4 mb-3 sm:mb-0">
                        <Avatar className="border border-[#1a2a40] bg-[#061020]">
                          <AvatarFallback className="bg-[#061020] text-blue-400">
                            {transaction.type === "received"
                              ? transaction.sender.charAt(0).toUpperCase()
                              : transaction.receiver.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-white">
                            {transaction.type === "received"
                              ? `From: ${transaction.sender.slice(0, 6)}...${transaction.sender.slice(-4)}`
                              : `To: ${transaction.receiver.slice(0, 6)}...${transaction.receiver.slice(-4)}`}
                          </div>
                          <div className="text-sm text-gray-400">
                            {transaction.amount} {transaction.token}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 pl-12 sm:pl-0">
                        <div className="text-right mr-4">
                          <div className="text-sm text-gray-400">
                            {formatDistanceToNow(
                              new Date(transaction.timestamp),
                              {
                                addSuffix: true,
                              }
                            )}
                          </div>
                          <StatusBadge status={transaction.status} />
                        </div>
                        <div className="flex items-center gap-2">
                          {transaction.type === "received" &&
                            transaction.receiver === walletAddress && (
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClaim(transaction);
                                }}
                              >
                                Claim
                              </Button>
                            )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-blue-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                `https://suiscan.xyz/${currentNetwork}/tx/${transaction.transactionDigest}`,
                                "_blank"
                              );
                            }}
                            title="View on Explorer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                {transactions.filter((tx) => tx.status === "active").length ===
                  0 && (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No pending transactions</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Your pending transactions will appear here
                    </p>
                  </div>
                )}
              </div>

              {transactions.filter((tx) => tx.status === "active").length >
                5 && (
                <div className="mt-4 text-center pb-4">
                  <Button
                    variant="link"
                    className="text-blue-400 hover:text-blue-300"
                    onClick={() => setShowAllPending(!showAllPending)}
                  >
                    {showAllPending
                      ? "Show Less"
                      : "View All Pending Approvals"}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent
            value="scheduled"
            className="border border-[#1a2a40] rounded-md overflow-hidden bg-[#0a1930]/50 backdrop-blur-sm"
          >
            <div className="p-4">
              <ScheduleList
                walletAddress={walletAddress || ""}
                showAll={showAllScheduled}
                onShowAllChange={setShowAllScheduled}
              />
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      <TransactionModal
        transaction={selectedTransaction}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        walletAddress={walletAddress || ""}
        verifyTransaction={verifyTransaction}
        verifyBulkTransaction={verifyBulkTransaction}
        updateBulkTransactionStatus={updateBulkTransactionStatus}
        updateTransactionStatus={updateTransactionStatus}
        claimFunds={claimFunds}
        claimUSDCFunds={claimUSDCFunds}
        refundUSDCFunds={refundUSDCFunds}
        refundFunds={refundFunds}
        onSuccess={refreshTransactions}
      />
    </div>
  );
}
