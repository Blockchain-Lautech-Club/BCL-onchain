import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const WALLET_API_URL =
  process.env.NEXT_PUBLIC_WALLET_API_URL || "http://localhost:8001";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?message=missing_code`);
  }

  const cookieStore = await cookies();

  // ✅ FIX: Read provider from the short-lived cookie set by SocialLoginButton
  // BEFORE the OAuth redirect, rather than from the redirectTo query param.
  // Google, GitHub, and other providers strip unknown query params from the
  // redirect URI if it doesn't exactly match the registered URI, so the
  // ?provider= param was silently dropped and always fell back to "google".
  const provider =
    cookieStore.get("bcl_pending_provider")?.value ?? "google";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()             { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.error("[auth/callback] Supabase error:", error);
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(error?.message ?? "no_session")}`
    );
  }

  const supabaseToken = data.session.access_token;

  try {
    const res = await fetch(`${WALLET_API_URL}/wallet/social-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, supabase_token: supabaseToken }),
    });

    if (res.ok) {
      const walletData = await res.json();
      const response = NextResponse.redirect(`${origin}${next}`);

      // Clear the pending provider cookie now that we've consumed it
      response.cookies.set("bcl_pending_provider", "", {
        maxAge: 0,
        path: "/",
      });

      response.cookies.set("bcl_wallet_token_pending", walletData.token, {
        httpOnly: false,
        maxAge: 60,
        path: "/",
        sameSite: "lax",
      });
      return response;
    }

        const errText = await res.text();
    console.error("[auth/callback] wallet backend non-ok:", res.status, errText);
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(`wallet_api_${res.status}: ${errText.slice(0, 150)}`)}`
    );
  } catch (walletErr) {
    console.error("[auth/callback] wallet backend error:", walletErr);
    return NextResponse.redirect(`${origin}/auth/error?message=wallet_api_unreachable`);
  }
}