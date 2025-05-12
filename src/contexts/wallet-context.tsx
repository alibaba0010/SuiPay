"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import {
  useWallets,
  useCurrentWallet,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import { useDisconnectWallet } from "@mysten/dapp-kit";
import { toast } from "@/components/ui/use-toast";

type WalletContextType = {
  isConnected: boolean | null;
  isConnecting: boolean | null;
  walletAddress: string | null;
  handleDisconnectWallet: () => void;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const disconnect = useDisconnectWallet();

  const router = useRouter();
  const currentWallet = useCurrentWallet();
  const currentAccount = useCurrentAccount();
  const { isConnected, isConnecting } = currentWallet;
  useEffect(() => {
    if (currentAccount) {
      setWalletAddress(currentAccount.address);
      localStorage.setItem("walletConnected", "true");
      localStorage.setItem("walletAddress", currentAccount.address);
    } else {
      setWalletAddress(null);
      localStorage.removeItem("walletConnected");
      localStorage.removeItem("walletAddress");
    }
  }, [currentAccount]);

  const handleDisconnectWallet = useCallback(() => {
    disconnect.mutate();
    toast({
      title: "Wallet Disconnected",
      description: "You've been logged out successfully.",
    });
  }, [disconnect]);
  return (
    <WalletContext.Provider
      value={{
        isConnected,
        walletAddress,
        handleDisconnectWallet,
        isConnecting,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  return context;
}
