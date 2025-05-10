"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useContract } from "@/hooks/useContract";
import { useWalletContext } from "@/lib/wallet-context";
import { isFakeEmail } from "fakefilter";
import {
  Shield,
  User,
  Mail,
  ArrowRight,
  CheckCircle,
  Check,
  RotateCw,
} from "lucide-react";
import { generateVerificationCode } from "@/utils/helpers";
import { useDrip } from "@/hooks/useDrip";
import { eventEmitter } from "@/lib/events";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function UserRegistrationDialog() {
  const [open, setOpen] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);

  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const { walletAddress } = useWalletContext() || {};
  const { createUser, getUserBalance } = useContract();
  const { checkBalanceAndDrip, isLoading: isChecking } = useDrip();
  const { fetchAllEmails, fetchAllUsername } = useUserProfile();
  const handleCheckAndDrip = async () => {
    if (!walletAddress) return;
    try {
      const result = await checkBalanceAndDrip(walletAddress);
      if (result) {
        nextStep();
      }
    } catch (err) {
      console.error("Operation failed:", err);
    }
  };

  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress) return;
      try {
        const { suiBalance: balance, usdcBalance } =
          await getUserBalance(walletAddress);
        setUserBalance(Number(balance));
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    };

    fetchBalance();
  }, [walletAddress, getUserBalance]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  useEffect(() => {
    if (userBalance > 0) {
      nextStep();
    }
  }, [userBalance]);

  const checkUsername = async (username: string) => {
    if (!walletAddress) return;

    try {
      const existingUsernames = await fetchAllUsername(walletAddress);
      if (!existingUsernames) return;
      if (existingUsernames.includes(username)) {
        setUsernameError("Username is already taken");
        return false;
      }
      setUsernameError("");
      return true;
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameError("Error checking username availability");
      return false;
    }
  };

  const checkEmail = async (email: string) => {
    if (!walletAddress) return;
    const isFake = await isFakeEmail(email);
    if (isFake) {
      setEmailError("This email provider is not allowed");
      return false;
    }

    try {
      const existingEmails = await fetchAllEmails(walletAddress);
      if (!existingEmails) return;
      if (existingEmails.includes(email)) {
        setEmailError("Email is already registered");
        return false;
      }
      setEmailError("");
      return true;
    } catch (error) {
      console.error("Error checking email:", error);
      setEmailError("Error checking email availability");
      return false;
    }
  };

  const handleVerifyEmail = async () => {
    if (!email) return;

    const isAvailable = await checkEmail(email);
    if (!isAvailable) return;

    const code = generateVerificationCode();
    localStorage.setItem(`email_verification_${email}`, code);
    setShowVerificationInput(true);

    try {
      const response = await fetch("/api/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        throw new Error("Failed to send verification email");
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      setEmailError("Failed to send verification email. Please try again.");
      setShowVerificationInput(false);
    }
  };

  const verifyCode = () => {
    const storedCode = localStorage.getItem(`email_verification_${email}`);
    if (storedCode === verificationCode) {
      setIsEmailVerified(true);
      setVerificationError("");
    } else {
      setVerificationError("Invalid verification code");
      setIsEmailVerified(false);
    }
  };

  const nextStep = async () => {
    if (username.trim()) {
      const isAvailable = await checkUsername(username);
      if (isAvailable) {
        setStep(2);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !isEmailVerified) return;

    setIsLoading(true);
    try {
      await createUser(username, email);
      setIsSuccess(true);
      eventEmitter.emit("userRegistered"); // Emit event after successful registration
      setOpen(false);
    } catch (error) {
      console.error("Error creating user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (isLoading) return;
    setOpen(newOpen);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError("");
    setVerificationError("");
    setIsEmailVerified(false);
    setShowVerificationInput(false);
    setVerificationCode("");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent
        className="sm:max-w-[450px] bg-gradient-to-b from-[#0a1930] to-[#061020] border-[#1a2a40] p-0 overflow-hidden shadow-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -translate-x-16 -translate-y-16 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 rounded-full translate-x-8 translate-y-8 blur-2xl"></div>

        <div className="p-6 relative z-10">
          <DialogHeader className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-600/20 p-3 rounded-full">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
            </div>
            <DialogTitle className="text-white text-xl text-center">
              Complete Your Profile
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-center">
              Please provide your details to complete your registration and
              access Sui Pay.
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center py-8"
              >
                <div className="bg-green-600/20 p-4 rounded-full mb-4">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-white text-lg font-medium mb-2">
                  Registration Complete!
                </h3>
                <p className="text-gray-400 text-center">
                  Your account has been successfully registered.
                </p>
              </motion.div>
            ) : step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="username"
                      className="text-gray-300 flex items-center"
                    >
                      <User className="h-4 w-4 mr-2 text-blue-400" />
                      Username
                    </Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-[#061020]/70 border-[#1a2a40] text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Choose a unique username"
                      required
                      autoFocus
                    />
                    {usernameError && (
                      <p className="text-xs text-red-500 mt-1">
                        {usernameError}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      This will be your public identifier on the Sui network
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={userBalance <= 0 ? handleCheckAndDrip : nextStep}
                    className="w-full bg-blue-600 hover:bg-blue-700 transition-all mt-4 group cursor-pointer"
                    disabled={!username.trim() || isLoading || isChecking}
                  >
                    {userBalance <= 0 ? (
                      <>
                        Get Tokens
                        {isChecking && (
                          <RotateCw className="ml-2 h-4 w-4 animate-spin" />
                        )}
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                  {userBalance <= 0 && (
                    <p className="text-xs text-red-500 mt-2">
                      Your balance is too low to register. Click "Get Tokens"
                      above to receive some tokens and continue.
                    </p>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="step2"
                onSubmit={handleSubmit}
                className="space-y-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-gray-300 flex items-center"
                  >
                    <Mail className="h-4 w-4 mr-2 text-blue-400" />
                    Email Address
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      className="bg-[#061020]/70 border-[#1a2a40] text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="your@email.com"
                      required
                      autoFocus
                    />
                    <Button
                      type="button"
                      onClick={handleVerifyEmail}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={!email || !!emailError}
                    >
                      Verify Email
                    </Button>
                  </div>
                  {emailError && (
                    <p className="text-xs text-red-500 mt-1">{emailError}</p>
                  )}
                  {showVerificationInput && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={verificationCode}
                          onChange={(e) =>
                            setVerificationCode(e.target.value.toUpperCase())
                          }
                          className="bg-[#061020]/70 border-[#1a2a40] text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                        />
                        <Button
                          type="button"
                          onClick={verifyCode}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={verificationCode.length !== 6}
                        >
                          {isEmailVerified ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            "Check"
                          )}
                        </Button>
                      </div>
                      {verificationError && (
                        <p className="text-xs text-red-500 mt-1">
                          {verificationError}
                        </p>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    We'll use this to send you important notifications
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 transition-all"
                    disabled={isLoading || !isEmailVerified}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Registering...
                      </div>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full mt-2 text-gray-400 hover:text-white hover:bg-[#0a1930]/50"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <DialogFooter className="mt-6 flex flex-col items-center">
            <p className="text-xs text-gray-500 text-center">
              By completing registration, you agree to our Terms of Service and
              Privacy Policy
            </p>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
