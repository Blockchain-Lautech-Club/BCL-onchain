"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api, DomainRecord } from "@/lib/api";
import { checkOnchainNameAvailability, getOnchainBclBalance, getOnchainUserDomains, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { useAuth } from "@/context/AuthContext";
import { useWriteContract, useAccount, useSwitchChain } from "wagmi";
import { parseAbi, maxUint256 } from "viem";
import toast from "react-hot-toast";
import {
  Globe,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Zap,
  RefreshCw,
  FileText,
  Send,
  X,
  ExternalLink,
  User as UserIcon,
} from "lucide-react";

function DomainsContent() {
  const searchParams = useSearchParams();
  const initialName = searchParams.get("name") || "";

  const { walletAddress, connectWallet, user, refreshUserData } = useAuth();
  const [searchQuery, setSearchQuery] = useState(initialName);
  const [years, setYears] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    name: string;
    available: boolean;
    price_per_year_bcl_wei: string;
  } | null>(null);

  // User BCL Balance state
  const [bclBalance, setBclBalance] = useState<{
    balance_wei: string;
    allowance_wei: string;
    name_nft_address: string;
  } | null>(null);

  // User domains
  const [myDomains, setMyDomains] = useState<DomainRecord[]>([]);
  const [loadingMyDomains, setLoadingMyDomains] = useState(false);

  // Registration flow state
  const { writeContractAsync } = useWriteContract();
  const { address: wagmiAddress, isConnected: isWagmiConnected, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [isApproving, setIsApproving] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regResult, setRegResult] = useState<{ success: boolean; message: string; txHash?: string } | null>(null);

  // Interactive Management Modals: Renew, Resolver, Transfer
  const [renewDomain, setRenewDomain] = useState<DomainRecord | null>(null);
  const [renewYears, setRenewYears] = useState(1);
  const [isRenewing, setIsRenewing] = useState(false);

  const [resolverDomain, setResolverDomain] = useState<DomainRecord | null>(null);
  const [resolverText, setResolverText] = useState("");
  const [isSavingResolver, setIsSavingResolver] = useState(false);

  const [transferDomain, setTransferDomain] = useState<DomainRecord | null>(null);
  const [transferRecipient, setTransferRecipient] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (initialName) {
      handleSearch(initialName);
    }
  }, [initialName]);

  useEffect(() => {
    if (walletAddress) {
      loadWalletData(walletAddress);
    }
  }, [walletAddress]);

  async function loadWalletData(address: string) {
    try {
      setLoadingMyDomains(true);
      let bal = await api.getBclBalance(address).catch(() => null);
      if (!bal) {
        bal = await getOnchainBclBalance(address).catch(() => null);
      }
      if (bal) setBclBalance(bal);

      let names = await api.getMyNames().catch(() => []);
      if (!names || names.length === 0) {
        names = await getOnchainUserDomains(address).catch(() => []);
      }
      setMyDomains(names || []);
    } catch {
      // ignore
    } finally {
      setLoadingMyDomains(false);
    }
  }

  async function handleSearch(queryToSearch?: string) {
    const raw = queryToSearch || searchQuery;
    const clean = raw.trim().toLowerCase().replace(".bcl", "");
    if (!clean || clean.length < 3) return;

    try {
      setIsSearching(true);
      setSearchResult(null);
      setRegResult(null);

      let res;
      try {
        res = await checkOnchainNameAvailability(clean);
      } catch {
        res = await api.checkNameAvailability(clean);
      }
      setSearchResult(res);
    } catch (err: unknown) {
      console.error("Domain availability check failed:", err);
      toast.error("Unable to query domain registrar");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleApprove() {
    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      await connectWallet();
      return;
    }

    try {
      setIsApproving(true);
      toast("Please confirm BCL token approval in your wallet...", { icon: "✍️" });

      let approved = false;

      // 1. Try Wagmi writeContractAsync if Wagmi is connected
      if (isWagmiConnected && writeContractAsync) {
        try {
          if (chainId !== 968 && switchChainAsync) {
            await switchChainAsync({ chainId: 968 }).catch(() => {});
          }
          await writeContractAsync({
            address: CONTRACT_ADDRESSES.BCL_TOKEN,
            abi: parseAbi([
              "function approve(address spender, uint256 amount) external returns (bool)",
            ]),
            functionName: "approve",
            args: [CONTRACT_ADDRESSES.NAME_NFT, maxUint256],
            chainId: 968,
          });
          approved = true;
        } catch (wagmiErr) {
          console.warn("Wagmi approve failed, trying direct provider fallback:", wagmiErr);
        }
      }

      // 2. Direct Provider fallback (resolves extension session & eliminates "Wallet is not initialized" -32000)
      if (!approved) {
        let provider: any = (typeof window !== "undefined" && (window as any).ethereum) || null;
        if (provider?.providers?.length) {
          provider = provider.providers.find((p: any) => p.isMetaMask) || provider.providers[0];
        }

        if (!provider) {
          await connectWallet();
          throw new Error("Please connect your wallet to approve BCL tokens.");
        }

        // CRITICAL: Request accounts to initialize extension session and prevent -32000 "Wallet is not initialized"
        const accounts: string[] = await provider.request({ method: "eth_requestAccounts" });
        const activeSender = accounts?.[0] || walletAddress;

        // Ensure wallet is switched to Botchain Testnet (Chain ID 968 / 0x3c8)
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x3c8" }],
          });
        } catch (switchErr: any) {
          if (switchErr?.code === 4902 || String(switchErr?.message || switchErr).includes("4902")) {
            await provider.request({
              method: "wallet_addEthereumChain",
              params: [{
                chainId: "0x3c8",
                chainName: "Botchain Testnet",
                rpcUrls: ["https://rpc.bohr.life"],
                nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
                blockExplorerUrls: ["https://scan.bohr.life"],
              }],
            });
          }
        }

        const spenderPadded = CONTRACT_ADDRESSES.NAME_NFT.toLowerCase().replace("0x", "").padStart(64, "0");
        const amountPadded = "f".repeat(64);
        const data = `0x095ea7b3${spenderPadded}${amountPadded}`;

        await provider.request({
          method: "eth_sendTransaction",
          params: [{
            from: activeSender,
            to: CONTRACT_ADDRESSES.BCL_TOKEN,
            data,
          }],
        });
        approved = true;
      }

      toast.success("BCL token approval confirmed! Updating allowance...");

      // Poll allowance for a few seconds so the UI automatically updates to Step 2
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        if (walletAddress) {
          const fresh = await getOnchainBclBalance(walletAddress).catch(() => null);
          if (fresh && BigInt(fresh.allowance_wei) > BigInt(0)) {
            setBclBalance(fresh);
            clearInterval(pollInterval);
            toast.success("Ready to claim! Click Confirm & Claim below.");
            return;
          }
        }
        if (attempts >= 6) {
          clearInterval(pollInterval);
          if (walletAddress) loadWalletData(walletAddress);
        }
      }, 2500);

    } catch (err: unknown) {
      console.error("Approval error:", err);
      const rawMsg = (err as { message?: string })?.message || (err instanceof Error ? err.message : String(err));
      if (!rawMsg.includes("User rejected") && !rawMsg.includes("rejected")) {
        toast.error(rawMsg.length > 80 ? rawMsg.slice(0, 80) + "…" : rawMsg);
      }
    } finally {
      setIsApproving(false);
    }
  }

  async function handleRegister() {
    if (!searchResult || !searchResult.available) return;
    const clean = searchResult.name.replace(".bcl", "");

    if (!walletAddress) {
      toast.error("Please connect your wallet first");
      await connectWallet();
      return;
    }

    try {
      setIsRegistering(true);
      setRegResult(null);

      let txHash = "";

      // 1. Send registration transaction onchain via user's connected wallet
      try {
        toast("Please confirm registration in your wallet...", { icon: "✍️" });
        if (isWagmiConnected && writeContractAsync) {
          if (chainId !== 968 && switchChainAsync) {
            await switchChainAsync({ chainId: 968 }).catch(() => {});
          }
          const hash = await writeContractAsync({
            address: CONTRACT_ADDRESSES.NAME_NFT,
            abi: parseAbi([
              "function register(string calldata label, uint256 numYears) external",
            ]),
            functionName: "register",
            args: [clean, BigInt(years)],
            chainId: 968,
          });
          txHash = hash;
        } else {
          let provider: any = (typeof window !== "undefined" && (window as any).ethereum) || null;
          if (provider?.providers?.length) {
            provider = provider.providers.find((p: any) => p.isMetaMask) || provider.providers[0];
          }
          if (provider) {
            await provider.request({ method: "eth_requestAccounts" });
            try {
              await provider.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0x3c8" }],
              });
            } catch {}
          }
        }
      } catch (onchainErr: unknown) {
        console.warn("Direct wallet registration call fallback to relayer:", onchainErr);
      }

      // 2. Call backend registrar endpoint to save active domain record & sync
      const res = await api.registerName(clean, years).catch((backendErr) => {
        console.warn("Backend API register response:", backendErr);
        if (txHash) {
          return { status: "confirmed", tx_hash: txHash, transaction_hash: txHash, message: `Successfully registered ${searchResult.name} onchain!` };
        }
        throw backendErr;
      });

      const finalTxHash = txHash || res?.tx_hash || res?.transaction_hash;
      setRegResult({
        success: true,
        message: res?.message || `Successfully registered ${searchResult.name}!`,
        txHash: finalTxHash,
      });
      toast.success(`${searchResult.name} registered successfully!`);

      if (walletAddress) {
        await loadWalletData(walletAddress);
        await refreshUserData();
        await handleSearch(clean);
      }
    } catch (err: unknown) {
      console.error("Registration error:", err);
      const rawMsg = (err as { message?: string })?.message || (err instanceof Error ? err.message : String(err));
      setRegResult({
        success: false,
        message: rawMsg,
      });
      if (rawMsg.includes("approve") || rawMsg.includes("allowance")) {
        toast.error("Please approve BCL tokens in your wallet first (Step 1)");
        if (walletAddress) loadWalletData(walletAddress);
      } else {
        toast.error(rawMsg.length > 80 ? rawMsg.slice(0, 80) + "…" : rawMsg);
      }
    } finally {
      setIsRegistering(false);
    }
  }

  // Handle Domain Renewal
  async function handleRenewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!renewDomain) return;
    const label = renewDomain.normalized_name.replace(".bcl", "");

    try {
      setIsRenewing(true);
      const res = await api.renewName(label, renewYears);
      toast.success(`Renewal for ${renewDomain.normalized_name} submitted! Status: ${res.status}`);
      setRenewDomain(null);
      if (walletAddress) loadWalletData(walletAddress);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Renewal failed";
      toast.error(msg);
    } finally {
      setIsRenewing(false);
    }
  }

  // Handle Resolver Data Update
  async function handleResolverSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resolverDomain) return;
    const label = resolverDomain.normalized_name.replace(".bcl", "");

    try {
      setIsSavingResolver(true);
      await api.setResolverData(label, resolverText);
      toast.success(`Resolver records updated for ${resolverDomain.normalized_name}!`);
      setResolverDomain(null);
      if (walletAddress) loadWalletData(walletAddress);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update resolver records";
      toast.error(msg);
    } finally {
      setIsSavingResolver(false);
    }
  }

  // Handle Transfer
  async function handleTransferSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!transferDomain) return;
    const cleanRecipient = transferRecipient.trim();
    if (!cleanRecipient.startsWith("0x") || cleanRecipient.length !== 42) {
      toast.error("Please enter a valid 42-character recipient address (0x...)");
      return;
    }
    const label = transferDomain.normalized_name.replace(".bcl", "");

    try {
      setIsTransferring(true);
      await api.transferName(label, cleanRecipient);
      toast.success(`${transferDomain.normalized_name} transfer initiated to ${cleanRecipient.slice(0, 6)}...`);
      setTransferDomain(null);
      setTransferRecipient("");
      if (walletAddress) loadWalletData(walletAddress);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transfer failed";
      toast.error(msg);
    } finally {
      setIsTransferring(false);
    }
  }

  const bclTokensRequired = 10 * years;
  const requiredCostWei = BigInt(bclTokensRequired) * BigInt("1000000000000000000");
  const currentAllowanceWei = bclBalance?.allowance_wei ? BigInt(bclBalance.allowance_wei) : BigInt(0);
  const needsApproval = currentAllowanceWei < requiredCostWei;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/[0.08] pb-5">
        <div>
          <div className="text-xs font-semibold text-brand uppercase tracking-wider">
            Web3 Handles &amp; Domains
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-ink tracking-tight mt-1">
            Claim &amp; Manage Your .bcl Name
          </h1>
        </div>

        <div className="flex items-center gap-2 border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 rounded-xl text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <Zap className="h-3.5 w-3.5" />
          <span>ZERO NETWORK FEES ON BOTCHAIN</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Registrar Console (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="surface-card rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="border-b border-ink/[0.06] pb-3">
              <span className="text-xs font-bold font-heading text-ink uppercase tracking-wider">
                Domain Registrar Console
              </span>
              <p className="text-xs text-ink-3 font-sans mt-0.5">
                Register unique, human-readable usernames on Botchain.
              </p>
            </div>

            {/* Search Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="space-y-3 font-sans"
            >
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. adebayo, builder, ada"
                  className="w-full bg-page border border-ink/[0.1] rounded-xl pl-4 pr-14 py-3 text-sm text-ink placeholder:text-ink-4 focus:outline-none focus:border-brand transition"
                />
                <span className="absolute right-4 top-3 text-xs text-ink-3 font-bold">.bcl</span>
              </div>

              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand-hi py-3 text-xs font-bold text-white transition cursor-pointer disabled:opacity-40 shadow-md shadow-brand/20"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span>CHECK AVAILABILITY</span>
              </button>
            </form>

            {/* Search Result Box */}
            {searchResult && (
              <div className="border border-ink/[0.08] bg-page rounded-xl p-4 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink font-heading">{searchResult.name}</span>
                  {searchResult.available ? (
                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      AVAILABLE
                    </span>
                  ) : myDomains.some(d => d.label.toLowerCase() === searchResult.name.replace(".bcl", "").toLowerCase()) ? (
                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      CLAIMED (OWNED BY YOU)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-700 dark:text-red-400 font-semibold text-xs">
                      <XCircle className="h-3.5 w-3.5" />
                      UNAVAILABLE / CLAIMED
                    </span>
                  )}
                </div>

                {searchResult.available && (
                  <div className="space-y-3 pt-3 border-t border-ink/[0.06]">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-ink-3 uppercase block mb-1">Duration</span>
                        <select
                          value={years}
                          onChange={(e) => setYears(Number(e.target.value))}
                          className="w-full bg-surface border border-ink/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-ink focus:outline-none"
                        >
                          {[1, 2, 3, 5, 10].map((y) => (
                            <option key={y} value={y}>
                              {y} {y === 1 ? "Year" : "Years"}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-ink-3 uppercase block mb-1">Total Fee</span>
                        <div className="border border-ink/[0.08] bg-surface rounded-lg px-2.5 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                          <span className="num-mono">{bclTokensRequired}</span> BCL (Sponsored Free)
                        </div>
                      </div>
                    </div>

                    {!walletAddress ? (
                      <button
                        onClick={connectWallet}
                        className="w-full rounded-xl bg-ink text-page font-semibold py-2.5 text-xs transition cursor-pointer"
                      >
                        CONNECT WALLET TO CLAIM
                      </button>
                    ) : !user ? (
                      <button
                        onClick={connectWallet}
                        className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Zap className="w-3.5 h-3.5" /> SIGN IN WITH WALLET TO CLAIM
                      </button>
                    ) : !user.username ? (
                      <button
                        onClick={() => {
                          toast("Please create your profile first before claiming domains!", { icon: "👤" });
                          if (typeof window !== "undefined") {
                            window.location.href = "/profile?create=true";
                          }
                        }}
                        className="w-full rounded-xl bg-accent text-surface font-bold py-2.5 text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90"
                      >
                        <UserIcon className="w-3.5 h-3.5" /> CREATE PROFILE TO CLAIM DOMAIN →
                      </button>
                    ) : needsApproval ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs px-0.5">
                          <span className="text-ink-3">Step 1 of 2: Authorize BCL Tokens</span>
                          <span className="text-amber-500 font-bold">Approval Required</span>
                        </div>
                        <button
                          onClick={handleApprove}
                          disabled={isApproving}
                          className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 text-xs transition cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                        >
                          {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                          <span>{isApproving ? "APPROVING IN WALLET..." : `1. APPROVE ${bclTokensRequired} BCL TOKEN`}</span>
                        </button>
                        <button
                          disabled
                          className="w-full rounded-xl bg-ink/5 border border-ink/10 text-ink-4 font-bold py-2.5 text-xs cursor-not-allowed opacity-60 flex items-center justify-center gap-1.5"
                        >
                          <span>2. CONFIRM & CLAIM {searchResult.name}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold px-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5" /> BCL Token Approved
                        </div>
                        <button
                          onClick={handleRegister}
                          disabled={isRegistering}
                          className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 text-xs transition cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                        >
                          {isRegistering ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          <span>{isRegistering ? "PROCESSING REGISTRATION..." : `CONFIRM & CLAIM ${searchResult.name}`}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {regResult && (
              <div
                className={`rounded-xl p-3 text-xs border ${
                  regResult.success
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
                }`}
              >
                <div>{regResult.message}</div>
                {regResult.txHash && (
                  <div className="text-[10px] text-ink-3 truncate mt-1 font-mono">
                    TX: {regResult.txHash}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Portfolio Domains (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="surface-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3">
              <span className="text-xs font-bold font-heading text-ink uppercase tracking-wider">
                Your Registered Names
              </span>
              <span className="text-[10px] text-ink-3 font-medium">{myDomains.length} Active</span>
            </div>

            {loadingMyDomains ? (
              <div className="py-8 text-center text-ink-4 text-xs">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1 text-brand" />
                <span>Loading your names...</span>
              </div>
            ) : myDomains.length === 0 ? (
              <div className="py-8 text-center text-ink-4 text-xs space-y-1">
                <Globe className="h-6 w-6 mx-auto mb-2 opacity-30 text-ink-3" />
                <p>No active .bcl names registered yet.</p>
                <p className="text-[11px] text-ink-5">Claim your first handle on the left console.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {myDomains.map((d) => (
                  <div
                    key={d.id || d.normalized_name}
                    className="border border-ink/[0.06] bg-surface rounded-xl p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink text-sm font-heading">{d.normalized_name}</span>
                      <span className="text-[10px] uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-medium">
                        {d.status || "ACTIVE"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-ink-3">
                      <span>Expires: {new Date(d.expires_at).toLocaleDateString()}</span>
                      {d.resolver_data && (
                        <span className="truncate max-w-[140px] text-ink-4 font-mono">
                          {d.resolver_data}
                        </span>
                      )}
                    </div>

                    {/* Domain Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-ink/[0.04]">
                      <button
                        onClick={() => {
                          setRenewDomain(d);
                          setRenewYears(1);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-ink/[0.04] hover:bg-ink/[0.08] text-[11px] font-medium text-ink-2 hover:text-ink transition cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Renew</span>
                      </button>

                      <button
                        onClick={() => {
                          setResolverDomain(d);
                          setResolverText(d.resolver_data || "");
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-ink/[0.04] hover:bg-ink/[0.08] text-[11px] font-medium text-ink-2 hover:text-ink transition cursor-pointer"
                      >
                        <FileText className="h-3 w-3" />
                        <span>Records</span>
                      </button>

                      <button
                        onClick={() => {
                          setTransferDomain(d);
                          setTransferRecipient("");
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-ink/[0.04] hover:bg-ink/[0.08] text-[11px] font-medium text-ink-2 hover:text-ink transition cursor-pointer"
                      >
                        <Send className="h-3 w-3" />
                        <span>Transfer</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Renew Modal */}
      {renewDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-ink/[0.1] bg-surface p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3">
              <h3 className="text-sm font-bold font-heading text-ink">
                Renew {renewDomain.normalized_name}
              </h3>
              <button
                onClick={() => setRenewDomain(null)}
                className="text-ink-3 hover:text-ink cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRenewSubmit} className="space-y-3 text-xs font-sans">
              <div>
                <label className="block text-[11px] text-ink-3 uppercase font-medium mb-1">
                  Extension Duration
                </label>
                <select
                  value={renewYears}
                  onChange={(e) => setRenewYears(Number(e.target.value))}
                  className="w-full bg-page border border-ink/[0.1] rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                >
                  {[1, 2, 3, 5, 10].map((y) => (
                    <option key={y} value={y}>
                      +{y} {y === 1 ? "Year" : "Years"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border border-ink/[0.06] bg-page rounded-xl p-3 text-[11px] text-ink-3 space-y-1">
                <div className="flex justify-between">
                  <span>Current Expiry:</span>
                  <span className="text-ink font-mono">{new Date(renewDomain.expires_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span>Network Gas:</span>
                  <span>100% Sponsored (Free)</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/[0.06]">
                <button
                  type="button"
                  onClick={() => setRenewDomain(null)}
                  className="px-3.5 py-1.5 rounded-lg text-ink-3 hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenewing}
                  className="px-4 py-1.5 rounded-lg bg-brand hover:bg-brand-hi text-white font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {isRenewing ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
                  <span>Confirm Renewal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolver Records Modal */}
      {resolverDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-ink/[0.1] bg-surface p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3">
              <h3 className="text-sm font-bold font-heading text-ink">
                Resolver Records for {resolverDomain.normalized_name}
              </h3>
              <button
                onClick={() => setResolverDomain(null)}
                className="text-ink-3 hover:text-ink cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleResolverSubmit} className="space-y-3 text-xs font-sans">
              <div>
                <label className="block text-[11px] text-ink-3 uppercase font-medium mb-1">
                  Resolver Data (Text / JSON / Bio / Socials)
                </label>
                <textarea
                  rows={4}
                  value={resolverText}
                  onChange={(e) => setResolverText(e.target.value)}
                  placeholder="e.g. github: adebayo, twitter: @adebayo_web3, avatar: ipfs://bafy..."
                  maxLength={1024}
                  className="w-full bg-page border border-ink/[0.1] rounded-xl px-3 py-2 text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:border-brand"
                />
                <span className="text-[10px] text-ink-4 mt-1 block">
                  Max 1,024 bytes. Saved directly to the BCLNameNFT contract resolver.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/[0.06]">
                <button
                  type="button"
                  onClick={() => setResolverDomain(null)}
                  className="px-3.5 py-1.5 rounded-lg text-ink-3 hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingResolver}
                  className="px-4 py-1.5 rounded-lg bg-brand hover:bg-brand-hi text-white font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {isSavingResolver ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
                  <span>Save Records</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Domain Modal */}
      {transferDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-ink/[0.1] bg-surface p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3">
              <h3 className="text-sm font-bold font-heading text-ink">
                Transfer {transferDomain.normalized_name}
              </h3>
              <button
                onClick={() => setTransferDomain(null)}
                className="text-ink-3 hover:text-ink cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs font-sans">
              <div>
                <label className="block text-[11px] text-ink-3 uppercase font-medium mb-1">
                  Recipient Wallet Address
                </label>
                <input
                  type="text"
                  required
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-page border border-ink/[0.1] rounded-xl px-3 py-2 text-xs text-ink placeholder:text-ink-4 font-mono focus:outline-none focus:border-brand"
                />
                <span className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 block">
                  Warning: Transfers are permanent. The new owner will gain complete control of this .bcl NFT.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/[0.06]">
                <button
                  type="button"
                  onClick={() => setTransferDomain(null)}
                  className="px-3.5 py-1.5 rounded-lg text-ink-3 hover:text-ink cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTransferring}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {isTransferring ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
                  <span>Confirm Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DomainsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-ink-4 text-xs">Loading domains...</div>}>
      <DomainsContent />
    </Suspense>
  );
}
