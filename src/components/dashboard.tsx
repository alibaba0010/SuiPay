"use client";
import {
  Activity,
  Calendar,
  DollarSign,
  Wallet,
  Clock,
  ExternalLink,
  RotateCw,
  Camera,
  X,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { motion } from "framer-motion";
import { useWalletContext } from "@/contexts/wallet-context";
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
  type BulkTransactionData,
  type SingleTransactionData,
  useSchedule,
} from "@/hooks/useSchedule";
import { useNetwork } from "@/contexts/network-context";
import { formatBalance, shortenAddress } from "@/utils/helpers";
import { useScheduleContext } from "@/contexts/schedule-context";
import { QRCodeSVG } from "qrcode.react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { createRoot } from "react-dom/client";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();
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
  const { fetchUserByAddress } = useUserProfile();
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
  const [showQRcode, setShowQRcode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { setUpcomingCount: setGlobalUpcomingCount } = useScheduleContext();
  const [scanningQR, setScanningQR] = useState(false);

  const [escrowUSDCAmount, setEscrowUSDCAmount] = useState(0);
  const [totalUSDCSent, setTotalUSDCSent] = useState(0);
  const [totalUSDCReceived, setTotalUSDCReceived] = useState(0);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

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

  useEffect(() => {
    const loadUserNames = async () => {
      const addresses = new Set(
        transactions.flatMap((t) => [t.sender, t.receiver])
      );

      const userPromises = Array.from(addresses).map(async (address) => {
        const user = await fetchUserByAddress(address);
        return { address, username: user?.username };
      });

      const users = await Promise.all(userPromises);
      const userMap: Record<string, string> = {};
      users.forEach(({ address, username }) => {
        if (username) {
          userMap[address] = username;
        }
      });

      setUserNames(userMap);
    };

    loadUserNames();
  }, [transactions]);

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
    setShowQRcode(null);
    refreshTransactions();
  };

  // Updated downloadQRCode function
  const downloadQRCode = (transaction: Transaction) => {
    try {
      const qrCodeValue = JSON.stringify({
        status: transaction.status,
        amount: transaction.amount,
        receiver: transaction.receiver,
        token: transaction.token,
        code: transaction.plainCode || transaction.verificationCode,
      });

      // Create a temporary container for the QR code
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px"; // Hide it off-screen
      document.body.appendChild(tempContainer);

      // Define the desired download size
      const downloadSize = 1024;

      // Render QR code into the temporary container
      const root = createRoot(tempContainer);
      root.render(
        <QRCodeSVG
          value={qrCodeValue}
          size={downloadSize}
          level="H"
          bgColor="#ffffff"
          fgColor="#000000"
        />
      );

      // Get the rendered SVG element after a slight delay to ensure rendering
      // Note: A more robust solution would use a callback or promise.
      setTimeout(() => {
        const renderedSVG = tempContainer.querySelector("svg");
        if (!renderedSVG) {
          console.error("Failed to render QR code for download.");
          // Clean up even if rendering fails
          root.unmount();
          document.body.removeChild(tempContainer);
          return;
        }

        // Create a canvas element
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          console.error("Could not get canvas context");
          root.unmount();
          document.body.removeChild(tempContainer);
          return;
        }

        // Set canvas size to the desired download size
        canvas.width = downloadSize;
        canvas.height = downloadSize;

        // Create an image from the SVG
        const svgData = new XMLSerializer().serializeToString(renderedSVG);
        const img = new Image();

        // Add a CORS-safe data URL prefix
        const svgDataUrl = "data:image/svg+xml;base64," + btoa(svgData);

        img.onload = () => {
          // Draw the image on canvas
          ctx.fillStyle = "white"; // Ensure white background for transparency issues
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Draw the SVG image onto the canvas, scaling it to the download size
          ctx.drawImage(img, 0, 0, downloadSize, downloadSize);

          // Convert canvas to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.error("Could not create blob from canvas");
                // Clean up
                root.unmount();
                document.body.removeChild(tempContainer);
                return;
              }

              // Create download link
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.download = `payment-qr-${transaction.id}.png`;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);

              // Clean up
              root.unmount();
              document.body.removeChild(tempContainer);
            },
            "image/png",
            1.0 // Specify quality for PNG (1.0 is best)
          );
        };

        // Handle potential image loading errors
        img.onerror = (error) => {
          console.error("Error loading SVG image to canvas:", error);
          // Clean up
          root.unmount();
          document.body.removeChild(tempContainer);
        };

        img.src = svgDataUrl;
      }, 50); // Add a small delay to allow rendering
    } catch (error) {
      console.error("Error downloading QR code:", error);
    }
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
                userNames={userNames} // Add this new prop
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
                              ? `From: ${userNames[transaction.sender] || shortenAddress(transaction.sender)}`
                              : `To: ${userNames[transaction.receiver] || shortenAddress(transaction.receiver)}`}
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
                              <>
                                <Button
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClaim(transaction);
                                  }}
                                >
                                  Claim with Code
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="border-[#1a2a40] hover:bg-[#0a1930]/80 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setScanningQR(true);
                                  }}
                                >
                                  Scan QR Code
                                </Button>
                              </>
                            )}
                          {transaction.type === "sent" &&
                            transaction.sender === walletAddress &&
                            transaction.status === "active" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="border-[#1a2a40] hover:bg-[#0a1930]/80 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowQRcode(
                                    showQRcode === transaction.id
                                      ? null
                                      : transaction.id || null
                                  );
                                }}
                              >
                                {showQRcode === transaction.id
                                  ? "Hide QR Code"
                                  : "Show QR Code"}
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
            {showQRcode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-4 flex justify-center p-4"
              >
                <div className="bg-[#0a1930] p-6 rounded-lg shadow-xl flex flex-col items-center">
                  {transactions.find((tx) => tx.id === showQRcode) && (
                    <>
                      <div className="bg-white p-4 rounded-lg">
                        <QRCodeSVG
                          value={JSON.stringify({
                            status: transactions.find(
                              (tx) => tx.id === showQRcode
                            )?.status,
                            amount: transactions.find(
                              (tx) => tx.id === showQRcode
                            )?.amount,
                            receiver: transactions.find(
                              (tx) => tx.id === showQRcode
                            )?.receiver,
                            code:
                              transactions.find((tx) => tx.id === showQRcode)
                                ?.plainCode ||
                              transactions.find((tx) => tx.id === showQRcode)
                                ?.verificationCode,
                          })}
                          size={200}
                          level={"H"}
                          bgColor="#ffffff"
                          fgColor="#000000"
                          data-transaction-id={showQRcode}
                        />
                      </div>
                      <div className="mt-4 text-center space-y-2">
                        <p className="text-sm text-gray-300">
                          Amount:{" "}
                          {
                            transactions.find((tx) => tx.id === showQRcode)
                              ?.amount
                          }{" "}
                          {
                            transactions.find((tx) => tx.id === showQRcode)
                              ?.token
                          }
                        </p>
                        <p className="text-sm text-gray-300">
                          To:{" "}
                          {userNames[
                            transactions.find((tx) => tx.id === showQRcode)
                              ?.receiver || ""
                          ] ||
                            shortenAddress(
                              transactions.find((tx) => tx.id === showQRcode)
                                ?.receiver || ""
                            )}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-4 text-blue-400 hover:text-blue-300"
                        onClick={() =>
                          downloadQRCode(
                            transactions.find((tx) => tx.id === showQRcode)!
                          )
                        }
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download QR Code
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
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
      {scanningQR && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#0a1930] border border-[#1a2a40] rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Scan QR Code</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setScanningQR(false)}
                className="h-8 w-8 text-gray-400 hover:text-blue-400"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="bg-black/20 rounded-lg p-4 flex items-center justify-center h-64">
              <Scanner
                onScan={(result) => {
                  if (result && result[0] && result[0].rawValue) {
                    try {
                      const scannedData = JSON.parse(result[0].rawValue);
                      console.log("Scanned Data:", scannedData);

                      if (
                        scannedData.receiver === walletAddress &&
                        scannedData.status === "active"
                      ) {
                        // Find the corresponding transaction
                        const transactionToClaim = transactions.find(
                          (tx) =>
                            tx.receiver === walletAddress &&
                            tx.status === "active" &&
                            tx.amount === scannedData.amount &&
                            tx.token === scannedData.token &&
                            (tx.verificationCode === scannedData.code ||
                              tx.plainCode === scannedData.code)
                        );

                        if (transactionToClaim) {
                          console.log(
                            "Transaction found, claiming:",
                            transactionToClaim
                          );
                          setScanningQR(false); // Close scanner
                          handleClaim(transactionToClaim); // Trigger claim process
                        } else {
                          console.warn(
                            "No matching active transaction found for scanned data."
                          );
                          toast({
                            title: "Scan Failed",
                            description:
                              "No matching active transaction found.",
                            variant: "destructive",
                          });
                        }
                      } else if (scannedData.receiver !== walletAddress) {
                        console.warn(
                          "Scanned QR code is not for your address."
                        );
                        toast({
                          title: "Scan Failed",
                          description:
                            "This QR code is not for your wallet address.",
                          variant: "destructive",
                        });
                      } else if (scannedData.status !== "active") {
                        console.warn(
                          "Scanned QR code is not for an active transaction."
                        );
                        toast({
                          title: "Scan Failed",
                          description:
                            "This QR code is not for an active transaction.",
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      console.error(
                        "Error parsing scanned QR code data:",
                        error
                      );
                      toast({
                        title: "Scan Failed",
                        description: "Invalid QR code data format.",
                        variant: "destructive",
                      });
                    }
                  } else {
                    console.warn("No QR code data detected.");
                    toast({
                      title: "Scan Failed",
                      description: "No QR code data detected.",
                      variant: "destructive",
                    });
                  }
                }}
                onError={(error) => {
                  console.error("QR Scanner Error:", error);
                  toast({
                    title: "Scanner Error",
                    description: "Could not access camera or scan QR code.",
                    variant: "destructive",
                  });
                  setScanningQR(false); // Close scanner on error
                }}
                constraints={{
                  facingMode: "environment", // Use rear camera
                }}
                // Add styles or components as needed
              />
            </div>
            <div className="mt-4">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 transition-colors"
                onClick={() => setScanningQR(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
