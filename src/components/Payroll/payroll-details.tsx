"use client";

import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Payroll, Recipient } from "@/types/payroll";
import { useUserProfile } from "@/hooks/useUserProfile";

interface PayrollDetailsProps {
  payroll: Payroll;
  onBack: () => void;
}

export function PayrollDetails({ payroll, onBack }: PayrollDetailsProps) {
  const [enrichedRecipients, setEnrichedRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    fetchUserByAddress,
    userProfile,
    isLoading: isGetting,
  } = useUserProfile();

  // Calculate total amount from recipients if not already provided
  const totalAmount =
    payroll.totalAmount ||
    (payroll.recipients
      ? payroll.recipients.reduce(
          (sum: number, recipient: Recipient) => sum + (recipient.amount || 0),
          0
        )
      : 0);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!payroll.recipients) return;

      try {
        const enrichedData = await Promise.all(
          payroll.recipients.map(async (recipient) => {
            if (!recipient.address) return recipient;
            if (!userProfile && !isGetting) {
              fetchUserByAddress(recipient.address);
            }
            return {
              ...recipient,
              username: userProfile?.username || recipient.username || "N/A",
              email: userProfile?.email || recipient.email || "N/A",
            };
          })
        );

        setEnrichedRecipients(enrichedData);
      } catch (error) {
        console.error("Error fetching user details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [payroll.recipients, userProfile, isGetting, fetchUserByAddress]);

  return (
    <Card className="bg-[#0a1930] border-[#1a2a40] text-white">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#061020]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="flex items-center gap-2">
            {payroll.name}
            <Badge className="ml-2 bg-blue-900/30 text-blue-400 border-blue-800">
              {payroll.status || "Active"}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#061020] p-4 rounded-lg border border-[#1a2a40]">
            <div className="text-gray-400 text-sm mb-1">Total Amount</div>
            <div className="text-xl font-bold">
              {totalAmount.toFixed(2)} SUI
            </div>
          </div>
          <div className="bg-[#061020] p-4 rounded-lg border border-[#1a2a40]">
            <div className="text-gray-400 text-sm mb-1">Created</div>
            <div className="text-md">
              {payroll.createdAt
                ? format(new Date(payroll.createdAt), "MMM d, yyyy 'at' h:mm a")
                : "N/A"}
            </div>
          </div>
          <div className="bg-[#061020] p-4 rounded-lg border border-[#1a2a40]">
            <div className="text-gray-400 text-sm mb-1">Last Updated</div>
            <div className="text-md">
              {payroll.updatedAt
                ? format(new Date(payroll.updatedAt), "MMM d, yyyy 'at' h:mm a")
                : "Same as created"}
            </div>
          </div>
        </div>

        <h3 className="text-lg font-medium mb-4">Recipients</h3>
        <div className="rounded-md border border-[#1a2a40] overflow-hidden mb-6">
          <Table>
            <TableHeader className="bg-[#061020]/30">
              <TableRow className="hover:bg-[#061020]/50 border-[#1a2a40]">
                <TableHead className="text-gray-300">Username</TableHead>
                <TableHead className="text-gray-300">Email</TableHead>
                <TableHead className="text-gray-300">Address</TableHead>
                <TableHead className="text-gray-300 text-right">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-gray-400"
                  >
                    Loading recipient details...
                  </TableCell>
                </TableRow>
              ) : enrichedRecipients.length > 0 ? (
                enrichedRecipients.map(
                  (recipient: Recipient, index: number) => (
                    <TableRow
                      key={`recipient-${index}`}
                      className="hover:bg-[#061020]/50 border-[#1a2a40]"
                    >
                      <TableCell>{recipient.username}</TableCell>
                      <TableCell>{recipient.email}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {recipient.address || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        {recipient.amount
                          ? `${recipient.amount.toFixed(2)} SUI`
                          : "0.00 SUI"}
                      </TableCell>
                    </TableRow>
                  )
                )
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-gray-400"
                  >
                    No recipients found for this payroll
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="blueWhite"
            onClick={onBack}
            className="border-[#1a2a40] hover:bg-[#061020] text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
