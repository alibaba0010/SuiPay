"use client";

import React, { useState } from "react";
import {
  Bell,
  Check,
  Filter,
  MoreHorizontal,
  Search,
  Trash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/contexts/notifications-context";
interface Props extends React.SVGProps<SVGSVGElement> {}

type NotificationType =
  | "payment"
  | "claim"
  | "approval"
  | "error"
  | "system"
  | "security"
  | "payments";

export default function NotificationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesType =
      selectedFilter === "all" || notification.type === selectedFilter;

    let matchesTimeframe = true;
    if (selectedTimeframe === "today") {
      matchesTimeframe = notification.date === new Date().toLocaleDateString();
    } else if (selectedTimeframe === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      matchesTimeframe = notification.date === yesterday.toLocaleDateString();
    }

    const matchesReadStatus = !showUnreadOnly || !notification.read;

    return (
      matchesSearch && matchesType && matchesTimeframe && matchesReadStatus
    );
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Handle deleting a notification
  const deleteNotification = () => {
    toast({
      title: "Notification deleted",
      description: "The notification has been removed.",
    });
    // In a real app, you would remove the notification from your state/database
  };

  const getNotificationIcon = (type: NotificationType): React.ReactElement => {
    switch (type) {
      case "payment":
        return (
          <div className="rounded-full bg-green-100 p-2 text-green-600">
            <CreditCard className="h-4 w-4" />
          </div>
        );
      case "approval":
        return (
          <div className="rounded-full bg-blue-100 p-2 text-blue-600">
            <CheckCircle className="h-4 w-4" />
          </div>
        );
      case "error":
        return (
          <div className="rounded-full bg-red-100 p-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
          </div>
        );
      case "system":
        return (
          <div className="rounded-full bg-purple-100 p-2 text-purple-600">
            <Settings className="h-4 w-4" />
          </div>
        );
      case "security":
        return (
          <div className="rounded-full bg-yellow-100 p-2 text-yellow-600">
            <Shield className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="rounded-full bg-gray-100 p-2 text-gray-600">
            <Bell className="h-4 w-4" />
          </div>
        );
    }
  };

  // Get priority badge color
  interface PriorityColors {
    high: string;
    normal: string;
    low: string;
  }

  type Priority = keyof PriorityColors | string;

  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      case "normal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "low":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            You have {unreadCount} unread notification
            {unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="blueWhite" onClick={markAllAsRead}>
            <Check className="mr-2 h-4 w-4" /> Mark all as read
          </Button>
          <Button
            variant="blueWhite"
            onClick={() =>
              toast({
                title: "Settings",
                description: "Notification settings would open here",
              })
            }
          >
            <Settings className="mr-2 h-4 w-4" /> Notification Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search notifications..."
                className="pl-8 w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select
              value={selectedTimeframe}
              onValueChange={setSelectedTimeframe}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-[130px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="approval">Approvals</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all">
          <NotificationsList
            notifications={filteredNotifications}
            getNotificationIcon={getNotificationIcon}
            getPriorityColor={getPriorityColor}
            markAsRead={markAsRead}
            deleteNotification={deleteNotification}
          />
        </TabsContent>

        <TabsContent value="unread">
          <NotificationsList
            notifications={filteredNotifications.filter((n) => !n.read)}
            getNotificationIcon={getNotificationIcon}
            getPriorityColor={getPriorityColor}
            markAsRead={markAsRead}
            deleteNotification={deleteNotification}
          />
        </TabsContent>

        <TabsContent value="payments">
          <NotificationsList
            notifications={filteredNotifications.filter(
              (n) => n.type === "payment"
            )}
            getNotificationIcon={getNotificationIcon}
            getPriorityColor={getPriorityColor}
            markAsRead={markAsRead}
            deleteNotification={deleteNotification}
          />
        </TabsContent>

        {/* <TabsContent value="system">
          <NotificationsList
            notifications={filteredNotifications.filter(
              (n) => n.type === "system"
            )}
            getNotificationIcon={getNotificationIcon}
            getPriorityColor={getPriorityColor}
            markAsRead={markAsRead}
            deleteNotification={deleteNotification}
          />
        </TabsContent> */}
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Customize how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div>
              <h3 className="text-lg font-medium mb-4">General Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="browser-notifications">
                      Browser Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications in your browser
                    </p>
                  </div>
                  <Switch id="browser-notifications" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sound-notifications">
                      Notification Sounds
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Play sounds for new notifications
                    </p>
                  </div>
                  <Switch id="sound-notifications" />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-4">Notification Types</h3>
              <div className="space-y-4">
                {[
                  {
                    id: "payment-notifications",
                    label: "Payment Notifications",
                    description:
                      "Notifications about payments and transactions",
                  },
                  {
                    id: "approval-notifications",
                    label: "Approval Requests",
                    description: "Notifications about approval requests",
                  },
                  {
                    id: "system-notifications",
                    label: "System Notifications",
                    description:
                      "Notifications about system updates and maintenance",
                  },
                  {
                    id: "security-notifications",
                    label: "Security Alerts",
                    description: "Notifications about security-related events",
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <Label htmlFor={item.id}>{item.label}</Label>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <Switch id={item.id} defaultChecked />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Separate component for the notifications list
interface NotificationsListProps {
  notifications: Array<{
    id: string;
    title: string;
    description: string;
    type: NotificationType;
    priority: string;
    read: boolean;
    time: string;
  }>;
  getNotificationIcon: (type: NotificationType) => React.ReactElement;
  getPriorityColor: (priority: string) => string;
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
}

function NotificationsList({
  notifications,
  getNotificationIcon,
  getPriorityColor,
  markAsRead,
  deleteNotification,
}: NotificationsListProps) {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No notifications found</h3>
          <p className="text-muted-foreground">
            You don't have any notifications matching your filters.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-muted/50 transition-colors ${!notification.read ? "bg-blue-50/10" : ""}`}
            >
              <div className="flex items-start gap-4">
                {getNotificationIcon(notification.type)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium">
                      {notification.title}
                    </h4>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                    )}
                    <Badge
                      variant="outline"
                      className={`ml-auto ${getPriorityColor(notification.priority)}`}
                    >
                      {notification.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {notification.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {notification.time}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="mr-2 h-4 w-4" /> Mark as read
                    </DropdownMenuItem>
                    {notification.type === "approval" && (
                      <DropdownMenuItem
                        onClick={() =>
                          toast({
                            title: "Approval",
                            description: "Navigating to approval request",
                          })
                        }
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Review &
                        Approve
                      </DropdownMenuItem>
                    )}
                    {notification.type === "error" && (
                      <DropdownMenuItem
                        onClick={() =>
                          toast({
                            title: "Error",
                            description: "Navigating to error details",
                          })
                        }
                      >
                        <AlertCircle className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Missing icon components
function CreditCard(props: Props) {
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
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function CheckCircle(props: Props) {
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function AlertCircle(props: Props) {
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
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

function Settings(props: Props) {
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
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1-1-1.73l-.43-.25a2 2 0 0 1-2 0l-.15.08a2 2 0 0 0-2.73-.73l-.22-.39a2 2 0 0 0 .73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function Shield(props: Props) {
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
