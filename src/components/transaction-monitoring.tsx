"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useTransactionStorage } from "@/hooks/useTransactionStorage";
import { useWalletContext } from "@/contexts/wallet-context";
import {
  useSchedule,
  type SingleTransactionData,
  type BulkTransactionData,
} from "@/hooks/useSchedule";
import {
  Calendar,
  Download,
  Eye,
  RefreshCcw,
  Search,
  X,
  Users,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
} from "lucide-react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import { isToday, format, isSameDay } from "date-fns";

interface Transaction {
  transactionDigest: string;
  sender: string;
  receiver: string;
  amount: number;
  status: "active" | "completed" | "claimed" | "rejected" | "refunded";
  verificationCode?: string;
  timestamp: Date;
  updatedDigest?: string;
  id: string;
  token: string;
  type: "sent" | "received";
  isBulk?: boolean;
  plainCode?: string;
}

interface ScheduledTransaction {
  date: Date;
  transactions: Array<SingleTransactionData | BulkTransactionData>;
}

export default function TransactionMonitoring() {
  const { walletAddress } = useWalletContext() || {};
  const { getTransactionsByAddress, getBulkTransactionsByAddress } =
    useTransactionStorage();
  const { getSchedules, isLoading: isScheduleLoading } = useSchedule();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [scheduledTransactions, setScheduledTransactions] = useState<
    ScheduledTransaction[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  // Generate calendar days for the current month view
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();

    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek;
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: Date[] = [];

    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLastDay - i));
    }

    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Add days from next month to complete the grid (6 rows of 7 days)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    setCalendarDays(days);
  }, [currentMonth]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!walletAddress) return;

      setIsLoading(true);
      try {
        const [userTransactions, userBulkTransactions] = await Promise.all([
          getTransactionsByAddress(walletAddress),
          getBulkTransactionsByAddress(walletAddress),
        ]);

        const processedTransactions = userTransactions.map((tx) => ({
          ...tx,
          id: tx.transactionDigest,
          token: tx.tokenType,
          type:
            tx.sender === walletAddress
              ? ("sent" as const)
              : ("received" as const),
        }));

        const flattenedBulkTransactions =
          userBulkTransactions.flatMap<Transaction>((bulkTx) => {
            if (bulkTx.sender === walletAddress) {
              return bulkTx.recipients.map((recipient) => ({
                transactionDigest: bulkTx.transactionDigest,
                sender: bulkTx.sender,
                receiver: recipient.address,
                amount: recipient.amount,
                status: recipient.status,
                timestamp: bulkTx.timestamp,
                id: `${bulkTx.transactionDigest}-${recipient.address}`,
                token: bulkTx.tokenType,
                type: "sent" as const,
                isBulk: true,
                plainCode: recipient.plainCode,
              }));
            } else {
              const relevantRecipient = bulkTx.recipients.find(
                (r) => r.address === walletAddress
              );

              if (!relevantRecipient) return [];

              return [
                {
                  transactionDigest: bulkTx.transactionDigest,
                  sender: bulkTx.sender,
                  receiver: walletAddress,
                  amount: relevantRecipient.amount,
                  status: relevantRecipient.status,
                  timestamp: bulkTx.timestamp,
                  id: `${bulkTx.transactionDigest}-${walletAddress}`,
                  token: bulkTx.tokenType,
                  type: "received" as const,
                  isBulk: true,
                  plainCode: relevantRecipient.plainCode,
                },
              ];
            }
          });

        const allTransactions = [
          ...processedTransactions,
          ...flattenedBulkTransactions,
        ].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        setTransactions(allTransactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [walletAddress, getTransactionsByAddress, getBulkTransactionsByAddress]);

  // Fetch scheduled transactions
  useEffect(() => {
    const fetchScheduledTransactions = async () => {
      if (!walletAddress) return;

      try {
        const response = await getSchedules(walletAddress);

        // Group transactions by date
        const groupedByDate: Record<
          string,
          Array<SingleTransactionData | BulkTransactionData>
        > = {};

        // Process single transactions
        response.singleTransactions.forEach(
          (tx: SingleTransactionData): void => {
            const dateStr: string = format(
              new Date(tx.scheduledDate),
              "yyyy-MM-dd"
            );
            if (!groupedByDate[dateStr]) {
              groupedByDate[dateStr] = Array<
                SingleTransactionData | BulkTransactionData
              >();
            }
            groupedByDate[dateStr].push(tx);
          }
        );

        // Process bulk transactions
        response.bulkTransactions.forEach((tx: BulkTransactionData): void => {
          const dateStr = format(new Date(tx.scheduledDate), "yyyy-MM-dd");
          if (!groupedByDate[dateStr]) {
            groupedByDate[dateStr] = [];
          }
          groupedByDate[dateStr].push(tx);
        });

        // Convert to array of ScheduledTransaction
        const scheduledTxs = Object.entries(groupedByDate).map(
          ([dateStr, txs]) => ({
            date: new Date(dateStr),
            transactions: txs,
          })
        );

        setScheduledTransactions(scheduledTxs);
      } catch (error) {
        console.error("Error fetching scheduled transactions:", error);
      }
    };

    fetchScheduledTransactions();
  }, [walletAddress]);

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.receiver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.transactionDigest.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      statusFilter === tx.status ||
      (statusFilter === "pending" && tx.status === "active");

    const matchesType =
      typeFilter === "all" ||
      (tx.isBulk ? typeFilter === "payroll" : typeFilter === tx.type);

    let matchesDate = true;
    if (dateRange === "today") {
      matchesDate = isToday(new Date(tx.timestamp));
    } else if (dateRange === "week") {
      const txDate = new Date(tx.timestamp);
      const today = new Date();
      const weekAgo = new Date(today.setDate(today.getDate() - 7));
      matchesDate = txDate >= weekAgo;
    }

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "claimed":
        return "bg-green-900/30 text-green-400 border-green-800";
      case "active":
      case "pending":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-800";
      case "failed":
      case "rejected":
      case "refunded":
        return "bg-red-900/30 text-red-400 border-red-800";
      default:
        return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "claimed":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "active":
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case "failed":
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  interface TransactionType {
    type: "payment" | "payroll" | "received";
  }

  const getTypeIcon = (
    type: TransactionType["type"]
  ): React.ReactElement | null => {
    switch (type) {
      case "payment":
        return <ArrowRight className="h-4 w-4" />;
      case "payroll":
        return <Users className="h-4 w-4" />;
      case "received":
        return <ArrowLeft className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleViewTransaction = (tx: Transaction): void => {
    setSelectedTransaction(tx);
  };

  const handleRefresh = () => {
    toast({
      title: "Refreshing Transactions",
      description: "Transaction data is being updated...",
    });
  };

  const handleExport = () => {
    toast({
      title: "Exporting Transactions",
      description: "Your transaction data is being exported...",
    });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
    setDateRange("all");
    toast({
      title: "Filters Cleared",
      description: "All transaction filters have been reset.",
    });
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  // Get scheduled transactions for a specific day
  const getScheduledTransactionsForDay = (day: Date) => {
    return scheduledTransactions.filter((st) =>
      isSameDay(new Date(st.date), day)
    );
  };

  // Calculate total amount for a day's scheduled transactions
  const getTotalAmountForDay = (day: Date) => {
    const dayTransactions = getScheduledTransactionsForDay(day);
    let total = 0;

    dayTransactions.forEach((dt) => {
      dt.transactions.forEach((tx) => {
        if ("amount" in tx) {
          // Single transaction
          total += tx.amount;
        } else if ("totalAmount" in tx) {
          // Bulk transaction
          total += tx.totalAmount;
        }
      });
    });

    return total;
  };

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
      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
        initial="hidden"
        animate="show"
        variants={containerVariants}
      >
        <motion.h1 className="text-2xl font-bold" variants={itemVariants}>
          Transaction Monitoring
        </motion.h1>
        <motion.div
          className="flex flex-col sm:flex-row w-full sm:w-auto gap-3"
          variants={itemVariants}
        >
          <Button
            variant="blueWhite"
            onClick={handleRefresh}
            className="border-[#1a2a40] hover:bg-[#0a1930]/80 transition-colors w-full sm:w-auto"
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button
            variant="blueWhite"
            onClick={handleExport}
            className="border-[#1a2a40] hover:bg-[#0a1930]/80 transition-colors w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-[#0a1930] border-[#1a2a40] text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent pointer-events-none"></div>

          <Tabs defaultValue="transactions" className="w-full">
            <CardHeader className="relative z-10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-400" />
                    Transaction Management
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    View and manage your transactions and schedules
                  </CardDescription>
                </div>
                <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-[#061020] border border-[#1a2a40]">
                  <TabsTrigger
                    value="transactions"
                    className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
                  >
                    Transactions
                  </TabsTrigger>
                  <TabsTrigger
                    value="schedule"
                    className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
                  >
                    Schedule
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>

            <TabsContent value="transactions" className="space-y-4">
              <CardContent className="relative z-10">
                <div className="flex flex-wrap items-start gap-3 mb-6">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Search transactions..."
                      className="pl-8 bg-[#061020] border-[#1a2a40] text-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-full sm:w-[160px] bg-[#061020] border-[#1a2a40] text-white">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a1930] border-[#1a2a40] text-white">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-full sm:w-[160px] bg-[#061020] border-[#1a2a40] text-white">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a1930] border-[#1a2a40] text-white">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="payment">Payments</SelectItem>
                        <SelectItem value="payroll">Payroll</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="w-full sm:w-[160px] bg-[#061020] border-[#1a2a40] text-white">
                        <Calendar className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Date range" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a1930] border-[#1a2a40] text-white">
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>

                    {(searchQuery ||
                      statusFilter !== "all" ||
                      typeFilter !== "all" ||
                      dateRange !== "all") && (
                      <Button
                        variant="blueWhite"
                        size="icon"
                        onClick={handleClearFilters}
                        className="border-[#1a2a40] hover:bg-[#0a1930]/80 transition-colors"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Clear Filters</span>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="rounded-md border border-[#1a2a40] overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-[#061020]/50">
                        <TableRow className="hover:bg-[#061020] border-[#1a2a40]">
                          <TableHead className="text-gray-300">ID</TableHead>
                          <TableHead className="text-gray-300">Type</TableHead>
                          <TableHead className="text-gray-300">
                            Recipient
                          </TableHead>
                          <TableHead className="text-gray-300 hidden md:table-cell">
                            Amount
                          </TableHead>
                          <TableHead className="text-gray-300 hidden md:table-cell">
                            Date
                          </TableHead>
                          <TableHead className="text-gray-300">
                            Status
                          </TableHead>
                          <TableHead className="text-right text-gray-300">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.length === 0 ? (
                          <TableRow className="hover:bg-[#061020] border-[#1a2a40]">
                            <TableCell
                              colSpan={7}
                              className="text-center py-8 text-gray-400"
                            >
                              <div className="flex flex-col items-center justify-center">
                                <AlertCircle className="h-8 w-8 mb-2 text-gray-500" />
                                <p>No transactions found</p>
                                <p className="text-sm text-gray-500 mt-1">
                                  Try a different search or clear filters
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTransactions.map((tx) => (
                            <motion.tr
                              key={tx.id}
                              className="hover:bg-[#061020]/70 border-[#1a2a40]"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <TableCell className="font-medium">
                                {tx.id}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  {getTypeIcon(
                                    tx.type === "sent"
                                      ? "payment"
                                      : tx.type || "payment"
                                  )}
                                  <span>
                                    {tx.isBulk
                                      ? "Payroll"
                                      : tx.type === "received"
                                        ? "Received"
                                        : "Payment"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="truncate max-w-[150px] sm:max-w-none">
                                  {tx.type === "received"
                                    ? `From: ${tx.sender}`
                                    : `To: ${tx.receiver}`}
                                </div>
                                <div className="text-xs text-gray-400 truncate max-w-[150px] sm:max-w-none">
                                  {tx.transactionDigest}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {tx.amount} {tx.token}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-gray-300">
                                {format(new Date(tx.timestamp), "yyyy-MM-dd")}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={getStatusColor(tx.status)}
                                >
                                  <div className="flex items-center gap-1.5">
                                    {getStatusIcon(tx.status)}
                                    <span>
                                      {tx.status.charAt(0).toUpperCase() +
                                        tx.status.slice(1)}
                                    </span>
                                  </div>
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                                  onClick={() => handleViewTransaction(tx)}
                                >
                                  <span className="sr-only">View</span>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </motion.tr>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 relative z-10">
                <div className="text-sm text-gray-400">
                  Showing {filteredTransactions.length} of {transactions.length}{" "}
                  transactions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="blueWhite"
                    size="sm"
                    disabled
                    className="border-[#1a2a40] hover:bg-[#061020] text-white disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    variant="blueWhite"
                    size="sm"
                    disabled
                    className="border-[#1a2a40] hover:bg-[#061020] text-white disabled:opacity-50"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardFooter>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <CardContent className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">
                      {format(currentMonth, "MMMM yyyy")}
                    </h3>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="blueWhite"
                        size="icon"
                        className="h-8 w-8 bg-[#061020] border-[#1a2a40]"
                        onClick={handlePrevMonth}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous month</span>
                      </Button>
                      <Button
                        variant="blueWhite"
                        size="icon"
                        className="h-8 w-8 bg-[#061020] border-[#1a2a40]"
                        onClick={handleNextMonth}
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next month</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="blueWhite"
                      className="bg-[#061020] border-[#1a2a40] text-white"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Jump to date
                    </Button>

                    <Select defaultValue="month">
                      <SelectTrigger className="w-[120px] bg-[#061020] border-[#1a2a40] text-white">
                        <SelectValue placeholder="View" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a1930] border-[#1a2a40] text-white">
                        <SelectItem value="month">Month</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="day">Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border rounded-md border-[#1a2a40] overflow-hidden">
                  <div className="grid grid-cols-7 text-center bg-[#061020]/70 py-2 border-b border-[#1a2a40]">
                    <div className="text-sm font-medium text-gray-300">Sun</div>
                    <div className="text-sm font-medium text-gray-300">Mon</div>
                    <div className="text-sm font-medium text-gray-300">Tue</div>
                    <div className="text-sm font-medium text-gray-300">Wed</div>
                    <div className="text-sm font-medium text-gray-300">Thu</div>
                    <div className="text-sm font-medium text-gray-300">Fri</div>
                    <div className="text-sm font-medium text-gray-300">Sat</div>
                  </div>

                  <div className="grid grid-cols-7 auto-rows-fr">
                    {calendarDays.map((day, index) => {
                      const isCurrentMonth =
                        day.getMonth() === currentMonth.getMonth();
                      const isToday = isSameDay(day, new Date());
                      const scheduledTxs = getScheduledTransactionsForDay(day);
                      const hasScheduledTx = scheduledTxs.length > 0;
                      const totalAmount = getTotalAmountForDay(day);

                      return (
                        <div
                          key={index}
                          className={`min-h-[100px] p-2 ${index % 7 !== 6 ? "border-r" : ""} ${
                            index < 35 ? "border-b" : ""
                          } border-[#1a2a40] ${!isCurrentMonth ? "text-gray-500" : ""} ${
                            isToday ? "bg-blue-900/30 ring-2 ring-blue-500" : ""
                          } ${hasScheduledTx && !isToday ? "bg-blue-900/20" : ""} relative`}
                        >
                          <div
                            className={`font-medium ${hasScheduledTx ? "text-blue-400" : ""}`}
                          >
                            {day.getDate()}
                          </div>

                          {hasScheduledTx && (
                            <div className="mt-2">
                              {scheduledTxs.map((st, stIndex) => (
                                <div
                                  key={stIndex}
                                  className="text-xs p-1 mb-1 bg-blue-900/40 border border-blue-800 rounded text-white flex items-center"
                                >
                                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center mr-1.5 flex-shrink-0">
                                    {st.transactions[0] &&
                                    "totalAmount" in st.transactions[0] ? (
                                      <Users className="w-2.5 h-2.5 text-white" />
                                    ) : (
                                      <ArrowRight className="w-2.5 h-2.5 text-white" />
                                    )}
                                  </div>
                                  <div className="overflow-hidden">
                                    <div className="font-medium truncate">
                                      {st.transactions[0] &&
                                      "totalAmount" in st.transactions[0]
                                        ? "Payroll"
                                        : "Payment"}
                                    </div>
                                    <div className="text-gray-300 truncate">
                                      {totalAmount}{" "}
                                      {st.transactions[0].tokenType}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between gap-4 relative z-10">
                <Button
                  variant="blueWhite"
                  className="border-[#1a2a40] hover:bg-[#061020] text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Transaction
                </Button>
                <Button
                  variant="blueWhite"
                  className="border-[#1a2a40] hover:bg-[#0a1930]/80 transition-colors"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Schedule
                </Button>
              </CardFooter>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  );
}
