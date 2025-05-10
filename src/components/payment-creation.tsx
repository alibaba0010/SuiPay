"use client";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  Copy,
  QrCode,
  Share2,
  Wallet,
  ChevronLeft,
  Shield,
  CheckCircle,
  AlertCircle,
  CreditCard,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useContract } from "@/hooks/useContract";
import { useWalletContext } from "@/lib/wallet-context";
import { useTransactionStorage } from "@/hooks/useTransactionStorage";
import { useSuiPrice } from "@/hooks/useSuiPrice";
import { useRouter } from "next/navigation";
import { formatBalance, generateVerificationCode } from "@/utils/helpers";
import { sendPaymentEmail } from "@/hooks/UseEmail";
import { useNotifications } from "@/contexts/notifications-context";
import { useUserProfile } from "@/hooks/useUserProfile";

interface FormData {
  recipient: string;
  recipientType: "walletAddress" | "email" | "username";
  amount: string;
  tokenType: string;
  memo: string;
  senderEmail: string;
}

export default function PaymentCreation() {
  const {
    sendPayment,
    sendPaymentDirectly,
    getUserBalance,
    sendUSDCPayment,
    sendUSDCPaymentDirectly,
  } = useContract();
  const { addTransaction } = useTransactionStorage();
  const suiPrice = useSuiPrice();
  const { addNotification } = useNotifications();
  const [senderUsername, setSenderUsername] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const { walletAddress } = useWalletContext() || {};
  const [formData, setFormData] = useState<FormData>({
    recipient: "",
    recipientType: "walletAddress",
    amount: "",
    tokenType: "SUI",
    memo: "",
    senderEmail: "",
  });
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [suiBalance, setSuiBalance] = useState<number>(0);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);

  useEffect(() => {
    if (walletAddress) {
    }
  }, [walletAddress]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (walletAddress) {
        try {
          const { suiBalance, usdBalance } =
            await getUserBalance(walletAddress);
          const formattedSuiBalance = formatBalance(suiBalance);
          const formattedUsdcBalance = formatBalance(usdBalance);

          setSuiBalance(Number(formattedSuiBalance));
          setUsdcBalance(Number(formattedUsdcBalance));
        } catch (error) {
          console.error("Error fetching balance:", error);
          setSuiBalance(0);
          setUsdcBalance(0);
        }
      }
    };

    fetchBalance();
  }, [walletAddress]);

  const [recipientInfo, setRecipientInfo] = useState<{
    username: string;
    email: string;
    walletAddress: string;
  } | null>(null);
  const [isLoadingRecipient, setIsLoadingRecipient] = useState(false);
  const [verificationKey, setVerificationKey] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [senderEmail, setSenderEmail] = useState("");
  const {
    fetchUserByAddress,
    userProfile,
    isLoading,
    fetchUserByEmail,
    fetchUserByUsername,
  } = useUserProfile();

  useEffect(() => {
    const fetchSenderEmail = async () => {
      if (walletAddress) {
        if (!userProfile && !isLoading) {
          fetchUserByAddress(walletAddress);
        }

        if (userProfile) {
          setSenderEmail(userProfile.email);
          setSenderUsername(userProfile.username);
        }
      }
    };
    fetchSenderEmail();
  }, [walletAddress, userProfile, isLoading, fetchUserByAddress]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

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

  const handleRecipientTypeChange = (
    type: "walletAddress" | "email" | "username"
  ) => {
    setFormData({ ...formData, recipientType: type, recipient: "" });
    setRecipientInfo(null);
  };

  const handleRecipientSubmit = async () => {
    if (!validateRecipient(formData.recipient, formData.recipientType)) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid recipient",
        variant: "destructive",
      });
      return;
    }

    if (
      formData.recipientType === "walletAddress" &&
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

      switch (formData.recipientType) {
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
      // Check if the found user is the same as the sender
      if (userInfo && userInfo.walletAddress === walletAddress) {
        toast({
          title: "Invalid Recipient",
          description: "You cannot send a payment to yourself",
          variant: "destructive",
        });
        setRecipientInfo(null);
        return;
      }

      // For wallet address type, we can proceed even without username/email
      if (formData.recipientType === "walletAddress") {
        // If no user info found, create a minimal user info object with just the wallet address
        if (!userInfo) {
          userInfo = {
            walletAddress: formData.recipient,
            username: "",
            email: "",
          };
        }
      } else {
        // For email/username types, we still need a wallet address
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

  const nextStep = () => {
    if (currentStep === 1.5) {
      setCurrentStep(2);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep === 1.5) {
      setCurrentStep(1);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
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
      // Convert amount to number and handle decimals

      // Get the recipient's wallet address - ensure we're using the wallet address directly
      const recipientAddress =
        recipientInfo && recipientInfo.walletAddress
          ? recipientInfo.walletAddress
          : formData.recipient;
      const recipientEmail = recipientInfo ? recipientInfo.email : "";
      // Convert amount based on token type
      const amount = Math.round(
        Number.parseFloat(formData.amount) *
          (formData.tokenType === "USDC" ? 1e6 : 1e9)
      ); // Convert to base units (USDC = 1e6, SUI = 1e9)
      // Send the payment and get the transaction digest based on token type
      let result;
      if (formData.tokenType === "USDC") {
        result = await sendUSDCPayment(recipientAddress, Number(amount));
      } else {
        result = await sendPayment(recipientAddress, Number(amount));
      }

      if (result) {
        // Generate a 6-character alphanumeric verification code
        const verificationCode = generateVerificationCode();

        // Store the transaction with tokenType
        await addTransaction({
          transactionDigest: result.data.transactionId as string,
          sender: walletAddress as string,
          receiver: recipientAddress,
          amount: Number(formData.amount),
          status: "active",
          verificationCode,
          tokenType: "USDC",
        });

        addNotification({
          type: "claim",
          title: "Payment Available to Claim",
          description: `${senderUsername} sent you ${formData.amount} ${formData.tokenType.toUpperCase()}.`,
          priority: "high",
          transactionId: result.data.transactionId as string,
        });
        // Send email if sender email is provided
        if (recipientEmail) {
          setIsSendingEmail(true);
          try {
            await sendPaymentEmail({
              recipientEmail,
              senderEmail,
              amount: formData.amount,
              token: formData.tokenType.toUpperCase(),
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

        // Store the verification key and move to next step
        setVerificationKey(verificationCode);
        router.push("/dashboard");
      } else {
        toast({
          title: "Error",
          description: "Failed to initiate payment",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast({
        title: "Error",
        description: "Failed to submit payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleDirectPayment = async () => {
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
      // Convert amount to number and handle decimals
      const amount = Math.round(
        Number.parseFloat(formData.amount) *
          (formData.tokenType === "USDC" ? 1e6 : 1e9)
      );

      // Get the recipient's wallet address - ensure we're using the wallet address directly
      const recipientAddress =
        recipientInfo && recipientInfo.walletAddress
          ? recipientInfo.walletAddress
          : formData.recipient;

      // Send the payment directly based on token type
      let result;
      if (formData.tokenType === "USDC") {
        result = await sendUSDCPaymentDirectly(
          recipientAddress,
          Number(amount)
        );
      } else {
        result = await sendPaymentDirectly(recipientAddress, Number(amount));
      }

      if (result) {
        await addTransaction({
          transactionDigest: result.data.transactionId as string,
          sender: walletAddress as string,
          receiver: recipientAddress,
          amount: Number(formData.amount),
          status: "completed",
          tokenType: "USDC",
        });
        // Add notification for completed payment
        const senderDisplay =
          senderUsername ||
          walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4);
        addNotification({
          type: "payment",
          title: "Payment Received",
          description: `You received ${formData.amount} ${formData.tokenType.toUpperCase()} from ${senderDisplay}`,
          priority: "normal",
          transactionId: result.data.transactionId as string,
        });
        toast({
          title: "Success",
          description: "Payment sent directly to recipient",
        });

        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        toast({
          title: "Error",
          description: "Failed to send payment",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Error sending direct payment:", error);
      toast({
        title: "Error",
        description: "Failed to send payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: message || "Copied to clipboard",
    });
  };

  const sharePayment = () => {
    setShareDialogOpen(true);
  };

  const getClaimUrl = () => {
    // In a real app, this would be a full URL to your site
    return `https://suipay.app/verification-claim?key=${verificationKey}`;
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const calculateNetworkFee = () => {
    return 0.005;
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

  const isValidAmount = (amount: string) => {
    const numAmount = Number(amount);
    return !isNaN(numAmount) && numAmount > 0;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold">Create New Payment</h1>
          <p className="text-gray-400 mt-1">
            Send funds securely to any recipient on the Sui network
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex gap-2"
        >
          {currentStep > 1 && (
            <Button
              variant="blueWhite"
              onClick={prevStep}
              className="border-[#1a2a40] hover:bg-[#d9dde2]"
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          )}
          <Button
            asChild
            variant="blueWhite"
            className="border-[#1a2a40] hover:bg-[#0a1930]"
          >
            <Link href="/transaction-monitoring">View Transactions</Link>
          </Button>
        </motion.div>
      </div>

      <div className="w-full bg-[#061020] h-1 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-blue-600"
          initial={{ width: `${((currentStep - 1) / 4) * 100}%` }}
          animate={{ width: `${(currentStep / 4) * 100}%` }}
          transition={{ duration: 0.3 }}
        ></motion.div>
      </div>

      <Card className="bg-gradient-to-b from-[#0a1930] to-[#061020] border-[#1a2a40] text-white overflow-hidden w-full shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full translate-x-16 translate-y-16 blur-3xl"></div>

        <CardHeader className="relative z-10 border-b border-[#1a2a40] bg-[#061020]/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">
                {currentStep === 5 ? "Payment Created" : "Payment Details"}
              </CardTitle>
              <CardDescription>
                {currentStep === 5
                  ? "Your payment has been created successfully"
                  : "Step " +
                    currentStep +
                    " of 4: " +
                    (currentStep === 1
                      ? "Recipient"
                      : currentStep === 2
                        ? "Amount"
                        : currentStep === 3
                          ? "Security"
                          : "Confirmation")}
              </CardDescription>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-medium transition-colors
                    ${
                      currentStep >= step
                        ? "bg-blue-600 text-white"
                        : "bg-[#061020] text-gray-400 border border-[#1a2a40]"
                    }`}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 p-6">
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
                        value={formData.recipientType}
                        onValueChange={handleRecipientTypeChange}
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
                        formData.recipientType === "walletAddress"
                          ? "Enter Sui walletAddress (0x...)"
                          : formData.recipientType === "email"
                            ? "Enter email walletAddress"
                            : "Enter username"
                      }
                      value={formData.recipient}
                      onChange={(e) =>
                        handleChange("recipient", e.target.value)
                      }
                      required
                      className="bg-[#061020]/70 border-[#1a2a40] text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    {formData.recipient &&
                      !validateRecipient(
                        formData.recipient,
                        formData.recipientType
                      ) && (
                        <p className="text-xs text-red-400">
                          {formData.recipientType === "walletAddress"
                            ? "Please enter a valid Sui wallet walletAddress"
                            : formData.recipientType === "email"
                              ? "Please enter a valid email walletAddress"
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
                            {recipientInfo.username}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Email:</span>
                          <span className="text-white">
                            {recipientInfo.email}
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
                      className="border-[#1a2a40] hover:bg-[#0a1930]"
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
                        step="0.001" // Allow for 9 decimal places (1 SUI = 1e9)
                        min="0"
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
                    </div>
                    <div>
                      <Label htmlFor="token" className="text-gray-300">
                        Token
                      </Label>
                      <Select
                        value={formData.tokenType}
                        onValueChange={(value) =>
                          handleChange("tokenType", value)
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
                      placeholder="Add a note for this payment"
                      value={formData.memo}
                      onChange={(e) => handleChange("memo", e.target.value)}
                      className="bg-[#061020]/70 border-[#1a2a40] text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400">
                      This memo will be visible to the recipient
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="button"
                    variant="blueWhite"
                    onClick={prevStep}
                    className="border-[#1a2a40] hover:bg-[#0a1930]"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="bg-blue-600 hover:bg-blue-700 transition-all"
                    disabled={
                      !formData.amount || !isValidAmount(formData.amount)
                    }
                  >
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
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
                <div className="space-y-5">
                  <div className="bg-[#061020]/70 p-5 rounded-lg border border-[#1a2a40] space-y-4">
                    <h3 className="font-medium text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-400" />
                      Payment Summary
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <span className="text-gray-400 text-sm">
                            Recipient
                          </span>
                          <div className="font-medium truncate">
                            {formData.recipient || "0x1a2b...3c4d"}
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-400 text-sm">Amount</span>
                          <div className="font-medium">
                            {formData.amount || "0"} {formData.tokenType}
                            {formData.amount &&
                              isValidAmount(formData.amount) && (
                                <span className="text-sm text-gray-400 ml-2">
                                  ≈ {calculateEquivalentValue(formData.amount)}
                                </span>
                              )}
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-400 text-sm">
                            Token Type
                          </span>
                          <div className="font-medium">
                            {formData.tokenType}
                          </div>
                        </div>

                        {formData.memo && (
                          <div>
                            <span className="text-gray-400 text-sm">Memo</span>
                            <div className="font-medium">{formData.memo}</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="text-gray-400 text-sm">Balance</span>
                          <div className="font-medium">
                            {formData.tokenType === "USDC"
                              ? usdcBalance
                              : suiBalance}{" "}
                            {formData.tokenType}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">
                            Network Fee
                          </span>
                          <div className="font-medium">
                            {calculateNetworkFee()} SUI
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-[#1a2a40]" />

                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Amount:</span>
                      <span className="font-bold text-lg">
                        {formData.amount
                          ? `${Number.parseFloat(formData.amount).toFixed(
                              2
                            )} ${formData.tokenType}`
                          : `${calculateNetworkFee()} ${formData.tokenType}`}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-900/30 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-200">
                        By submitting this payment, you agree to the terms and
                        conditions of Sui Pay. This transaction will be recorded
                        on the Sui blockchain and cannot be altered once
                        submitted.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Update the buttons in step 3 to use the new functions and disable state
                Replace the buttons section in step 3 with this: */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full">
                  <Button
                    type="button"
                    variant="blueWhite"
                    onClick={prevStep}
                    className="border-[#1a2a40] hover:bg-[#0a1930]"
                    disabled={isProcessing}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <div className="flex-grow"></div>
                  <Button
                    onClick={handleDirectPayment}
                    className="bg-blue-600 hover:bg-blue-700 transition-all"
                    disabled={
                      isProcessing ||
                      Number(formData.amount) >
                        (formData.tokenType === "USDC"
                          ? usdcBalance
                          : suiBalance)
                    }
                  >
                    {isProcessing ? "Processing..." : "Send Funds Directly"}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="bg-green-600 hover:bg-green-700 transition-all"
                    disabled={
                      isProcessing ||
                      Number(formData.amount) >
                        (formData.tokenType === "USDC"
                          ? usdcBalance
                          : suiBalance)
                    }
                  >
                    {isProcessing ? (
                      "Processing..."
                    ) : (
                      <>
                        Send Funds Securely <Shield className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: -50 }}
                variants={fadeIn}
                className="space-y-6"
              >
                <div className="space-y-5">
                  <div className="bg-[#061020]/70 p-5 rounded-lg border border-[#1a2a40] space-y-4">
                    <h3 className="font-medium text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-400" />
                      Payment Summary
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <span className="text-gray-400 text-sm">
                            Recipient
                          </span>
                          <div className="font-medium truncate">
                            {formData.recipient || "0x1a2b...3c4d"}
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-400 text-sm">Amount</span>
                          <div className="font-medium">
                            {formData.amount || "0"} {formData.tokenType}
                            {formData.amount &&
                              isValidAmount(formData.amount) && (
                                <span className="text-sm text-gray-400 ml-2">
                                  ≈ {calculateEquivalentValue(formData.amount)}
                                </span>
                              )}
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-400 text-sm">
                            Token Type
                          </span>
                          <div className="font-medium">
                            {formData.tokenType}
                          </div>
                        </div>

                        {formData.memo && (
                          <div>
                            <span className="text-gray-400 text-sm">Memo</span>
                            <div className="font-medium">{formData.memo}</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="text-gray-400 text-sm">Balance</span>
                          <div className="font-medium">
                            {formData.tokenType === "USDC"
                              ? usdcBalance
                              : suiBalance}{" "}
                            {formData.tokenType}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">
                            Network Fee
                          </span>
                          <div className="font-medium">
                            {calculateNetworkFee()} SUI
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-[#1a2a40]" />

                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Amount:</span>
                      <span className="font-bold text-lg">
                        {formData.amount ? (
                          <>
                            {Number.parseFloat(formData.amount).toFixed(2)}{" "}
                            {formData.tokenType}
                            <span className="text-sm text-gray-400 ml-2">
                              ≈ {calculateEquivalentValue(formData.amount)}
                            </span>
                          </>
                        ) : (
                          `${calculateNetworkFee()} ${formData.tokenType}`
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-900/30 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-200">
                        By submitting this payment, you agree to the terms and
                        conditions of Sui Pay. This transaction will be recorded
                        on the Sui blockchain and cannot be altered once
                        submitted.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="button"
                    variant="blueWhite"
                    onClick={prevStep}
                    className="border-[#1a2a40] hover:bg-[#0a1930]"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-700 transition-all"
                  >
                    Submit Payment
                  </Button>
                </div>
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0 }}
                variants={fadeIn}
                className="space-y-6"
              >
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="bg-blue-600/20 p-4 rounded-full mb-4">
                    <CheckCircle className="h-10 w-10 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">
                    Payment Created Successfully!
                  </h2>
                  <p className="text-gray-300 mb-6 max-w-md">
                    Your payment of{" "}
                    <span className="font-medium">
                      {formData.amount} {formData.tokenType.toUpperCase()}
                    </span>{" "}
                    has been created and is waiting to be claimed.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="space-y-4">
                      <div className="bg-[#061020]/70 p-4 rounded-lg border border-[#1a2a40]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-300">
                            Verification Key:
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-blue-400 hover:text-blue-300 hover:bg-[#061020]"
                            onClick={() =>
                              copyToClipboard(
                                verificationKey,
                                "Verification key copied to clipboard!"
                              )
                            }
                          >
                            <Copy className="h-4 w-4" /> Copy
                          </Button>
                        </div>
                        <code className="block bg-[#061020] p-3 rounded border border-[#1a2a40] text-sm overflow-x-auto">
                          {verificationKey}
                        </code>
                        <p className="text-xs text-gray-400 mt-2">
                          Share this key with your recipient to claim the
                          payment
                        </p>
                      </div>

                      <div className="bg-[#061020]/70 p-4 rounded-lg border border-[#1a2a40]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-300">
                            Claim Link:
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-blue-400 hover:text-blue-300 hover:bg-[#061020]"
                            onClick={() =>
                              copyToClipboard(
                                getClaimUrl(),
                                "Claim link copied to clipboard!"
                              )
                            }
                          >
                            <Copy className="h-4 w-4" /> Copy
                          </Button>
                        </div>
                        <code className="block bg-[#061020] p-3 rounded border border-[#1a2a40] text-sm overflow-x-auto">
                          {getClaimUrl()}
                        </code>
                        <p className="text-xs text-gray-400 mt-2">
                          Send this link to your recipient for one-click
                          claiming
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-[#061020]/70 p-4 rounded-lg border border-[#1a2a40]">
                      <div className="bg-white p-4 rounded-md mb-3">
                        {/* This would be a real QR code in a production app */}
                        <div className="relative">
                          <QrCode className="h-40 w-40 text-blue-900" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white p-1 rounded">
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="h-6 w-6 text-blue-600"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M18 8V7.2C18 6.0799 18 5.51984 17.782 5.09202C17.5903 4.71569 17.2843 4.40973 16.908 4.21799C16.4802 4 15.9201 4 14.8 4H9.2C8.07989 4 7.51984 4 7.09202 4.21799C6.71569 4.40973 6.40973 4.71569 6.21799 5.09202C6 5.51984 6 6.0799 6 7.2V8M6 8H18M6 8H4M18 8H20M9 11V17M12 11V17M15 11V17M3 8H21V16.8C21 17.9201 21 18.4802 20.782 18.908C20.5903 19.2843 20.2843 19.5903 19.908 19.782C19.4802 20 18.9201 20 17.8 20H6.2C5.0799 20 4.51984 20 4.09202 19.782C3.71569 19.5903 3.40973 19.2843 3.21799 18.908C3 18.4802 3 17.9201 3 16.8V8Z"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <p className="text-blue-900 text-xs mt-2 text-center">
                          Scan to claim payment
                        </p>
                      </div>
                      <Button
                        variant="blueWhite"
                        size="sm"
                        className="border-[#1a2a40] hover:bg-[#0a1930] mb-2"
                        onClick={() => {
                          // In a real app, this would download the QR code image
                          toast({
                            title: "QR Code Downloaded",
                            description:
                              "QR code has been saved to your device.",
                          });
                        }}
                      >
                        Download QR Code
                      </Button>
                      <p className="text-xs text-gray-400 text-center">
                        The recipient can scan this QR code to claim the payment
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full sm:justify-center">
                    <Button
                      onClick={sharePayment}
                      className="bg-blue-600 hover:bg-blue-700 transition-all"
                    >
                      <Share2 className="mr-2 h-4 w-4" /> Share Payment
                    </Button>
                    <Button
                      variant="blueWhite"
                      asChild
                      className="border-[#1a2a40] hover:bg-[#0a1930]"
                    >
                      <Link href="/transaction-monitoring">
                        View Transaction
                      </Link>
                    </Button>
                    <Button
                      variant="blueWhite"
                      asChild
                      className="border-[#1a2a40] hover:bg-[#0a1930]"
                    >
                      <Link href="/payment-creation">
                        Create Another Payment
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md bg-[#0a1930] border-[#1a2a40] text-white">
          <DialogHeader>
            <DialogTitle>Share Payment</DialogTitle>
            <DialogDescription className="text-gray-400">
              Share this payment with your recipient using any of these methods.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-gray-300">Verification Key</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={verificationKey}
                  className="bg-[#061020] border-[#1a2a40] text-white"
                />
                <Button
                  size="sm"
                  variant="blueWhite"
                  className="border-[#1a2a40] hover:bg-[#0a1930]"
                  onClick={() =>
                    copyToClipboard(verificationKey, "Verification key copied!")
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Share this key with your recipient to claim the payment.
              </p>
            </div>

            <div className="grid gap-2">
              <Label className="text-gray-300">Claim Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={getClaimUrl()}
                  className="bg-[#061020] border-[#1a2a40] text-white"
                />
                <Button
                  size="sm"
                  variant="blueWhite"
                  className="border-[#1a2a40] hover:bg-[#0a1930]"
                  onClick={() =>
                    copyToClipboard(getClaimUrl(), "Claim link copied!")
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-400">
                Send this link to your recipient for one-click claiming.
              </p>
            </div>

            <div className="grid gap-2">
              <Label className="text-gray-300">QR Code</Label>
              <div className="flex justify-center bg-white p-4 rounded-md">
                {/* This would be a real QR code in a production app */}
                <div className="relative">
                  <QrCode className="h-32 w-32 text-blue-900" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white p-1 rounded">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-5 w-5 text-blue-600"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M18 8V7.2C18 6.0799 18 5.51984 17.782 5.09202C17.5903 4.71569 17.2843 4.40973 16.908 4.21799C16.4802 4 15.9201 4 14.8 4H9.2C8.07989 4 7.51984 4 7.09202 4.21799C6.71569 4.40973 6.40973 4.71569 6.21799 5.09202C6 5.51984 6 6.0799 6 7.2V8M6 8H18M6 8H4M18 8H20M9 11V17M12 11V17M15 11V17M3 8H21V16.8C21 17.9201 21 18.4802 20.782 18.908C20.5903 19.2843 20.2843 19.5903 19.908 19.782C19.4802 20 18.9201 20 17.8 20H6.2C5.0799 20 4.51984 20 4.09202 19.782C3.71569 19.5903 3.40973 19.2843 3.21799 18.908C3 18.4802 3 17.9201 3 16.8V8Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <Button
                  variant="blueWhite"
                  size="sm"
                  className="border-[#1a2a40] hover:bg-[#0a1930]"
                  onClick={() => {
                    // In a real app, this would download the QR code image
                    toast({
                      title: "QR Code Downloaded",
                      description: "QR code has been saved to your device.",
                    });
                  }}
                >
                  Download QR Code
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => setShareDialogOpen(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
