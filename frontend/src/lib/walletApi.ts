/**
 * Typed client for the custom embedded wallet backend (main.py).
 * Set NEXT_PUBLIC_WALLET_API_URL to point at your deployed instance.
 */

const WALLET_API_URL = process.env.NEXT_PUBLIC_WALLET_API_URL || "http://localhost:8001";

// ── Storage helpers ──────────────────────────────────────────────────────────

const WALLET_TOKEN_KEY = "bcl_wallet_token";

export function getStoredWalletToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(WALLET_TOKEN_KEY); }
  catch { return null; }
}

export function setStoredWalletToken(token: string) {
  try { localStorage.setItem(WALLET_TOKEN_KEY, token); } catch {}
}

export function clearStoredWalletToken() {
  try { localStorage.removeItem(WALLET_TOKEN_KEY); } catch {}
}

// ── Low-level fetch ──────────────────────────────────────────────────────────

async function walletFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${WALLET_API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { detail?: string }).detail || res.statusText;
    throw new Error(msg);
  }
  return data as T;
}

// ── Types ────────────────────────────────────────────────────────────────────

export type SocialProvider =
  | "google" | "github" | "discord" | "twitter" | "facebook"
  | "apple" | "azure" | "bitbucket" | "gitlab" | "figma"
  | "kakao" | "keycloak" | "linkedin" | "notion" | "slack"
  | "spotify" | "twitch" | "workos" | "zoom"
  | "passkey" | "telegram" | "farcaster" | "phone";

export interface WalletResponse {
  address: string;
  token: string;
  linked_socials: string[];
  evm_address?: string;
  solana_address?: string;
  stellar_address?: string;
  legacy_found?: boolean;
  legacy_privy_id?: string;
  legacy_evm_address?: string;
  legacy_sol_address?: string;
  needs_seed_import?: boolean;
  has_pin?: boolean;
}

export interface WalletMe {
  address: string;
  wallet_type: string;
  linked_socials: string[];
  created_at: string;
  has_pin: boolean;
  has_security_questions: boolean;
}

export interface AllAddresses {
  evm: string;
  solana: string | null;
  stellar: string | null;
  wallet_type: string;
  has_mnemonic: boolean;
}

export interface SigningGrantResponse {
  success: boolean;
  signing_grant: string;
  expires_in: number;
}

export interface ExportKeyResponse {
  chain: string;
  chain_id: number;
  address: string;
  private_key: string | number[];
  private_key_hex?: string;
  derivation_path: string;
  warning: string;
}

// ── API methods ──────────────────────────────────────────────────────────────

export const walletApi = {
  /** Register/login an external wallet (MetaMask, etc.) by address only. */
  externalLogin(address: string): Promise<WalletResponse> {
    return walletFetch("/wallet/external-login", {
      method: "POST",
      body: JSON.stringify({ address }),
    });
  },

  /**
   * Social login via a Supabase access_token (OAuth + passkey providers)
   * or via a raw credential (telegram / farcaster).
   */
  socialLogin(
    provider: SocialProvider,
    opts: { supabase_token?: string; credential?: string },
  ): Promise<WalletResponse> {
    return walletFetch("/wallet/social-login", {
      method: "POST",
      body: JSON.stringify({ provider, ...opts }),
    });
  },

  /** Get the authenticated wallet's profile. */
  getMe(token: string): Promise<WalletMe> {
    return walletFetch("/wallet/me", {}, token);
  },

  /** All derived addresses (EVM, Solana, Stellar). */
  getAllAddresses(token: string): Promise<AllAddresses> {
    return walletFetch("/wallet/all-addresses", {}, token);
  },

  /** Verify PIN → receive short-lived signing grant. */
  verifyPin(token: string, pin: string): Promise<SigningGrantResponse> {
    return walletFetch("/wallet/verify-pin", {
      method: "POST",
      body: JSON.stringify({ pin }),
    }, token);
  },

  /** Set or change PIN. */
  setPin(token: string, pin: string, current_pin?: string, reset_grant?: string) {
    return walletFetch("/wallet/set-pin", {
      method: "POST",
      body: JSON.stringify({ pin, current_pin, reset_grant }),
    }, token);
  },

  /** Export private key for a given chain_id after supplying a signing grant. */
  exportPrivateKey(token: string, chain_id: number, signing_grant: string): Promise<ExportKeyResponse> {
    return walletFetch("/wallet/export-privatekey", {
      method: "POST",
      body: JSON.stringify({ chain_id, signing_grant }),
    }, token);
  },

  /** Link an additional social provider to an existing wallet. */
  linkSocial(
    token: string,
    provider: SocialProvider,
    opts: { supabase_token?: string; credential?: string },
  ) {
    return walletFetch("/wallet/link-social", {
      method: "POST",
      body: JSON.stringify({ provider, ...opts }),
    }, token);
  },

  /** Unlink a social provider. */
  unlinkSocial(token: string, provider: SocialProvider) {
    return walletFetch("/wallet/unlink-social", {
      method: "DELETE",
      body: JSON.stringify({ provider }),
    }, token);
  },

  /** Security questions */
  getSecurityQuestions(token: string) {
    return walletFetch<{ has_security_questions: boolean; questions: string[] }>(
      "/wallet/security-questions", {}, token
    );
  },
};
