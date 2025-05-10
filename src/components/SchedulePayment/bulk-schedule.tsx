"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Plus,
  X,
  ArrowRight,
  Search,
  CheckCircle,
  FileText,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePayroll } from "@/hooks/usePayroll";
import { useContract } from "@/hooks/useContract";
import { useWalletContext } from "@/lib/wallet-context";
import { toast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useSchedule } from "@/hooks/useSchedule";
import { format, isBefore, startOfDay } from "date-fns";
import { Label } from "../ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserProfile } from "@/hooks/useUserProfile";

interface Payment {
  id: string;
  username: string;
  email: string;
  recipient: string;
  amount: string;
}

interface TimeSelection {
  hours: string;
  minutes: string;
}

// Add this validation function at the top level along with other functions
const isValidAmount = (amount: string) => {
  const numAmount = Number(amount);
  return !isNaN(numAmount) && numAmount > 0;
};

export default function BulkPayment() {
  const [scheduleDate, setScheduleDate] = useState<Date>();
  const [payments, setPayments] = useState<Payment[]>([
    { id: "1", username: "", email: "", recipient: "", amount: "" },
  ]);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [payrollList, setPayrollList] = useState<any[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<string>("");
  const [selectedPayrollData, setSelectedPayrollData] = useState<any>(null);
  const [showManualEntry, setShowManualEntry] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<TimeSelection>({
    hours: "12",
    minutes: "00",
  });
  const [currentUser, setCurrentUser] = useState<any>({});

  // Get wallet address and contract functions
  const { walletAddress } = useWalletContext() as any;
  const { payrolls, getPayrolls, getPayrollByName } = usePayroll();
  const { scheduleTransaction } = useSchedule();
  const {
    fetchUserByAddress,
    userProfile,
    isLoading: isGetting,
    fetchUserByEmail,
    fetchUserByUsername,
  } = useUserProfile();

  const { sendSecureBulkPayment, getUserBalance } = useContract();

  function isTimeValid(
    date: Date | undefined,
    hours: string,
    minutes: string
  ): boolean {
    if (!date) return false;

    const now = new Date();
    const selectedDate = new Date(date);
    selectedDate.setHours(Number.parseInt(hours));
    selectedDate.setMinutes(Number.parseInt(minutes));

    return selectedDate > now;
  }

  const generateTimeOptions = () => {
    const now = new Date();
    const hours = Array.from({ length: 24 }, (_, i) =>
      i.toString().padStart(2, "0")
    );
    const minutes = Array.from({ length: 60 }, (_, i) =>
      i.toString().padStart(2, "0")
    );

    // If today is selected, filter out past hours and minutes
    if (scheduleDate) {
      const isToday =
        scheduleDate.getDate() === now.getDate() &&
        scheduleDate.getMonth() === now.getMonth() &&
        scheduleDate.getFullYear() === now.getFullYear();

      if (isToday) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        return {
          hours: hours.filter((h) => Number.parseInt(h) >= currentHour),
          minutes:
            selectedTime.hours === currentHour.toString().padStart(2, "0")
              ? minutes.filter((m) => Number.parseInt(m) > currentMinute)
              : minutes,
        };
      }
    }

    return { hours, minutes };
  };

  // Fetch payrolls when component mounts
  useEffect(() => {
    const fetchPayrolls = async () => {
      if (walletAddress) {
        await getPayrolls(walletAddress);
      }
    };

    fetchPayrolls();
  }, [walletAddress, getPayrolls]);

  // Update payroll list when payrolls change
  useEffect(() => {
    if (payrolls && payrolls.length > 0) {
      setPayrollList(payrolls);
    }
  }, [payrolls]);

  // Calculate total amount whenever payments change
  useEffect(() => {
    const sum = payments.reduce((acc, payment) => {
      // Only add to total if amount is valid (greater than 0 and not NaN)
      return (
        acc +
        (payment.amount && isValidAmount(payment.amount)
          ? Number.parseFloat(payment.amount)
          : 0)
      );
    }, 0);
    setTotalAmount(sum);
  }, [payments]);

  // Get current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (walletAddress) {
        try {
          if (!userProfile && !isGetting) {
            fetchUserByAddress(walletAddress);
          }
          if (userProfile) {
            setCurrentUser(userProfile);
          }
        } catch (error) {
          console.error("Error fetching current user:", error);
        }
      }
    };

    fetchCurrentUser();
  }, [walletAddress, userProfile, isGetting, fetchUserByAddress]);

  // Handle payroll selection
  const handlePayrollSelect = async (payrollName: string) => {
    // If selecting "none", reset to manual entry
    if (payrollName === "none") {
      setSelectedPayroll("");
      setSelectedPayrollData(null);
      setShowManualEntry(true);
      setPayments([
        { id: "1", username: "", email: "", recipient: "", amount: "" },
      ]);
      return;
    }

    setSelectedPayroll(payrollName);

    try {
      // Get the payroll data by name
      const payrollData = await getPayrollByName(payrollName, walletAddress);

      if (payrollData && payrollData.recipients) {
        setSelectedPayrollData(payrollData);
        setShowManualEntry(false);

        // Create new payments from the payroll recipients
        const newPayments = await Promise.all(
          payrollData.recipients.map(async (recipient: any, index: number) => {
            // Try to get additional user info
            let userData = null;
            try {
              userData = await fetchUserByAddress(recipient.address);
            } catch (error) {
              console.error("Error fetching user data:", error);
            }

            return {
              id: Date.now().toString() + index,
              username: userData?.username || "",
              email: userData?.email || "",
              recipient: recipient.address,
              amount: recipient.amount.toString(),
            };
          })
        );

        setPayments(newPayments);

        toast({
          title: "Payroll Selected",
          description: `Loaded ${newPayments.length} recipients from "${payrollData.name}"`,
        });
      }
    } catch (error) {
      console.error("Error fetching payroll data:", error);
      toast({
        title: "Error",
        description: "Failed to load payroll data",
        variant: "destructive",
      });
    }
  };

  // Switch to manual entry mode
  const switchToManualEntry = () => {
    setSelectedPayroll("");
    setSelectedPayrollData(null);
    setShowManualEntry(true);
    setPayments([
      { id: "1", username: "", email: "", recipient: "", amount: "" },
    ]);
  };

  const addPayment = () => {
    setPayments([
      ...payments,
      {
        id: Date.now().toString(),
        username: "",
        email: "",
        recipient: "",
        amount: "",
      },
    ]);
  };

  const removePayment = (id: string) => {
    setPayments(payments.filter((payment) => payment.id !== id));
  };

  // Replace the updatePayment function with this version
  const updatePayment = (id: string, field: keyof Payment, value: string) => {
    // For amount field, prevent 'e', 'E', '+', '-' characters
    if (field === "amount" && /[eE+-]/.test(value)) {
      return;
    }

    // Update the payment
    setPayments(
      payments.map((payment) =>
        payment.id === id ? { ...payment, [field]: value } : payment
      )
    );
  };

  // Modify the verifyRecipient function to prevent redirects on errors
  const verifyRecipient = async (id: string) => {
    const payment = payments.find((p) => p.id === id);

    if (!payment?.recipient) return;

    try {
      // Validate address format
      if (
        !payment.recipient.startsWith("0x") ||
        payment.recipient.length < 10
      ) {
        toast({
          variant: "destructive",
          title: "Invalid Address",
          description: "Please enter a valid wallet address",
        });
        return; // Just return, don't redirect
      }

      // Check if trying to add current wallet address
      if (payment.recipient === walletAddress) {
        toast({
          variant: "destructive",
          title: "Invalid Address",
          description: "You cannot add your own wallet address as a recipient",
        });

        // Mark as invalid but don't redirect
        setPayments(
          payments.map((p) =>
            p.id === id
              ? {
                  ...p,
                  isValid: false,
                }
              : p
          )
        );
        return;
      }

      // Get user data
      const userData = await fetchUserByAddress(payment.recipient);

      if (userData) {
        // Update payment with user data
        setPayments(
          payments.map((p) =>
            p.id === id
              ? {
                  ...p,
                  username: userData.username || p.username,
                  email: userData.email || p.email,
                  isValid: true,
                }
              : p
          )
        );

        toast({
          title: "Recipient Verified",
          description: "Recipient details retrieved successfully",
        });
      }
    } catch (error) {
      console.error("Error verifying recipient:", error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Could not verify recipient details",
      });
      // Don't throw or redirect on error, just log it
    }
  };

  // Similarly update verifyRecipientByUsername to prevent redirects
  const verifyRecipientByUsername = async (id: string) => {
    const payment = payments.find((p) => p.id === id);

    if (!payment?.username) return;

    // Check if trying to add current username
    if (
      payment.username &&
      currentUser &&
      payment.username === currentUser.username
    ) {
      toast({
        variant: "destructive",
        title: "Invalid Username",
        description: "You cannot add your own username as a recipient",
      });

      // Mark as invalid but don't redirect
      setPayments(
        payments.map((p) =>
          p.id === id
            ? {
                ...p,
                isValid: false,
              }
            : p
        )
      );
      return;
    }

    try {
      // Get user data by username
      const userData = await fetchUserByUsername(
        payment.username,
        walletAddress
      );

      if (userData) {
        // Update payment with user data
        setPayments(
          payments.map((p) =>
            p.id === id
              ? {
                  ...p,
                  recipient: userData.walletAddress || p.recipient,
                  email: userData.email || p.email,
                  isValid: true,
                }
              : p
          )
        );

        toast({
          title: "Recipient Verified",
          description: "Recipient details retrieved by username successfully",
        });
      } else {
        toast({
          variant: "destructive",
          title: "User Not Found",
          description: "No user found with this username",
        });
      }
    } catch (error) {
      console.error("Error verifying recipient by username:", error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Could not verify recipient details",
      });
      // Don't throw or redirect on error, just log it
    }
  };

  // Update verifyRecipientByEmail to prevent redirects
  const verifyRecipientByEmail = async (id: string) => {
    const payment = payments.find((p) => p.id === id);

    if (!payment?.email) return;

    try {
      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payment.email)) {
        toast({
          variant: "destructive",
          title: "Invalid Email",
          description: "Please enter a valid email address",
        });
        return; // Just return, don't redirect
      }

      // Check if trying to add current email
      if (payment.email && currentUser && payment.email === currentUser.email) {
        toast({
          variant: "destructive",
          title: "Invalid Email",
          description: "You cannot add your own email as a recipient",
        });

        // Mark as invalid but don't redirect
        setPayments(
          payments.map((p) =>
            p.id === id
              ? {
                  ...p,
                  isValid: false,
                }
              : p
          )
        );
        return;
      }

      // Get user data by email
      const userData = await fetchUserByEmail(payment.email, walletAddress);

      if (userData) {
        // Update payment with user data
        setPayments(
          payments.map((p) =>
            p.id === id
              ? {
                  ...p,
                  recipient: userData.walletAddress || p.recipient,
                  username: userData.username || p.username,
                  isValid: true,
                }
              : p
          )
        );

        toast({
          title: "Recipient Verified",
          description: "Recipient details retrieved by email successfully",
        });
      } else {
        toast({
          variant: "destructive",
          title: "User Not Found",
          description: "No user found with this email",
        });
      }
    } catch (error) {
      console.error("Error verifying recipient by email:", error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Could not verify recipient details",
      });
      // Don't throw or redirect on error, just log it
    }
  };

  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use the new validation function to filter valid payments
    const validPayments = payments.filter(
      (p) => p.recipient && p.amount && isValidAmount(p.amount)
    );

    // Validation checks
    if (validPayments.length === 0) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description:
          "Please add at least one recipient with a valid amount greater than 0",
      });
      return; // Just return, don't redirect
    }

    if (!scheduleDate) {
      toast({
        variant: "destructive",
        title: "Invalid Date",
        description: "Please select a valid schedule date",
      });
      return; // Just return, don't redirect
    }

    // Validate time
    if (!isTimeValid(scheduleDate, selectedTime.hours, selectedTime.minutes)) {
      toast({
        variant: "destructive",
        title: "Invalid Time",
        description: "Please select a future time for today's date",
      });
      return; // Just return, don't redirect
    }

    // Check for invalid addresses
    const hasInvalidAddresses = payments.some(
      (p) => p.recipient && !p.recipient.startsWith("0x")
    );

    if (hasInvalidAddresses) {
      toast({
        variant: "destructive",
        title: "Invalid Addresses",
        description: "Please correct the invalid addresses before continuing",
      });
      return; // Just return, don't redirect
    }

    try {
      setIsLoading(true);

      const recipients = validPayments.map((p) => ({
        address: p.recipient,
        amount: Number(p.amount),
        status: "pending" as const,
      }));

      const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);

      // Check balance
      const { suiBalance: balance, usdcBalance } =
        await getUserBalance(walletAddress);
      if (totalAmount > Number(balance)) {
        toast({
          variant: "destructive",
          title: "Insufficient Balance",
          description: `You need ${totalAmount} SUI but only have ${balance} SUI`,
        });
        setIsLoading(false);
        return; // Just return, don't redirect
      }

      // Send payment
      const result = await sendSecureBulkPayment(
        recipients.map((r) => r.address),
        recipients.map((r) => r.amount),
        totalAmount
      );

      if (!result?.success) {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: result?.error || "Failed to send payment",
        });
        return; // Just return, don't redirect
      }

      // Update in the handleSubmit function, before calling scheduleTransaction
      const scheduledDateTime = new Date(scheduleDate);
      scheduledDateTime.setHours(Number.parseInt(selectedTime.hours));
      scheduledDateTime.setMinutes(Number.parseInt(selectedTime.minutes));

      // Use scheduledDateTime instead of scheduleDate
      const transactionData = {
        transactionDigest: result.data?.transactionId as string,
        sender: walletAddress,
        recipients: recipients.map((r) => ({
          address: r.address,
          amount: r.amount,
          status: r.status,
        })),
        totalAmount,
        scheduledDate: scheduledDateTime,
        status: "pending",
      };

      await scheduleTransaction("bulk", transactionData);

      // Reset form
      setPayments([
        { id: "1", username: "", email: "", recipient: "", amount: "" },
      ]);
      setCurrentStep(1);
      setSelectedPayroll("");
      setSelectedPayrollData(null);
      setShowManualEntry(true);

      toast({
        title: "Success",
        description: "Payment scheduled successfully",
      });
    } catch (error) {
      console.error("Schedule payment error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to schedule payment",
      });
      // Don't throw or redirect on error, just log it
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="w-full bg-[#061020] h-1 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-blue-600"
          initial={{ width: `${((currentStep - 1) / 2) * 100}%` }}
          animate={{ width: `${(currentStep / 2) * 100}%` }}
          transition={{ duration: 0.3 }}
        ></motion.div>
      </div>

      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step1"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, x: -50 }}
            variants={fadeIn}
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-medium mb-2">Add Recipients</h3>
              <p className="text-gray-400 text-sm">
                Add multiple recipients and specify amounts
              </p>
            </div>

            {/* Payroll selection section */}
            <div className="bg-[#061020]/80 rounded-lg border border-[#1a2a40] overflow-hidden">
              <div className="p-4 border-b border-[#1a2a40] bg-[#0a1930]/50">
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Select Payment Source
                </h4>
              </div>

              <div className="p-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-1">
                    <Select
                      value={selectedPayroll || "none"}
                      onValueChange={handlePayrollSelect}
                    >
                      <SelectTrigger className="w-full bg-[#061020] border-[#1a2a40] text-white">
                        <SelectValue placeholder="Select a payroll or enter manually" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a1930] border-[#1a2a40] text-white">
                        <SelectItem value="none">Manual Entry</SelectItem>
                        {payrollList.map((payroll) => (
                          <SelectItem key={payroll.name} value={payroll.name}>
                            {payroll.name} ({payroll.recipients?.length || 0}{" "}
                            recipients)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedPayrollData && (
                    <Button
                      variant="blueWhite"
                      size="sm"
                      className="border-[#1a2a40] text-blue-400 hover:bg-blue-900/20"
                      onClick={switchToManualEntry}
                    >
                      Switch to Manual Entry
                    </Button>
                  )}
                </div>

                {/* Selected payroll info */}
                {selectedPayrollData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 bg-blue-900/10 border border-blue-800/30 rounded-lg p-4"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3">
                      <div>
                        <h3 className="font-medium text-lg">
                          {selectedPayrollData.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {selectedPayrollData.description ||
                            "No description available"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant="outline"
                          className="bg-blue-900/30 text-blue-400 border-blue-800"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          {selectedPayrollData.recipients?.length || 0}{" "}
                          Recipients
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-blue-900/30 text-blue-400 border-blue-800"
                        >
                          {selectedPayrollData.totalAmount?.toFixed(2) ||
                            "0.00"}{" "}
                          SUI
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Recipients section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Recipients</h4>
                {selectedPayrollData && (
                  <p className="text-sm text-gray-400">
                    Using recipients from payroll "{selectedPayrollData.name}"
                  </p>
                )}
              </div>
              <p className="text-sm text-blue-400 mb-4">
                Click the{" "}
                {<CheckCircle className="inline-block h-3 w-3 mr-1" />}next to
                any field to verify recipient information
              </p>

              {/* Show recipients */}
              {payments.map((payment, index) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="bg-[#061020]/80 p-4 rounded-lg border border-[#1a2a40] relative"
                >
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex flex-1 min-w-[200px] gap-4">
                      <div className="flex-1">
                        <div className="text-sm text-gray-400 mb-1.5">
                          Username
                        </div>
                        <div className="relative">
                          <Input
                            value={payment.username}
                            onChange={(e) =>
                              updatePayment(
                                payment.id,
                                "username",
                                e.target.value
                              )
                            }
                            placeholder="Username"
                            className="bg-[#061020] border-[#1a2a40] text-white"
                            readOnly={!showManualEntry}
                          />
                          {payment.username && showManualEntry && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <CheckCircle
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500 cursor-pointer hover:text-green-400 transition-colors"
                                    onClick={() =>
                                      verifyRecipientByUsername(payment.id)
                                    }
                                  />
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p>Click to verify username</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-400 mb-1.5">
                          Email
                        </div>
                        <div className="relative">
                          <Input
                            value={payment.email}
                            onChange={(e) =>
                              updatePayment(payment.id, "email", e.target.value)
                            }
                            placeholder="email@example.com"
                            className="bg-[#061020] border-[#1a2a40] text-white"
                            readOnly={!showManualEntry}
                          />
                          {payment.email && showManualEntry && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <CheckCircle
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500 cursor-pointer hover:text-green-400 transition-colors"
                                    onClick={() =>
                                      verifyRecipientByEmail(payment.id)
                                    }
                                  />
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p>Click to verify email</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 min-w-[200px]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-gray-400">
                          Recipient Address
                        </span>
                        {showManualEntry && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
                          >
                            <Search className="h-3 w-3 mr-1" />
                            Search
                          </Button>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          value={payment.recipient}
                          onChange={(e) =>
                            updatePayment(
                              payment.id,
                              "recipient",
                              e.target.value
                            )
                          }
                          placeholder="0x..."
                          className="bg-[#061020] border-[#1a2a40] text-white pr-8"
                          readOnly={!showManualEntry}
                        />
                        {payment.recipient && showManualEntry && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <CheckCircle
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500 cursor-pointer hover:text-green-400 transition-colors"
                                  onClick={() => verifyRecipient(payment.id)}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Click to verify wallet address</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>

                    <div className="w-[120px]">
                      <div className="text-sm text-gray-400 mb-1.5">
                        Amount (SUI)
                      </div>
                      <Input
                        value={payment.amount}
                        onChange={(e) =>
                          updatePayment(payment.id, "amount", e.target.value)
                        }
                        required
                        type="number"
                        placeholder="0.00"
                        className="bg-[#061020] border-[#1a2a40] text-white"
                      />
                      {payment.amount && !isValidAmount(payment.amount) && (
                        <p className="text-sm text-red-400 mt-1">
                          Please enter an amount greater than 0
                        </p>
                      )}
                    </div>
                  </div>

                  {payments.length > 1 && showManualEntry && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePayment(payment.id)}
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-[#061020] border border-[#1a2a40] text-gray-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex gap-2 justify-between items-center">
              {showManualEntry && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="blueWhite"
                    onClick={addPayment}
                    className="border-[#1a2a40] text-blue-400 hover:bg-blue-900/20"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipient
                  </Button>
                </div>
              )}

              {!showManualEntry && payments.length === 0 && (
                <p className="text-sm text-gray-400">
                  No recipients in this payroll
                </p>
              )}

              <div className="text-right ml-auto">
                <span className="text-gray-400 mr-2">Total Amount:</span>
                <span className="font-bold text-lg">
                  {totalAmount.toFixed(4)} SUI
                </span>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <div className="text-sm text-gray-400 mb-1">
                Schedule Date (Required)
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="blueWhite"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-[#061020]/70 border-[#1a2a40] text-white",
                      !scheduleDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduleDate
                      ? format(scheduleDate, "PPP") +
                        ` at ${selectedTime.hours}:${selectedTime.minutes}`
                      : "Select schedule date and time"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-[#0a1930] border-[#1a2a40]"
                  align="center"
                >
                  <div className="p-3">
                    <Calendar
                      mode="single"
                      required={true}
                      selected={scheduleDate}
                      onSelect={setScheduleDate}
                      disabled={(date) =>
                        isBefore(date, startOfDay(new Date()))
                      }
                      initialFocus
                      className="bg-[#0a1930] text-white rounded-none"
                      classNames={{
                        months:
                          "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4",
                        caption:
                          "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium text-white",
                        nav: "space-x-1 flex items-center",
                        nav_button:
                          "h-7 w-7 bg-transparent p-0 text-gray-300 hover:text-white hover:bg-[#061020]",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex w-full",
                        head_cell:
                          "text-gray-400 w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm relative p-0 [&:has([aria-selected])]:bg-[#061020] first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-[#061020] rounded-md",
                        day_selected:
                          "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white",
                        day_today: "bg-[#061020] text-white",
                        day_outside: "text-gray-600 opacity-50",
                        day_disabled: "text-gray-400 opacity-50",
                        day_hidden: "invisible",
                      }}
                    />
                    <div className="border-t border-[#1a2a40] mt-3 pt-3 flex items-center gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-gray-400">Hour</Label>
                        <Select
                          value={selectedTime.hours}
                          onValueChange={(value) =>
                            setSelectedTime((prev) => ({
                              ...prev,
                              hours: value,
                            }))
                          }
                        >
                          <SelectTrigger className="bg-[#061020]/70 border-[#1a2a40] text-white">
                            <SelectValue placeholder="Hour" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0a1930] border-[#1a2a40] text-white max-h-[200px]">
                            {generateTimeOptions().hours.map((hour) => (
                              <SelectItem key={hour} value={hour}>
                                {hour}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-gray-400">Minute</Label>
                        <Select
                          value={selectedTime.minutes}
                          onValueChange={(value) =>
                            setSelectedTime((prev) => ({
                              ...prev,
                              minutes: value,
                            }))
                          }
                        >
                          <SelectTrigger className="bg-[#061020]/70 border-[#1a2a40] text-white">
                            <SelectValue placeholder="Minute" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0a1930] border-[#1a2a40] text-white max-h-[200px]">
                            {generateTimeOptions().minutes.map((minute) => (
                              <SelectItem key={minute} value={minute}>
                                {minute}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Button
              onClick={nextStep}
              className="bg-blue-600 hover:bg-blue-700 transition-all w-full"
              disabled={
                payments.every(
                  (p) => !p.recipient || !p.amount || !isValidAmount(p.amount)
                ) ||
                !scheduleDate ||
                (scheduleDate &&
                  !isTimeValid(
                    scheduleDate,
                    selectedTime.hours,
                    selectedTime.minutes
                  ))
              }
            >
              Review Payment <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step2"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, x: -50 }}
            variants={fadeIn}
            className="space-y-6"
          >
            <div>
              <h3 className="text-xl font-medium mb-2">Confirm Bulk Payment</h3>
              <p className="text-gray-400 text-sm">
                Review and confirm your payment details
              </p>
            </div>

            <div className="bg-[#061020]/70 p-5 rounded-lg border border-[#1a2a40]">
              <h3 className="font-medium text-lg mb-4">Payment Summary</h3>

              {selectedPayrollData && (
                <div className="mb-4 pb-4 border-b border-[#1a2a40]">
                  <p className="text-sm text-gray-400">Source Payroll:</p>
                  <p className="font-medium">{selectedPayrollData.name}</p>
                </div>
              )}

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {payments
                  .filter((p) => p.recipient && p.amount)
                  .map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-md bg-[#0a1930] border border-[#1a2a40]"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-900/50 text-blue-200 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium truncate">
                            {payment.recipient}
                          </p>
                          {(payment.username || payment.email) && (
                            <p className="text-xs text-gray-400">
                              {payment.username && `@${payment.username}`}{" "}
                              {payment.email &&
                                (payment.username
                                  ? `• ${payment.email}`
                                  : payment.email)}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="font-medium">{payment.amount} SUI</p>
                    </motion.div>
                  ))}
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#1a2a40]">
                <div>
                  <p className="text-gray-400">Schedule Date:</p>
                  <p className="font-medium">
                    {scheduleDate
                      ? format(scheduleDate, "PPP")
                      : "Not selected"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400">Total Amount:</p>
                  <p className="text-xl font-bold">
                    {totalAmount.toFixed(4)} SUI
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="blueWhite"
                onClick={prevStep}
                className="border-[#1a2a40] hover:bg-[#0a1930] text-white"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 transition-all flex-1"
                disabled={isLoading}
              >
                Submit Payments
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
