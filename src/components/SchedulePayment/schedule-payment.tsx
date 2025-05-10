"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SinglePayment from "./single-schedule";
import BulkPayment from "./bulk-schedule";
import { motion } from "framer-motion";

export default function SchedulePayment() {
  const [activeTab, setActiveTab] = useState("single");

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">Payment Management</h1>
          <p className="text-gray-400 mt-1">
            Create single payments or schedule bulk payments
          </p>
        </div>
      </motion.div>

      <Card className="bg-gradient-to-b from-[#0a1930] to-[#061020] border-[#1a2a40] text-white overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -translate-x-32 -translate-y-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full translate-x-16 translate-y-16 blur-3xl"></div>

        <CardHeader className="relative z-10 border-b border-[#1a2a40] bg-[#061020]/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Payment Details</CardTitle>
              <CardDescription className="text-gray-400">
                Select payment type and enter payment details
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 p-6">
          <Tabs
            defaultValue="single"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-[#061020]/70 border border-[#1a2a40]">
              <TabsTrigger
                value="single"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Single Payment
              </TabsTrigger>
              <TabsTrigger
                value="bulk"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                Bulk Payment
              </TabsTrigger>
            </TabsList>
            <TabsContent value="single" className="mt-0">
              <SinglePayment />
            </TabsContent>
            <TabsContent value="bulk" className="mt-0">
              <BulkPayment />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
