"use client";

import { useState } from "react";
import { Download, Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { toast } from "@/components/ui/use-toast";

import { motion } from "framer-motion";
import AddNewPayroll from "./NewPayroll";
import { PayrollList } from "./PayrollList";

export default function PayrollManagement() {
  const [activeTab, setActiveTab] = useState("payrolls");

  return (
    <div className="space-y-6 w-full">
      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1 className="text-2xl font-bold">Payroll Management</motion.h1>
        <motion.div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
          <Button
            variant="blueWhite"
            onClick={() =>
              toast({
                title: "Exporting",
                description: "Exporting employee data...",
              })
            }
            className="border-[#1a2a40] hover:bg-[#0a1930]/80 transition-colors w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </motion.div>
      </motion.div>

      <Tabs
        defaultValue="payrolls"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <div className="overflow-x-auto pb-2">
          <TabsList className="bg-[#0a1930] border border-[#1a2a40] w-full sm:w-auto">
            <TabsTrigger
              value="payrolls"
              className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4 mr-2 hidden sm:inline" />
              All Payrolls
            </TabsTrigger>
            <TabsTrigger
              value="new_payroll"
              className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
            >
              <UserPlus className="h-4 w-4 mr-2 hidden sm:inline" />
              Add New Payroll
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="payrolls">
          <PayrollList />
        </TabsContent>

        <TabsContent value="new_payroll">
          <AddNewPayroll />
        </TabsContent>
      </Tabs>
    </div>
  );
}
