"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import type { Provider } from "@supabase/supabase-js";
import { walletApi, SocialProvider } from "@/lib/walletApi";
import { useAuth } from "@/context/AuthContext";

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL      || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// ✅ Single stable client — PKCE verifier cookie is written once and stays consistent
const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface SocialLoginButtonProps {
  provider:        SocialProvider;
  label?:          string;
  className?:      string;
  credential?:     string;
  supabase_token?: string;
  onSuccess?:      () => void;
  iconOverride?:   React.ReactNode;
}

const SUPABASE_PROVIDER_MAP: Partial<Record<SocialProvider, Provider>> = {
  google:    "google",
  github:    "github",
  discord:   "discord",
  twitter:   "twitter",
  facebook:  "facebook",
  apple:     "apple",
  azure:     "azure",
  bitbucket: "bitbucket",
  gitlab:    "gitlab",
  figma:     "figma",
  kakao:     "kakao",
  keycloak:  "keycloak",
  linkedin:  "linkedin",
  notion:    "notion",
  slack:     "slack",
  spotify:   "spotify",
  twitch:    "twitch",
  workos:    "workos",
  zoom:      "zoom",
};

export function SocialLoginButton({
  provider,
  label,
  className = "",
  credential,
  supabase_token,
  onSuccess,
  iconOverride,
}: SocialLoginButtonProps) {
  const { loginWithWalletToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      let wr;

      if (provider === "telegram" || provider === "farcaster") {
        if (!credential) throw new Error(`credential is required for ${provider} login`);
        wr = await walletApi.socialLogin(provider, { credential });

      } else if (provider in SUPABASE_PROVIDER_MAP) {
        let token = supabase_token;

        if (!token) {
          if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            throw new Error("Supabase env vars not configured");
          }

          const supabaseProvider = SUPABASE_PROVIDER_MAP[provider]!;

          // ✅ FIX: Store provider in a short-lived cookie BEFORE the OAuth redirect.
          // The `provider` query param appended to redirectTo gets stripped by Google,
          // GitHub, and other OAuth providers if it isn't part of the registered redirect URI.
          // Reading it from a cookie in /auth/callback/route.ts is reliable.
          document.cookie = `bcl_pending_provider=${provider}; max-age=300; path=/; samesite=lax`;

          const { error: oauthError } = await supabase.auth.signInWithOAuth({
            provider: supabaseProvider,
            options: {
              // ✅ FIX: `provider` removed from redirectTo query string — it won't survive
              // the OAuth round-trip. The cookie above is the reliable carrier instead.
              redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`,
            },
          });

          if (oauthError) throw oauthError;
          return; // browser redirects — execution stops here
        }

        wr = await walletApi.socialLogin(provider, { supabase_token: token });

      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      await loginWithWalletToken(wr);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      console.error(`[SocialLoginButton] ${provider}:`, err);
      if (!msg.includes("User rejected")) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5
          bg-white/5 border border-white/10
          text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed
          ${className}`}
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          : iconOverride
            ? <span className="shrink-0">{iconOverride}</span>
            : null
        }
        {label ?? `Continue with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`}
      </button>
      {error && (
        <p className="text-[10px] text-red-400 text-center px-1 leading-tight">{error}</p>
      )}
    </div>
  );
}