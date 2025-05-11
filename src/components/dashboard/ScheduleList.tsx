"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RotateCw } from "lucide-react";
import { useSchedule } from "@/hooks/useSchedule";
import { format, formatDistance } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useContract } from "@/hooks/useContract";
import { generateVerificationCode, shortenAddress } from "@/utils/helpers";
import { useTransactionStorage } from "@/hooks/useTransactionStorage";
import { sendBulkPaymentEmails, sendPaymentEmail } from "@/hooks/UseEmail";
import { toast } from "@/components/ui/use-toast";
import { useNotifications } from "@/contexts/notifications-context";

interface Recipient {
  address: string;
  amount: number;
}

interface ScheduledTransaction {
  id: string;
  type: "single" | "bulk";
  transactionDigest: string;
  sender: string;
  receiver: string;
  amount: number;
  scheduledDate: Date;
  recipients?: Recipient[];
  recipientsCount?: number;
  totalAmount?: number;
  tokenType: "SUI" | "USDC";
}

interface ScheduleListProps {
  walletAddress: string;
  showAll: boolean;
  onShowAllChange: (value: boolean) => void;
}

export function ScheduleList({
  walletAddress,
  showAll,
  onShowAllChange,
}: ScheduleListProps) {
  const [transactions, setTransactions] = useState<ScheduledTransaction[]>([]);
  const { addTransaction, addBulkTransaction } = useTransactionStorage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { addNotification } = useNotifications();
  const { getSchedules, isLoading, deleteSchedule } = useSchedule();

  const { refundFunds, getUserByAddress } = useContract();
  const [selectedSchedule, setSelectedSchedule] =
    useState<ScheduledTransaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [usernames, setUsernames] = useState<Record<string, string>>({});
  const [now, setNow] = useState(new Date());
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Update current time every minute for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchScheduledTransactions = async () => {
    if (!walletAddress) return;
    setIsRefreshing(true);
    try {
      const response = await getSchedules(walletAddress);

      // Combine and transform single and bulk transactions
      interface SingleTransactionResponse {
        _id?: string;
        transactionDigest: string;
        sender: string;
        receiver: string;
        amount: number;
        scheduledDate: string;
        tokenType: "SUI" | "USDC";
      }

      interface BulkTransactionResponse {
        _id?: string;
        transactionDigest: string;
        sender: string;
        totalAmount: number;
        scheduledDate: string;
        recipients: Recipient[];
        tokenType: "SUI" | "USDC";
      }

      const scheduled: ScheduledTransaction[] = [
        ...response.singleTransactions.map((tx: SingleTransactionResponse) => ({
          id: tx._id || "",
          transactionDigest: tx.transactionDigest,
          type: "single" as const,
          sender: tx.sender,
          receiver: tx.receiver,
          amount: tx.amount,
          scheduledDate: new Date(tx.scheduledDate),
          recipientsCount: 1,
          tokenType: tx.tokenType,
        })),
        ...response.bulkTransactions.map((tx: BulkTransactionResponse) => ({
          id: tx._id || "",
          transactionDigest: tx.transactionDigest,
          type: "bulk" as const,
          sender: tx.sender,
          receiver: "Multiple Recipients",
          amount: tx.totalAmount,
          scheduledDate: new Date(tx.scheduledDate),
          recipientsCount: tx.recipients.length,
          recipients: tx.recipients,
          tokenType: tx.tokenType,
        })),
      ].sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime()); // Latest first

      setTransactions(scheduled);

      // Fetch usernames for all addresses
      const addresses = new Set<string>();
      scheduled.forEach((tx) => {
        addresses.add(tx.sender);
        if (tx.type === "single") {
          addresses.add(tx.receiver);
        } else if (tx.recipients) {
          tx.recipients.forEach((r) => addresses.add(r.address));
        }
      });

      const usernamePromises = Array.from(addresses).map(async (address) => {
        try {
          const userInfo = await getUserByAddress(address);
          if (!userInfo) return;
          const { username, email } = userInfo;
          return { address, username };
        } catch (error) {
          console.error(`Error fetching username for ${address}:`, error);
          return {
            address,
            username: address.slice(0, 6) + "..." + address.slice(-4),
          };
        }
      });

      const result = await Promise.all(usernamePromises);
      const usernameMap: Record<string, string> = {};
      result.forEach((item) => {
        if (!item) return;
        const { address, username } = item;
        const usernameString =
          typeof username === "string" ? username : username || address;
        usernameMap[address] = usernameString;
      });

      setUsernames(usernameMap);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScheduledTransactions();
  }, [walletAddress]);

  // Update the calculateCountdown function to include seconds
  const calculateCountdown = (scheduledDate: Date) => {
    const diffMs = scheduledDate.getTime() - now.getTime();
    if (diffMs <= 0) return { isExpired: true, countdown: "00:00:00" };

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHrs = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

    return {
      isExpired: false,
      countdown: `${diffDays.toString().padStart(2, "0")}:${diffHrs
        .toString()
        .padStart(2, "0")}:${diffMins.toString().padStart(2, "0")}:${diffSecs
        .toString()
        .padStart(2, "0")}`,
    };
  };

  const handleScheduleClick = (transaction: ScheduledTransaction) => {
    if (transaction.sender === walletAddress) {
      setSelectedSchedule(transaction);
      setIsModalOpen(true);
    }
  };

  const handleActivatePayment = async (
    transactionId: string,
    type: "single" | "bulk"
  ) => {
    try {
      const transaction = transactions.find((tx) => tx.id === transactionId);
      if (!transaction) {
        throw new Error("Transaction not found");
      }

      if (type === "single") {
        const verificationCode = generateVerificationCode();

        // Get recipient info
        const recipientInfo = await getUserByAddress(transaction.receiver);

        await addTransaction({
          transactionDigest: transaction.transactionDigest,
          sender: transaction.sender,
          receiver: transaction.receiver,
          amount: transaction.amount,
          status: "active",
          verificationCode,
          tokenType: transaction.tokenType,
        });
        addNotification({
          type: "claim",
          title: "Payment Available to Claim",
          description: `${transaction.sender} sent you ${transaction.amount} ${transaction.tokenType}. Click to claim.`,
          priority: "high",
          transactionId,
        });
        // Send email if recipient has email
        if (recipientInfo?.email) {
          setIsSendingEmail(true);
          try {
            const senderInfo = await getUserByAddress(transaction.sender);
            await sendPaymentEmail({
              recipientEmail: recipientInfo.email,
              senderEmail: senderInfo?.email || transaction.sender,
              amount: transaction.amount.toString(),
              token: transaction.tokenType,
              verificationCode,
            });

            toast({
              title: "Success",
              description: "Payment email sent successfully",
            });
          } catch (error) {
            console.error("Error sending email:", error);
            toast({
              title: "Error",
              description: "Failed to send payment email",
              variant: "destructive",
            });
          } finally {
            setIsSendingEmail(false);
          }
        }
      } else {
        if (!transaction.recipients) {
          throw new Error("No recipients found for bulk transaction");
        }

        // Generate codes and get recipient info
        const recipientDetails = await Promise.all(
          transaction.recipients.map(async (r) => {
            const info = await getUserByAddress(r.address);
            return {
              ...r,
              email: info?.email,
              plainCode: generateVerificationCode(),
            };
          })
        );

        await addBulkTransaction({
          transactionDigest: transaction.transactionDigest,
          sender: transaction.sender,
          recipients: recipientDetails.map((r) => ({
            address: r.address,
            amount: r.amount,
            plainCode: r.plainCode,
            status: "active",
          })),
          totalAmount: transaction.totalAmount ?? 0,
          tokenType: transaction.tokenType,
        });

        // Prepare email payloads for recipients with valid emails
        const senderInfo = await getUserByAddress(transaction.sender);
        const emailPayloads = recipientDetails
          .filter((r) => r.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email))
          .map((r) => ({
            recipientEmail: r.email!,
            senderEmail: senderInfo?.email || transaction.sender,
            amount: r.amount.toString(),
            token: transaction.tokenType,
            verificationCode: r.plainCode,
          }));

        if (emailPayloads.length > 0) {
          try {
            await sendBulkPaymentEmails(emailPayloads);
            toast({
              title: "Success",
              description: `Payment notifications sent to ${emailPayloads.length} recipients`,
            });
          } catch (error) {
            console.error("Failed to send payment notifications:", error);
            toast({
              variant: "destructive",
              title: "Warning",
              description:
                "Payment processed but some notifications failed to send",
            });
          }
        }
      }

      // Delete schedule and refresh
      await deleteSchedule(transactionId, type);
      await fetchScheduledTransactions();
    } catch (error) {
      console.error("Error activating payment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to activate payment",
      });
    }
  };

  const handleCancelPayment = async (
    transactionId: string,
    type: "single" | "bulk"
  ) => {
    try {
      const transaction = transactions.find((tx) => tx.id === transactionId);
      if (!transaction) {
        throw new Error("Transaction not found");
      }

      // Call refundFunds with the correct amount
      await refundFunds(transaction.amount);

      // Delete the schedule
      await deleteSchedule(transactionId, type);

      // Refresh the list
      await fetchScheduledTransactions();

      toast({
        title: "Success",
        description: "Payment cancelled and funds refunded successfully",
      });

      // Close modal if open
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error cancelling payment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel payment",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <RotateCw className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Upcoming Transactions</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchScheduledTransactions}
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
          .slice(0, showAll ? transactions.length : 5)
          .map((transaction, index) => {
            const { isExpired, countdown } = calculateCountdown(
              transaction.scheduledDate
            );
            const isSender = transaction.sender === walletAddress;

            return (
              <motion.div
                key={transaction.id}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-[#1a2a40] last:border-0 hover:bg-[#0a1930]/80 transition-colors ${
                  isSender ? "cursor-pointer" : ""
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                onClick={() => isSender && handleScheduleClick(transaction)}
              >
                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                  <Avatar className="border border-[#1a2a40] bg-[#061020]">
                    <AvatarFallback className="bg-[#061020] text-blue-400">
                      {transaction.receiver.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-white">
                      {transaction.type === "bulk"
                        ? "Bulk Payment"
                        : "Single Payment"}
                    </div>
                    <div className="text-sm text-gray-400">
                      {(transaction.recipientsCount ?? 0) > 1
                        ? `${transaction.recipientsCount} recipients`
                        : usernames[transaction.receiver] ||
                          transaction.receiver}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0">
                  <div className="text-right">
                    <div className="font-medium text-white">
                      {transaction.amount.toFixed(2)} {transaction.tokenType}
                    </div>
                    <div className="text-sm text-gray-400">
                      {format(transaction.scheduledDate, "MMM dd, yyyy")}
                    </div>
                  </div>
                  {isSender && isExpired ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
                        disabled={isSendingEmail || isLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActivatePayment(
                            transaction.id,
                            transaction.type
                          );
                        }}
                      >
                        Activate
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
                        disabled={isSendingEmail || isLoading}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelPayment(transaction.id, transaction.type);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-[#1a2a40] bg-[#061020] text-blue-400"
                    >
                      {countdown}
                    </Badge>
                  )}
                </div>
              </motion.div>
            );
          })}

        {transactions.length === 0 && (
          <div className="text-center py-8">
            <RotateCw className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No scheduled transactions</p>
            <p className="text-sm text-gray-500 mt-1">
              Your scheduled transactions will appear here
            </p>
          </div>
        )}
      </div>

      {transactions.length > 5 && (
        <div className="mt-4 text-center">
          <Button
            variant="link"
            className="text-blue-400 hover:text-blue-300"
            onClick={() => onShowAllChange(!showAll)}
          >
            {showAll ? "Show Less" : "View All Scheduled Transactions"}
          </Button>
        </div>
      )}

      {/* Schedule Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#0a1930] border border-[#1a2a40] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Scheduled Payment Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedSchedule?.type === "bulk"
                ? "Bulk Payment"
                : "Single Payment"}{" "}
              scheduled for{" "}
              {selectedSchedule && (
                <>
                  {format(
                    selectedSchedule.scheduledDate,
                    "MMMM dd, yyyy 'at' h:mm a"
                  )}
                  <br />
                  <span className="text-sm">
                    {formatDistance(
                      selectedSchedule.scheduledDate,
                      new Date(),
                      {
                        addSuffix: true,
                      }
                    )}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedSchedule && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <div className="text-gray-400">Sender:</div>
                <div>
                  {usernames[selectedSchedule.sender] ||
                    selectedSchedule.sender}
                </div>

                <div className="text-gray-400">Total Amount:</div>
                <div>
                  {selectedSchedule.amount.toFixed(2)}{" "}
                  {selectedSchedule.tokenType}
                </div>

                <div className="text-gray-400">Scheduled Date:</div>
                <div>
                  {format(selectedSchedule.scheduledDate, "MMM dd, yyyy")}
                </div>

                <div className="text-gray-400">Scheduled Time:</div>
                <div>{format(selectedSchedule.scheduledDate, "h:mm a")}</div>

                {!calculateCountdown(selectedSchedule.scheduledDate)
                  .isExpired && (
                  <>
                    <div className="text-gray-400">Countdown:</div>
                    <div>
                      {
                        calculateCountdown(selectedSchedule.scheduledDate)
                          .countdown
                      }
                    </div>
                  </>
                )}
              </div>

              {selectedSchedule.type === "bulk" &&
                selectedSchedule.recipients && (
                  <div className="mt-2">
                    <h4 className="font-medium mb-2 text-gray-400">
                      Recipients
                    </h4>
                    <div className="max-h-40 overflow-y-auto border border-[#1a2a40] rounded-md">
                      {selectedSchedule.recipients.map((recipient, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between p-2 border-b border-[#1a2a40] last:border-0"
                        >
                          <div className="truncate max-w-[200px]">
                            {usernames[recipient.address] ||
                              shortenAddress(recipient.address)}
                          </div>
                          <div>
                            {recipient.amount.toFixed(2)}{" "}
                            {selectedSchedule.tokenType}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {selectedSchedule.type === "single" && (
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <div className="text-gray-400">Recipient:</div>
                  <div>
                    {usernames[selectedSchedule.receiver] ||
                      shortenAddress(selectedSchedule.receiver)}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                {calculateCountdown(selectedSchedule.scheduledDate)
                  .isExpired && (
                  <>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer"
                      disabled={isSendingEmail || isLoading}
                      onClick={() => {
                        handleActivatePayment(
                          selectedSchedule.id,
                          selectedSchedule.type
                        );
                        setIsModalOpen(false);
                      }}
                    >
                      Activate Payment
                    </Button>
                    <Button
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
                      disabled={isSendingEmail || isLoading}
                      onClick={() => {
                        handleCancelPayment(
                          selectedSchedule.id,
                          selectedSchedule.type
                        );
                      }}
                    >
                      Cancel Payment
                    </Button>
                  </>
                )}
                <Button
                  variant="blueWhite"
                  className="border-[#1a2a40] hover:bg-[#0a1930]/80"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
