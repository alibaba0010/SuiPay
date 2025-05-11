"use client";

import { useState, useEffect, useRef } from "react";
import { usePayroll } from "@/hooks/usePayroll";
import { useWalletContext } from "@/lib/wallet-context";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Search,
  Download,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PayrollDetails } from "./payroll-details";
import { PayrollEdit } from "./payroll-edit";
import { useToast } from "@/components/ui/use-toast";
import { exportPayrolls } from "@/lib/utils/exportPayroll";
import { importPayrolls } from "@/lib/utils/importPayroll";
import { Payroll } from "@/types/payroll";

export function PayrollList() {
  const { walletAddress } = useWalletContext() || {};
  const {
    loading,
    getPayrolls,
    deletePayroll,
    createPayroll: storePayroll,
  } = usePayroll();
  const [searchQuery, setSearchQuery] = useState("");
  const [payrolls, setPayroll] = useState<Array<Payroll>>([]);
  const [selectedPayroll, setSelectedPayroll] = useState("all");
  const [filteredPayrolls, setFilteredPayrolls] = useState<Array<Payroll>>([]);
  const [viewMode, setViewMode] = useState<"list" | "details" | "edit">("list");
  const [activePayroll, setActivePayroll] = useState<Payroll | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPayrolls = async () => {
      if (walletAddress) {
        const payrolls = await getPayrolls(walletAddress);
        if (payrolls) {
          setPayroll(payrolls);
          setFilteredPayrolls(payrolls);
        }
      }
    };

    fetchPayrolls();
  }, [walletAddress, getPayrolls]);
  // Filter payrolls based on search query and selected payroll
  useEffect(() => {
    let filtered = payrolls || []; // Ensure we have an array to work with

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((payroll) =>
        payroll.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by selected payroll
    if (selectedPayroll !== "all") {
      filtered = filtered.filter((payroll) => payroll.id === selectedPayroll);
    }

    setFilteredPayrolls(filtered);
  }, [payrolls, searchQuery, selectedPayroll]);

  const handleViewDetails = (payroll: Payroll) => {
    setActivePayroll(payroll);
    setViewMode("details");
  };

  const handleEditPayroll = (payroll: Payroll) => {
    setActivePayroll(payroll);
    setViewMode("edit");
  };

  const handleBackToList = () => {
    setViewMode("list");
    setActivePayroll(null);
  };

  const handleDeletePayroll = async (
    payrollName: string,
    payrollId: string
  ) => {
    try {
      await deletePayroll(payrollName, payrollId);
      toast({
        title: "Success",
        description: "Payroll deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting payroll:", error);
      toast({
        title: "Error",
        description: "Failed to delete payroll",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (payrollName: string, payrollId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this payroll?"
    );
    if (confirmed) {
      handleDeletePayroll(payrollName, payrollId);
    }
  };

  const handleExport = (format: "csv" | "json") => {
    try {
      exportPayrolls(filteredPayrolls, format);
      toast({
        title: "Success",
        description: `Payroll data exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Error exporting payroll data:", error);
      toast({
        title: "Error",
        description: `Failed to export payroll data`,
        variant: "destructive",
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!walletAddress) return;
      const importedPayrolls = await importPayrolls(file);

      // Store each imported payroll
      for (const payroll of importedPayrolls) {
        await storePayroll({
          name: payroll.name,
          ownerAddress: walletAddress,
          recipients: payroll.recipients,
          tokenType: payroll.tokenType,
        });
      }

      // Refresh the payroll list
      await getPayrolls(walletAddress);

      toast({
        title: "Success",
        description: `Successfully imported ${importedPayrolls.length} payrolls`,
      });
    } catch (error) {
      console.error("Error importing payrolls:", error);
      toast({
        title: "Error",
        description: "Failed to import payrolls",
        variant: "destructive",
      });
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (viewMode === "details" && activePayroll) {
    return <PayrollDetails payroll={activePayroll} onBack={handleBackToList} />;
  }

  if (viewMode === "edit" && activePayroll) {
    return <PayrollEdit payroll={activePayroll} onBack={handleBackToList} />;
  }

  return (
    <Card className="bg-[#0a1930] border-[#1a2a40] text-white">
      <CardHeader className="pb-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle>Payroll List</CardTitle>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="blueWhite"
                  className="border-[#1a2a40] hover:bg-[#061020] text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0a1930] border-[#1a2a40] text-white">
                <DropdownMenuItem onClick={() => handleExport("csv")}>
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")}>
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="blueWhite"
              className="border-[#1a2a40] hover:bg-[#061020] text-white"
              onClick={() => fileInputRef.current?.click()}
            >
              Import
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".csv, .json"
              onChange={handleImport}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search payrolls by name..."
              className="pl-8 bg-[#061020] border-[#1a2a40] text-white w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedPayroll} onValueChange={setSelectedPayroll}>
            <SelectTrigger className="w-full md:w-[200px] bg-[#061020] border-[#1a2a40] text-white">
              <SelectValue placeholder="Select Payroll" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a1930] border-[#1a2a40] text-white">
              <SelectItem value="all">All Payrolls</SelectItem>
              {payrolls &&
                payrolls.map((payroll) => (
                  <SelectItem
                    key={payroll.id || `payroll-${payroll.name}`}
                    value={payroll.id}
                  >
                    {payroll.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border border-[#1a2a40] overflow-hidden">
          <Table>
            <TableHeader className="bg-[#061020]/30">
              <TableRow className="hover:bg-[#061020]/50 border-[#1a2a40]">
                <TableHead className="text-gray-300">Name</TableHead>
                <TableHead className="text-gray-300">Recipients</TableHead>
                <TableHead className="text-gray-300">Total Amount</TableHead>
                <TableHead className="text-gray-300">Created</TableHead>
                <TableHead className="text-gray-300 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayrolls && filteredPayrolls.length > 0 ? (
                filteredPayrolls.map((payroll, index) => (
                  <motion.tr
                    key={payroll.id || `${payroll.name}-${index}`}
                    className="hover:bg-[#061020]/50 border-[#1a2a40] cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleViewDetails(payroll)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 border border-[#1a2a40] bg-[#061020]">
                          <AvatarFallback className="bg-blue-900/50 text-blue-200">
                            {payroll.name ? payroll.name.charAt(0) : "P"}
                          </AvatarFallback>
                        </Avatar>
                        {payroll.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-blue-900/30 text-blue-400 border-blue-800"
                      >
                        {payroll.recipients ? payroll.recipients.length : 0}{" "}
                        recipients
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payroll.totalAmount
                        ? `${payroll.totalAmount.toFixed(2)} ${payroll.tokenType}`
                        : `0.00 ${payroll.tokenType}`}
                    </TableCell>
                    <TableCell>
                      {payroll.createdAt
                        ? format(new Date(payroll.createdAt), "MMM d, yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#0a1930] border-[#1a2a40] text-white"
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(payroll);
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditPayroll(payroll);
                            }}
                          >
                            Edit Payroll
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              confirmDelete(
                                payroll.name,
                                payroll._id || payroll.id || ""
                              )
                            }
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Payroll
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {searchQuery ? (
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Search className="h-8 w-8 mb-2" />
                        <p>No payrolls found matching "{searchQuery}"</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <p>No payrolls available</p>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {payrolls && payrolls.length > 0 && (
          <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
            <div>
              Showing {filteredPayrolls.length} of {payrolls.length} payrolls
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="blueWhite"
                size="sm"
                className="border-[#1a2a40] hover:bg-[#061020] text-white"
                disabled={true}
              >
                Previous
              </Button>
              <Button
                variant="blueWhite"
                size="sm"
                className="border-[#1a2a40] hover:bg-[#061020] text-white"
                disabled={true}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
