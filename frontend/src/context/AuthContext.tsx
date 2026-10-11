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
      const me = await api.getMe();

      if (!me?.wallet_address) {
        // No active session — clear everything and stop loading
        setUser(null);
        setStats(null);
        setWalletAddress(null);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // We have a session — fetch profile + stats in parallel
      const [profileResult, statsResult] = await Promise.allSettled([
        api.getProfile(),
        api.getMyStats(),
      ]);

      const newUser: User =
        profileResult.status === "fulfilled"
          ? {
              id:             profileResult.value.id,
              wallet_address: profileResult.value.wallet_address,
              username:       profileResult.value.username ?? undefined,
              level:          profileResult.value.level,
              total_points:   profileResult.value.total_points,
              status:         "active",
              is_admin:       me.is_admin,
            }
          : {
              id:             me.id,
              wallet_address: me.wallet_address,
              level:          0,
              total_points:   0,
              status:         "active",
              is_admin:       me.is_admin,
            };

      const newStats =
        statsResult.status === "fulfilled" ? statsResult.value : null;

      // Set all state together before clearing isLoading
      // so components never see walletAddress without user
      setWalletAddress(me.wallet_address);
      setIsAdmin(me.is_admin);
      setUser(newUser);
      setStats(newStats);
    } catch {
      // Session check failed (401, network error, etc.) — not logged in
      setUser(null);
      setStats(null);
      setWalletAddress(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);