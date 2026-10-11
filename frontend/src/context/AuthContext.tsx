"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, User, UserStats, ProfileData, DomainRecord } from "@/lib/api";
import { getOnchainUserDomains } from "@/lib/contracts";
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
  const pendingSiweRef = React.useRef(false);

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

      // Try authenticated profile/stats first, then fall back to public database record
      let prof: ProfileData | null = null;
      let userStats: UserStats | null = null;
      let domains: DomainRecord[] = [];

      try {
        prof = await api.getProfile();
      } catch {
        prof = await api.getUserProfile(activeAddress).catch(() => null);
      }

      try {
        userStats = await api.getMyStats();
      } catch {
        userStats = await api.getUserStats(activeAddress).catch(() => null);
      }

      try {
        domains = await api.getMyNames();
      } catch {
        domains = await api.getUserDomains(activeAddress).catch(() => []);
      }

      if (!domains || domains.length === 0) {
        domains = await getOnchainUserDomains(activeAddress).catch(() => []);
      }

      const activeDomain = domains.find(d => d.status === "active")?.normalized_name;

      const envAdminWallets = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || "0x825aab493a07fe7dbe29c4de1431deba84bf14eb")
        .toLowerCase()
        .split(",")
        .map(w => w.trim());
      const isUserAdmin = Boolean(
        me?.is_admin ||
        prof?.is_admin ||
        envAdminWallets.includes(activeAddress)
      );

      const newUser: User = prof
        ? {
            id:             prof.id,
            wallet_address: prof.wallet_address || activeAddress,
            username:       activeDomain || prof.username || `${activeAddress.slice(0, 6)}…${activeAddress.slice(-4)}`,
            avatar_url:     prof.avatar_url || prof.avatar_emoji || "🧑‍💻",
            level:          prof.level,
            total_points:   prof.total_points,
            status:         "active",
            is_admin:       isUserAdmin,
            bcl_domain:     activeDomain || (prof as unknown as { bcl_domain?: string })?.bcl_domain,
          }
        : {
            id:             me?.id || 0,
            wallet_address: activeAddress,
            username:       activeDomain || `${activeAddress.slice(0, 6)}…${activeAddress.slice(-4)}`,
            level:          0,
            total_points:   0,
            status:         "active",
            is_admin:       isUserAdmin,
            bcl_domain:     activeDomain,
          };

      const newStats: UserStats = userStats
        ? userStats
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
      setIsAdmin(isUserAdmin);
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

  const signInWithSiwe = useCallback(async (address: string) => {
    try {
      setIsConnecting(true);
      const normalizedAddress = address.toLowerCase();

      // 1. Get nonce + EIP-4361 message
      const { message } = await api.getNonce(normalizedAddress);

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
            params: [message, normalizedAddress],
          });
        } else {
          throw signErr;
        }
      }

      if (!signature) throw new Error("No signature returned");

      // 3. Verify -> backend sets token
      const res = await api.verifyLogin(normalizedAddress, signature);
      setWalletAddress(res.wallet_address);
      setIsAdmin(res.is_admin);
      toast.success("Signed in successfully!");

      // Re-fetch full profile + stats after login
      await checkSession();
    } catch (err: unknown) {
      console.error("SIWE signature failed:", err);
      const msg = err instanceof Error ? err.message : "Failed to sign in";
      if (!msg.includes("User rejected") && !msg.includes("rejected")) {
        toast.error(msg);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [checkSession, signMessageAsync]);

  useEffect(() => {
    if (isConnected && appKitAddress && pendingSiweRef.current) {
      pendingSiweRef.current = false;
      signInWithSiwe(appKitAddress.toLowerCase());
    }
  }, [isConnected, appKitAddress, signInWithSiwe]);

  const connectWallet = async () => {
    try {
      setIsConnecting(true);

      const targetAddress = appKitAddress;

      if (!isConnected || !targetAddress) {
        pendingSiweRef.current = true;
        await open();
        setIsConnecting(false);
        return;
      }

      await signInWithSiwe(targetAddress.toLowerCase());
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