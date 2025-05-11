"use client";

import { useState, useEffect, createElement } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Menu, Search, X, ChevronDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useWalletContext } from "@/lib/wallet-context";
import { WalletButton } from "@/components/wallet-button";
import { NetworkSwitcher } from "@/components/network-switcher";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

import type { ReactNode } from "react";
import { useNotifications } from "@/contexts/notifications-context";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useNavItems } from "@/utils/navItmes";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("");
  const navItems = useNavItems();
  const [userInfo, setUserInfo] = useState<{
    username: string;
    email: string;
    walletAddress: string;
  } | null>(null);
  const { fetchUserByAddress, userProfile, isLoading } = useUserProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected, walletAddress, isConnecting } = useWalletContext() || {};
  const { notifications, unreadCount, markAllAsRead, markAsRead } =
    useNotifications();

  useEffect(() => {
    const getUser = async () => {
      try {
        if (walletAddress) {
          if (!userProfile && !isLoading) {
            fetchUserByAddress(walletAddress);
          }
          if (userProfile) {
            setUserInfo(userProfile);
          }
        }
      } catch (error) {
        console.error("Error getting user data:", error);
      }
    };
    getUser();
  }, [walletAddress, userProfile, isLoading, fetchUserByAddress]);

  // Handle route preservation on refresh
  useEffect(() => {
    if (isConnected && walletAddress) {
      const currentPath = window.location.pathname;
      if (currentPath !== "/") {
        router.push(currentPath);
      }
    }
  }, [isConnected, walletAddress, router]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navGroups = [
    {
      name: "Overview",
      items: navItems.filter((item) => item.category === "overview"),
    },
    {
      name: "Payments",
      items: navItems.filter((item) => item.category === "payments"),
    },
    {
      name: "Management",
      items: navItems.filter((item) => item.category === "management"),
    },
  ];

  if (!isConnected) {
    return null; // Don't render anything if not connected
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#0a1930] to-[#061020] text-white overflow-x-hidden">
      {/* Blur overlay when connecting */}
      {isConnecting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-white text-lg">Connecting wallet...</div>
        </div>
      )}

      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-[#1a2a40] bg-[#0a1930]/90 backdrop-blur-md px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Link
            href={userInfo ? "/dashboard" : "/"}
            className="flex items-center gap-2"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 8V7.2C18 6.0799 18 5.51984 17.782 5.09202C17.5903 4.71569 17.2843 4.40973 16.908 4.21799C16.4802 4 15.9201 4 14.8 4H9.2C8.07989 4 7.51984 4 7.09202 4.21799C6.71569 4.40973 6.40973 4.71569 6.21799 5.09202C6 5.51984 6 6.0799 6 7.2V8M6 8H18M6 8H4M18 8H20M9 11V17M12 11V17M15 11V17M3 8H21V16.8C21 17.9201 21 18.4802 20.782 18.908C20.5903 19.2843 20.2843 19.5903 19.908 19.782C19.4802 20 18.9201 20 17.8 20H6.2C5.0799 20 4.51984 20 4.09202 19.782C3.71569 19.5903 3.40973 19.2843 3.21799 18.908C3 18.4802 3 17.9201 3 16.8V8Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden md:inline">Sui Pay</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[280px] bg-[#0a1930] border-[#1a2a40] p-0"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-[#1a2a40]">
                <div className="flex items-center gap-2 font-semibold">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-6 w-6 text-blue-400"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 8V7.2C18 6.0799 18 5.51984 17.782 5.09202C17.5903 4.71569 17.2843 4.40973 16.908 4.21799C16.4802 4 15.9201 4 14.8 4H9.2C8.07989 4 7.51984 4 7.09202 4.21799C6.71569 4.40973 6.40973 4.71569 6.21799 5.09202C6 5.51984 6 6.0799 6 7.2V8M6 8H18M6 8H4M18 8H20M9 11V17M12 11V17M15 11V17M3 8H21V16.8C21 17.9201 21 18.4802 20.782 18.908C20.5903 19.2843 20.2843 19.5903 19.908 19.782C19.4802 20 18.9201 20 17.8 20H6.2C5.0799 20 4.51984 20 4.09202 19.782C3.71569 19.5903 3.40973 19.2843 3.21799 18.908C3 18.4802 3 17.9201 3 16.8V8Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Sui Pay</span>
                </div>
                <Button
                  variant="blueWhite"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="absolute top-4 right-4 z-50 bg-[#061020] border-[#1a2a40] hover:bg-[#0a1930] hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Mobile search */}
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search..."
                    className="pl-9 bg-[#061020] border-[#1a2a40] text-white rounded-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <nav className="flex-1 overflow-auto py-4">
                {navGroups.map((group) => (
                  <div key={group.name} className="mb-6 px-4">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-2 ml-1">
                      {group.name}
                    </h3>
                    <ul className="space-y-1">
                      {group.items.map((item, index) => (
                        <motion.li
                          key={item.path}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                        >
                          <Link
                            href={item.path}
                            className={cn(
                              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all relative overflow-hidden group",
                              pathname === item.path
                                ? "bg-blue-600 text-white font-medium"
                                : "text-gray-300 hover:text-white hover:bg-[#061020]"
                            )}
                          >
                            <span
                              className={cn(
                                "flex items-center justify-center h-7 w-7 rounded-md",
                                pathname === item.path
                                  ? "bg-blue-700 text-white"
                                  : "bg-[#061020] text-blue-400 group-hover:bg-blue-900/30"
                              )}
                            >
                              {createElement(item.icon, { size: 16 })}
                            </span>
                            <span>{item.name}</span>
                            {item.badge && (
                              <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium bg-blue-800 text-blue-200">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>

              <div className="border-t border-[#1a2a40] p-4 space-y-4">
                <NetworkSwitcher />
                <WalletButton />
                <Button
                  variant="blueWhite"
                  className="border-[#1a2a40] hover:bg-[#061020] text-white"
                  onClick={() => router.push("/schedule-payments")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Transaction
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Navigation - New Tab-like nav */}
        <div className="hidden md:flex items-center space-x-4 ml-6 flex-1">
          <div className="flex bg-[#061020]/50 rounded-lg p-1 gap-1">
            {navGroups.map((group, groupIndex) => (
              <Popover
                key={group.name}
                open={activeGroup === group.name}
                onOpenChange={(open) =>
                  setActiveGroup(open ? group.name : null)
                }
              >
                <PopoverTrigger asChild>
                  <Button
                    variant={
                      group.items.some((item) => item.path === pathname)
                        ? "default"
                        : "ghost"
                    }
                    size="sm"
                    className={cn(
                      "rounded-md px-3 gap-2 h-9 text-sm",
                      group.items.some((item) => item.path === pathname)
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:text-white hover:bg-[#061020]"
                    )}
                  >
                    {group.name}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="bg-[#0a1930] border-[#1a2a40] p-2 w-56"
                  align="start"
                  sideOffset={10}
                >
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <motion.li
                        key={item.path}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Link
                          href={item.path}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all relative overflow-hidden group",
                            pathname === item.path
                              ? "bg-blue-600 text-white font-medium"
                              : "text-gray-300 hover:text-white hover:bg-[#061020]"
                          )}
                          onClick={() => setActiveGroup(null)}
                        >
                          <span
                            className={cn(
                              "flex items-center justify-center h-7 w-7 rounded-md",
                              pathname === item.path
                                ? "bg-blue-700 text-white"
                                : "bg-[#061020] text-blue-400 group-hover:bg-blue-900/30"
                            )}
                          >
                            {createElement(item.icon, { size: 16 })}
                          </span>
                          <span>{item.name}</span>
                          {item.badge && (
                            <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium bg-blue-800 text-blue-200">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            ))}
          </div>

          {/* Current page indicator */}
          {navItems.find((item) => item.path === pathname) && (
            <div className="items-center gap-2 px-3 text-sm font-medium hidden lg:flex">
              <span className="text-gray-400">•</span>
              <span className="text-white">
                {navItems.find((item) => item.path === pathname)?.name}
              </span>
            </div>
          )}

          {/* Desktop search */}
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search..."
              className="pl-9 w-64 bg-[#061020] border-[#1a2a40] text-white rounded-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto md:ml-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-300 hover:text-white"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {unreadCount}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between p-4 border-b border-[#1a2a40]">
                <h4 className="text-sm font-medium">Notifications</h4>
                <Button
                  variant="ghost"
                  className="text-xs text-blue-500 hover:text-blue-600"
                  onClick={() => router.push("/notifications")}
                >
                  See all
                </Button>
              </div>
              <div className="divide-y divide-[#1a2a40] max-h-[300px] overflow-auto">
                {notifications.slice(0, 3).map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-b border-blue-700 px-4 py-3 ${
                      notification.read ? "opacity-60" : ""
                    }`}
                    onClick={() => {
                      markAsRead(notification.id);
                      toast({
                        title: notification.title,
                        description: notification.description,
                      });
                    }}
                  >
                    <div className="flex items-start gap-3 cursor-pointer">
                      <div
                        className={`mt-1 h-2 w-2 rounded-full ${
                          notification.read ? "bg-transparent" : "bg-blue-400"
                        }`}
                      />
                      <div className="flex-1">
                        <h5 className="text-sm font-medium">
                          {notification.title}
                        </h5>
                        <p className="text-xs text-blue-200">
                          {notification.description}
                        </p>
                        <p className="mt-1 text-xs text-blue-300">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="hidden md:block">
            <NetworkSwitcher />
          </div>

          <WalletButton />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-full mx-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
