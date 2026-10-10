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

const getAdminList = (): string[] => {
  const envList = process.env.NEXT_PUBLIC_ADMIN_WALLETS || "";
  return envList
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
};

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
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Sync wallet address with connected AppKit wallet
  useEffect(() => {
    if (appKitAddress) {
      const addr = appKitAddress.toLowerCase();
      const adminList = getAdminList();
      const isAuthorizedAdmin = adminList.includes(addr);

      setWalletAddress(addr);
      setIsAdmin(isAuthorizedAdmin);
      setUser((prev) => ({
        id: prev?.id || 1,
        wallet_address: addr,
        level: prev?.level || 1,
        total_points: prev?.total_points || 0,
        status: "active",
        is_admin: isAuthorizedAdmin,
      }));
    } else {
      setWalletAddress(null);
      setUser(null);
      setStats(null);
      setIsAdmin(false);
    }
  }, [appKitAddress]);

  // Check existing session
  const checkSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const adminList = getAdminList();
      const me = await api.getMe();
      if (me && me.wallet_address) {
        const addr = me.wallet_address.toLowerCase();
        const isAuthorizedAdmin = Boolean(me.is_admin || adminList.includes(addr));
        setWalletAddress(me.wallet_address);
        setIsAdmin(isAuthorizedAdmin);
        setUser({
          id: me.id,
          wallet_address: me.wallet_address,
          level: 1,
          total_points: 0,
          status: "active",
          is_admin: isAuthorizedAdmin,
        });

        // Load stats
        try {
          const s = await api.getMyStats();
          setStats(s);
          setUser((prev) => (prev ? { ...prev, level: s.level, total_points: s.total_points, is_admin: isAuthorizedAdmin } : null));
        } catch {
          // stats might fail if user is new
        }
      } else if (appKitAddress) {
        const addr = appKitAddress.toLowerCase();
        const isAuthorizedAdmin = adminList.includes(addr);
        setWalletAddress(addr);
        setIsAdmin(isAuthorizedAdmin);
      } else {
        setIsAdmin(false);
      }
    } catch {
      if (appKitAddress) {
        const adminList = getAdminList();
        setIsAdmin(adminList.includes(appKitAddress.toLowerCase()));
      } else {
        setIsAdmin(false);
      }
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
