"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  useWallets,
  useCurrentWallet,
  useCurrentAccount,
} from "@mysten/dapp-kit";

type WalletContextType = {
  isConnected: boolean | null;
  isConnecting: boolean | null;
  walletAddress: string | null;
  disconnectWallet: () => void;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
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

  const disconnectWallet = () => {
    setWalletAddress(null);
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("walletAddress");
    router.push("/");
  };

  return (
    <WalletContext.Provider
      value={{ isConnected, walletAddress, disconnectWallet, isConnecting }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  return context;
}
