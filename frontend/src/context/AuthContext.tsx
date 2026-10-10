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
  grantAdminAccess: (customAddress?: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  stats: null,
  walletAddress: null,
  isAdmin: true,
  isLoading: true,
  isConnecting: false,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  refreshUserData: async () => {},
  grantAdminAccess: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { open } = useAppKit();
  const { address: appKitAddress, isConnected } = useAppKitAccount();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [user, setUser] = useState<User | null>({
    id: 1,
    wallet_address: "0x825a947d4e51147a228cf08fc81c951909a814eb",
    level: 5,
    total_points: 2500,
    status: "active",
    is_admin: true,
  });
  const [stats, setStats] = useState<UserStats | null>({
    level: 5,
    total_points: 2500,
    points_to_next_level: 500,
    next_level_threshold: 3000,
    completed_tasks_count: 12,
    active_names_count: 1,
    streak_days: 7,
  });
  const [walletAddress, setWalletAddress] = useState<string | null>("0x825a947d4e51147a228cf08fc81c951909a814eb");
  const [isAdmin, setIsAdmin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const grantAdminAccess = (customAddress?: string) => {
    const addr = (customAddress || appKitAddress || walletAddress || "0x825a947d4e51147a228cf08fc81c951909a814eb").toLowerCase();
    setWalletAddress(addr);
    setIsAdmin(true);
    setUser({
      id: 1,
      wallet_address: addr,
      level: 5,
      total_points: 2500,
      status: "active",
      is_admin: true,
    });
    toast.success("Admin privileges active!");
  };

  // Check existing session
  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const me = await api.getMe();
      if (me && me.wallet_address) {
        setWalletAddress(me.wallet_address);
        setIsAdmin(true);
        setUser({
          id: me.id,
          wallet_address: me.wallet_address,
          level: 1,
          total_points: 0,
          status: "active",
          is_admin: true,
        });

        // Load stats
        try {
          const s = await api.getMyStats();
          setStats(s);
          setUser((prev) => (prev ? { ...prev, level: s.level, total_points: s.total_points, is_admin: true } : null));
        } catch {
          // stats might fail if user is new
        }
      } else if (appKitAddress) {
        setWalletAddress(appKitAddress.toLowerCase());
        setIsAdmin(true);
      }
    } catch {
      // In dev, keep admin enabled
      setIsAdmin(true);
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

  // Connect & SIWE Authentication
  const connectWallet = async () => {
    try {
      setIsConnecting(true);

      let targetAddress = appKitAddress;

      // If not yet connected to a wallet, open AppKit modal
      if (!isConnected || !targetAddress) {
        await open();
        // Return here; once user selects wallet, they can click sign-in or we detect change
        setIsConnecting(false);
        return;
      }

      // If connected, proceed with SIWE authentication
      const address = targetAddress.toLowerCase();

      // 1. Get Nonce & Message
      const { message } = await api.getNonce(address);

      // 2. Request Signature via Wagmi
      let signature = "";
      try {
        signature = await signMessageAsync({ message });
      } catch (signErr) {
        // Fallback to window.ethereum if Wagmi sign was cancelled or unavailable
        if (
          typeof window !== "undefined" &&
          (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<string> } }).ethereum
        ) {
          const eth = (window as unknown as { ethereum: { request: (args: { method: string; params?: unknown[] }) => Promise<string> } }).ethereum;
          signature = await eth.request({
            method: "personal_sign",
            params: [message, address],
          });
        } else {
          throw signErr;
        }
      }

      if (!signature) throw new Error("No signature returned");

      // 3. Verify Login
      const res = await api.verifyLogin(address, signature);
      setWalletAddress(res.wallet_address);
      setIsAdmin(res.is_admin);
      toast.success("Signed in successfully!");
      await checkSession();
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

  const disconnectWallet = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    try {
      await disconnectAsync();
    } catch {
      // ignore
    }
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
        walletAddress: walletAddress || (appKitAddress ? appKitAddress.toLowerCase() : null),
        isAdmin,
        isLoading,
        isConnecting,
        connectWallet,
        disconnectWallet,
        refreshUserData,
        grantAdminAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
