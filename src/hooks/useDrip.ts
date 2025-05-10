import { useState } from "react";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { useNetwork } from "@/contexts/network-context";

interface DripResponse {
  message?: string;
  txDigest?: string;
  amount?: number;
  error?: string;
  details?: any;
}

export function useDrip() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const { currentNetwork } = useNetwork();

  const checkBalanceAndDrip = async (address: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check balance first
      const client = new SuiClient({ url: getFullnodeUrl(currentNetwork) });
      const coins = await client.getCoins({
        owner: address,
        coinType: "0x2::sui::SUI",
      });

      const balance = coins.data.reduce(
        (sum, c) => sum + BigInt(c.balance),
        BigInt(0)
      );

      // If balance is 0 or very low, request drip
      if (balance <= BigInt(0)) {
        return await requestDrip(address);
      } else {
        return { message: "Sufficient balance", balance: balance.toString() };
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to check balance and drip";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const requestDrip = async (recipient: string) => {
    setIsLoading(true);
    setError(null);
    setTxDigest(null);

    try {
      const response = await fetch("/api/drip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipient, currentNetwork }),
      });

      const data: DripResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request drip");
      }

      if (data.txDigest) {
        setTxDigest(data.txDigest);
      }

      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to request drip";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkBalanceAndDrip,
    requestDrip,
    isLoading,
    error,
    txDigest,
  };
}
