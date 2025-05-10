"use client";

import { useState } from "react";
import {
  Bell,
  Key,
  Moon,
  Shield,
  Sun,
  Users,
  Wallet,
  Check,
  Sparkles,
  Upload,
  Trash,
  Edit,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "@/components/ui/use-toast";
import { useTheme } from "@/components/theme-provider";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("security");

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

  interface ToastOptions {
    title: string;
    description: string;
  }

  interface SaveSettingsProps {
    section: "Security" | "Team" | "Notification" | "API" | "Appearance";
  }

  const handleSaveSettings = (section: SaveSettingsProps["section"]): void => {
    toast({
      title: `${section} settings saved`,
      description: `Your ${section.toLowerCase()} settings have been updated successfully.`,
    } as ToastOptions);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Secondary Navigation */}
      <div
        className={`${theme === "light" ? "bg-gray-50 border-b border-gray-200" : "bg-[#010a05] border-b border-[#0a1a10]"} py-2 px-4 -mx-6 mb-6`}
      >
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

      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
        initial="hidden"
        animate="show"
        variants={containerVariants}
      >
        <motion.h1 className="text-2xl font-bold" variants={itemVariants}>
          Settings & Administration
        </motion.h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Tabs
          defaultValue="security"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="overflow-x-auto">
            <TabsList
              className={`${theme === "light" ? "bg-gray-100 border border-gray-200" : "bg-[#0a1930] border border-[#1a2a40]"} w-full sm:w-auto mb-4`}
            >
              <TabsTrigger
                value="security"
                className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
              >
                <Shield className="h-4 w-4 mr-2 hidden sm:inline" />
                Security
              </TabsTrigger>
              <TabsTrigger
                value="team"
                className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
              >
                <Users className="h-4 w-4 mr-2 hidden sm:inline" />
                Team
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
              >
                <Bell className="h-4 w-4 mr-2 hidden sm:inline" />
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="api"
                className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
              >
                <Key className="h-4 w-4 mr-2 hidden sm:inline" />
                API
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="data-[state=active]:bg-blue-700 data-[state=active]:text-white"
              >
                {theme === "dark" ? (
                  <Moon className="h-4 w-4 mr-2 hidden sm:inline" />
                ) : (
                  <Sun className="h-4 w-4 mr-2 hidden sm:inline" />
                )}
                Appearance
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="security" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                className={`${theme === "light" ? "bg-white border-gray-200 text-gray-900" : "bg-[#0a1930] border-[#1a2a40] text-white"} overflow-hidden relative`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${theme === "light" ? "from-blue-100/50" : "from-blue-900/20"} to-transparent pointer-events-none`}
                ></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-400" />
                    Security Settings
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure security settings for your transactions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Transaction Security
                    </h3>

                    <div className="grid gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-md bg-[#061020]/50 border border-[#1a2a40]">
                        <div className="space-y-1">
                          <Label htmlFor="multi-sig" className="text-white">
                            Multi-Signature Requirements
                          </Label>
                          <p className="text-sm text-gray-400">
                            Require multiple approvals for transactions above a
                            threshold
                          </p>
                        </div>
                        <Switch
                          id="multi-sig"
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="threshold" className="text-gray-300">
                            Threshold Amount (SUI)
                          </Label>
                          <Input
                            id="threshold"
                            type="number"
                            placeholder="500"
                            className="bg-[#061020] border-[#1a2a40] text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="approvers" className="text-gray-300">
                            Required Approvers
                          </Label>
                          <Select defaultValue="2">
                            <SelectTrigger
                              id="approvers"
                              className="bg-[#061020] border-[#1a2a40] text-white"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0a1930] border-[#1a2a40] text-white">
                              <SelectItem value="2">2 Approvers</SelectItem>
                              <SelectItem value="3">3 Approvers</SelectItem>
                              <SelectItem value="all">
                                All Team Members
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-[#1a2a40]" />

                    <div className="grid gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-md bg-[#061020]/50 border border-[#1a2a40]">
                        <div className="space-y-1">
                          <Label
                            htmlFor="default-expiration"
                            className="text-white"
                          >
                            Default Expiration Time
                          </Label>
                          <p className="text-sm text-gray-400">
                            Set the default expiration time for new payments
                          </p>
                        </div>
                        <Select defaultValue="24">
                          <SelectTrigger
                            id="default-expiration"
                            className="w-full sm:w-[180px] bg-[#061020] border-[#1a2a40] text-white"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0a1930] border-[#1a2a40] text-white">
                            <SelectItem value="1">1 hour</SelectItem>
                            <SelectItem value="24">24 hours</SelectItem>
                            <SelectItem value="72">3 days</SelectItem>
                            <SelectItem value="168">7 days</SelectItem>
                            <SelectItem value="0">No expiration</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-md bg-[#061020]/50 border border-[#1a2a40]">
                        <div className="space-y-1">
                          <Label
                            htmlFor="allow-cancellation"
                            className="text-white"
                          >
                            Allow Cancellation by Default
                          </Label>
                          <p className="text-sm text-gray-400">
                            Enable cancellation option for new payments by
                            default
                          </p>
                        </div>
                        <Switch
                          id="allow-cancellation"
                          defaultChecked
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>
                    </div>

                    <Separator className="bg-[#1a2a40]" />

                    <div className="grid gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-md bg-[#061020]/50 border border-[#1a2a40]">
                        <div className="space-y-1">
                          <Label htmlFor="key-rotation" className="text-white">
                            Key Rotation Policy
                          </Label>
                          <p className="text-sm text-gray-400">
                            Automatically rotate verification keys for enhanced
                            security
                          </p>
                        </div>
                        <Select defaultValue="never">
                          <SelectTrigger
                            id="key-rotation"
                            className="w-full sm:w-[180px] bg-[#061020] border-[#1a2a40] text-white"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0a1930] border-[#1a2a40] text-white">
                            <SelectItem value="never">Never</SelectItem>
                            <SelectItem value="30">Every 30 days</SelectItem>
                            <SelectItem value="90">Every 90 days</SelectItem>
                            <SelectItem value="180">Every 180 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="relative z-10 flex flex-col sm:flex-row gap-2">
                  <Button
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 transition-colors"
                    onClick={() => handleSaveSettings("Security")}
                  >
                    Save Security Settings
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
            >
              <Card
                className={`${theme === "light" ? "bg-white border-gray-200 text-gray-900" : "bg-[#0a1930] border-[#1a2a40] text-white"} overflow-hidden relative`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${theme === "light" ? "from-blue-100/50" : "from-blue-900/20"} to-transparent pointer-events-none`}
                ></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-400" />
                    Two-Factor Authentication
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Add an extra layer of security to your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-md bg-[#061020]/50 border border-[#1a2a40]">
                    <div className="space-y-1">
                      <Label htmlFor="2fa" className="text-white">
                        Enable 2FA
                      </Label>
                      <p className="text-sm text-gray-400">
                        Require two-factor authentication for all team members
                      </p>
                    </div>
                    <Switch
                      id="2fa"
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-md bg-[#061020]/50 border border-[#1a2a40]">
                    <div className="space-y-1">
                      <Label htmlFor="2fa-transactions" className="text-white">
                        2FA for High-Value Transactions
                      </Label>
                      <p className="text-sm text-gray-400">
                        Require 2FA verification for transactions above 100 SUI
                      </p>
                    </div>
                    <Switch
                      id="2fa-transactions"
                      defaultChecked
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                </CardContent>
                <CardFooter className="relative z-10">
                  <Button
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 transition-colors"
                    onClick={() => {
                      toast({
                        title: "2FA Configuration",
                        description:
                          "Two-factor authentication settings updated successfully.",
                      });
                    }}
                  >
                    Configure 2FA
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="team">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                className={`${theme === "light" ? "bg-white border-gray-200 text-gray-900" : "bg-[#0a1930] border-[#1a2a40] text-white"} overflow-hidden relative`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${theme === "light" ? "from-blue-100/50" : "from-blue-900/20"} to-transparent pointer-events-none`}
                ></div>
                <CardHeader className="relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-400" />
                        Team Management
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Manage team members and their access permissions
                      </CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 transition-colors">
                          <Users className="h-4 w-4 mr-2" />
                          Add Team Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#0a1930] border-[#1a2a40] text-white">
                        <DialogHeader>
                          <DialogTitle>Add Team Member</DialogTitle>
                          <DialogDescription className="text-gray-400">
                            Invite a new team member to your organization
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="name"
                              className="text-right text-gray-300"
                            >
                              Name
                            </Label>
                            <Input
                              id="name"
                              className="col-span-3 bg-[#061020] border-[#1a2a40] text-white"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="email"
                              className="text-right text-gray-300"
                            >
                              Email
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              className="col-span-3 bg-[#061020] border-[#1a2a40] text-white"
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label
                              htmlFor="role"
                              className="text-right text-gray-300"
                            >
                              Role
                            </Label>
                            <Select>
                              <SelectTrigger
                                id="role"
                                className="col-span-3 bg-[#061020] border-[#1a2a40] text-white"
                              >
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#0a1930] border-[#1a2a40] text-white">
                                <SelectItem value="admin">
                                  Administrator
                                </SelectItem>
                                <SelectItem value="approver">
                                  Approver
                                </SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => {
                              toast({
                                title: "Invitation Sent",
                                description:
                                  "Team member has been invited successfully.",
                              });
                            }}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 transition-colors"
                          >
                            Send Invitation
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="rounded-md border border-[#1a2a40] overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-[#061020]/50">
                          <TableRow className="hover:bg-[#061020] border-[#1a2a40]">
                            <TableHead className="text-gray-300">
                              Name
                            </TableHead>
                            <TableHead className="text-gray-300 hidden md:table-cell">
                              Email
                            </TableHead>
                            <TableHead className="text-gray-300">
                              Role
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
                          {[
                            {
                              name: "John Smith",
                              email: "john@example.com",
                              role: "Administrator",
                              status: "Active",
                              initial: "J",
                            },
                            {
                              name: "Sarah Johnson",
                              email: "sarah@example.com",
                              role: "Approver",
                              status: "Active",
                              initial: "S",
                            },
                            {
                              name: "Michael Brown",
                              email: "michael@example.com",
                              role: "Viewer",
                              status: "Pending",
                              initial: "M",
                            },
                            {
                              name: "Emily Davis",
                              email: "emily@example.com",
                              role: "Approver",
                              status: "Active",
                              initial: "E",
                            },
                          ].map((member, index) => (
                            <motion.tr
                              key={index}
                              className="hover:bg-[#061020]/70 border-[#1a2a40]"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                  delay: 0.1 * index,
                                  duration: 0.3,
                                },
                              }}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8 border border-[#1a2a40] bg-[#061020]">
                                    <AvatarFallback className="bg-[#061020] text-blue-400">
                                      {member.initial}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate max-w-[120px] sm:max-w-none">
                                    {member.name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-gray-300">
                                {member.email}
                              </TableCell>
                              <TableCell className="text-gray-300">
                                {member.role}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`${
                                    member.status === "Active"
                                      ? "border-green-800 bg-green-900/30 text-green-400"
                                      : "border-yellow-800 bg-yellow-900/30 text-yellow-400"
                                  }`}
                                >
                                  {member.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                                >
                                  <span className="sr-only">Edit</span>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                                >
                                  <span className="sr-only">Delete</span>
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <Separator className="bg-[#1a2a40]" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Key className="h-4 w-4 text-blue-400" />
                      Role Permissions
                    </h3>
                    <div className="rounded-md border border-[#1a2a40] overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-[#061020]/50">
                            <TableRow className="hover:bg-[#061020] border-[#1a2a40]">
                              <TableHead className="text-gray-300">
                                Permission
                              </TableHead>
                              <TableHead className="text-gray-300">
                                Administrator
                              </TableHead>
                              <TableHead className="text-gray-300">
                                Approver
                              </TableHead>
                              <TableHead className="text-gray-300">
                                Viewer
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[
                              {
                                permission: "Create Payments",
                                admin: true,
                                approver: true,
                                viewer: false,
                              },
                              {
                                permission: "Approve Transactions",
                                admin: true,
                                approver: true,
                                viewer: false,
                              },
                              {
                                permission: "Manage Team",
                                admin: true,
                                approver: false,
                                viewer: false,
                              },
                              {
                                permission: "View Transactions",
                                admin: true,
                                approver: true,
                                viewer: true,
                              },
                              {
                                permission: "Manage Settings",
                                admin: true,
                                approver: false,
                                viewer: false,
                              },
                            ].map((perm, index) => (
                              <TableRow key={index}>
                                <motion.tr
                                  className="hover:bg-[#061020]/70 border-[#1a2a40]"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{
                                    opacity: 1,
                                    y: 0,
                                    transition: {
                                      delay: 0.1 * index + 0.3,
                                      duration: 0.3,
                                    },
                                  }}
                                >
                                  <TableCell className="font-medium">
                                    {perm.permission}
                                  </TableCell>
                                  <TableCell>
                                    {perm.admin ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <span className="text-gray-500">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {perm.approver ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <span className="text-gray-500">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {perm.viewer ? (
                                      <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <span className="text-gray-500">—</span>
                                    )}
                                  </TableCell>
                                </motion.tr>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="relative z-10">
                  <Button
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 transition-colors"
                    onClick={() => handleSaveSettings("Team")}
                  >
                    Save Team Settings
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                className={`${theme === "light" ? "bg-white border-gray-200 text-gray-900" : "bg-[#0a1930] border-[#1a2a40] text-white"} overflow-hidden relative`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${theme === "light" ? "from-blue-100/50" : "from-blue-900/20"} to-transparent pointer-events-none`}
                ></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-400" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-400" />
                      Email Notifications
                    </h3>

                    <div className="space-y-3">
                      {[
                        {
                          id: "email-payments",
                          label: "New Payment Notifications",
                          description:
                            "Receive emails when new payments are created",
                          defaultChecked: true,
                        },
                        {
                          id: "email-approvals",
                          label: "Approval Requests",
                          description:
                            "Receive emails when your approval is needed",
                          defaultChecked: true,
                        },
                        {
                          id: "email-completed",
                          label: "Completed Transactions",
                          description:
                            "Receive emails when transactions are completed",
                          defaultChecked: true,
                        },
                        {
                          id: "email-failed",
                          label: "Failed Transactions",
                          description: "Receive emails when transactions fail",
                          defaultChecked: true,
                        },
                        {
                          id: "email-summary",
                          label: "Daily Summary",
                          description:
                            "Receive a daily summary of all transaction activity",
                          defaultChecked: false,
                        },
                      ].map((notification) => (
                        <motion.div
                          key={notification.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-md bg-[#061020]/50 border border-[#1a2a40]"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          <div className="space-y-1">
                            <Label
                              htmlFor={notification.id}
                              className="text-white"
                            >
                              {notification.label}
                            </Label>
                            <p className="text-sm text-gray-400">
                              {notification.description}
                            </p>
                          </div>
                          <Switch
                            id={notification.id}
                            defaultChecked={notification.defaultChecked}
                            className="data-[state=checked]:bg-blue-600"
                          />
                        </motion.div>
                      ))}
                    </div>

                    <Separator className="bg-[#1a2a40]" />

                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <BellRing className="h-4 w-4 text-blue-400" />
                      Push Notifications
                    </h3>

                    <div className="space-y-3">
                      {[
                        {
                          id: "push-payments",
                          label: "New Payment Notifications",
                          description:
                            "Receive push notifications when new payments are created",
                          defaultChecked: false,
                        },
                        {
                          id: "push-approvals",
                          label: "Approval Requests",
                          description:
                            "Receive push notifications when your approval is needed",
                          defaultChecked: true,
                        },
                        {
                          id: "push-completed",
                          label: "Completed Transactions",
                          description:
                            "Receive push notifications when transactions are completed",
                          defaultChecked: false,
                        },
                        {
                          id: "push-failed",
                          label: "Failed Transactions",
                          description:
                            "Receive push notifications when transactions fail",
                          defaultChecked: false,
                        },
                      ].map((notification) => (
                        <motion.div
                          key={notification.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-md bg-[#061020]/50 border border-[#1a2a40]"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          <div className="space-y-1">
                            <Label
                              htmlFor={notification.id}
                              className="text-white"
                            >
                              {notification.label}
                            </Label>
                            <p className="text-sm text-gray-400">
                              {notification.description}
                            </p>
                          </div>
                          <Switch
                            id={notification.id}
                            defaultChecked={notification.defaultChecked}
                            className="data-[state=checked]:bg-blue-600"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="relative z-10">
                  <Button
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 transition-colors"
                    onClick={() => handleSaveSettings("Notification")}
                  >
                    Save Notification Settings
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="api">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                className={`${theme === "light" ? "bg-white border-gray-200 text-gray-900" : "bg-[#0a1930] border-[#1a2a40] text-white"} overflow-hidden relative`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${theme === "light" ? "from-blue-100/50" : "from-blue-900/20"} to-transparent pointer-events-none`}
                ></div>
                <CardHeader className="relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-blue-400" />
                        API Access
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Manage API keys for integrating with external systems
                      </CardDescription>
                    </div>
                    <Button
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 transition-colors"
                      onClick={() => {
                        toast({
                          title: "New API Key Generated",
                          description:
                            "sui-api-key-" +
                            Math.random().toString(36).substring(2, 15),
                        });
                      }}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Generate New API Key
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="rounded-md border border-[#1a2a40] overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-[#061020]/50">
                          <TableRow className="hover:bg-[#061020] border-[#1a2a40]">
                            <TableHead className="text-gray-300">
                              Key Name
                            </TableHead>
                            <TableHead className="text-gray-300 hidden md:table-cell">
                              Created
                            </TableHead>
                            <TableHead className="text-gray-300 hidden md:table-cell">
                              Last Used
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
                          {[
                            {
                              name: "Production API Key",
                              created: "2023-06-15",
                              lastUsed: "2023-07-25",
                              status: "Active",
                            },
                            {
                              name: "Development API Key",
                              created: "2023-06-20",
                              lastUsed: "2023-07-24",
                              status: "Active",
                            },
                            {
                              name: "Testing API Key",
                              created: "2023-07-01",
                              lastUsed: "2023-07-10",
                              status: "Revoked",
                            },
                          ].map((key, index) => (
                            <motion.tr
                              key={index}
                              className={`hover:bg-[#061020]/70 border-[#1a2a40]`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                transition: {
                                  delay: 0.1 * index,
                                  duration: 0.3,
                                },
                              }}
                            >
                              <TableCell className="font-medium">
                                {key.name}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-gray-300">
                                {key.created}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-gray-300">
                                {key.lastUsed}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`${
                                    key.status === "Active"
                                      ? "border-green-800 bg-green-900/30 text-green-400"
                                      : "border-red-800 bg-red-900/30 text-red-400"
                                  }`}
                                >
                                  {key.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                                >
                                  <span className="sr-only">View</span>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {key.status === "Active" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                                  >
                                    <span className="sr-only">Revoke</span>
                                    <EyeOff className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <Separator className="bg-[#1a2a40]" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-blue-400" />
                      API Rate Limits
                    </h3>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="rate-limit" className="text-gray-300">
                            Requests per minute
                          </Label>
                          <Input
                            id="rate-limit"
                            type="number"
                            defaultValue="60"
                            className="bg-[#061020] border-[#1a2a40] text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="daily-limit"
                            className="text-gray-300"
                          >
                            Daily request limit
                          </Label>
                          <Input
                            id="daily-limit"
                            type="number"
                            defaultValue="10000"
                            className="bg-[#061020] border-[#1a2a40] text-white"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-md bg-[#061020]/50 border border-[#1a2a40]">
                        <div className="space-y-1">
                          <Label
                            htmlFor="webhook-enabled"
                            className="text-white"
                          >
                            Enable Webhooks
                          </Label>
                          <p className="text-sm text-gray-400">
                            Send transaction events to your systems via webhooks
                          </p>
                        </div>
                        <Switch
                          id="webhook-enabled"
                          defaultChecked
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="webhook-url" className="text-gray-300">
                          Webhook URL
                        </Label>
                        <Input
                          id="webhook-url"
                          placeholder="https://your-domain.com/webhook"
                          className="bg-[#061020] border-[#1a2a40] text-white"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="relative z-10">
                  <Button
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 transition-colors"
                    onClick={() => handleSaveSettings("API")}
                  >
                    Save API Settings
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="appearance">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card
                className={`${theme === "light" ? "bg-white border-gray-200 text-gray-900" : "bg-[#0a1930] border-[#1a2a40] text-white"} overflow-hidden relative`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${theme === "light" ? "from-blue-100/50" : "from-blue-900/20"} to-transparent pointer-events-none`}
                ></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2">
                    {theme === "dark" ? (
                      <Moon className="h-5 w-5 text-blue-400" />
                    ) : (
                      <Sun className="h-5 w-5 text-blue-400" />
                    )}
                    Appearance Settings
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Customize the look and feel of your payment interface
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Theme</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <motion.div
                        className={`border rounded-md p-4 cursor-pointer hover:border-blue-500 transition-colors ${
                          theme === "light"
                            ? "border-blue-500 bg-[#061020]/50"
                            : "border-[#1a2a40]"
                        }`}
                        onClick={() => setTheme("light")}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-medium">Light</span>
                          <Sun className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="h-24 bg-white border rounded-md"></div>
                      </motion.div>

                      <motion.div
                        className={`border rounded-md p-4 cursor-pointer hover:border-blue-500 transition-colors ${
                          theme === "dark"
                            ? "border-blue-500 bg-[#061020]/50"
                            : "border-[#1a2a40]"
                        }`}
                        onClick={() => setTheme("dark")}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-medium">Dark</span>
                          <Moon className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="h-24 bg-[#0a1930] border border-[#1a2a40] rounded-md"></div>
                      </motion.div>

                      <motion.div
                        className={`border rounded-md p-4 cursor-pointer hover:border-blue-500 transition-colors ${
                          theme === "system"
                            ? "border-blue-500 bg-[#061020]/50"
                            : "border-[#1a2a40]"
                        }`}
                        onClick={() => setTheme("system")}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <span className="font-medium">System</span>
                          <div className="flex">
                            <Sun className="h-4 w-4 mr-1 text-blue-400" />
                            <Moon className="h-4 w-4 text-blue-400" />
                          </div>
                        </div>
                        <div className="h-24 bg-gradient-to-r from-white to-[#0a1930] border border-[#1a2a40] rounded-md"></div>
                      </motion.div>
                    </div>

                    <Separator className="bg-[#1a2a40]" />

                    <h3 className="text-lg font-medium">Branding</h3>

                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company-name" className="text-gray-300">
                          Company Name
                        </Label>
                        <Input
                          id="company-name"
                          defaultValue="Sui Pay"
                          className="bg-[#061020] border-[#1a2a40] text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="logo" className="text-gray-300">
                          Logo
                        </Label>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="h-16 w-16 rounded-md border border-[#1a2a40] flex items-center justify-center bg-[#061020]">
                            <Wallet className="h-8 w-8 text-blue-400" />
                          </div>
                          <Button
                            variant="outline"
                            className="border-[#1a2a40] hover:bg-[#061020] text-white w-full sm:w-auto"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload New Logo
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="primary-color"
                          className="text-gray-300"
                        >
                          Primary Color
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="primary-color"
                            defaultValue="#1E40AF"
                            className="bg-[#061020] border-[#1a2a40] text-white"
                          />
                          <div className="h-10 w-10 rounded-md bg-blue-700 border border-[#1a2a40]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="relative z-10">
                  <Button
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 transition-colors"
                    onClick={() => handleSaveSettings("Appearance")}
                  >
                    Save Appearance Settings
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
interface Props extends React.SVGProps<SVGSVGElement> {}

function Mail(props: Props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function BellRing(props: Props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      <path d="M4 2C2.8 3.7 2 5.7 2 8" />
      <path d="M22 8c0-2.3-.8-4.3-2-6" />
    </svg>
  );
}
