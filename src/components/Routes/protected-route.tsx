"use client";

import type React from "react";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWalletContext } from "@/lib/wallet-context";
import { useUserProfile } from "@/hooks/useUserProfile";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isConnected, walletAddress } = useWalletContext() || {};
  const { fetchUserByAddress, userProfile, isLoading } = useUserProfile();

  const checkAccess = useCallback(async () => {
    if (!isConnected || !walletAddress) {
      router.push("/");
      return;
    }

    // Only proceed with fetch if not already loading and profile doesn't exist
    if (!isLoading && !userProfile) {
      try {
        const profile = await fetchUserByAddress(walletAddress);

        // Only redirect if we completed the fetch and still don't have a user profile
        if (!profile) {
          router.push("/");
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        router.push("/");
      }
    }
  }, [
    isConnected,
    walletAddress,
    router,
    fetchUserByAddress,
    isLoading,
    userProfile,
  ]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  return <>{children}</>;
}
