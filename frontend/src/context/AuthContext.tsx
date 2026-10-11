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

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const me = await api.getMe();
      if (me?.wallet_address) {
        setWalletAddress(me.wallet_address);
        setIsAdmin(me.is_admin);

        // Load full profile + stats in parallel
        const [profile, userStats] = await Promise.allSettled([
          api.getProfile(),
          api.getMyStats(),
        ]);

        if (profile.status === "fulfilled") {
          setUser({
            id: profile.value.id,
            wallet_address: profile.value.wallet_address,
            username: profile.value.username ?? undefined,
            level: profile.value.level,
            total_points: profile.value.total_points,
            status: "active",
            is_admin: me.is_admin,
          });
        } else {
          setUser({
            id: me.id,
            wallet_address: me.wallet_address,
            level: 0,
            total_points: 0,
            status: "active",
            is_admin: me.is_admin,
          });
        }

        if (userStats.status === "fulfilled") {
          setStats(userStats.value);
        }
      }
    } catch {
      // No valid session — user needs to connect wallet
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
