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
      { rootMargin: "-100px 0px -80% 0px" }
    );

    // Observe all section elements
    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      Object.values(sectionRefs.current).forEach((ref) => {
        if (ref) observer.unobserve(ref);
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
                        Choose Recipient
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          Enter the receiver's <strong>wallet address</strong>,{" "}
                          <strong>email</strong>, or <strong>username</strong>.
                        </li>
                        <li>
                          Click <strong>Preview</strong> to fetch and display
                          recipient details.
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">2</Badge>
                        Specify Amount
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>Enter the amount you wish to send.</li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">3</Badge>
                        Select Transfer Mode
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Badge className="bg-green-700 text-white mt-1">
                            Direct
                          </Badge>
                          <div>
                            <p>
                              Funds are sent immediately; status updates to{" "}
                              <strong>Completed</strong>.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge className="bg-blue-700 text-white mt-1">
                            Secure
                          </Badge>
                          <div>
                            <p>Triggers a verification process:</p>
                            <ol className="list-decimal pl-6 space-y-2 mt-2">
                              <li>A code is sent to the recipient's email.</li>
                              <li>
                                Transaction status changes to{" "}
                                <strong>Active</strong>.
                              </li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">4</Badge>
                        Finalizing Secure Transfers (Recipient's Side)
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          The recipient logs in and enters the{" "}
                          <strong>verification code</strong>.
                        </li>
                        <li>
                          They choose to <strong>Claim</strong> or{" "}
                          <strong>Reject</strong>:
                          <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li>
                              <strong>Claim</strong>: Funds move to their
                              wallet; status becomes <strong>Claimed</strong>.
                            </li>
                            <li>
                              <strong>Reject</strong>: Status becomes{" "}
                              <strong>Rejected</strong>; funds remain with the
                              sender.
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">5</Badge>
                        Refund/Reclaim (Sender's Side)
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          For <strong>Rejected</strong> transactions, the sender
                          can initiate a <strong>Refund</strong>.
                        </li>
                        <li>
                          Upon refund, status updates to{" "}
                          <strong>Refunded</strong> and tokens return to the
                          sender's wallet.
                        </li>
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
                        Add Recipients
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          Upload a list of recipients (address/email/username)
                          with corresponding amounts.
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">2</Badge>
                        Review & Preview
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          Verify each recipient's details and total amount.
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">3</Badge>
                        Select Transfer Mode
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Badge className="bg-green-700 text-white mt-1">
                            Direct Bulk
                          </Badge>
                          <div>
                            <p>
                              All recipients receive funds instantly; each
                              transaction marked <strong>Completed</strong>.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge className="bg-blue-700 text-white mt-1">
                            Secure Bulk
                          </Badge>
                          <div>
                            <p>
                              Each recipient receives an email with a
                              verification code; all transactions marked{" "}
                              <strong>Active</strong>.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">4</Badge>
                        Recipient Actions
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          As with single transfers, each recipient uses their
                          code to <strong>Claim</strong> or{" "}
                          <strong>Reject</strong>.
                        </li>
                        <li>
                          <strong>Claim</strong> updates individual status to{" "}
                          <strong>Claimed</strong>; <strong>Reject</strong>{" "}
                          updates to <strong>Rejected</strong>.
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#061020]/50 p-6 rounded-lg border border-[#1a2a40]">
                      <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Badge className="bg-blue-700 text-white">5</Badge>
                        Reclaims
                      </h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          Sender can reclaim funds for any rejected transfer;
                          status updates to <strong>Refunded</strong>.
                        </li>
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
