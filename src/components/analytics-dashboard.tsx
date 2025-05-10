"use client";

import { CardFooter } from "@/components/ui/card";

import { useState } from "react";
import {
  Calendar,
  Download,
  Users,
  BarChart4,
  PieChart,
  LineChart,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("month");
  const [forecastPeriod, setForecastPeriod] = useState("monthly");

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

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5 },
    },
    hover: {
      y: -5,
      boxShadow: "0 10px 30px -15px rgba(0, 0, 0, 0.3)",
      transition: { duration: 0.2 },
    },
  };

  // Sample data for charts
  const volumeData = [
    { date: "2023-07-01", volume: 320, displayDate: "Jul 1" },
    { date: "2023-07-08", volume: 280, displayDate: "Jul 8" },
    { date: "2023-07-15", volume: 420, displayDate: "Jul 15" },
    { date: "2023-07-22", volume: 380, displayDate: "Jul 22" },
    { date: "2023-07-29", volume: 520, displayDate: "Jul 29" },
    { date: "2023-08-05", volume: 480, displayDate: "Aug 5" },
    { date: "2023-08-12", volume: 600, displayDate: "Aug 12" },
  ];

  const typeData = [
    { name: "Payments", value: 45, color: "#3b82f6" },
    { name: "Transfers", value: 30, color: "#8b5cf6" },
    { name: "Swaps", value: 15, color: "#06b6d4" },
    { name: "Other", value: 10, color: "#10b981" },
  ];

  const recipientData = [
    { name: "0x1a2b...3c4d", value: 1250 },
    { name: "0x5e6f...7g8h", value: 980 },
    { name: "0x9i0j...1k2l", value: 750 },
    { name: "0x3m4n...5o6p", value: 620 },
    { name: "0x7q8r...9s0t", value: 450 },
  ];

  const forecastData = {
    monthly: [
      { name: "Aug", value: 420 },
      { name: "Sep", value: 520 },
      { name: "Oct", value: 320 },
      { name: "Nov", value: 580 },
      { name: "Dec", value: 380 },
      { name: "Jan", value: 450 },
    ],
    quarterly: [
      { name: "Q3 2023", value: 1250 },
      { name: "Q4 2023", value: 950 },
      { name: "Q1 2024", value: 1650 },
      { name: "Q2 2024", value: 1250 },
    ],
    yearly: [
      { name: "2024", value: 4800 },
      { name: "2025", value: 6000 },
      { name: "2026", value: 7200 },
    ],
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
          Analytics Dashboard
        </motion.h1>
        <motion.div
          className="flex flex-col sm:flex-row w-full sm:w-auto gap-3"
          variants={itemVariants}
        >
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-[180px] bg-[#061020] border-[#1a2a40] text-white">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent className="bg-[#0a1930] border-[#1a2a40] text-white">
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="quarter">Last 90 Days</SelectItem>
              <SelectItem value="year">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="blueWhite"
            onClick={() => alert("Exporting analytics report...")}
            className="border-[#1a2a40] hover:bg-[#0a1930]/80 transition-colors w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="show"
        variants={containerVariants}
      >
        <SummaryCard
          title="Total Volume"
          value="5,280.75 SUI"
          description="+12.5% from last month"
          icon={<TrendingUp className="h-5 w-5" />}
          variants={cardVariants}
          color="from-blue-700 to-blue-900"
          positive={true}
        />
        <SummaryCard
          title="Transaction Count"
          value="142"
          description="+8.3% from last month"
          icon={<BarChart4 className="h-5 w-5" />}
          variants={cardVariants}
          color="from-indigo-700 to-indigo-900"
          positive={true}
        />
        <SummaryCard
          title="Average Transaction"
          value="37.19 SUI"
          description="+4.2% from last month"
          icon={<ArrowUpRight className="h-5 w-5" />}
          variants={cardVariants}
          color="from-blue-700 to-blue-900"
          positive={true}
        />
        <SummaryCard
          title="Active Recipients"
          value="28"
          description="+3 from last month"
          icon={<Users className="h-5 w-5" />}
          variants={cardVariants}
          color="from-indigo-700 to-indigo-900"
          positive={true}
        />
      </motion.div>

      <motion.div
        className="grid gap-6 mt-6 md:grid-cols-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card className="col-span-1 md:col-span-2 bg-[#0a1930] border-[#1a2a40] text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent pointer-events-none"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5 text-blue-400" />
              Transaction Volume
            </CardTitle>
            <CardDescription className="text-gray-400">
              Total transaction volume over time
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ChartContainer
              config={{
                volume: {
                  label: "Volume",
                  color: "#3b82f6",
                },
              }}
              className="w-full h-full"
            >
              <AreaChart
                data={volumeData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2a40" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fill: "#9ca3af" }}
                  axisLine={{ stroke: "#1a2a40" }}
                  tickLine={{ stroke: "#1a2a40" }}
                />
                <YAxis
                  tick={{ fill: "#9ca3af" }}
                  axisLine={{ stroke: "#1a2a40" }}
                  tickLine={{ stroke: "#1a2a40" }}
                  tickFormatter={(value) => `${value} SUI`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div>
                          <p className="text-sm text-gray-400">{name}</p>
                          <p className="text-lg font-bold text-white">
                            {value} SUI
                          </p>
                        </div>
                      )}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorVolume)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#0a1930] border-[#1a2a40] text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-transparent pointer-events-none"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-400" />
              Transaction Types
            </CardTitle>
            <CardDescription className="text-gray-400">
              Breakdown by transaction type
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ChartContainer
              config={{
                Payments: { label: "Payments", color: "#3b82f6" },
                Transfers: { label: "Transfers", color: "#8b5cf6" },
                Swaps: { label: "Swaps", color: "#06b6d4" },
                Other: { label: "Other", color: "#10b981" },
              }}
              className="w-full h-full"
            >
              <RechartsPieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: "#6b7280", strokeWidth: 1 }}
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div>
                          <p className="text-sm text-gray-400">{name}</p>
                          <p className="text-lg font-bold text-white">
                            {value}%
                          </p>
                        </div>
                      )}
                    />
                  }
                />
              </RechartsPieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-[#0a1930] border-[#1a2a40] text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent pointer-events-none"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart4 className="h-5 w-5 text-blue-400" />
              Top Recipients
            </CardTitle>
            <CardDescription className="text-gray-400">
              Most frequent payment recipients
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ChartContainer
              config={{
                value: { label: "Amount", color: "#3b82f6" },
              }}
              className="w-full h-full"
            >
              <BarChart
                data={recipientData}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1a2a40"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "#9ca3af" }}
                  axisLine={{ stroke: "#1a2a40" }}
                  tickLine={{ stroke: "#1a2a40" }}
                  tickFormatter={(value) => `${value} SUI`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#9ca3af" }}
                  axisLine={{ stroke: "#1a2a40" }}
                  tickLine={{ stroke: "#1a2a40" }}
                  width={80}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div>
                          <p className="text-sm text-gray-400">{name}</p>
                          <p className="text-lg font-bold text-white">
                            {value} SUI
                          </p>
                        </div>
                      )}
                    />
                  }
                />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  fill="#3b82f6"
                  barSize={20}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="bg-[#0a1930] border-[#1a2a40] text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent pointer-events-none"></div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Spending Forecast
            </CardTitle>
            <CardDescription className="text-gray-400">
              Projected spending based on recurring payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="monthly"
              onValueChange={(value) => setForecastPeriod(value)}
            >
              <TabsList className="mb-4 bg-[#061020] border border-[#1a2a40]">
                <TabsTrigger
                  value="monthly"
                  className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
                >
                  Monthly
                </TabsTrigger>
                <TabsTrigger
                  value="quarterly"
                  className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
                >
                  Quarterly
                </TabsTrigger>
                <TabsTrigger
                  value="yearly"
                  className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
                >
                  Yearly
                </TabsTrigger>
              </TabsList>
              <div className="relative h-[300px] w-full overflow-hidden rounded-md border border-[#1a2a40]">
                <TabsContent
                  value="monthly"
                  className="absolute inset-0 transition-opacity data-[state=inactive]:opacity-0"
                >
                  <div className="h-full w-full bg-[#061020]/50 p-4">
                    <ChartContainer
                      config={{
                        value: { label: "Amount", color: "#3b82f6" },
                      }}
                      className="w-full h-full"
                    >
                      <BarChart
                        data={forecastData.monthly}
                        margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2a40" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#9ca3af" }}
                          axisLine={{ stroke: "#1a2a40" }}
                          tickLine={{ stroke: "#1a2a40" }}
                        />
                        <YAxis
                          tick={{ fill: "#9ca3af" }}
                          axisLine={{ stroke: "#1a2a40" }}
                          tickLine={{ stroke: "#1a2a40" }}
                          tickFormatter={(value) => `${value} SUI`}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value, name) => (
                                <div>
                                  <p className="text-sm text-gray-400">
                                    {name}
                                  </p>
                                  <p className="text-lg font-bold text-white">
                                    {value} SUI
                                  </p>
                                </div>
                              )}
                            />
                          }
                        />
                        <Bar
                          dataKey="value"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                          barSize={30}
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </TabsContent>

                <TabsContent
                  value="quarterly"
                  className="absolute inset-0 transition-opacity data-[state=inactive]:opacity-0"
                >
                  <div className="h-full w-full bg-[#061020]/50 p-4">
                    <ChartContainer
                      config={{
                        value: { label: "Amount", color: "#8b5cf6" },
                      }}
                      className="w-full h-full"
                    >
                      <BarChart
                        data={forecastData.quarterly}
                        margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2a40" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#9ca3af" }}
                          axisLine={{ stroke: "#1a2a40" }}
                          tickLine={{ stroke: "#1a2a40" }}
                        />
                        <YAxis
                          tick={{ fill: "#9ca3af" }}
                          axisLine={{ stroke: "#1a2a40" }}
                          tickLine={{ stroke: "#1a2a40" }}
                          tickFormatter={(value) => `${value} SUI`}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value, name) => (
                                <div>
                                  <p className="text-sm text-gray-400">
                                    {name}
                                  </p>
                                  <p className="text-lg font-bold text-white">
                                    {value} SUI
                                  </p>
                                </div>
                              )}
                            />
                          }
                        />
                        <Bar
                          dataKey="value"
                          fill="#8b5cf6"
                          radius={[4, 4, 0, 0]}
                          barSize={40}
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </TabsContent>

                <TabsContent
                  value="yearly"
                  className="absolute inset-0 transition-opacity data-[state=inactive]:opacity-0"
                >
                  <div className="h-full w-full bg-[#061020]/50 p-4">
                    <ChartContainer
                      config={{
                        value: { label: "Amount", color: "#06b6d4" },
                      }}
                      className="w-full h-full"
                    >
                      <BarChart
                        data={forecastData.yearly}
                        margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a2a40" />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#9ca3af" }}
                          axisLine={{ stroke: "#1a2a40" }}
                          tickLine={{ stroke: "#1a2a40" }}
                        />
                        <YAxis
                          tick={{ fill: "#9ca3af" }}
                          axisLine={{ stroke: "#1a2a40" }}
                          tickLine={{ stroke: "#1a2a40" }}
                          tickFormatter={(value) => `${value} SUI`}
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value, name) => (
                                <div>
                                  <p className="text-sm text-gray-400">
                                    {name}
                                  </p>
                                  <p className="text-lg font-bold text-white">
                                    {value} SUI
                                  </p>
                                </div>
                              )}
                            />
                          }
                        />
                        <Bar
                          dataKey="value"
                          fill="#06b6d4"
                          radius={[4, 4, 0, 0]}
                          barSize={60}
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
          <CardFooter>
            <div className="text-sm text-gray-400">
              Based on currently scheduled recurring payments
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  variants: any;
  color: string;
  positive: boolean;
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  variants,
  color,
  positive,
}: SummaryCardProps) {
  return (
    <motion.div
      variants={variants}
      whileHover="hover"
      className="overflow-hidden"
    >
      <Card
        className={`bg-[#0a1930] border-[#1a2a40] text-white overflow-hidden relative h-full`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20`}
        ></div>
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 rounded-full blur-md"></div>
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="rounded-full bg-[#061020] p-2 border border-[#1a2a40]">
            {icon}
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <motion.div
            className="text-2xl font-bold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {value}
          </motion.div>
          <motion.p
            className={`text-xs ${positive ? "text-green-400" : "text-red-400"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {description}
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
