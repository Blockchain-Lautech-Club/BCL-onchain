"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, User, UserStats } from "@/lib/api";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { useDisconnect, useSignMessage } from "wagmi";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  stats: UserStats | null;
  walletAddress: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  awardClaimedXp: (points: number, reason?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  stats: null,
  walletAddress: null,
  isAdmin: false,
  isLoading: true,
  isConnecting: false,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  refreshUserData: async () => {},
  awardClaimedXp: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { open } = useAppKit();
  const { address: appKitAddress, isConnected } = useAppKitAccount();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [user,          setUser]          = useState<User | null>(null);
  const [stats,         setStats]         = useState<UserStats | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAdmin,       setIsAdmin]       = useState(false);
  const [isLoading,     setIsLoading]     = useState(true);
  const [isConnecting,  setIsConnecting]  = useState(false);

  const checkSession = useCallback(async () => {
    setIsLoading(true);

    try {
      const me = await api.getMe().catch(() => null);
      const activeAddress = (me?.wallet_address || appKitAddress || (typeof window !== "undefined" ? localStorage.getItem("bcl_wallet_address") : null))?.toLowerCase();

      if (!activeAddress) {
        setUser(null);
        setStats(null);
        setWalletAddress(null);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("bcl_wallet_address", activeAddress);
      }

      // Fetch profile and stats in parallel; neither should block the other
      const [profileResult, statsResult] = await Promise.allSettled([
        api.getProfile(),
        api.getMyStats(),
      ]);

      const newUser: User =
        profileResult.status === "fulfilled"
          ? {
              id:             profileResult.value.id,
              wallet_address: profileResult.value.wallet_address || activeAddress,
              username:       profileResult.value.username ?? undefined,
              level:          profileResult.value.level,
              total_points:   profileResult.value.total_points,
              status:         "active",
              is_admin:       me?.is_admin || profileResult.value.is_admin || false,
            }
          : {
              id:             me?.id || 0,
              wallet_address: activeAddress,
              level:          0,
              total_points:   0,
              status:         "active",
              is_admin:       me?.is_admin || false,
            };

      const newStats: UserStats =
        statsResult.status === "fulfilled" && statsResult.value
          ? statsResult.value
          : {
              level: newUser.level || 0,
              total_points: newUser.total_points || 0,
              points_to_next_level: Math.max(0, 100 - (newUser.total_points || 0)),
              next_level_threshold: 100,
              completed_tasks_count: 0,
              active_names_count: 0,
              streak_days: 0,
            };

      // Set all state together before clearing isLoading
      setWalletAddress(activeAddress);
      setIsAdmin(Boolean(newUser.is_admin));
      setUser(newUser);
      setStats(newStats);
    } catch {
      setUser(null);
      setStats(null);
      setWalletAddress(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [appKitAddress]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const refreshUserData = async () => {
    await checkSession();
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);

      let targetAddress = appKitAddress;

      if (!isConnected || !targetAddress) {
        await open();
        setIsConnecting(false);
        return;
      }

      const address = targetAddress.toLowerCase();

      // 1. Get nonce + EIP-4361 message
      const { message } = await api.getNonce(address);

      // 2. Sign with wagmi (fallback to window.ethereum)
      let signature = "";
      try {
        signature = await signMessageAsync({ message });
      } catch (signErr) {
        const eth = (
          window as unknown as {
            ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<string> };
          }
        ).ethereum;
        if (eth) {
          signature = await eth.request({
            method: "personal_sign",
            params: [message, address],
          });
        } else {
          throw signErr;
        }
      }

      if (!signature) throw new Error("No signature returned");

      // 3. Verify → backend sets httpOnly cookie
      const res = await api.verifyLogin(address, signature);
      setWalletAddress(res.wallet_address);
      setIsAdmin(res.is_admin);
      toast.success("Signed in successfully!");

      // Re-fetch full profile + stats after login
      await checkSession();

      // If user profile is not yet completed in database (no username), redirect directly to /profile
      const prof = await api.getProfile().catch(() => null);
      if (!prof?.username) {
        toast("Welcome! Please choose a username to complete your profile.", { icon: "👤" });
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/profile")) {
          window.location.href = "/profile?create=true";
        }
      }
    } catch (err: unknown) {
      console.error("Wallet connection failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to connect wallet";
      if (!msg.includes("User rejected") && !msg.includes("rejected")) {
        toast.error(msg);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const awardClaimedXp = useCallback((points: number) => {
    setUser(prev => {
      if (!prev) return null;
      const currentPts = (prev.total_points ?? 0) + points;
      return {
        ...prev,
        total_points: currentPts,
        level: currentPts >= 100 ? 1 : 0,
      };
    });

    setStats(prev => {
      if (!prev) return null;
      const currentPts = (prev.total_points ?? 0) + points;
      const nextThreshold = prev.next_level_threshold || 100;
      const pointsToNext = Math.max(0, nextThreshold - currentPts);
      return {
        ...prev,
        level: prev.level || (currentPts >= 100 ? 1 : 0),
        total_points: currentPts,
        points_to_next_level: pointsToNext,
        next_level_threshold: nextThreshold,
      };
    });
  }, []);

  const disconnectWallet = async () => {
    try { await api.logout(); } catch { /* ignore */ }
    try { await disconnectAsync(); } catch { /* ignore */ }
    setUser(null);
    setStats(null);
    setWalletAddress(null);
    setIsAdmin(false);
    toast.success("Signed out successfully");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        stats,
        // Expose appKitAddress as fallback only when walletAddress not yet set
        walletAddress: walletAddress || (appKitAddress ? appKitAddress.toLowerCase() : null),
        isAdmin,
        isLoading,
        isConnecting,
        connectWallet,
        disconnectWallet,
        refreshUserData,
        awardClaimedXp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);