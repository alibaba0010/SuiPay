"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  CreditCard,
  Wallet,
  ArrowRight,
  ChevronLeft,
  FileText,
  ChevronRight,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { format, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { useSchedule } from "@/hooks/useSchedule";
import { useWalletContext } from "@/contexts/wallet-context";
import { useContract } from "@/hooks/useContract";
import { useSuiPrice } from "@/hooks/useSuiPrice";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";

// Add after other interfaces
interface RecipientInfo {
  username?: string;
  email?: string;
  walletAddress: string;
}

interface FormData {
  recipient: string;
  amount: string;
  paymentMethod: string;
  memo: string;
  tokenType: "SUI" | "USDC";
}

interface TimeSelection {
  hours: string;
  minutes: string;
}

const isValidAmount = (amount: string) => {
  const numAmount = Number(amount);
  return !isNaN(numAmount) && numAmount > 0;
};

export default function SinglePayment() {
  const [currentStep, setCurrentStep] = useState(1);
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [formData, setFormData] = useState<FormData>({
    recipient: "",
    amount: "",
    paymentMethod: "",
    memo: "",
    tokenType: "SUI",
  });

  const [recipientInfo, setRecipientInfo] = useState<RecipientInfo | null>(
    null
  );
  const [recipientType, setRecipientType] = useState<
    "walletAddress" | "email" | "username"
  >("walletAddress");
  const [isLoadingRecipient, setIsLoadingRecipient] = useState(false);
  const [selectedTime, setSelectedTime] = useState<TimeSelection>({
    hours: "12",
    minutes: "00",
  });

  const validateRecipient = (value: string, type: string) => {
    switch (type) {
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case "username":
        return /^[a-zA-Z0-9_]{3,20}$/.test(value);
      case "walletAddress":
        return /^0x[a-fA-F0-9]{40,64}$/.test(value);
      default:
        return false;
    }
  };

  const { scheduleTransaction } = useSchedule();
  const { getUserBalance, sendPayment, sendUSDCPayment } = useContract();
  const { walletAddress } = useWalletContext() || {};
  const { fetchUserByAddress, fetchUserByEmail, fetchUserByUsername } =
    useUserProfile();
  const suiPrice = useSuiPrice();
  const router = useRouter();
  const [suiBalance, setSuiBalance] = useState<number>(0);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (walletAddress) {
        try {
          const { suiBalance, usdcBalance } =
            await getUserBalance(walletAddress);
          const formattedSuiBalance = Number(suiBalance) / 1_000_000_000;
          const formattedUsdcBalance = Number(usdcBalance) / 1_000_000;

          setSuiBalance(formattedSuiBalance);
          setUsdcBalance(formattedUsdcBalance);
        } catch (error) {
          console.error("Error fetching balance:", error);
          setSuiBalance(0);
          setUsdcBalance(0);
        }
      }
    };

    fetchBalance();
  }, [walletAddress, getUserBalance]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRecipientSubmit = async () => {
    if (!validateRecipient(formData.recipient, recipientType)) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid recipient",
        variant: "destructive",
      });
      return;
    }

    if (
      recipientType === "walletAddress" &&
      formData.recipient === walletAddress
    ) {
      toast({
        title: "Invalid Recipient",
        description: "You cannot send a payment to yourself",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingRecipient(true);
    try {
      let userInfo = null;
      if (!walletAddress) return;

      switch (recipientType) {
        case "walletAddress":
          userInfo = await fetchUserByAddress(formData.recipient);
          break;
        case "email":
          userInfo = await fetchUserByEmail(formData.recipient, walletAddress);
          break;
        case "username":
          userInfo = await fetchUserByUsername(
            formData.recipient,
            walletAddress
          );
          break;
      }

      if (userInfo && userInfo.walletAddress === walletAddress) {
        toast({
          title: "Invalid Recipient",
          description: "You cannot send a payment to yourself",
          variant: "destructive",
        });
        setRecipientInfo(null);
        return;
      }

      if (recipientType === "walletAddress") {
        if (!userInfo) {
          userInfo = {
            walletAddress: formData.recipient,
            username: "",
            email: "",
          };
        }
      } else {
        if (!userInfo || !userInfo.walletAddress) {
          toast({
            title: "Invalid Recipient",
            description: "No wallet address found for this recipient",
            variant: "destructive",
          });
          setRecipientInfo(null);
          return;
        }
      }

      setRecipientInfo(userInfo);
      setCurrentStep(1.5);
    } catch (error) {
      console.error("Error fetching recipient info:", error);
      toast({
        title: "Error",
        description: "Failed to fetch recipient information",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRecipient(false);
    }
  };

  const nextStep = async () => {
    if (currentStep === 1) {
      await handleRecipientSubmit();
    } else if (currentStep === 1.5) {
      setCurrentStep(2);
    } else if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep === 1.5) {
      setCurrentStep(1);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateNetworkFee = () => {
    return 0.001;
  };

  const calculateEquivalentValue = (amount: string) => {
    if (!amount || isNaN(Number(amount))) return "$0.00 USD";
    const numericAmount = Number.parseFloat(amount);
    if (numericAmount <= 0) return "$0.00 USD";

    // Calculate value based on token type
    const value =
      formData.tokenType === "USDC"
        ? numericAmount * 0.99 // USDC conversion
        : numericAmount * suiPrice; // SUI conversion

    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} USD`;
  };

  const isDateValid = (date?: Date) => {
    if (!date) return false;
    const today = startOfDay(new Date());
    return !isBefore(date, today);
  };

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
    const isToday = scheduleDate
      ? scheduleDate.getDate() === now.getDate() &&
        scheduleDate.getMonth() === now.getMonth() &&
        scheduleDate.getFullYear() === now.getFullYear()
      : false;

    const hours = Array.from({ length: 24 }, (_, i) =>
      i.toString().padStart(2, "0")
    );

    const minutes = Array.from({ length: 60 }, (_, i) =>
      i.toString().padStart(2, "0")
    );

    // If today is selected, filter out past hours and minutes
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

    return { hours, minutes };
  };

  const validateForm = () => {
    if (!formData.recipient) {
      toast({
        title: "Error",
        description: "Please enter a recipient address",
        variant: "destructive",
      });
      return false;
    }

    if (!isValidAmount(formData.amount)) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return false;
    }

    if (!scheduleDate || !selectedTime.hours || !selectedTime.minutes) {
      toast({
        title: "Error",
        description: "Please select both date and time",
        variant: "destructive",
      });
      return false;
    }

    if (!isDateValid(scheduleDate)) {
      toast({
        title: "Error",
        description: "Schedule date cannot be in the past",
        variant: "destructive",
      });
      return false;
    }

    if (!isTimeValid(scheduleDate, selectedTime.hours, selectedTime.minutes)) {
      toast({
        title: "Error",
        description: "For today's date, please select a time in the future",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!walletAddress) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    // Add balance validation based on token type
    const selectedAmount = Number(formData.amount);
    const relevantBalance =
      formData.tokenType === "USDC" ? usdcBalance : suiBalance;

    if (selectedAmount > relevantBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient balance",
        description: `You need ${formData.amount} ${formData.tokenType.toUpperCase()} but only have ${relevantBalance.toFixed(2)} ${formData.tokenType.toUpperCase()}`,
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Convert amount based on token type
      const amount = Math.round(
        Number.parseFloat(formData.amount) *
          (formData.tokenType === "USDC" ? 1e6 : 1e9)
      ); // Convert to base units (USDC = 1e6, SUI = 1e9)

      const recipientAddress =
        recipientInfo?.walletAddress || formData.recipient;

      // Send the payment based on token type
      let result;
      if (formData.tokenType === "USDC") {
        result = await sendUSDCPayment(recipientAddress, Number(amount));
      } else {
        result = await sendPayment(recipientAddress, Number(amount));
      }

      if (result && scheduleDate) {
        const scheduledDateTime = new Date(scheduleDate);
        scheduledDateTime.setHours(Number.parseInt(selectedTime.hours));
        scheduledDateTime.setMinutes(Number.parseInt(selectedTime.minutes));

        const transactionData = {
          transactionDigest: result.data.transactionId as string,
          sender: walletAddress,
          receiver: recipientAddress,
          amount: Number(formData.amount),
          scheduledDate: scheduledDateTime,
          tokenType: formData.tokenType,
        };
        await scheduleTransaction("single", transactionData);
        toast({
          title: "Success",
          description: "Payment scheduled successfully",
        });
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast({
        title: "Error",
        description: "Failed to schedule payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="space-y-6">
      <div className="w-full bg-[#061020] h-1 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-blue-600"
          initial={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          animate={{ width: `${(currentStep / 3) * 100}%` }}
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
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="recipient"
                    className="text-gray-300 flex items-center gap-2"
                  >
                    <Wallet className="h-4 w-4 text-blue-400" />
                    Recipient
                  </Label>
                  <Select
                    defaultValue="walletAddress"
                    onValueChange={(value) =>
                      setRecipientType(
                        value as "walletAddress" | "email" | "username"
                      )
                    }
                  >
                    <SelectTrigger className="w-[120px] bg-[#061020]/70 border-[#1a2a40] text-white">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a1930] border-[#1a2a40] text-white">
                      <SelectItem value="walletAddress">
                        Wallet Address
                      </SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="username">Username</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  id="recipient"
                  placeholder={
                    recipientType === "walletAddress"
                      ? "Enter Sui wallet address (0x...)"
                      : recipientType === "email"
                        ? "Enter email address"
                        : "Enter username"
                  }
                  value={formData.recipient}
                  onChange={(e) => handleChange("recipient", e.target.value)}
                  className="bg-[#061020]/70 border-[#1a2a40] text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                {formData.recipient &&
                  !validateRecipient(formData.recipient, recipientType) && (
                    <p className="text-xs text-red-400">
                      {recipientType === "walletAddress"
                        ? "Please enter a valid Sui wallet address"
                        : recipientType === "email"
                          ? "Please enter a valid email address"
                          : "Username must be 3-20 characters long and contain only letters, numbers, and underscores"}
                    </p>
                  )}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleRecipientSubmit}
                  disabled={!formData.recipient || isLoadingRecipient}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoadingRecipient ? "Loading..." : "Verify Recipient"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 1.5 && (
          <motion.div
            key="step1.5"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, x: -50 }}
            variants={fadeIn}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="bg-[#061020]/70 p-4 rounded-lg border border-[#1a2a40] space-y-4">
                <h3 className="text-lg font-medium text-blue-400">
                  Recipient Information
                </h3>

                {recipientInfo ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Username:</span>
                      <span className="text-white">
                        {recipientInfo.username || "Not available"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white">
                        {recipientInfo.email || "Not available"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Wallet Address:</span>
                      <span className="text-white font-mono text-sm">
                        {recipientInfo.walletAddress}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-red-400">
                      No user information found for this recipient.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Please verify the recipient details and try again.
                    </p>
                  </div>
                )}
                {recipientInfo &&
                  recipientInfo.walletAddress &&
                  (!recipientInfo.username || !recipientInfo.email) && (
                    <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-900/30 rounded-md">
                      <p className="text-yellow-400 text-sm flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {!recipientInfo.username && !recipientInfo.email
                          ? "This recipient has no username or email, but you can still send funds directly to their wallet address."
                          : !recipientInfo.username
                            ? "This recipient has no username, but you can still send funds to their wallet address."
                            : "This recipient has no email, but you can still send funds to their wallet address."}
                      </p>
                    </div>
                  )}
              </div>

              <div className="flex justify-between">
                <Button
                  onClick={() => setCurrentStep(1)}
                  variant="blueWhite"
                  className="border-[#1a2a40] text-white hover:bg-[#0a1930]"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!recipientInfo || !recipientInfo.walletAddress}
                >
                  Continue
                </Button>
              </div>
            </div>
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
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Label
                    htmlFor="amount"
                    className="text-gray-300 flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4 text-blue-400" />
                    Amount
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => handleChange("amount", e.target.value)}
                    required
                    className="mt-1.5 bg-[#061020]/70 border-[#1a2a40] text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  {formData.amount && !isValidAmount(formData.amount) && (
                    <p className="text-sm text-red-400 mt-1">
                      Please enter an amount greater than 0
                    </p>
                  )}
                  {formData.amount && isValidAmount(formData.amount) && (
                    <p className="text-sm text-gray-400 mt-1">
                      ≈ {calculateEquivalentValue(formData.amount)}
                    </p>
                  )}
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-gray-400">Your Balance:</p>
                      <p
                        className={`font-medium ${
                          Number(formData.amount) >
                          (formData.tokenType === "USDC"
                            ? usdcBalance
                            : suiBalance)
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        {formData.tokenType === "USDC"
                          ? usdcBalance.toFixed(2)
                          : suiBalance.toFixed(2)}{" "}
                        {formData.tokenType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400">Required Amount:</p>
                      <p className="font-medium">
                        {formData.amount || "0.00"}{" "}
                        {formData.tokenType.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {Number(formData.amount) >
                    (formData.tokenType === "USDC"
                      ? usdcBalance
                      : suiBalance) && (
                    <div className="bg-red-900/20 p-4 rounded-lg border border-red-900/30 flex gap-3">
                      <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-red-200">
                          Insufficient balance. You need{" "}
                          {(
                            Number(formData.amount) -
                            (formData.tokenType === "USDC"
                              ? usdcBalance
                              : suiBalance)
                          ).toFixed(2)}{" "}
                          more {formData.tokenType.toUpperCase()} to complete
                          this transaction.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="token" className="text-gray-300">
                    Token
                  </Label>
                  <Select
                    value={formData.tokenType}
                    onValueChange={(value) =>
                      handleChange("tokenType", value as "SUI" | "USDC")
                    }
                  >
                    <SelectTrigger
                      id="token"
                      className="mt-1.5 bg-[#061020]/70 border-[#1a2a40] text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a1930] border-[#1a2a40] text-white">
                      <SelectItem value="SUI">SUI</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                    </SelectContent>
                  </Select>
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
                          <Label className="text-xs text-gray-400">
                            Minute
                          </Label>
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
                {scheduleDate && !isDateValid(scheduleDate) && (
                  <p className="text-sm text-red-400 mt-1">
                    Schedule date cannot be in the past
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="memo"
                  className="text-gray-300 flex items-center gap-2"
                >
                  <FileText className="h-4 w-4 text-blue-400" />
                  Memo (Optional)
                </Label>
                <Input
                  id="memo"
                  placeholder="Add a note"
                  value={formData.memo}
                  onChange={(e) => handleChange("memo", e.target.value)}
                  className="bg-[#061020]/70 border-[#1a2a40] text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-between">
                <Button
                  onClick={prevStep}
                  variant="blueWhite"
                  className="border-[#1a2a40] text-white hover:bg-[#061020]"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={
                    !formData.amount ||
                    !isValidAmount(formData.amount) ||
                    !scheduleDate ||
                    !isDateValid(scheduleDate) ||
                    (scheduleDate &&
                      !isTimeValid(
                        scheduleDate,
                        selectedTime.hours,
                        selectedTime.minutes
                      ))
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step3"
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, x: -50 }}
            variants={fadeIn}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="bg-[#061020]/70 p-4 rounded-lg border border-[#1a2a40]">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-400" />
                  Payment Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Recipient:</span>
                    <span className="text-white">
                      {recipientInfo?.walletAddress || formData.recipient}
                    </span>
                  </div>
                  {recipientInfo?.username && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Username:</span>
                      <span className="text-white">
                        {recipientInfo.username}
                      </span>
                    </div>
                  )}
                  {recipientInfo?.email && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white">{recipientInfo.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Amount:</span>
                    <div className="text-right">
                      <div className="text-white">
                        {formData.amount} {formData.tokenType}
                      </div>
                      {formData.amount && isValidAmount(formData.amount) && (
                        <div className="text-xs text-gray-400">
                          ≈ {calculateEquivalentValue(formData.amount)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Token Type:</span>
                    <span className="text-white">{formData.tokenType}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Schedule Date:</span>
                    <span className="text-white">
                      {scheduleDate
                        ? `${format(scheduleDate, "PPP")} at ${selectedTime.hours}:${selectedTime.minutes}`
                        : "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Schedule Time:</span>
                    <span className="text-white">
                      {selectedTime.hours}:{selectedTime.minutes}
                    </span>
                  </div>
                  {formData.memo && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Memo:</span>
                      <span className="text-white">{formData.memo}</span>
                    </div>
                  )}
                  <Separator className="my-2 bg-[#1a2a40]" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Network Fee:</span>
                    <span className="text-white">
                      {calculateNetworkFee()} SUI
                    </span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-400">Total:</span>
                    <div className="text-right">
                      <div className="text-white">
                        {Number(formData.amount) + calculateNetworkFee()}{" "}
                        {formData.tokenType}
                      </div>
                      {formData.amount && isValidAmount(formData.amount) && (
                        <div className="text-xs text-gray-400">
                          ≈{" "}
                          {calculateEquivalentValue(
                            (
                              Number(formData.amount) + calculateNetworkFee()
                            ).toString()
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  onClick={prevStep}
                  variant="blueWhite"
                  className="border-[#1a2a40] text-white hover:bg-[#061020]"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isProcessing ||
                    !isValidAmount(formData.amount) ||
                    !scheduleDate ||
                    !isDateValid(scheduleDate) ||
                    !isTimeValid(
                      scheduleDate,
                      selectedTime.hours,
                      selectedTime.minutes
                    ) ||
                    Number(formData.amount) >
                      (formData.tokenType === "USDC" ? usdcBalance : suiBalance)
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? "Processing..." : "Schedule Payment"}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
