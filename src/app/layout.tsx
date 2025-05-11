import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SuiProvider } from "@/providers/sui-provider";
import { Toaster } from "../components/ui/toaster";
import { WalletProvider } from "@/lib/wallet-context";
import { NotificationsProvider } from "@/contexts/notifications-context";
import { RouteChecker } from "@/components/Routes/route-checker";
import { NetworkProvider } from "@/contexts/network-context";
import { ScheduleProvider } from "@/contexts/schedule-context";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Sui Protected Payment Gateway",
  description:
    "A modern payment gateway and payroll system for the Sui blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SuiProvider>
          <WalletProvider>
            <NotificationsProvider>
              <NetworkProvider>
                <ScheduleProvider>
                  <RouteChecker>{children}</RouteChecker>
                </ScheduleProvider>
              </NetworkProvider>
            </NotificationsProvider>
          </WalletProvider>
          <Toaster />
        </SuiProvider>
      </body>
    </html>
  );
}
