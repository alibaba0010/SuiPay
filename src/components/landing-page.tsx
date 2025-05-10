"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WalletButton } from "@/components/wallet-button";
import { ConnectButton } from "@mysten/dapp-kit";
import { Button } from "@/components/ui/button";

import {
  ArrowRight,
  CheckCircle,
  Shield,
  Zap,
  Wallet,
  CreditCard,
  BarChart4,
  Coins,
  Banknote,
  Receipt,
  Users,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useWalletContext } from "@/lib/wallet-context";

import UserRegistrationDialog from "@/components/user-registration-dialog";
import { useUserProfile } from "@/hooks/useUserProfile";

export function LandingPage() {
  const { isConnected, walletAddress, isConnecting } = useWalletContext() || {};
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const { fetchUserByAddress, userProfile, isLoading } = useUserProfile();

  const checkUserRegistration = useCallback(async () => {
    if (!isConnected || !walletAddress) {
      setIsCheckingUser(false);
      setShowRegistration(false);
      return;
    }

    try {
      if (!userProfile && !isLoading) {
        fetchUserByAddress(walletAddress);
      }
      if (!userProfile) {
        setShowRegistration(true);
      } else {
        setShowRegistration(false);
      }
    } catch (error) {
      console.error("Error checking user registration:", error);
      setShowRegistration(false);
    } finally {
      setIsCheckingUser(false);
    }
  }, [isConnected, walletAddress, userProfile, isLoading, fetchUserByAddress]);

  useEffect(() => {
    checkUserRegistration();
  }, [checkUserRegistration]);

  // Handle route preservation on refresh
  useEffect(() => {
    if (isConnected && walletAddress) {
      const currentPath = window.location.pathname;
      if (currentPath !== "/") {
        router.push(currentPath);
      }
    }
  }, [isConnected, walletAddress, router]);

  // Handle scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1930] to-[#061020] text-white overflow-hidden relative">
      {/* Blur overlay when connecting or checking user */}
      {(isConnecting || isCheckingUser) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-white text-lg">
            {isConnecting ? "Connecting wallet..." : "Loading..."}
          </div>
        </div>
      )}

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-900 rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div
          className="absolute top-1/3 -left-20 w-60 h-60 bg-indigo-900 rounded-full opacity-10 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 right-1/4 w-40 h-40 bg-blue-800 rounded-full opacity-10 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Secondary Navigation */}
      <div className="bg-[#010a05] border-b border-[#0a1a10] py-2 px-6">
        <div className="container mx-auto flex flex-wrap justify-center md:justify-between gap-4">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Shield className="h-4 w-4 text-green-500" />
              <span>Secure & Protected</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Sparkles className="h-4 w-4 text-green-500" />
              <span>Username Support</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Users className="h-4 w-4 text-green-500" />
              <span>Group Payments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <header
        className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#0a1930]/90 backdrop-blur-md shadow-md"
            : "bg-[#0a1930]/70 backdrop-blur-sm"
        }`}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-8 w-8 text-blue-400"
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
            <span>Sui Pay</span>
          </div>
          {isConnected ? (
            <WalletButton />
          ) : (
            <ConnectButton className="cursor-pointer" />
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <span className="block">Modern Payments</span>
                <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  on the Sui Blockchain
                </span>
              </motion.h1>
              <motion.p
                className="text-lg text-gray-300 md:pr-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Secure, fast, and decentralized payment solutions for businesses
                and individuals. Connect your wallet to start sending and
                receiving payments on Sui.
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                {!isConnected ? (
                  <ConnectButton className="cursor-pointer" />
                ) : (
                  <Button
                    variant="outline"
                    className="border-blue-700 text-gray-200 group transition-all duration-300 hover:bg-blue-700 hover:text-white"
                    onClick={() => router.push("/dashboard")}
                  >
                    Go to Dashboard
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="border-blue-700 text-gray-200 group transition-all duration-300 hover:bg-blue-700 hover:text-white"
                  onClick={() => router.push("/learn-more")}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    window.open("/learn-more", "_blank");
                  }}
                >
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
              <motion.div
                className="flex items-center gap-6 text-sm text-gray-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
              >
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Fast</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Low Fees</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-[#061020]/80 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Payment Features
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Everything you need to manage payments, payroll, and transactions
              on the Sui blockchain.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="h-10 w-10 text-blue-500" />,
                title: "Instant Payments",
                description:
                  "Send and receive payments instantly with low transaction fees on the Sui blockchain.",
              },
              {
                icon: <Shield className="h-10 w-10 text-blue-500" />,
                title: "Secure Escrow",
                description:
                  "Use our secure escrow system for conditional payments and added security.",
              },
              {
                icon: <Wallet className="h-10 w-10 text-blue-500" />,
                title: "Wallet Integration",
                description:
                  "Seamlessly connect with popular Sui wallets for easy access to your funds.",
              },
              {
                icon: <CreditCard className="h-10 w-10 text-blue-500" />,
                title: "Virtual Cards",
                description:
                  "Create virtual payment cards linked to your Sui wallet for online purchases.",
              },
              {
                icon: <Banknote className="h-10 w-10 text-blue-500" />,
                title: "Automated Payroll",
                description:
                  "Set up recurring payments and automate your payroll process with ease.",
              },
              {
                icon: <BarChart4 className="h-10 w-10 text-blue-500" />,
                title: "Analytics Dashboard",
                description:
                  "Track all your transactions with detailed analytics and reporting tools.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-[#0a1930]/50 border border-[#1a2a40] rounded-xl p-6 hover:bg-[#0a1930]/80 transition-colors hover:border-blue-700 group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -5 }}
              >
                <div className="bg-[#061020]/80 rounded-lg p-3 inline-block mb-4 group-hover:bg-[#0a1930] transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            className="bg-gradient-to-r from-[#0a1930] to-[#0a1a40] rounded-2xl p-8 md:p-12 text-center relative overflow-hidden border border-[#1a2a40]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <Coins className="absolute top-10 left-10 h-16 w-16 text-blue-700/10 rotate-12" />
              <Receipt className="absolute bottom-10 right-10 h-16 w-16 text-indigo-700/10 -rotate-12" />
              <Wallet className="absolute top-1/2 left-1/4 h-20 w-20 text-blue-700/10 rotate-45" />
            </div>
            <motion.h2
              className="text-3xl font-bold mb-4 relative"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Ready to get started?
            </motion.h2>
            <motion.p
              className="text-gray-300 mb-8 max-w-xl mx-auto relative"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Connect your wallet now to access the full suite of payment
              features and start managing your transactions on Sui.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="relative"
            >
              {isConnected ? (
                <WalletButton />
              ) : (
                <ConnectButton className="cursor-pointer" />
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-[#061020]">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-xl mb-4 md:mb-0">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6 text-blue-400"
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
              <span>Sui Pay</span>
            </div>
            <div className="text-sm text-gray-400">
              © 2023 Sui Pay. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {!isCheckingUser && showRegistration && <UserRegistrationDialog />}
    </div>
  );
}
