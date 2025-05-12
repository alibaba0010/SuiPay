"use client";

import type React from "react";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Save,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useContract } from "@/hooks/useContract";
import { useWalletContext } from "@/contexts/wallet-context";
import { usePayroll } from "@/hooks/usePayroll";
import type { Recipient } from "@/types/payroll";
import { useUserProfile } from "@/hooks/useUserProfile";

interface PayrollRecipient {
  username: string;
  email: string;
  address: string;
  amount: string;
  isValid?: boolean;
  name?: string;
}

interface RecentRecipient {
  address: string;
  name: string;
  avatar: string;
  lastUsed: string;
  email?: string;
  username?: string;
}

export default function AddNewPayroll() {
  const [currentStep, setCurrentStep] = useState(1);
  const { walletAddress } = useWalletContext() || {};
  const { createPayroll: storePayroll } = usePayroll();
  const [payrollData, setPayrollData] = useState({
    name: "",
    description: "",
    amount: "",
    token: "SUI",
    recipients: [],
    notes: "",
  });
  const [currentField, setCurrentField] = useState<
    keyof PayrollRecipient | null
  >(null);
  const [recipients, setRecipients] = useState<PayrollRecipient[]>([
    { username: "", email: "", address: "", amount: "", isValid: undefined },
  ]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [currentUser, setCurrentUser] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showRecipientSearch, setShowRecipientSearch] = useState(false);
  const [selectedRecipientIndex, setSelectedRecipientIndex] = useState<
    number | null
  >(null);
  const {
    fetchUserByAddress,
    userProfile,
    fetchUserByEmail,
    fetchUserByUsername,
    isLoading,
  } = useUserProfile();

  // Add the contract hook
  const { createPayroll, createUSDCPayroll } = useContract();

  // Reference to the next input field
  const nextInputRef = useRef<HTMLInputElement>(null);

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

  // Calculate total amount whenever recipients change
  useEffect(() => {
    const calculateTotal = () => {
      const sum = recipients.reduce((acc, recipient) => {
        const amount = Number.parseFloat(recipient.amount) || 0;
        return acc + amount;
      }, 0);
      setTotalAmount(sum);
    };

    calculateTotal();
  }, [recipients]);

  // Auto-validate addresses
  useState(() => {
    const validateAddresses = async () => {
      const updatedRecipients = [...recipients];

      for (let i = 0; i < updatedRecipients.length; i++) {
        const recipient = updatedRecipients[i];

        // Simple validation - in a real app, you would check if this is a valid address
        if (
          recipient.address &&
          recipient.address.startsWith("0x") &&
          recipient.address.length >= 10
        ) {
          // Find if we have a name for this address
          const matchingRecipient = recentRecipients.find(
            (r) => r.address === recipient.address
          );

          updatedRecipients[i] = {
            ...recipient,
            isValid: true,
            name: matchingRecipient?.name,
            email: matchingRecipient?.email || recipient.email,
            username: matchingRecipient?.username || recipient.username,
          };
        } else if (recipient.address) {
          updatedRecipients[i] = {
            ...recipient,
            isValid: false,
          };
        }
      }

      setRecipients(updatedRecipients);
    };

    validateAddresses();
  });
  useEffect(() => {
    const currentUser = async () => {
      if (!walletAddress) return;
      if (!userProfile && !isLoading) {
        fetchUserByAddress(walletAddress);
      }
      if (userProfile) {
        setCurrentUser(userProfile);
      }
    };
    currentUser();
  }, [walletAddress, userProfile, isLoading, fetchUserByAddress]);
  interface PayrollData {
    name: string;
    description: string;
    amount: string;
    token: string;
    schedule: string;
    startDate: Date;
    endDate: Date | null;
    recipients: Recipient[];
    requireVerification: boolean;
    approvalWorkflow: string;
    notes: string;
  }

  // Function to verify if a field has valid input
  const verifyField = async (
    index: number,
    field: keyof PayrollRecipient,
    value: string
  ) => {
    // Don't verify empty fields
    if (!value.trim()) return;

    const newRecipients = [...recipients];
    if (!currentUser) return;

    try {
      // Check if the current wallet address is being entered
      if (field === "address" && value === walletAddress) {
        toast({
          title: "Invalid Input",
          description: "You cannot add your own wallet address as a recipient.",
          variant: "destructive",
        });
        // Mark as invalid but don't redirect
        newRecipients[index] = {
          ...newRecipients[index],
          [field]: value,
          isValid: false,
        };
        setRecipients(newRecipients);
        return;
      }
      //add esle if
      else if (field === "username" && value === currentUser.username) {
        toast({
          title: "Invalid Input",
          description: `You cannot add your own ${field} as a recipient.`,
          variant: "destructive",
        });
        // Mark as invalid but don't redirect
        newRecipients[index] = {
          ...newRecipients[index],
          [field]: value,
          isValid: false,
        };
        setRecipients(newRecipients);
        return;
      } else if (field === "email" && value === currentUser.email) {
        toast({
          title: "Invalid Input",
          description: `You cannot add your own ${field} as a recipient.`,
          variant: "destructive",
        });
        // Mark as invalid but don't redirect
        newRecipients[index] = {
          ...newRecipients[index],
          [field]: value,
          isValid: false,
        };
        setRecipients(newRecipients);
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
      } else if (field === "address") {
        // Address validation - starts with 0x and has sufficient length
        isValid = value.startsWith("0x") && value.length >= 10;
      }

      // Update the field with validation status
      newRecipients[index] = {
        ...newRecipients[index],
        [field]: value,
        isValid: isValid,
      };

      setRecipients(newRecipients);
    } catch (error) {
      console.error("Error verifying field:", error);
      // Don't throw or redirect on error, just log it
    }
  };

  // Function to handle focus change and auto-fetch user data
  const handleFocusChange = async (
    index: number,
    field: keyof PayrollRecipient,
    value: string
  ) => {
    // Don't verify empty fields or invalid fields
    if (!value.trim() || !recipients[index].isValid) return;

    try {
      let userData;
      if (!walletAddress) return;
      // Call the appropriate API based on which field was verified
      if (field === "username" && value) {
        userData = await fetchUserByUsername(value, walletAddress);
      } else if (field === "email" && value) {
        userData = await fetchUserByEmail(value, walletAddress);
      } else if (field === "address" && value) {
        userData = await fetchUserByAddress(value);
      }

      if (userData) {
        // Update all fields with the fetched data
        const newRecipients = [...recipients];
        newRecipients[index] = {
          ...newRecipients[index],
          username: userData.username || recipients[index].username,
          email: userData.email || recipients[index].email,
          address: userData.walletAddress || recipients[index].address,
          isValid: true,
        };

        setRecipients(newRecipients);

        toast({
          title: "Recipient Verified",
          description: "Recipient details have been successfully retrieved.",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleInputChange = (
    field: keyof PayrollData,
    value: PayrollData[keyof PayrollData]
  ) => {
    setPayrollData({
      ...payrollData,
      [field]: value,
    });
  };

  const addRecipient = () => {
    setRecipients([
      ...recipients,
      { username: "", email: "", address: "", amount: "", isValid: undefined },
    ]);

    // Focus the newly added field after render
    setTimeout(() => {
      if (nextInputRef.current) {
        nextInputRef.current.focus();
      }
    }, 100);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };
  const updateRecipient = (
    index: number,
    field: keyof PayrollRecipient,
    value: string
  ) => {
    // For amount field, prevent 'e', 'E', '+', '-' characters
    if (field === "amount" && /[eE+-]/.test(value)) {
      return;
    }

    // Update the recipient
    const newRecipients = [...recipients];
    newRecipients[index] = {
      ...newRecipients[index],
      [field]: value,
    };
    setRecipients(newRecipients);

    // Verify field if needed
    if (field === "username" || field === "email" || field === "address") {
      verifyField(index, field, value);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (index === recipients.length - 1) {
        addRecipient();
      }
    }
  };

  const openRecipientSearch = (index: number) => {
    setSelectedRecipientIndex(index);
    setShowRecipientSearch(true);
  };

  const selectRecipient = (recipient: RecentRecipient) => {
    if (selectedRecipientIndex !== null) {
      updateRecipient(selectedRecipientIndex, "address", recipient.address);
      updateRecipient(selectedRecipientIndex, "name", recipient.name);

      // Also update email and username if available
      if (recipient.email) {
        updateRecipient(selectedRecipientIndex, "email", recipient.email);
      }

      if (recipient.username) {
        updateRecipient(selectedRecipientIndex, "username", recipient.username);
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

  // Update the handleSubmit function
  const handleSubmit = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    try {
      // Validate form before submission
      if (!isFormValid()) {
        toast({
          title: "Validation Error",
          description: "Please check all required fields and try again.",
          variant: "destructive",
        });
        return; // Stop execution if validation fails
      }

      // Filter out empty recipients
      const validRecipients = recipients.filter((r) => r.address && r.amount);

      const recipientAddresses = validRecipients.map((r) => r.address);
      const recipientAmounts = validRecipients.map((r) => Number(r.amount));

      // First create payroll on smart contract using the appropriate function based on token type
      let contractResult;
      if (payrollData.token === "SUI") {
        contractResult = await createPayroll(
          payrollData.name,
          recipientAddresses,
          recipientAmounts,
          totalAmount
        );
      } else {
        contractResult = await createUSDCPayroll(
          payrollData.name,
          recipientAddresses,
          recipientAmounts,
          totalAmount
        );
      }

      if (contractResult.success) {
        // If smart contract creation succeeds, store in database
        try {
          await storePayroll({
            name: payrollData.name,
            ownerAddress: walletAddress || "",
            recipients: validRecipients.map((r) => ({
              address: r.address,
              amount: Number(r.amount),
            })),
            tokenType: payrollData.token as "USDC" | "SUI",
          });

          toast({
            title: "Payroll Created",
            description: `${payrollData.name} has been created successfully with ${validRecipients.length} recipients.`,
          });

          // Reset form and go back to step 1
          setPayrollData({
            name: "",
            description: "",
            amount: "",
            token: "SUI",
            recipients: [],
            notes: "",
          });
          setRecipients([
            {
              username: "",
              email: "",
              address: "",
              amount: "",
              isValid: undefined,
            },
          ]);
          setCurrentStep(1);
        } catch (dbError) {
          console.error("Error storing payroll in database:", dbError);
          toast({
            title: "Warning",
            description:
              "Payroll created on-chain but failed to sync with database",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description:
            "error" in contractResult
              ? contractResult.error
              : "Failed to create payroll",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating payroll:", error);
      toast({
        title: "Error",
        description: "Failed to create payroll. Please try again.",
        variant: "destructive",
      });
    }
  };

  const goToNextStep = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!isFormValid()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setCurrentStep(2);
  };

  const goToPreviousStep = () => {
    setCurrentStep(1);
  };

  const isFormValid = () => {
    // Check if payroll name is provided
    if (payrollData.name.trim() === "") return false;

    // Check if at least one recipient has both address and amount
    const hasValidRecipient = recipients.some((r) => {
      // Each recipient must have at least address and amount greater than 0
      const hasRequiredFields =
        r.address && r.amount && Number.parseFloat(r.amount) > 0;

      // All usernames/emails must have an address
      const hasValidRelationships = r.username || r.email ? !!r.address : true;

      return hasRequiredFields && hasValidRelationships;
    });

    return hasValidRecipient;
  };

  // Filter recipients based on search query
  const filteredRecipients = recentRecipients.filter(
    (recipient) =>
      recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipient.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (recipient.email &&
        recipient.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (recipient.username &&
        recipient.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Animation variants
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

  return (
    <div className="space-y-6 w-full">
      {/* Progress bar */}
      <div className="w-full bg-[#061020] h-1 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-blue-600"
          initial={{ width: "0%" }}
          animate={{ width: currentStep === 1 ? "50%" : "100%" }}
          transition={{ duration: 0.3 }}
        ></motion.div>
      </div>

      <Card className="bg-gradient-to-b from-[#0a1930] to-[#061020] border-[#1a2a40] text-white overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full translate-x-16 translate-y-16 blur-3xl"></div>

        <CardHeader className="relative z-10 border-b border-[#1a2a40] bg-[#061020]/30">
          <CardTitle>
            {currentStep === 1 ? "Add New Payroll" : "Review Payroll Details"}
          </CardTitle>
          <CardDescription>
            {currentStep === 1
              ? "Create a new payroll by providing the necessary details"
              : "Review and confirm your payroll information"}
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 p-6">
          <AnimatePresence mode="wait">
            {currentStep === 1 ? (
              <motion.div
                key="payroll-form"
                className="space-y-6"
                initial="hidden"
                animate="show"
                variants={containerVariants}
              >
                <motion.div
                  className="bg-blue-900/20 border border-blue-800/40 rounded-lg p-4 text-sm text-blue-300"
                  variants={itemVariants}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">Recipient Verification</p>
                      <p>
                        Fill in a username, email, or address field and click
                        the green check icon that appears to verify and
                        auto-fill other recipient details.
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div className="space-y-4" variants={itemVariants}>
                  <div className="space-y-2">
                    <Label htmlFor="payroll-name" className="text-gray-300">
                      Payroll Name <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="payroll-name"
                      value={payrollData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="e.g. Monthly Salaries, Q2 Bonuses"
                      className="bg-[#061020] border-[#1a2a40] text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="payroll-description"
                      className="text-gray-300"
                    >
                      Description (Optional)
                    </Label>
                    <Input
                      id="payroll-description"
                      value={payrollData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      placeholder="Brief description of this payroll"
                      className="bg-[#061020] border-[#1a2a40] text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="token-type" className="text-gray-300">
                      Token Type <span className="text-red-400">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => handleInputChange("token", "SUI")}
                        className={`flex-1 ${
                          payrollData.token === "SUI"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-[#061020] border-[#1a2a40] text-gray-300 hover:bg-[#0a1930]"
                        }`}
                      >
                        SUI
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleInputChange("token", "USDC")}
                        className={`flex-1 ${
                          payrollData.token === "USDC"
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "bg-[#061020] border-[#1a2a40] text-gray-300 hover:bg-[#0a1930]"
                        }`}
                      >
                        USDC
                      </Button>
                    </div>
                  </div>
                </motion.div>

                <motion.div className="space-y-4" variants={itemVariants}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Payroll Information</h3>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-blue-900/30 text-blue-400 border-blue-800"
                      >
                        {recipients.filter((r) => r.address && r.amount).length}{" "}
                        Recipients
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-blue-900/30 text-blue-400 border-blue-800"
                      >
                        {totalAmount.toFixed(2)} {payrollData.token}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {recipients.map((recipient, index) => (
                      <motion.div
                        key={index}
                        className={`flex gap-4 items-start p-4 rounded-lg border ${
                          recipient.isValid === true
                            ? "bg-green-900/10 border-green-800/30"
                            : recipient.isValid === false
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
                                  value={recipient.username}
                                  onChange={(e) =>
                                    updateRecipient(
                                      index,
                                      "username",
                                      e.target.value
                                    )
                                  }
                                  onBlur={(e) => {
                                    if (recipient.isValid) {
                                      handleFocusChange(
                                        index,
                                        "username",
                                        e.target.value
                                      );
                                    }
                                  }}
                                  placeholder="Username"
                                  className={`bg-[#061020] border-[#1a2a40] text-white ${
                                    currentField === "username" &&
                                    recipient.isValid === false
                                      ? "border-red-800 focus:border-red-700"
                                      : ""
                                  }`}
                                  onKeyDown={(e) => handleKeyDown(e, index)}
                                />
                                {recipient.username &&
                                  recipient.isValid === true && (
                                    <CheckCircle
                                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500 cursor-pointer"
                                      onClick={() =>
                                        handleFocusChange(
                                          index,
                                          "username",
                                          recipient.username
                                        )
                                      }
                                    />
                                  )}
                              </div>
                              {recipient.username &&
                                recipient.isValid === false && (
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
                                  value={recipient.email}
                                  onChange={(e) =>
                                    updateRecipient(
                                      index,
                                      "email",
                                      e.target.value
                                    )
                                  }
                                  onBlur={(e) => {
                                    if (recipient.isValid) {
                                      handleFocusChange(
                                        index,
                                        "email",
                                        e.target.value
                                      );
                                    }
                                  }}
                                  type="email"
                                  placeholder="email@example.com"
                                  className={`bg-[#061020] border-[#1a2a40] text-white ${
                                    currentField === "email" &&
                                    recipient.isValid === false
                                      ? "border-red-800 focus:border-red-700"
                                      : ""
                                  }`}
                                  onKeyDown={(e) => handleKeyDown(e, index)}
                                />
                                {recipient.email &&
                                  recipient.isValid === true && (
                                    <CheckCircle
                                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500 cursor-pointer"
                                      onClick={() =>
                                        handleFocusChange(
                                          index,
                                          "email",
                                          recipient.email
                                        )
                                      }
                                    />
                                  )}
                              </div>
                              {recipient.email &&
                                recipient.isValid === false && (
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
                              </div>
                              <div className="relative">
                                <Input
                                  value={recipient.address}
                                  onChange={(e) =>
                                    updateRecipient(
                                      index,
                                      "address",
                                      e.target.value
                                    )
                                  }
                                  onBlur={(e) => {
                                    if (recipient.isValid) {
                                      handleFocusChange(
                                        index,
                                        "address",
                                        e.target.value
                                      );
                                    }
                                  }}
                                  onKeyDown={(e) => handleKeyDown(e, index)}
                                  placeholder="0x..."
                                  className={`bg-[#061020] border-[#1a2a40] text-white pr-8 ${
                                    currentField === "address" &&
                                    recipient.isValid === false
                                      ? "border-red-800 focus:border-red-700"
                                      : ""
                                  }`}
                                  ref={
                                    index === recipients.length - 1
                                      ? nextInputRef
                                      : null
                                  }
                                />
                                {recipient.address &&
                                  recipient.isValid === true && (
                                    <CheckCircle
                                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500 cursor-pointer"
                                      onClick={() =>
                                        handleFocusChange(
                                          index,
                                          "address",
                                          recipient.address
                                        )
                                      }
                                    />
                                  )}
                                {currentField === "address" &&
                                  recipient.isValid === false && (
                                    <AlertCircle className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                                  )}
                              </div>
                              {recipient.name && (
                                <p className="text-xs text-green-400 mt-1">
                                  {recipient.name}
                                </p>
                              )}
                              {currentField === "address" &&
                                recipient.isValid === false && (
                                  <p className="text-xs text-red-400 mt-1">
                                    Invalid address format
                                  </p>
                                )}
                            </div>

                            {/* Amount field */}
                            <div className="sm:w-1/6 space-y-1">
                              <label className="text-sm text-gray-400">
                                Amount ({payrollData.token})
                              </label>
                              <Input
                                value={recipient.amount}
                                onChange={(e) =>
                                  updateRecipient(
                                    index,
                                    "amount",
                                    e.target.value
                                  )
                                }
                                type="number"
                                step="0.0001"
                                min="0.0001"
                                placeholder="0.00"
                                className={`bg-[#061020] border-[#1a2a40] text-white ${
                                  recipient.amount &&
                                  Number.parseFloat(recipient.amount) <= 0
                                    ? "border-red-800 focus:border-red-700"
                                    : ""
                                }`}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                              />
                              {recipient.amount &&
                                Number.parseFloat(recipient.amount) <= 0 && (
                                  <p className="text-xs text-red-400 mt-1">
                                    Amount must be greater than 0
                                  </p>
                                )}
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRecipient(index)}
                          className="text-gray-400 hover:text-red-300 hover:bg-red-900/20 mt-1"
                          disabled={
                            recipients.length === 1 &&
                            !recipient.address &&
                            !recipient.amount
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Button
                      type="button"
                      variant="blueWhite"
                      onClick={addRecipient}
                      className="border-[#1a2a40] text-blue-400 hover:bg-blue-900/20 w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Recipient
                    </Button>

                    <div className="text-right bg-[#061020]/70 p-3 rounded-lg border border-[#1a2a40] w-full sm:w-auto">
                      <div className="flex items-center justify-between gap-8">
                        <p className="text-sm text-gray-400">Total Amount:</p>
                        <p className="text-xl font-bold text-white">
                          {totalAmount.toFixed(2)} {payrollData.token}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <Button
                  onClick={(e) => goToNextStep(e)}
                  disabled={!isFormValid()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Preview Payroll <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
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
                      Payroll Summary
                    </h3>

                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-400">Payroll Name:</span>
                      <span className="font-medium">{payrollData.name}</span>
                    </div>

                    {payrollData.description && (
                      <div className="mb-4">
                        <span className="text-gray-400 block mb-1">
                          Description:
                        </span>
                        <p className="text-sm">{payrollData.description}</p>
                      </div>
                    )}

                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      {recipients
                        .filter((r) => r.address && r.amount)
                        .map((recipient, index) => (
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
                                  {recipient.username
                                    ? recipient.username.charAt(0).toUpperCase()
                                    : recipient.name
                                      ? recipient.name.charAt(0).toUpperCase()
                                      : "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                {recipient.name && (
                                  <p className="font-medium">
                                    {recipient.name}
                                  </p>
                                )}
                                <p className="text-sm text-gray-400 font-mono">
                                  {recipient.address.substring(0, 8)}...
                                  {recipient.address.substring(
                                    recipient.address.length - 6
                                  )}
                                </p>
                                {(recipient.username || recipient.email) && (
                                  <p className="text-xs text-gray-400">
                                    {recipient.username &&
                                      `@${recipient.username}`}{" "}
                                    {recipient.email && `• ${recipient.email}`}
                                  </p>
                                )}
                              </div>
                            </div>
                            <p className="font-medium">
                              {recipient.amount} {payrollData.token}
                            </p>
                          </motion.div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#1a2a40]">
                      <div>
                        <p className="text-gray-400">Recipients:</p>
                        <p className="font-medium">
                          {
                            recipients.filter((r) => r.address && r.amount)
                              .length
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400">Total Amount:</p>
                        <p className="text-xl font-bold">
                          {totalAmount.toFixed(2)} {payrollData.token}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="blueWhite"
                    onClick={goToPreviousStep}
                    className="border-[#1a2a40] hover:bg-[#0a1930]"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                  </Button>

                  <Button
                    onClick={(e) => handleSubmit(e)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Create Payroll
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
                            {recipient.username
                              ? recipient.username.charAt(0).toUpperCase()
                              : recipient.avatar}
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
    </div>
  );
}
