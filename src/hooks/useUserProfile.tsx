import { useCallback, useState } from "react";
import { useContract } from "./useContract";

interface UserProfile {
  username: string;
  email: string;
  walletAddress: string;
}

export function useUserProfile() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    getUserByAddress,
    getUserByEmail,
    getUserByUsername,
    getAllEmails,
    getAllUsernames,
  } = useContract();

  const fetchUserByAddress = useCallback(
    async (address: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const profile = await getUserByAddress(address);
        setUserProfile(profile);
        return profile;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch user profile";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getUserByAddress]
  );
  const fetchUserByEmail = useCallback(
    async (email: string, address: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const profile = await getUserByEmail(email, address);
        return profile;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch user profile";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getUserByEmail]
  );
  const fetchUserByUsername = useCallback(
    async (username: string, address: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const profile = await getUserByUsername(username, address);
        return profile;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch user profile";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getUserByUsername]
  );
  const fetchAllUsername = useCallback(
    async (address: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const usernames = await getAllUsernames(address);
        return usernames;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch user profile";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getUserByUsername]
  );
  const fetchAllEmails = useCallback(
    async (address: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const emails = await getAllEmails(address);
        return emails;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch user profile";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getUserByUsername]
  );

  return {
    userProfile,
    isLoading,
    error,
    fetchUserByAddress,
    fetchUserByEmail,
    fetchUserByUsername,
    fetchAllUsername,
    fetchAllEmails,
  };
}
