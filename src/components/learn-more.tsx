"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Home,
  List,
  Menu,
  X,
  ArrowRight,
  Clock,
  Users,
  Wallet,
  Shield,
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const LearnMore = () => {
  const [activeSection, setActiveSection] = useState("introduction");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Define the table of contents structure
  const tableOfContents = [
    { id: "introduction", title: "Introduction", icon: Home },
    { id: "getting-started", title: "1. Getting Started", icon: FileText },
    {
      id: "single-transaction",
      title: "2. Single Transaction Workflow",
      icon: ArrowRight,
    },
    {
      id: "bulk-transaction",
      title: "3. Bulk Transaction Workflow",
      icon: Users,
    },
    {
      id: "scheduled-transactions",
      title: "4. Scheduled Transactions",
      icon: Clock,
    },
    { id: "payroll-management", title: "5. Payroll Management", icon: Wallet },
    { id: "best-practices", title: "6. Best Practices & Tips", icon: Shield },
  ];

  // Handle intersection observer to update active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      // Modify these values to better control when sections become active
      {
        threshold: 0.2, // Section becomes active when 20% visible
        rootMargin: "-20% 0px -60% 0px", // Adjust these values to fine-tune activation area
      }
    );

    // Observe all section elements
    Object.keys(sectionRefs.current).forEach((sectionId) => {
      const element = sectionRefs.current[sectionId];
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      Object.values(sectionRefs.current).forEach((element) => {
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, []);

  // Scroll to section when clicking on TOC item
  interface ScrollToSection {
    (sectionId: string): void;
  }

  const scrollToSection: ScrollToSection = (sectionId) => {
    setIsMobileMenuOpen(false);
    const section = sectionRefs.current[sectionId];
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050e1a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a1930] border-b border-[#1a2a40] py-4 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-400" />
            <h1 className="text-xl font-bold">SuiPay Documentation</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden fixed inset-0 top-16 z-40 bg-[#0a1930] border-b border-[#1a2a40] p-4 overflow-auto"
        >
          <div className="space-y-2">
            {tableOfContents.map((item) => (
              <button
                key={item.id}
                className={`w-full flex items-center gap-2 p-3 rounded-md text-left ${
                  activeSection === item.id
                    ? "bg-blue-900/30 text-blue-400 border border-blue-800"
                    : "hover:bg-[#061020] text-gray-300"
                }`}
                onClick={() => scrollToSection(item.id)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar - Table of Contents (Desktop) */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-2">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <List className="h-5 w-5 text-blue-400" />
              Table of Contents
            </h2>
            {tableOfContents.map((item) => (
              <button
                key={item.id}
                className={`w-full flex items-center gap-2 p-3 rounded-md text-left ${
                  activeSection === item.id
                    ? "bg-blue-900/30 text-blue-400 border border-blue-800"
                    : "hover:bg-[#061020] text-gray-300"
                }`}
                onClick={() => scrollToSection(item.id)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl">
          <Card className="bg-[#0a1930] border-[#1a2a40] text-white overflow-hidden relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent pointer-events-none"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-400" />
                SuiPay Documentation
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your comprehensive guide to using SuiPay for decentralized
                finance transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="prose prose-invert max-w-none">
                {/* Introduction */}
                <section
                  id="introduction"
                  ref={(el) => {
                    sectionRefs.current["introduction"] = el;
                  }}
                  className="mb-10 scroll-mt-24"
                >
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-blue-400">
                    <Home className="h-5 w-5" />
                    Introduction
                  </h2>
                  <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                    <p className="mb-4">
                      Welcome to{" "}
                      <strong className="text-blue-400">SuiPay</strong>, your
                      go-to decentralized finance application for seamless,
                      secure, and scheduled transactions on the Testnet network.
                      Whether you're sending a single payment, managing payroll,
                      or scheduling bulk transfers, this guide will walk you
                      through every step of the process—from registration to
                      claiming funds.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                      <div className="bg-[#0a1930] p-4 rounded-md border border-[#1a2a40] flex flex-col items-center text-center">
                        <ArrowRight className="h-8 w-8 text-blue-400 mb-2" />
                        <h3 className="font-medium mb-1">
                          Single Transactions
                        </h3>
                        <p className="text-sm text-gray-400">
                          Send tokens to individuals securely
                        </p>
                      </div>
                      <div className="bg-[#0a1930] p-4 rounded-md border border-[#1a2a40] flex flex-col items-center text-center">
                        <Users className="h-8 w-8 text-blue-400 mb-2" />
                        <h3 className="font-medium mb-1">Bulk Transfers</h3>
                        <p className="text-sm text-gray-400">
                          Send to multiple recipients at once
                        </p>
                      </div>
                      <div className="bg-[#0a1930] p-4 rounded-md border border-[#1a2a40] flex flex-col items-center text-center">
                        <Clock className="h-8 w-8 text-blue-400 mb-2" />
                        <h3 className="font-medium mb-1">Scheduled Payments</h3>
                        <p className="text-sm text-gray-400">
                          Set up future-dated transactions
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
                <Separator className="my-8 bg-[#1a2a40]" />
                {/* Getting Started */}
                <section
                  id="getting-started"
                  ref={(el) => {
                    sectionRefs.current["getting-started"] = el;
                  }}
                  className="mb-10 scroll-mt-24"
                >
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-blue-400">
                    <FileText className="h-5 w-5" />
                    1. Getting Started
                  </h2>
                  <div className="space-y-6">
                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">1</Badge>
                        Network
                      </h3>
                      <p>
                        SuiPay runs on the Testnet network by default. You can
                        safely experiment without using real tokens.
                      </p>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">2</Badge>
                        Registration
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Navigate to the registration page.</li>
                        <li>
                          Provide a <strong>unique username</strong> and{" "}
                          <strong>valid email address</strong>.
                        </li>
                        <li>
                          Click <strong>Register</strong> to submit your
                          details.
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">3</Badge>
                        Obtaining Test Tokens
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          Upon registration, your wallet will show a zero
                          balance.
                        </li>
                        <li>
                          Click <strong>Get Token</strong> to top up your SuiPay
                          wallet with free test tokens.
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">4</Badge>
                        Email Verification
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          After registering, an email with a{" "}
                          <strong>verification code</strong> is sent to your
                          address.
                        </li>
                        <li>
                          Enter this code in the app to activate your account.
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">5</Badge>
                        Dashboard Access
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          Once your email is verified, you'll be directed to the
                          main dashboard, where you can begin transacting.
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>
                <Separator className="my-8 bg-[#1a2a40]" />

                {/* Single Transaction Workflow */}
                <section
                  id="single-transaction"
                  ref={(el: HTMLElement | null) => {
                    sectionRefs.current["single-transaction"] = el;
                  }}
                  className="mb-10 scroll-mt-24"
                >
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-blue-400">
                    <ArrowRight className="h-5 w-5" />
                    2. Single Transaction Workflow
                  </h2>
                  <div className="space-y-6">
                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">1</Badge>
                        Recipient Selection
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          Choose a recipient identification method:
                          <ul className="list-disc pl-6 mt-2">
                            <li>
                              <strong>Wallet Address:</strong> Direct input of
                              Sui wallet address (0x...)
                            </li>
                            <li>
                              <strong>Email:</strong> Recipient's registered
                              email address
                            </li>
                            <li>
                              <strong>Username:</strong> Recipient's SuiPay
                              username
                            </li>
                          </ul>
                        </li>
                        <li>
                          System verifies recipient details and displays:
                          <ul className="list-disc pl-6 mt-2">
                            <li>Username (if registered)</li>
                            <li>Email address (if available)</li>
                            <li>Wallet address</li>
                          </ul>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">2</Badge>
                        Payment Details
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          Select token type:
                          <ul className="list-disc pl-6 mt-2">
                            <li>
                              <strong>SUI:</strong> Native blockchain token
                            </li>
                            <li>
                              <strong>USDC:</strong> USD Coin stablecoin
                            </li>
                          </ul>
                        </li>
                        <li>
                          Enter amount (system shows equivalent USD value)
                        </li>
                        <li>Add optional memo for transaction reference</li>
                        <li>
                          System validates:
                          <ul className="list-disc pl-6 mt-2">
                            <li>Sufficient balance</li>
                            <li>Network fees</li>
                            <li>Valid amount format</li>
                          </ul>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">3</Badge>
                        Transfer Methods
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Badge className="bg-green-700 text-white mt-1">
                            Direct
                          </Badge>
                          <div>
                            <p className="mb-2">
                              Instant transfer directly to recipient's wallet:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                              <li>No verification required</li>
                              <li>
                                Transaction marked as <strong>Completed</strong>{" "}
                                immediately
                              </li>
                              <li>
                                Funds available instantly in recipient's wallet
                              </li>
                            </ul>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Badge className="bg-blue-700 text-white mt-1">
                            Secure
                          </Badge>
                          <div>
                            <p className="mb-2">
                              Enhanced security with verification:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                              <li>System generates unique verification code</li>
                              <li>
                                Email sent to recipient with claim instructions
                              </li>
                              <li>
                                Transaction marked as <strong>Active</strong>
                              </li>
                              <li>Funds held in escrow until claimed</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">4</Badge>
                        Claim Process (Secure Transfer)
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          Recipient receives multiple claim options:
                          <ul className="list-disc pl-6 mt-2">
                            <li>Verification code entry</li>
                            <li>Direct claim link</li>
                            <li>QR code scanning</li>
                          </ul>
                        </li>
                        <li>
                          Upon successful verification:
                          <ul className="list-disc pl-6 mt-2">
                            <li>Funds transfer to recipient's wallet</li>
                            <li>
                              Transaction status updates to{" "}
                              <strong>Claimed</strong>
                            </li>
                            <li>
                              Both parties receive confirmation notifications
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">5</Badge>
                        Transaction Management
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>View transaction details in dashboard</li>
                        <li>Monitor status updates in real-time</li>
                        <li>Access transaction history and receipts</li>
                        <li>Receive notifications for important events</li>
                      </ul>
                    </div>
                  </div>
                </section>
                <Separator className="my-8 bg-[#1a2a40]" />

                {/* Bulk Transaction Workflow */}
                <section
                  id="bulk-transaction"
                  ref={(el: HTMLElement | null) => {
                    sectionRefs.current["bulk-transaction"] = el;
                  }}
                  className="mb-10 scroll-mt-24"
                >
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-blue-400">
                    <Users className="h-5 w-5" />
                    3. Bulk Transaction Workflow
                  </h2>
                  <div className="space-y-6">
                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">1</Badge>
                        Payment Source Selection
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          Choose between two input methods:
                          <ul className="list-disc pl-6 mt-2">
                            <li>
                              <strong>Manual Entry:</strong> Add recipients one
                              by one
                            </li>
                            <li>
                              <strong>Payroll Template:</strong> Load saved
                              recipient groups
                            </li>
                          </ul>
                        </li>
                        <li>
                          Select token type for payment:
                          <ul className="list-disc pl-6 mt-2">
                            <li>SUI: Native blockchain token</li>
                            <li>USDC: USD Coin stablecoin</li>
                          </ul>
                        </li>
                        <li>
                          System displays available balance for selected token
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">2</Badge>
                        Recipient Entry Methods
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          Manual entry fields per recipient:
                          <ul className="list-disc pl-6 mt-2">
                            <li>Username (optional)</li>
                            <li>Email address (optional)</li>
                            <li>Wallet address (required)</li>
                            <li>Amount (required)</li>
                          </ul>
                        </li>
                        <li>
                          Quick recipient selection:
                          <ul className="list-disc pl-6 mt-2">
                            <li>Search from recent recipients</li>
                            <li>Select from address book</li>
                            <li>Load saved payroll groups</li>
                          </ul>
                        </li>
                        <li>
                          Real-time validation for each entry:
                          <ul className="list-disc pl-6 mt-2">
                            <li>Address format verification</li>
                            <li>Amount validation</li>
                            <li>Duplicate entry prevention</li>
                            <li>Self-payment prevention</li>
                          </ul>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">3</Badge>
                        Payment Review & Confirmation
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          Summary display:
                          <ul className="list-disc pl-6 mt-2">
                            <li>Total number of recipients</li>
                            <li>Total amount to be sent</li>
                            <li>Balance verification</li>
                            <li>Network fee calculation</li>
                          </ul>
                        </li>
                        <li>
                          Recipients list overview:
                          <ul className="list-disc pl-6 mt-2">
                            <li>Individual payment amounts</li>
                            <li>Recipient details</li>
                            <li>Payment method per recipient</li>
                          </ul>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">4</Badge>
                        Transfer Methods
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Badge className="bg-green-700 text-white mt-1">
                            Direct Bulk
                          </Badge>
                          <div>
                            <p className="mb-2">
                              Instant transfers to all recipients:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                              <li>All transactions processed immediately</li>
                              <li>No verification required</li>
                              <li>
                                Status set to <strong>Completed</strong>{" "}
                                instantly
                              </li>
                              <li>Ideal for trusted recipient groups</li>
                            </ul>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Badge className="bg-blue-700 text-white mt-1">
                            Secure Bulk
                          </Badge>
                          <div>
                            <p className="mb-2">
                              Enhanced security for all transfers:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                              <li>Individual verification codes generated</li>
                              <li>
                                Email notifications sent to all recipients
                              </li>
                              <li>
                                All transactions marked as{" "}
                                <strong>Active</strong>
                              </li>
                              <li>Funds held in escrow until claimed</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">5</Badge>
                        Monitoring & Management
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          Batch status tracking:
                          <ul className="list-disc pl-6 mt-2">
                            <li>Overall transaction status</li>
                            <li>Individual payment statuses</li>
                            <li>Claim/rejection tracking</li>
                          </ul>
                        </li>
                        <li>
                          Notification system:
                          <ul className="list-disc pl-6 mt-2">
                            <li>Email confirmations</li>
                            <li>Status change alerts</li>
                            <li>Claim notifications</li>
                          </ul>
                        </li>
                        <li>Transaction history and reporting</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <Separator className="my-8 bg-[#1a2a40]" />
                {/* Scheduled Transactions */}
                <section
                  id="scheduled-transactions"
                  ref={(el: HTMLElement | null) => {
                    sectionRefs.current["scheduled-transactions"] = el;
                  }}
                  className="mb-10 scroll-mt-24"
                >
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-blue-400">
                    <Clock className="h-5 w-5" />
                    4. Scheduled Transactions
                  </h2>
                  <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40] mb-6">
                    <p className="mb-4">
                      Schedule payments for a later date and time in days,
                      hours, and minutes.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">1</Badge>
                        Preparation
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          Follow the steps under <strong>Single</strong> or{" "}
                          <strong>Bulk Transaction</strong> up to preview.
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">2</Badge>
                        Set Schedule
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          Choose the desired <strong>delay</strong> (e.g.,
                          1d:12h:30m).
                        </li>
                        <li>Confirm the scheduled time.</li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">3</Badge>
                        Execution
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          At the scheduled moment, if you selected{" "}
                          <strong>Secure</strong>, codes are sent to recipients;
                          statuses turn <strong>Active</strong>.
                        </li>
                        <li>
                          Recipients complete the <strong>Claim/Reject</strong>{" "}
                          flow as usual.
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">4</Badge>
                        Management
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          View all scheduled transactions in the{" "}
                          <strong>Scheduled</strong> tab.
                        </li>
                        <li>Modify or cancel before execution if needed.</li>
                      </ul>
                    </div>
                  </div>
                </section>
                <Separator className="my-8 bg-[#1a2a40]" />
                {/* Payroll Management */}
                <section
                  id="payroll-management"
                  ref={(el: HTMLElement | null) => {
                    sectionRefs.current["payroll-management"] = el;
                  }}
                  className="mb-10 scroll-mt-24"
                >
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-blue-400">
                    <Wallet className="h-5 w-5" />
                    5. Payroll Management
                  </h2>
                  <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40] mb-6">
                    <p className="mb-4">
                      Streamline regular bulk payouts for teams or projects.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">1</Badge>
                        Create Payroll Group
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Upload your employee list with payment details.</li>
                        <li>
                          Save as a <strong>Payroll Template</strong>.
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">2</Badge>
                        Instant Payroll
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          Choose a template and hit <strong>Execute Now</strong>{" "}
                          to perform a direct or secure batch payment.
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">3</Badge>
                        Scheduled Payroll
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          Select a template and schedule for future
                          disbursement.
                        </li>
                        <li>
                          The app will execute per the rules of{" "}
                          <strong>Scheduled Transactions</strong>.
                        </li>
                      </ul>
                    </div>
                  </div>
                </section>
                <Separator className="my-8 bg-[#1a2a40]" />
                {/* Best Practices & Tips */}
                <section
                  id="best-practices"
                  ref={(el: HTMLElement | null) => {
                    sectionRefs.current["best-practices"] = el;
                  }}
                  className="mb-10 scroll-mt-24"
                >
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-blue-400">
                    <Shield className="h-5 w-5" />
                    6. Best Practices & Tips
                  </h2>
                  <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-white">Testnet Usage:</strong>{" "}
                          Always verify amounts with small test transactions
                          first.
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-white">Secure Mode:</strong>{" "}
                          Use for high-value or sensitive transfers.
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-white">Email Hygiene:</strong>{" "}
                          Ensure recipient emails are correct to avoid lost
                          verification codes.
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-white">
                            Template Reuse:
                          </strong>{" "}
                          Save time by reusing payroll and bulk templates.
                        </div>
                      </li>
                    </ul>
                  </div>
                </section>
                {/* Conclusion */}
                <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40] mt-10">
                  <p className="mb-4">
                    Thank you for choosing SuiPay! For support, visit our{" "}
                    <Link href="#" className="text-blue-400 hover:underline">
                      Help Center
                    </Link>{" "}
                    or contact our support team.
                  </p>
                  <div className="flex items-center gap-3 mt-6">
                    <HelpCircle className="h-5 w-5 text-blue-400" />
                    <p className="text-gray-300">
                      Need more help? Contact us at{" "}
                      <Link
                        href="mailto:support@suipay.com"
                        className="text-blue-400 hover:underline"
                      >
                        support@suipay.com
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-[#0a1930] border-t border-[#1a2a40] py-6 px-4 mt-auto">
        <div className="container mx-auto text-center text-gray-400">
          <p>© 2025 SuiPay. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="#" className="text-gray-400 hover:text-blue-400">
              Terms of Service
            </Link>
            <Link href="#" className="text-gray-400 hover:text-blue-400">
              Privacy Policy
            </Link>
            <Link href="#" className="text-gray-400 hover:text-blue-400">
              Contact Us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LearnMore;
