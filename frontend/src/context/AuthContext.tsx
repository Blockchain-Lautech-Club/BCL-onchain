"use client";

/**
 * AuthContext — custom embedded wallet backend edition.
 *
 * Login flow A — External wallet (MetaMask / injected):
 *   1. wagmi `connect({ connector: injected() })`  ← connects wagmi for contract writes
 *   2. walletApi.externalLogin(address)              ← registers with wallet backend
 *   3. api.getNonce(address) + personal_sign         ← SIWE with BCL backend
 *   4. api.verifyLogin()                             ← creates BCL session cookie
 *
 * Login flow B — Social / embedded wallet:
 *   Caller calls walletApi.socialLogin() externally, then calls
 *   loginWithWalletToken(walletResponse) here to complete the BCL session.
 *
 * The wallet backend token (walletToken) is persisted in localStorage so
 * callers can use it for PIN verification, key export, etc.
 */

import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from "react";
import { useConnect, useDisconnect, useAccount } from "wagmi";
import { injected } from "wagmi";
import toast from "react-hot-toast";
import { api, User, UserStats, ProfileData, DomainRecord } from "@/lib/api";
import { getOnchainUserDomains } from "@/lib/contracts";
import {
  walletApi,
  WalletResponse,
  getStoredWalletToken,
  setStoredWalletToken,
  clearStoredWalletToken,
} from "@/lib/walletApi";

// ── Context shape ─────────────────────────────────────────────────────────────

interface AuthContextType {
  user:            User | null;
  stats:           UserStats | null;
  walletAddress:   string | null;
  /** Bearer token for the custom wallet backend (PIN, key export, etc.) */
  walletToken:     string | null;
  isAdmin:         boolean;
  isLoading:       boolean;
  isConnecting:    boolean;
  /** Connect an injected (external) wallet via MetaMask */
  connectWallet:   () => Promise<void>;
  disconnectWallet:() => Promise<void>;
  refreshUserData: () => Promise<void>;
  awardClaimedXp:  (points: number, label?: string) => void;
  /**
   * Call this after a successful walletApi.socialLogin() to complete the
   * BCL session.  The WalletResponse token is stored and the BCL backend is
   * notified via POST /auth/wallet-token.
   */
  loginWithWalletToken: (wr: WalletResponse) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, stats: null, walletAddress: null, walletToken: null,
  isAdmin: false, isLoading: true, isConnecting: false,
  connectWallet:        async () => {},
  disconnectWallet:     async () => {},
  refreshUserData:      async () => {},
  awardClaimedXp:       () => {},
  loginWithWalletToken: async () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // wagmi — used to connect MetaMask so useWriteContract etc. work in other pages
  const { connectAsync }    = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { address: wagmiAddress, isConnected } = useAccount();

  const [user,          setUser]          = useState<User | null>(null);
  const [stats,         setStats]         = useState<UserStats | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletToken,   setWalletToken]   = useState<string | null>(null);
  const [isAdmin,       setIsAdmin]       = useState(false);
  const [isLoading,     setIsLoading]     = useState(true);
  const [isConnecting,  setIsConnecting]  = useState(false);

  // ── Restore session on mount ──────────────────────────────────────────────

  const checkSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const me         = await api.getMe().catch(() => null);
      const storedAddr = typeof window !== "undefined"
        ? localStorage.getItem("bcl_wallet_address")
        : null;
      const activeAddress = (
        me?.wallet_address || wagmiAddress || storedAddr
      )?.toLowerCase();

      if (!activeAddress) {
        setUser(null); setStats(null);
        setWalletAddress(null); setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      localStorage.setItem("bcl_wallet_address", activeAddress);

      let prof: ProfileData | null = null;
      let userStats: UserStats | null = null;
      let domains: DomainRecord[] = [];

      try { prof = await api.getProfile(); }
      catch { prof = await api.getUserProfile(activeAddress).catch(() => null); }

      try { userStats = await api.getMyStats(); }
      catch { userStats = await api.getUserStats(activeAddress).catch(() => null); }

      try { domains = await api.getMyNames(); }
      catch { domains = await api.getUserDomains(activeAddress).catch(() => []); }

      if (!domains || domains.length === 0) {
        domains = await getOnchainUserDomains(activeAddress).catch(() => []);
      }

      const activeDomain = domains.find(d => d.status === "active")?.normalized_name;

      const envAdminWallets = (
        process.env.NEXT_PUBLIC_ADMIN_WALLETS || "0x825aab493a07fe7dbe29c4de1431deba84bf14eb"
      ).toLowerCase().split(",").map(w => w.trim());

      const isUserAdmin = Boolean(
        me?.is_admin || prof?.is_admin || envAdminWallets.includes(activeAddress)
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
            level:          0, total_points: 0, status: "active",
            is_admin:       isUserAdmin, bcl_domain: activeDomain,
          };

      const newStats: UserStats = userStats ?? {
        level: newUser.level || 0,
        total_points: newUser.total_points || 0,
        points_to_next_level: Math.max(0, 100 - (newUser.total_points || 0)),
        next_level_threshold: 100,
        completed_tasks_count: 0, active_names_count: 0, streak_days: 0,
      };

      setWalletAddress(activeAddress);
      setIsAdmin(isUserAdmin);
      setUser(newUser);
      setStats(newStats);

      const stored = getStoredWalletToken();
      if (stored) setWalletToken(stored);
    } catch {
      setUser(null); setStats(null);
      setWalletAddress(null); setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, [wagmiAddress]);

  useEffect(() => { checkSession(); }, [checkSession]);

  // ── Social login completion — wallet token pending cookie ─────────────────
  //
  // ✅ FIX: This used to live inside ConnectModal, gated behind `open`.
  // If the user returns from the OAuth redirect and the modal is no longer
  // open (e.g. page re-mounted, state reset), the cookie was never consumed
  // and the user silently ended up not logged in.
  //
  // Moving it here means it runs unconditionally on every mount, catches the
  // cookie however the user lands back on the page.

  const loginWithWalletToken = useCallback(async (wr: WalletResponse) => {
    setStoredWalletToken(wr.token);
    setWalletToken(wr.token);
    const res = await api.loginWithWalletToken(wr.token);
    setWalletAddress(res.wallet_address);
    setIsAdmin(res.is_admin);
    toast.success("Signed in successfully!");
    await checkSession();
  }, [checkSession]);

  useEffect(() => {
    const pending = document.cookie
      .split("; ")
      .find(row => row.startsWith("bcl_wallet_token_pending="))
      ?.split("=")[1];

    if (!pending) return;

    // Clear the cookie immediately so a page refresh doesn't re-trigger
    document.cookie = "bcl_wallet_token_pending=; Max-Age=0; path=/";

    loginWithWalletToken({ token: pending } as WalletResponse).catch(err => {
      console.error("[AuthProvider] failed to consume bcl_wallet_token_pending:", err);
      toast.error("Sign-in failed. Please try again.");
    });
  // loginWithWalletToken is stable (useCallback with checkSession dep),
  // but we only want this to run once on mount — empty dep array is intentional.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── SIWE with BCL backend ────────────────────────────────────────────────

  const signInWithSiwe = useCallback(async (address: string) => {
    const normalizedAddress = address.toLowerCase();
    const { message } = await api.getNonce(normalizedAddress);

    // wagmi's useSignMessage is hook-only; fall back to window.ethereum directly
    const eth = (window as unknown as {
      ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<string> };
    }).ethereum;
    if (!eth) throw new Error("No injected wallet found");

    const signature = await eth.request({
      method: "personal_sign",
      params: [message, normalizedAddress],
    });
    if (!signature) throw new Error("No signature returned");

    const res = await api.verifyLogin(normalizedAddress, signature);
    setWalletAddress(res.wallet_address);
    setIsAdmin(res.is_admin);
    toast.success("Signed in successfully!");
    await checkSession();
  }, [checkSession]);

  // ── External wallet connect (MetaMask / injected) ────────────────────────

  const connectWallet = useCallback(async () => {
    try {
      setIsConnecting(true);

      let address: string;

      if (isConnected && wagmiAddress) {
        address = wagmiAddress.toLowerCase();
      } else {
        // Connect wagmi (needed for useWriteContract in other pages)
        const result = await connectAsync({ connector: injected() });
        address = result.accounts[0]?.toLowerCase() ?? "";
        if (!address) throw new Error("No account returned");
      }

      // Register with custom wallet backend
      try {
        const wr = await walletApi.externalLogin(address);
        setStoredWalletToken(wr.token);
        setWalletToken(wr.token);
      } catch {
        // Non-fatal — proceed with SIWE even if wallet backend is unreachable
      }

      // Authenticate with BCL backend via SIWE
      await signInWithSiwe(address);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect wallet";
      if (!msg.includes("User rejected") && !msg.includes("rejected")) {
        toast.error(msg);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected, wagmiAddress, connectAsync, signInWithSiwe]);

  // ── Disconnect ────────────────────────────────────────────────────────────

  const disconnectWallet = useCallback(async () => {
    try { await api.logout(); } catch {}
    try { await disconnectAsync(); } catch {}
    clearStoredWalletToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("bcl_wallet_address");
    }
    setUser(null); setStats(null);
    setWalletAddress(null); setIsAdmin(false); setWalletToken(null);
    toast.success("Signed out successfully");
  }, [disconnectAsync]);

  // ── Optimistic XP update ─────────────────────────────────────────────────

  const awardClaimedXp = useCallback((points: number, label?: string) => {    setUser(prev => {
      if (!prev) return null;
      const pts = (prev.total_points ?? 0) + points;
      return { ...prev, total_points: pts, level: pts >= 100 ? 1 : 0 };
    });
    setStats(prev => {
      if (!prev) return null;
      const pts = (prev.total_points ?? 0) + points;
      const threshold = prev.next_level_threshold || 100;
      return {
        ...prev,
        level: pts >= threshold ? (prev.level || 0) + 1 : prev.level,
        total_points: pts,
        points_to_next_level: Math.max(0, threshold - pts),
        next_level_threshold: threshold,
      };
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user, stats, walletAddress, walletToken,
      isAdmin, isLoading, isConnecting,
      connectWallet, disconnectWallet,
      refreshUserData: checkSession,
      awardClaimedXp, loginWithWalletToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);