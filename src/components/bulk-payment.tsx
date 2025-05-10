"use client";

import type React from "react";

import {
  useState,
  useEffect,
  useRef,
  type KeyboardEvent,
  useCallback,
} from "react";
import { useContract } from "@/hooks/useContract";
import { useWalletContext } from "@/lib/wallet-context";
import { usePayroll } from "@/hooks/usePayroll";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Loader2,
  Users,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  X,
  Search,
  Shield,
  Send,
  FileText,
  ChevronLeft,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useTransactionStorage } from "@/hooks/useTransactionStorage";
import { formatBalance, generateVerificationCode } from "@/utils/helpers";
import { sendBulkPaymentEmails } from "@/hooks/UseEmail";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/contexts/notifications-context";
import { useUserProfile } from "@/hooks/useUserProfile";

interface PaymentField {
  receiver: string;
  amount: string;
  username: string;
  email: string;
  name?: string;
  isValid?: boolean;
}

interface RecentRecipient {
  address: string;
  name: string;
  avatar: string;
  lastUsed: string;
  email?: string;
  username?: string;
}

// Add this custom hook after the interface definitions and before the component
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function BulkPayment() {
  const { sendBulkPayment, sendSecureBulkPayment, getUserBalance } =
    useContract();
  const { walletAddress } = useWalletContext() || {};
  const { toast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [senderEmail, setSenderEmail] = useState("");
  const [suiBalance, setSuiBalance] = useState<number>(0);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  // Update the currentField state to be more specific
  const [currentField, setCurrentField] = useState<{
    index: number;
    field: keyof PaymentField | null;
  }>({ index: -1, field: null });
  const [currentUser, setCurrentUser] = useState<any>({});

  const [payments, setPayments] = useState<PaymentField[]>([
    { receiver: "", amount: "", username: "", email: "", isValid: undefined },
  ]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showRecipientSearch, setShowRecipientSearch] = useState(false);
  const [selectedRecipientIndex, setSelectedRecipientIndex] = useState<
    number | null
  >(null);
  const { addBulkTransaction } = useTransactionStorage();
  // Reference to the next input field
  const nextInputRef = useRef<HTMLInputElement>(null);

  // Payroll integration
  const { payrolls, getPayrolls, getPayrollByName } = usePayroll();
  const [payrollList, setPayrollList] = useState<any[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<string>("");
  const [selectedPayrollData, setSelectedPayrollData] = useState<any>(null);
  const [showManualEntry, setShowManualEntry] = useState(true);
  const [showPayrollSelection, setShowPayrollSelection] = useState(false);
  const { addNotification } = useNotifications();
  const {
    fetchUserByAddress,
    fetchUserByEmail,
    userProfile,
    isLoading: isGetting,
    fetchUserByUsername,
  } = useUserProfile();

  // Sample recent recipients data
  const recentRecipients: RecentRecipient[] = [
    {
      address: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
      name: "John Doe",
      avatar: "JD",
      lastUsed: "2 days ago",
      email: "john.doe@example.com",
      username: "johndoe",
    },
  ];
  useEffect(() => {
    const currentUser = async () => {
      if (!walletAddress) return;
      if (!userProfile && !isGetting) {
        fetchUserByAddress(walletAddress);
      }
      if (userProfile) {
        setCurrentUser(userProfile);
      }
    };
    currentUser();
  }, [walletAddress, userProfile, isGetting, fetchUserByAddress]);
  // Filtered recipients based on search query
  const filteredRecipients = recentRecipients.filter(
    (recipient) =>
      recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipient.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (recipient.username &&
        recipient.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (recipient.email &&
        recipient.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // get sender email
  useEffect(() => {
    const getSenderEmail = async () => {
      if (!walletAddress) return;
      if (!userProfile && !isGetting) {
        fetchUserByAddress(walletAddress);
      }
      // sender email
      if (userProfile) {
        setSenderEmail(userProfile.email);
      }
    };
    getSenderEmail();
  }, [walletAddress, userProfile, isGetting, fetchUserByAddress]);

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

  // Calculate total amount whenever payment fields change
  useEffect(() => {
    const sum = payments.reduce((acc, payment) => {
      const amount = Number.parseFloat(payment.amount) || 0;
      return acc + amount;
    }, 0);
    setTotalAmount(sum);
  }, [payments]);

  // Fetch user balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (walletAddress) {
        try {
          const { suiBalance, usdcBalance } =
            await getUserBalance(walletAddress);
          const formattedSuiBalance = formatBalance(suiBalance);
          const formattedUsdcBalance = formatBalance(usdcBalance);
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
  }, [walletAddress, getUserBalance]);

  // Handle payroll selection
  const handlePayrollSelect = async (payrollName: string) => {
    // If selecting "none", reset to manual entry
    if (payrollName === "none") {
      setSelectedPayroll("");
      setSelectedPayrollData(null);
      setShowManualEntry(true);
      setPayments([
        {
          receiver: "",
          amount: "",
          username: "",
          email: "",
          isValid: undefined,
        },
      ]);
      setShowPayrollSelection(false);
      return;
    }

    setSelectedPayroll(payrollName);
    setIsLoading(true);

    try {
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }

      // Get the payroll data by name
      const payrollData = await getPayrollByName(payrollName, walletAddress);

      if (
        !payrollData ||
        !payrollData.recipients ||
        !Array.isArray(payrollData.recipients)
      ) {
        throw new Error("Invalid payroll data");
      }

      setSelectedPayrollData(payrollData);
      setShowManualEntry(false);

      // Create new payments from the payroll recipients
      const newPayments = await Promise.all(
        payrollData.recipients.map(async (recipient: any) => {
          if (!recipient || !recipient.address) {
            return {
              receiver: "",
              amount: "0",
              username: "",
              email: "",
              isValid: false,
            };
          }

          // Try to get additional user info
          let userData = null;
          try {
            userData = await fetchUserByAddress(recipient.address);
          } catch (error) {
            console.error("Error fetching user data:", error);
          }

          return {
            receiver: recipient.address,
            amount: (recipient.amount || 0).toString(),
            username: userData?.username || "",
            email: userData?.email || "",
            isValid: true,
          };
        })
      );

      setPayments(newPayments);
      setShowPayrollSelection(false);

      toast({
        title: "Payroll Selected",
        description: `Loaded ${newPayments.length} recipients from "${payrollData.name}"`,
      });
    } catch (error) {
      console.error("Error fetching payroll data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Failed to load payroll data: " +
          (error instanceof Error ? error.message : "Unknown error"),
      });

      // Reset to manual entry on error
      setSelectedPayroll("");
      setSelectedPayrollData(null);
      setShowManualEntry(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to manual entry mode
  const switchToManualEntry = () => {
    setSelectedPayroll("");
    setSelectedPayrollData(null);
    setShowManualEntry(true);
    setPayments([
      { receiver: "", amount: "", username: "", email: "", isValid: undefined },
    ]);
  };

  const addPaymentField = () => {
    setPayments([
      ...payments,
      { receiver: "", amount: "", username: "", email: "", isValid: undefined },
    ]);

    // Focus the newly added field after render
    setTimeout(() => {
      if (nextInputRef.current) {
        nextInputRef.current.focus();
      }
    }, 100);
  };

  const removePaymentField = (index: number) => {
    if (payments.length > 1) {
      const newPayments = payments.filter((_, i) => i !== index);
      setPayments(newPayments);
    }
  };

  // Verify field function with enhanced validation
  const verifyField = async (
    index: number,
    field: keyof PaymentField,
    value: string
  ) => {
    // Don't verify empty fields
    if (!value.trim()) {
      const newPayments = [...payments];
      newPayments[index] = {
        ...newPayments[index],
        [field]: value,
        isValid: undefined,
      };
      setPayments(newPayments);
      return;
    }

    // Set the current field being validated
    setCurrentField({ index, field });

    const newPayments = [...payments];
    if (!currentUser) return;

    try {
      // Check if the current wallet address is being entered
      if (field === "receiver" && value === walletAddress) {
        toast({
          title: "Invalid Input",
          description: "You cannot add your own wallet address as a recipient.",
          variant: "destructive",
        });
        // Mark as invalid but don't redirect
        newPayments[index] = {
          ...newPayments[index],
          [field]: value,
          isValid: false,
        };
        setPayments(newPayments);
        return;
      }
      // Check if user is trying to pay themselves
      else if (field === "username" && value === currentUser.username) {
        toast({
          title: "Invalid Input",
          description: `You cannot add your own ${field} as a recipient.`,
          variant: "destructive",
        });
        // Mark as invalid but don't redirect
        newPayments[index] = {
          ...newPayments[index],
          [field]: value,
          isValid: false,
        };
        setPayments(newPayments);
        return;
      } else if (field === "email" && value === currentUser.email) {
        toast({
          title: "Invalid Input",
          description: `You cannot add your own ${field} as a recipient.`,
          variant: "destructive",
        });
        // Mark as invalid but don't redirect
        newPayments[index] = {
          ...newPayments[index],
          [field]: value,
          isValid: false,
        };
        setPayments(newPayments);
        return;
      }
      // Check if username is being entered in email field
      else if (field === "email" && !value.includes("@")) {
        toast({
          title: "Invalid Input",
          description: "Please enter a valid email address with @ symbol.",
          variant: "destructive",
        });
        // Mark as invalid but don't redirect
        newPayments[index] = {
          ...newPayments[index],
          [field]: value,
          isValid: false,
        };
        setPayments(newPayments);
        return;
      }
      // Check if email is being entered in username field
      else if (field === "username" && value.includes("@")) {
        toast({
          title: "Invalid Input",
          description:
            "Username should not contain @ symbol. Use the email field for email addresses.",
          variant: "destructive",
        });
        // Mark as invalid but don't redirect
        newPayments[index] = {
          ...newPayments[index],
          [field]: value,
          isValid: false,
        };
        setPayments(newPayments);
        return;
      }
      // Check if wallet address is being entered in username or email field
      else if (
        (field === "username" || field === "email") &&
        value.startsWith("0x") &&
        value.length >= 10
      ) {
        toast({
          title: "Invalid Input",
          description: `This appears to be a wallet address. Please use the address field instead.`,
          variant: "destructive",
        });
        // Mark as invalid but don't redirect
        newPayments[index] = {
          ...newPayments[index],
          [field]: value,
          isValid: false,
        };
        setPayments(newPayments);
        return;
      }

      // Basic validation for each field type
      let isValid = false;

      if (field === "username") {
        // Username validation - alphanumeric with possible underscores
        isValid = /^[a-zA-Z0-9_]{3,30}$/.test(value);
      } else if (field === "email") {
        // Email validation
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      } else if (field === "receiver") {
        // Address validation - starts with 0x and has sufficient length
        isValid = value.startsWith("0x") && value.length >= 10;
      } else if (field === "amount") {
        // Amount validation - must be a number greater than 0
        try {
          const amount = Number(value);
          isValid = !isNaN(amount) && amount > 0;

          if (!isValid) {
            toast({
              title: "Invalid Amount",
              description: "Amount must be a number greater than 0",
              variant: "destructive",
            });

            // Mark as invalid but don't redirect
            newPayments[index] = {
              ...newPayments[index],
              [field]: value,
              isValid: false,
            };
            setPayments(newPayments);
            return; // Return early to prevent further processing
          }
        } catch (amountError) {
          console.error("Error validating amount:", amountError);
          toast({
            title: "Invalid Amount",
            description: "Please enter a valid number",
            variant: "destructive",
          });

          // Mark as invalid but don't redirect
          newPayments[index] = {
            ...newPayments[index],
            [field]: value,
            isValid: false,
          };
          setPayments(newPayments);
          return; // Return early to prevent further processing
        }
      }

      // Update the field with validation status
      newPayments[index] = {
        ...newPayments[index],
        [field]: value,
        isValid: isValid,
      };

      setPayments(newPayments);
    } catch (error) {
      console.error("Error verifying field:", error);
      // Don't throw or redirect on error, just log it
    } finally {
      // Clear the current field after validation is complete
      setTimeout(() => {
        setCurrentField({ index: -1, field: null });
      }, 500);
    }
  };

  const updatePayment = (
    index: number,
    field: keyof PaymentField,
    value: string
  ) => {
    // For amount field, prevent 'e', 'E', '+', '-' characters
    if (field === "amount" && /[eE+-]/.test(value)) {
      return;
    }

    // Update the payment
    const newPayments = [...payments];

    // Update the field without changing validation status yet
    newPayments[index] = {
      ...newPayments[index],
      [field]: value,
    };

    setPayments(newPayments);

    // Add to pending validations for debouncing
    setPendingValidations((prev) => [...prev, { index, field, value }]);
  };

  // Enhanced handleFocusChange function to fetch user data
  const handleFocusChange = useCallback(
    async (index: number, field: keyof PaymentField, value: string) => {
      // Don't verify empty fields or invalid fields
      if (!value.trim()) return;

      try {
        let userData = null;
        if (!walletAddress) return;

        setCurrentField({ index, field });

        // Call the appropriate API based on which field was verified
        try {
          if (field === "username" && value) {
            userData = await fetchUserByUsername(value, walletAddress);
          } else if (field === "email" && value) {
            userData = await fetchUserByEmail(value, walletAddress);
          } else if (field === "receiver" && value) {
            userData = await fetchUserByAddress(value);
          }
        } catch (apiError) {
          console.error("API error during user data fetch:", apiError);
          // Don't throw the error further, just show a toast
          toast({
            variant: "destructive",
            title: "Verification Failed",
            description:
              "Could not verify recipient details. Please check your input and try again.",
          });
          return; // Return early to prevent further processing
        }

        if (userData) {
          // Update all fields with the fetched data
          const newPayments = [...payments];
          newPayments[index] = {
            ...newPayments[index],
            username: userData.username || newPayments[index].username,
            email: userData.email || newPayments[index].email,
            receiver: userData.walletAddress || newPayments[index].receiver,
            isValid: true,
          };

          setPayments(newPayments);

          toast({
            title: "Recipient Verified",
            description: "Recipient details have been successfully retrieved.",
          });
        } else {
          // If no user data found but the field format is valid, mark as valid but don't auto-fill
          const newPayments = [...payments];
          if (newPayments[index].isValid) {
            toast({
              title: "Validation Successful",
              description: `${field.charAt(0).toUpperCase() + field.slice(1)} format is valid, but no additional user details found.`,
            });
          }
        }
      } catch (error) {
        // Catch any other errors that might occur
        console.error("Error in handleFocusChange:", error);
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description:
            "Could not verify recipient details. Please check your input and try again.",
        });
        // Don't throw the error further
      } finally {
        // Clear the current field after a delay
        setTimeout(() => {
          setCurrentField({ index: -1, field: null });
        }, 500);
      }
    },
    [
      walletAddress,
      fetchUserByUsername,
      fetchUserByEmail,
      fetchUserByAddress,
      payments,
      toast,
    ]
  );

  // Create a debounced version of handleFocusChange
  const debouncedHandleFocusChange = useCallback(
    (index: number, field: keyof PaymentField, value: string) => {
      if (value.trim()) {
        handleFocusChange(index, field, value);
      }
    },
    [handleFocusChange]
  );

  // Add this inside the component, after the state declarations
  const [pendingValidations, setPendingValidations] = useState<
    Array<{ index: number; field: keyof PaymentField; value: string }>
  >([]);

  // Use the debounced value
  const debouncedPendingValidations = useDebounce(pendingValidations, 500);

  // Add this effect to process debounced validations
  useEffect(() => {
    if (debouncedPendingValidations.length > 0) {
      // Process only the latest validation for each field
      const uniqueValidations = debouncedPendingValidations.reduce(
        (acc, curr) => {
          const key = `${curr.index}-${curr.field}`;
          acc[key] = curr;
          return acc;
        },
        {} as Record<string, (typeof debouncedPendingValidations)[0]>
      );

      // Execute validations
      Object.values(uniqueValidations).forEach(({ index, field, value }) => {
        verifyField(index, field, value);
      });

      // Clear pending validations
      setPendingValidations([]);
    }
  }, [debouncedPendingValidations]);

  // Add this to the end of the updatePayment function, replacing the setTimeout block
  // Modify the handleFocusChange function to be debounced

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index === payments.length - 1) {
        addPaymentField();
      }
    }
  };

  const selectRecipient = (recipient: RecentRecipient) => {
    if (selectedRecipientIndex !== null) {
      updatePayment(selectedRecipientIndex, "receiver", recipient.address);
      updatePayment(selectedRecipientIndex, "name", recipient.name);

      // Also update email and username if available
      if (recipient.email) {
        updatePayment(selectedRecipientIndex, "email", recipient.email);
      }

      if (recipient.username) {
        updatePayment(selectedRecipientIndex, "username", recipient.username);
      }

      setShowRecipientSearch(false);
      setSelectedRecipientIndex(null);

      // Focus the amount field for this recipient
      setTimeout(() => {
        const amountInputs = document.querySelectorAll(
          'input[placeholder="0.00"]'
        );
        if (amountInputs[selectedRecipientIndex]) {
          (amountInputs[selectedRecipientIndex] as HTMLInputElement).focus();
        }
      }, 100);
    }
  };

  const openRecipientSearch = (index: number) => {
    setSelectedRecipientIndex(index);
    setShowRecipientSearch(true);
  };

  // Verify recipient address and fetch user data
  const verifyRecipient = async (index: number) => {
    const payment = payments[index];

    if (!payment || !payment.receiver) return;

    try {
      // Check if address is valid
      if (!payment.receiver.startsWith("0x") || payment.receiver.length < 10) {
        toast({
          variant: "destructive",
          title: "Invalid Address",
          description: "Please enter a valid wallet address",
        });
        return;
      }

      // Get user data by address
      const userData = await fetchUserByAddress(payment.receiver);

      if (userData) {
        // Update payment with user data
        setPayments(
          payments.map((p, i) =>
            i === index
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
          description: "Recipient details have been retrieved successfully",
        });
      }
    } catch (error) {
      console.error("Error verifying recipient:", error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Could not verify recipient details",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Don't validate payments if we're just opening the payroll selection
    if (showPayrollSelection) {
      return;
    }

    try {
      // Validate all fields
      const validPayments = payments.filter((p) => p.receiver && p.amount);

      if (validPayments.length === 0 && !showPayrollSelection) {
        toast({
          variant: "destructive",
          title: "Invalid Input",
          description: "Please add at least one recipient with an amount",
        });
        return;
      }

      // Check for invalid addresses
      const hasInvalidAddresses = payments.some(
        (p) => p.receiver && p.isValid === false
      );

      if (hasInvalidAddresses) {
        toast({
          variant: "destructive",
          title: "Invalid Addresses",
          description: "Please correct the invalid addresses before continuing",
        });
        return;
      }

      // Check for invalid amounts
      const hasInvalidAmounts = payments.some(
        (p) => p.amount && (isNaN(Number(p.amount)) || Number(p.amount) <= 0)
      );

      if (hasInvalidAmounts) {
        toast({
          variant: "destructive",
          title: "Invalid Amounts",
          description: "All amounts must be numbers greater than 0",
        });
        return;
      }

      // Move to confirmation step
      setShowConfirmation(true);
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "An error occurred while processing your request. Please try again.",
      });
      // Don't redirect, just show the error
    }
  };
  const processPayment = async (secure = false) => {
    if (!walletAddress) {
      toast({
        variant: "destructive",
        title: "Wallet not connected",
        description: "Please connect your wallet to continue",
      });
      return;
    }

    const validPayments = payments.filter((p) => p.receiver && p.amount);

    if (validPayments.length === 0) {
      toast({
        variant: "destructive",
        title: "Invalid input",
        description: "Please add at least one valid payment",
      });
      return;
    }

    // Add balance validation
    if (totalAmount > suiBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient balance",
        description: `You need ${totalAmount.toFixed(2)} SUI but only have ${suiBalance.toFixed(2)} SUI`,
      });
      return;
    }

    try {
      setIsLoading(true);

      const recipients = validPayments.map((p) => ({
        address: p.receiver,
        amount: Number(p.amount),
        status: "active" as const,
        plainCode: secure ? generateVerificationCode() : "",
      }));
      const totalAmount = recipients.reduce((sum, r) => sum + r.amount, 0);
      let result;

      if (secure) {
        // Handle secure bulk payment
        result = await sendSecureBulkPayment(
          recipients.map((r) => r.address),
          recipients.map((r) => r.amount),
          totalAmount
        );
      } else {
        // Handle regular bulk payment
        result = await sendBulkPayment(
          recipients.map((r) => r.address),
          recipients.map((r) => r.amount),
          totalAmount
        );
      }

      if (result?.success) {
        const senderInfo = await fetchUserByAddress(walletAddress);
        const senderDisplay =
          senderInfo?.username ||
          walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4);

        // Store transaction with individual verification codes
        await addBulkTransaction({
          transactionDigest: result.data?.transactionId as string,
          sender: walletAddress,
          recipients: recipients.map((r) => ({
            address: r.address,
            amount: r.amount,
            plainCode: r.plainCode || "",
            status: secure ? "active" : ("completed" as const),
          })),
          totalAmount,
          tokenType: "SUI", //USDC
        });

        // Add notifications for each recipient with different priorities based on status
        recipients.forEach((recipient) => {
          const status = secure ? "active" : "completed";
          addNotification({
            type: status === "completed" ? "payment" : "claim",
            title:
              status === "completed"
                ? "Payment Received"
                : "Payment Available to Claim",
            description:
              status === "completed"
                ? `You received ${recipient.amount} SUI from ${senderDisplay}`
                : `${senderDisplay} sent you ${recipient.amount} SUI. Click to claim.`,
            priority: status === "active" ? "high" : "normal",
            transactionId: result.data?.transactionId as string,
          });
        });

        if (secure) {
          const emailPayloads = validPayments
            .filter(
              (payment, index) =>
                payment.email &&
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payment.email) &&
                recipients[index].plainCode // Check the recipients array instead of storedRecipients
            )
            .map((payment, index) => ({
              recipientEmail: payment.email,
              senderEmail: senderEmail || walletAddress,
              amount: payment.amount,
              token: "SUI",
              verificationCode: recipients[index].plainCode, // Use the generated plainCode
              transactionId: result.data?.transactionId,
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

        // Reset form and state
        setPayments([
          {
            receiver: "",
            amount: "",
            username: "",
            email: "",
            isValid: undefined,
          },
        ]);
        setShowConfirmation(false);
        setCurrentStep(1);
        setSelectedPayroll("");
        setSelectedPayrollData(null);
        setShowManualEntry(true);

        toast({
          title: "Success",
          description: `${secure ? "Secure payment" : "Payment"} processed successfully`,
        });
      } else {
        throw new Error(result?.error || "Failed to send payment");
      }
    } catch (error) {
      console.error("Bulk payment error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while processing the payment",
      });
      console.error("Bulk payment error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while processing the payment",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Bulk Payment</h1>
          <p className="text-gray-400">
            Send payments to multiple recipients at once
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-blue-900/30 text-blue-400 border-blue-800"
          >
            {payments.filter((p) => p.receiver && p.amount).length} Recipients
          </Badge>
          <Badge
            variant="outline"
            className="bg-blue-900/30 text-blue-400 border-blue-800"
          >
            {totalAmount.toFixed(4)} SUI
          </Badge>
        </div>
      </motion.div>

      {/* Progress bar */}
      <div className="w-full bg-[#061020] h-1 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-blue-600"
          initial={{ width: "0%" }}
          animate={{ width: showConfirmation ? "100%" : "50%" }}
          transition={{ duration: 0.3 }}
        ></motion.div>
      </div>

      <Card className="bg-gradient-to-b from-[#0a1930] to-[#061020] border-[#1a2a40] text-white overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full translate-x-16 translate-y-16 blur-3xl"></div>

        <CardHeader className="relative z-10 border-b border-[#1a2a40] bg-[#061020]/30">
          <CardTitle>
            {showConfirmation ? "Confirm Bulk Payment" : "Add Recipients"}
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-10 p-6">
          <AnimatePresence mode="wait">
            {!showConfirmation ? (
              <motion.form
                key="payment-form"
                onSubmit={handleSubmit}
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
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
                        <Button
                          variant="blueWhite"
                          className="w-full justify-between text-left font-normal bg-[#061020] border-[#1a2a40] text-white"
                          onClick={() => setShowPayrollSelection(true)}
                        >
                          {selectedPayroll
                            ? selectedPayroll
                            : "Select a payroll or enter manually"}
                          <Users className="ml-2 h-4 w-4 opacity-70" />
                        </Button>
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

                <div className="space-y-4">
                  {payments.map((payment, index) => (
                    <motion.div
                      key={index}
                      className={`flex gap-4 items-start p-4 rounded-lg border ${
                        payment.isValid === true
                          ? "bg-green-900/10 border-green-800/30"
                          : payment.isValid === false
                            ? "bg-red-900/10 border-red-800/30"
                            : "bg-[#0a1930] border-[#1a2a40]"
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row gap-3 items-start">
                          {/* Username field */}
                          <div className="sm:w-1/5 space-y-1">
                            <label className="text-sm text-gray-400">
                              Username
                            </label>
                            <div className="relative">
                              <Input
                                value={payment.username}
                                onChange={(e) =>
                                  updatePayment(
                                    index,
                                    "username",
                                    e.target.value
                                  )
                                }
                                onBlur={(e) => {
                                  if (e.target.value) {
                                    debouncedHandleFocusChange(
                                      index,
                                      "username",
                                      e.target.value
                                    );
                                  }
                                }}
                                placeholder="Username"
                                className={`bg-[#061020] border-[#1a2a40] text-white ${
                                  currentField.index === index &&
                                  currentField.field === "username" &&
                                  payment.isValid === false
                                    ? "border-red-800 focus:border-red-700"
                                    : ""
                                }`}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                readOnly={!showManualEntry}
                              />
                              {payment.username && payment.isValid === true && (
                                <CheckCircle
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500 cursor-pointer"
                                  onClick={() =>
                                    handleFocusChange(
                                      index,
                                      "username",
                                      payment.username
                                    )
                                  }
                                />
                              )}
                            </div>
                            {currentField.index === index &&
                              currentField.field === "username" &&
                              payment.isValid === false && (
                                <p className="text-xs text-red-400 mt-1">
                                  Invalid username format
                                </p>
                              )}
                          </div>

                          {/* Email field */}
                          <div className="sm:w-1/4 space-y-1">
                            <label className="text-sm text-gray-400">
                              Email
                            </label>
                            <div className="relative">
                              <Input
                                value={payment.email}
                                onChange={(e) =>
                                  updatePayment(index, "email", e.target.value)
                                }
                                onBlur={(e) => {
                                  if (e.target.value) {
                                    debouncedHandleFocusChange(
                                      index,
                                      "email",
                                      e.target.value
                                    );
                                  }
                                }}
                                type="email"
                                placeholder="email@example.com"
                                className={`bg-[#061020] border-[#1a2a40] text-white ${
                                  currentField.index === index &&
                                  currentField.field === "email" &&
                                  payment.isValid === false
                                    ? "border-red-800 focus:border-red-700"
                                    : ""
                                }`}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                readOnly={!showManualEntry}
                              />
                              {payment.email && payment.isValid === true && (
                                <CheckCircle
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500 cursor-pointer"
                                  onClick={() =>
                                    handleFocusChange(
                                      index,
                                      "email",
                                      payment.email
                                    )
                                  }
                                />
                              )}
                            </div>
                            {currentField.index === index &&
                              currentField.field === "email" &&
                              payment.isValid === false && (
                                <p className="text-xs text-red-400 mt-1">
                                  Invalid email format
                                </p>
                              )}
                          </div>

                          {/* Wallet Address field */}
                          <div className="sm:w-1/3 space-y-1">
                            <div className="flex justify-between">
                              <label className="text-sm text-gray-400">
                                Recipient Address
                              </label>
                              {showManualEntry && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
                                  onClick={() => openRecipientSearch(index)}
                                >
                                  <Search className="h-3 w-3 mr-1" />
                                  Search
                                </Button>
                              )}
                            </div>
                            <div className="relative">
                              <Input
                                value={payment.receiver}
                                onChange={(e) =>
                                  updatePayment(
                                    index,
                                    "receiver",
                                    e.target.value
                                  )
                                }
                                onBlur={(e) => {
                                  if (e.target.value) {
                                    debouncedHandleFocusChange(
                                      index,
                                      "receiver",
                                      e.target.value
                                    );
                                  }
                                }}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                placeholder="0x..."
                                className={`bg-[#061020] border-[#1a2a40] text-white pr-8 ${
                                  currentField.index === index &&
                                  currentField.field === "receiver" &&
                                  payment.isValid === false
                                    ? "border-red-800 focus:border-red-700"
                                    : ""
                                }`}
                                ref={
                                  index === payments.length - 1
                                    ? nextInputRef
                                    : null
                                }
                                readOnly={!showManualEntry}
                              />
                              {payment.isValid === true && (
                                <CheckCircle className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                              )}
                              {payment.isValid === false && (
                                <AlertCircle className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                              )}
                              {payment.receiver &&
                                showManualEntry &&
                                !payment.isValid && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-8 top-1/2 transform -translate-y-1/2 h-5 w-5 p-0"
                                    onClick={() => verifyRecipient(index)}
                                  >
                                    <CheckCircle className="h-3 w-3 text-blue-400" />
                                  </Button>
                                )}
                            </div>
                            {payment.name && (
                              <p className="text-xs text-green-400 mt-1">
                                {payment.name}
                              </p>
                            )}
                            {currentField.index === index &&
                              currentField.field === "receiver" &&
                              payment.isValid === false && (
                                <p className="text-xs text-red-400 mt-1">
                                  Invalid address format
                                </p>
                              )}
                          </div>

                          {/* Amount field */}
                          <div className="sm:w-1/6 space-y-1">
                            <label className="text-sm text-gray-400">
                              Amount (SUI)
                            </label>
                            <Input
                              value={payment.amount}
                              onChange={(e) =>
                                updatePayment(index, "amount", e.target.value)
                              }
                              type="number"
                              step="0.0000001"
                              min="0.0000001"
                              placeholder="0.00"
                              className={`bg-[#061020] border-[#1a2a40] text-white ${
                                payment.amount &&
                                (isNaN(Number(payment.amount)) ||
                                  Number(payment.amount) <= 0)
                                  ? "border-red-800 focus:border-red-700"
                                  : ""
                              }`}
                              onKeyDown={(e) => handleKeyDown(e, index)}
                            />
                            {payment.amount &&
                              (isNaN(Number(payment.amount)) ||
                                Number(payment.amount) <= 0) && (
                                <p className="text-xs text-red-400 mt-1">
                                  Amount must be greater than 0
                                </p>
                              )}
                          </div>
                        </div>
                      </div>

                      {payments.length > 1 && showManualEntry && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePaymentField(index)}
                          className="text-gray-400 hover:text-red-300 hover:bg-red-900/20 mt-1"
                          disabled={
                            payments.length === 1 &&
                            !payment.receiver &&
                            !payment.amount
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  {showManualEntry && (
                    <Button
                      type="button"
                      variant="blueWhite"
                      onClick={addPaymentField}
                      className="border-[#1a2a40] text-blue-400 hover:bg-blue-900/20 w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Recipient
                    </Button>
                  )}

                  <div className="text-right bg-[#061020]/70 p-3 rounded-lg border border-[#1a2a40] w-full sm:w-auto">
                    <div className="flex items-center justify-between gap-8">
                      <p className="text-sm text-gray-400">Total Amount:</p>
                      <p className="text-xl font-bold text-white">
                        {totalAmount.toFixed(2)} SUI
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={
                    payments.every((p) => !p.receiver || !p.amount) ||
                    payments.some((p) => p.isValid === false) ||
                    payments.some(
                      (p) =>
                        p.amount &&
                        (isNaN(Number(p.amount)) || Number(p.amount) <= 0)
                    ) ||
                    isLoading
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Review Payment <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </motion.form>
            ) : (
              <motion.div
                key="confirmation"
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-4">
                  <div className="bg-[#061020]/70 p-5 rounded-lg border border-[#1a2a40]">
                    <h3 className="font-medium text-lg mb-4">
                      Payment Summary
                    </h3>

                    {selectedPayrollData && (
                      <div className="mb-4 pb-4 border-b border-[#1a2a40]">
                        <p className="text-sm text-gray-400">Source Payroll:</p>
                        <p className="font-medium">
                          {selectedPayrollData.name}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="text-gray-400">Your Balance:</p>
                        <p
                          className={`font-medium ${suiBalance < totalAmount ? "text-red-400" : "text-green-400"}`}
                        >
                          {suiBalance.toFixed(2)} SUI
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400">Required Amount:</p>
                        <p className="font-medium">
                          {totalAmount.toFixed(4)} SUI
                        </p>
                      </div>
                    </div>

                    {suiBalance < totalAmount && (
                      <div className="bg-red-900/20 p-4 rounded-lg border border-red-900/30 flex gap-3 mb-4">
                        <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-red-200">
                            Insufficient balance. You need{" "}
                            {(totalAmount - suiBalance).toFixed(4)} more SUI to
                            complete this transaction.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      {payments
                        .filter((p) => p.receiver && p.amount)
                        .map((payment, index) => (
                          <motion.div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-md bg-[#0a1930] border border-[#1a2a40]"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-[#1a2a40] bg-[#061020]">
                                <AvatarFallback className="bg-blue-900/50 text-blue-200">
                                  {payment.name ? payment.name.charAt(0) : "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                {payment.name && (
                                  <p className="font-medium">{payment.name}</p>
                                )}
                                <p className="text-sm text-gray-400 font-mono">
                                  {payment.receiver.substring(0, 8)}...
                                  {payment.receiver.substring(
                                    payment.receiver.length - 6
                                  )}
                                </p>
                                {(payment.username || payment.email) && (
                                  <p className="text-xs text-gray-400">
                                    {payment.username && `@${payment.username}`}{" "}
                                    {payment.email && `• ${payment.email}`}
                                  </p>
                                )}
                              </div>
                            </div>
                            <p className="font-medium">{payment.amount} SUI</p>
                          </motion.div>
                        ))}
                    </div>

                    <Separator className="my-4 bg-[#1a2a40]" />

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-400">Recipients:</p>
                        <p className="font-medium">
                          {
                            payments.filter((p) => p.receiver && p.amount)
                              .length
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400">Total Amount:</p>
                        <p className="text-xl font-bold">
                          {totalAmount.toFixed(2)} SUI
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-900/30 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-200">
                        By confirming this transaction, you agree to send
                        payments to all recipients listed above. This action
                        cannot be undone once processed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="blueWhite"
                    onClick={() => setShowConfirmation(false)}
                    className="border-[#1a2a40] hover:bg-[#0a1930]"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Back
                  </Button>

                  <Button
                    onClick={() => processPayment(false)}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Payment Directly
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => processPayment(true)}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Send Payment Securely
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Recipient search dialog */}
      <Dialog open={showRecipientSearch} onOpenChange={setShowRecipientSearch}>
        <DialogContent className="sm:max-w-[500px] bg-[#0a1930] border-[#1a2a40] text-white">
          <DialogHeader>
            <DialogTitle>Select Recipient</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose from your recent recipients or search by name or address
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search recipients..."
                className="pl-9 bg-[#061020] border-[#1a2a40] text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredRecipients.length > 0 ? (
                filteredRecipients.map((recipient, index) => (
                  <motion.div
                    key={recipient.address}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <Button
                      variant="blueWhite"
                      className="w-full justify-start border-[#1a2a40] hover:bg-[#061020] hover:border-blue-600 transition-all p-3 h-auto"
                      onClick={() => selectRecipient(recipient)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <Avatar className="h-9 w-9 border border-[#1a2a40] bg-[#061020]">
                          <AvatarFallback className="bg-blue-900/50 text-blue-200">
                            {recipient.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left overflow-hidden">
                          <div className="font-medium">{recipient.name}</div>
                          <div className="text-xs text-gray-400 truncate">
                            {recipient.address.substring(0, 10)}...
                            {recipient.address.substring(
                              recipient.address.length - 4
                            )}
                          </div>
                          {(recipient.username || recipient.email) && (
                            <div className="text-xs text-gray-500 truncate">
                              {recipient.username && `@${recipient.username}`}{" "}
                              {recipient.email && `• ${recipient.email}`}
                            </div>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs bg-[#061020] border-[#1a2a40]"
                        >
                          {recipient.lastUsed}
                        </Badge>
                      </div>
                    </Button>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No matching recipients found</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payroll selection dialog */}
      <Dialog
        open={showPayrollSelection}
        onOpenChange={setShowPayrollSelection}
      >
        <DialogContent className="sm:max-w-[500px] bg-[#0a1930] border-[#1a2a40] text-white">
          <DialogHeader>
            <DialogTitle>Select Payroll</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose from your saved payrolls or continue with manual entry
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              <Button
                variant="blueWhite"
                className="w-full justify-start border-[#1a2a40] hover:bg-[#061020] hover:border-blue-600 transition-all p-3 h-auto"
                onClick={() => handlePayrollSelect("none")}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="h-9 w-9 rounded-full bg-[#061020] border border-[#1a2a40] flex items-center justify-center">
                    <Plus className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">Manual Entry</div>
                    <div className="text-xs text-gray-400">
                      Add recipients manually
                    </div>
                  </div>
                </div>
              </Button>

              {payrollList.length > 0 ? (
                payrollList.map((payroll, index) => (
                  <motion.div
                    key={payroll.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <Button
                      variant="blueWhite"
                      className="w-full justify-start border-[#1a2a40] hover:bg-[#061020] hover:border-blue-600 transition-all p-3 h-auto"
                      onClick={() => handlePayrollSelect(payroll.name)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="h-9 w-9 rounded-full bg-blue-900/30 border border-blue-800/30 flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="flex-1 text-left overflow-hidden">
                          <div className="font-medium">{payroll.name}</div>
                          <div className="text-xs text-gray-400">
                            {payroll.recipients?.length || 0} recipients
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs bg-[#061020] border-[#1a2a40]"
                        >
                          {payroll.totalAmount?.toFixed(2) || "0.00"} SUI
                        </Badge>
                      </div>
                    </Button>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>No payrolls found</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
