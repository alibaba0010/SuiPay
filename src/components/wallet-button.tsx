"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ConnectButton, useDisconnectWallet } from "@mysten/dapp-kit";
import {
  LogOut,
  Copy,
  ExternalLink,
  ChevronDown,
  User,
  Droplets,
} from "lucide-react";
import { useWalletContext } from "@/lib/wallet-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getFaucetHost, requestSuiFromFaucetV0 } from "@mysten/sui/faucet";
import { toast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNetwork } from "@/contexts/network-context";
import { eventEmitter } from "@/lib/events";
import { useUserProfile } from "@/hooks/useUserProfile";

export function WalletButton() {
  const [userData, setUserData] = useState<{
    username: string;
    email: string;
  } | null>(null);
  const disconnect = useDisconnectWallet();
  const { isConnected, walletAddress } = useWalletContext() || {};
  const { fetchUserByAddress, userProfile, isLoading } = useUserProfile();

  const { currentNetwork } = useNetwork();

  const fetchUserData = useCallback(async () => {
    if (walletAddress) {
      if (!userProfile && !isLoading) {
        fetchUserByAddress(walletAddress);
      }
      if (userProfile) {
        setUserData(userProfile);
      }
    }
  }, [walletAddress, userProfile, isLoading, fetchUserByAddress]);

  useEffect(() => {
    fetchUserData();

    // Add event listener for registration updates
    const handleUserRegistered = () => {
      fetchUserData();
    };

    eventEmitter.on("userRegistered", handleUserRegistered);

    // Cleanup
    return () => {
      eventEmitter.off("userRegistered", handleUserRegistered);
    };
  }, [fetchUserData]);

  useEffect(() => {
    if (userProfile) {
      setUserData(userProfile);
    }
  }, [userProfile]);

  const handleDisconnect = useCallback(() => {
    disconnect.mutate();
    toast({
      title: "Wallet Disconnected",
      description: "You've been logged out successfully.",
    });
  }, [disconnect]);

  const copyAddress = useCallback(() => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  }, [walletAddress]);

  const handleFaucetClaim = useCallback(async () => {
    try {
      if (!walletAddress) return;
      if (currentNetwork !== "testnet" && currentNetwork !== "devnet") {
        throw new Error("Faucet is only available on testnet, devnet");
      }
      const response = await requestSuiFromFaucetV0({
        host: getFaucetHost(currentNetwork as "testnet" | "devnet"),
        recipient: walletAddress,
      });
      const data = await response;

      if (response) {
        toast({
          title: "Faucet Claimed",
          description: "Successfully claimed SUI tokens from faucet",
        });
      } else {
        toast({
          title: "Faucet Error",
          description:
            data.error || "Failed to claim tokens. Please try again later.",
          variant: "destructive",
        });
        window.open(
          `https://faucet.sui.io/?network=${currentNetwork}`,
          "_blank"
        );
      }
    } catch (error) {
      toast({
        title: "Faucet Error",
        description: "Failed to claim tokens. Please try again later.",
        variant: "destructive",
      });
      window.open(`https://faucet.sui.io/?network=${currentNetwork}`, "_blank");
    }
  }, [walletAddress, currentNetwork]);

  if (!isConnected || !walletAddress) {
    return <ConnectButton className="cursor-pointer" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-blue-600">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback>
                {userData?.username ? (
                  userData.username.charAt(0).toUpperCase()
                ) : (
                  <User className="h-4 w-4" />
                )}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline">
              {userData?.username ||
                walletAddress.substring(0, 6) +
                  "..." +
                  walletAddress.substring(walletAddress.length - 4)}
            </span>
            <ChevronDown className="h-4 w-4 text-blue-400" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {userData?.username ? (
                userData.username.charAt(0).toUpperCase()
              ) : (
                <User className="h-4 w-4" />
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">
              {userData?.username || "Anonymous"}
            </span>
            <span className="text-xs text-gray-400">
              {userData?.email || "No email"}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyAddress}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy Address</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            window.open(
              `https://suiscan.xyz/${currentNetwork}/account/${walletAddress}`,
              "_blank"
            )
          }
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          <span>View on Explorer</span>
        </DropdownMenuItem>
        {(currentNetwork === "devnet" || currentNetwork === "testnet") && (
          <DropdownMenuItem onClick={handleFaucetClaim}>
            <Droplets className="mr-2 h-4 w-4" />
            <span>Claim Faucet</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
