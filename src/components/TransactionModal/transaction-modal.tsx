"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { is } from "date-fns/locale";

interface Transaction {
  transactionDigest: string;
  sender: string;
  receiver: string;
  amount: number;
  status: "active" | "completed" | "claimed" | "rejected" | "refunded";
  plainCode?: string;
  timestamp: Date;
  updatedDigest?: string;
  id?: string;
  token?: string;
  type?: "sent" | "received";
  isBulk?: boolean;
}

interface TransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
  verifyTransaction: (
    digest: string,
    code: string,
    receiverAddress: string
  ) => Promise<boolean>;
  claimFunds: (amount: number) => Promise<any>;
  refundFunds: (amount: number) => Promise<any>;
  verifyBulkTransaction: (
    digest: string,
    code: string,
    receiverAddress: string
  ) => Promise<boolean>;
  updateBulkTransactionStatus: (
    digest: string,
    recipientAddress: string,
    status: "active" | "completed" | "claimed" | "rejected" | "refunded",
    newDigest?: string
  ) => Promise<void>;
  updateTransactionStatus: (
    digest: string,
    status: "active" | "completed" | "claimed" | "rejected" | "refunded",
    newDigest?: string
  ) => Promise<void>;
  onSuccess?: () => void; // Add this prop
}

export default function TransactionModal({
  transaction,
  isOpen,
  onClose,
  walletAddress,
  verifyTransaction,
  claimFunds,
  verifyBulkTransaction,
  updateBulkTransactionStatus,
  updateTransactionStatus,
  onSuccess,
  refundFunds,
}: TransactionModalProps) {
  const [verificationCode, setVerificationCode] = useState<string[]>(
    Array(6).fill("")
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundError, setRefundError] = useState(false);
  const [refundSuccess, setRefundSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isSender = transaction?.sender === walletAddress;
  const isReceiver = transaction?.receiver === walletAddress;

  useEffect(() => {
    if (isOpen && transaction) {
      setVerificationCode(Array(6).fill(""));
      setVerificationError(false);
      setVerificationSuccess(false);
      setClaimError(false);
      setClaimSuccess(false);
    }
  }, [isOpen, transaction]);

  useEffect(() => {
    if (isOpen && isReceiver && inputRefs.current[0]) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen, isReceiver]);

  const handleInputChange = (index: number, value: string) => {
    if (!value) {
      const newCode = [...verificationCode];
      newCode[index] = "";
      setVerificationCode(newCode);

      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }

    value = value.toUpperCase();

    if (value.length > 1) {
      value = value.slice(-1);
    }

    if (/^[A-Z0-9]$/.test(value)) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);

      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace") {
      if (verificationCode[index] === "") {
        if (index > 0) {
          const newCode = [...verificationCode];
          newCode[index - 1] = "";
          setVerificationCode(newCode);
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        const newCode = [...verificationCode];
        newCode[index] = "";
        setVerificationCode(newCode);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    const pastedCode = pastedData
      .replace(/\s+/g, "")
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6)
      .split("");

    if (pastedCode.length > 0) {
      const newCode = Array(6).fill("");
      pastedCode.forEach((char, index) => {
        if (index < 6) {
          newCode[index] = char;
        }
      });

      setVerificationCode(newCode);

      const lastFilledIndex = Math.min(pastedCode.length - 1, 5);
      const nextEmptyIndex = newCode.findIndex((val) => val === "");

      if (nextEmptyIndex !== -1) {
        inputRefs.current[nextEmptyIndex]?.focus();
      } else {
        inputRefs.current[lastFilledIndex]?.focus();
      }
    }
  };

  const isCodeComplete = () => {
    return verificationCode.every((digit) => digit !== "");
  };

  const handleVerify = async () => {
    if (!transaction) return;

    const code = verificationCode.join("");
    if (code.length !== 6) return;

    setIsVerifying(true);
    setVerificationError(false);

    try {
      let result;
      if (transaction.isBulk) {
        result = await verifyBulkTransaction(
          transaction.transactionDigest,
          code,
          transaction.receiver
        );
      } else {
        result = await verifyTransaction(
          transaction.transactionDigest,
          code,
          transaction.receiver
        );
      }

      if (result) {
        setVerificationSuccess(true);
      } else {
        setVerificationError(true);
        setVerificationCode(Array(6).fill(""));
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationError(true);
      setVerificationCode(Array(6).fill(""));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClaim = async () => {
    if (!transaction || !verificationSuccess) return;

    setIsClaiming(true);
    setClaimError(false);

    try {
      const result = await claimFunds(transaction.amount);
      if (result.success) {
        if (transaction.isBulk) {
          await updateBulkTransactionStatus(
            transaction.transactionDigest,
            transaction.receiver,
            "claimed",
            result.data.transactionId
          );
        } else {
          await updateTransactionStatus(
            transaction.transactionDigest,
            "claimed",
            result.data.transactionId
          );
        }
        onSuccess?.();
        setClaimSuccess(true);
        setTimeout(() => {
          onClose();
        }, 50);
      }
    } catch (error) {
      console.error("Claim error:", error);
      setClaimError(true);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleReject = async () => {
    if (!transaction || !verificationSuccess) return;

    setIsRejecting(true);
    try {
      if (transaction.isBulk) {
        await updateBulkTransactionStatus(
          transaction.transactionDigest,
          transaction.receiver,
          "rejected"
        );
      } else {
        await updateTransactionStatus(
          transaction.transactionDigest,
          "rejected"
        );
      }
      onSuccess?.(); // Call onSuccess after successful rejection
      onClose();
    } catch (error) {
      console.error("Reject error:", error);
    } finally {
      setIsRejecting(false);
    }
  };

  const copyVerificationCode = () => {
    if (transaction?.plainCode) {
      navigator.clipboard.writeText(transaction.plainCode);
      toast({
        title: "Success",
        description: "Copied successfully",
      });
    }
  };

  const handleRefund = async () => {
    if (!transaction) return;

    setIsRefunding(true);
    setRefundError(false);

    try {
      const result = await refundFunds(transaction.amount);
      if (result.success) {
        if (transaction.isBulk) {
          await updateBulkTransactionStatus(
            transaction.transactionDigest,
            transaction.receiver,
            "refunded",
            result.data.transactionId
          );
        } else {
          await updateTransactionStatus(
            transaction.transactionDigest,
            "refunded",
            result.data.transactionId
          );
        }
        onSuccess?.();
        setRefundSuccess(true);
        setTimeout(() => {
          onClose();
        }, 50);
      }
    } catch (error) {
      console.error("Refund error:", error);
      setRefundError(true);
    } finally {
      setIsRefunding(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !transaction) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md"
          >
            <Card className="bg-[#0a1930] border-[#1a2a40] text-white overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 opacity-50"></div>
              <CardHeader className="relative z-10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Transaction Details</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(transaction.timestamp), {
                    addSuffix: true,
                  })}
                </div>
              </CardHeader>
              <CardContent className="relative z-10 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-400">Status</div>
                  <Badge
                    variant="outline"
                    className="bg-yellow-900/30 text-yellow-400 border-yellow-800 border"
                  >
                    Active
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-400">Amount</div>
                  <div className="font-medium">{transaction.amount} SUI</div>
                </div>

                {isSender && (
                  <>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-400">Receiver</div>
                      <div className="font-mono text-sm bg-[#061020] p-2 rounded-md overflow-x-auto">
                        {transaction.receiver}
                      </div>
                    </div>

                    {transaction.plainCode &&
                      transaction.status === "active" && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-400">
                              Verification Token
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full"
                              onClick={copyVerificationCode}
                            >
                              <Copy className="h-4 w-4 text-green-400" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-400">
                            Share this token with the receiver to verify the
                            transaction
                          </p>
                        </div>
                      )}
                  </>
                )}

                {isReceiver && (
                  <>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-400">Sender</div>
                      <div className="font-mono text-sm bg-[#061020] p-2 rounded-md overflow-x-auto">
                        {transaction.sender}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-gray-400">
                        Enter Verification Code
                      </div>
                      <div className="flex justify-between gap-2">
                        {Array(6)
                          .fill(0)
                          .map((_, index) => (
                            <input
                              key={index}
                              ref={(el) => {
                                inputRefs.current[index] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={verificationCode[index]}
                              onChange={(e) =>
                                handleInputChange(index, e.target.value)
                              }
                              onKeyDown={(e) => handleKeyDown(index, e)}
                              onPaste={handlePaste}
                              className={`w-full h-12 text-center font-mono text-lg bg-[#061020] border ${
                                verificationError
                                  ? "border-red-500 animate-shake"
                                  : "border-[#1a2a40] focus:border-blue-500"
                              } rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500`}
                            />
                          ))}
                      </div>

                      {verificationError && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 text-red-400 text-sm"
                        >
                          <AlertCircle className="h-4 w-4" />
                          <span>
                            Invalid verification code. Please try again.
                          </span>
                        </motion.div>
                      )}

                      {verificationSuccess && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 text-green-400 text-sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Verification successful!</span>
                        </motion.div>
                      )}

                      {claimError && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 text-red-400 text-sm"
                        >
                          <AlertCircle className="h-4 w-4" />
                          <span>Failed to claim funds. Please try again.</span>
                        </motion.div>
                      )}

                      {claimSuccess && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 text-green-400 text-sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Funds claimed successfully!</span>
                        </motion.div>
                      )}
                    </div>
                  </>
                )}

                {refundError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-red-400 text-sm"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>Failed to refund funds. Please try again.</span>
                  </motion.div>
                )}

                {refundSuccess && transaction.status === "refunded" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-green-400 text-sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Funds refunded successfully!</span>
                  </motion.div>
                )}
              </CardContent>
              <CardFooter className="relative z-10 flex gap-3">
                {isSender &&
                  (transaction.status === "active" ||
                    transaction.status === "rejected") && (
                    <Button
                      variant="destructive"
                      className="w-full bg-red-600 hover:bg-red-700"
                      disabled={isRefunding}
                      onClick={handleRefund}
                    >
                      {isRefunding ? "Refunding..." : "Refund Transaction"}
                    </Button>
                  )}

                {isReceiver && (
                  <>
                    {!verificationSuccess ? (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={isVerifying || !isCodeComplete()}
                        onClick={handleVerify}
                      >
                        {isVerifying ? "Verifying..." : "Verify Code"}
                      </Button>
                    ) : (
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="destructive"
                          className="w-full"
                          disabled={isRejecting || isClaiming}
                          onClick={handleReject}
                        >
                          {isRejecting ? "Rejecting..." : "Reject"}
                        </Button>
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          disabled={isClaiming || isRejecting}
                          onClick={handleClaim}
                        >
                          {isClaiming ? "Claiming..." : "Claim Funds"}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
