import { createPublicClient, http, parseAbi, isAddress, getAddress } from "viem";

function resolveValidAddress(
  envVal: string | undefined,
  fallback: `0x${string}`
): `0x${string}` {
  if (envVal) {
    const trimmed = envVal.trim();
    if (isAddress(trimmed)) {
      return getAddress(trimmed);
    }
    // Handle truncated address where trailing character was omitted in env setup (e.g. 41 chars)
    if (trimmed.length === 41 && fallback.toLowerCase().startsWith(trimmed.toLowerCase())) {
      return fallback;
    }
  }
  return fallback;
}

export const CONTRACT_ADDRESSES = {
  REWARDS: resolveValidAddress(
    process.env.NEXT_PUBLIC_REWARDS_CONTRACT,
    "0xDdF69D1b3CD83B8bF9FfEf2ED407be9F9cAb6Cab"
  ),
  REGISTRY: resolveValidAddress(
    process.env.NEXT_PUBLIC_REGISTRY_CONTRACT,
    "0xb6BaA98648a8D3B5e24f5b029e12d5Cd700398fd"
  ),
  BCL_TOKEN: resolveValidAddress(
    process.env.NEXT_PUBLIC_TOKEN_CONTRACT,
    "0x13AD24fDF0843c9b3Cc9adbE7C2EC55A48707086"
  ),
  NAME_NFT: resolveValidAddress(
    process.env.NEXT_PUBLIC_NAME_NFT_CONTRACT,
    "0xa21b4e2d910a106f8783dD8628D8C5Ba3E4b7A96"
  ),
};

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.bohr.life";
export const EXPLORER_BASE_URL =
  process.env.NEXT_PUBLIC_EXPLORER_URL || "https://scan.bohr.life";

export function getExplorerUrl(
  hashOrAddress: string,
  type: "tx" | "address" = "tx"
): string {
  if (!hashOrAddress) return EXPLORER_BASE_URL;
  return `${EXPLORER_BASE_URL.replace(/\/$/, "")}/${type}/${hashOrAddress}`;
}

export const botchainPublicClient = createPublicClient({
  transport: http(RPC_URL),
});

const NAME_NFT_ABI = parseAbi([
  "function available(string calldata label) external view returns (bool)",
  "function quote(uint256 numYears) external view returns (uint256)",
  "function resolve(string calldata label) external view returns (address owner, string memory data, uint64 expiresAt)",
  "function ownerOfLabel(string calldata label) external view returns (address)",
]);

export async function checkOnchainNameAvailability(label: string): Promise<{
  name: string;
  available: boolean;
  price_per_year_bcl_wei: string;
}> {
  const clean = label.trim().toLowerCase().replace(".bcl", "");
  try {
    const isAvailable = await botchainPublicClient.readContract({
      address: CONTRACT_ADDRESSES.NAME_NFT,
      abi: NAME_NFT_ABI,
      functionName: "available",
      args: [clean],
    });

    let priceWei = "10000000000000000000";
    try {
      const q = await botchainPublicClient.readContract({
        address: CONTRACT_ADDRESSES.NAME_NFT,
        abi: NAME_NFT_ABI,
        functionName: "quote",
        args: [BigInt(1)],
      });
      priceWei = q.toString();
    } catch {
      // fallback to 10 BCL
    }

    return {
      name: `${clean}.bcl`,
      available: Boolean(isAvailable),
      price_per_year_bcl_wei: priceWei,
    };
  } catch (err) {
    console.error("Onchain domain query error:", err);
    throw err;
  }
}

const BCL_TOKEN_ABI = parseAbi([
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
]);

export async function getOnchainBclBalance(wallet: string): Promise<{
  wallet: string;
  balance_wei: string;
  allowance_wei: string;
  name_nft_address: string;
}> {
  if (!wallet || !isAddress(wallet.trim())) {
    return {
      wallet,
      balance_wei: "0",
      allowance_wei: "0",
      name_nft_address: CONTRACT_ADDRESSES.NAME_NFT,
    };
  }
  const cleanWallet = getAddress(wallet.trim());

  try {
    const bal = await botchainPublicClient.readContract({
      address: CONTRACT_ADDRESSES.BCL_TOKEN,
      abi: BCL_TOKEN_ABI,
      functionName: "balanceOf",
      args: [cleanWallet],
    });

    const allow = await botchainPublicClient.readContract({
      address: CONTRACT_ADDRESSES.BCL_TOKEN,
      abi: BCL_TOKEN_ABI,
      functionName: "allowance",
      args: [cleanWallet, CONTRACT_ADDRESSES.NAME_NFT],
    });

    return {
      wallet,
      balance_wei: bal.toString(),
      allowance_wei: allow.toString(),
      name_nft_address: CONTRACT_ADDRESSES.NAME_NFT,
    };
  } catch (err) {
    console.error("Onchain BCL balance query error:", err);
    return {
      wallet,
      balance_wei: "0",
      allowance_wei: "0",
      name_nft_address: CONTRACT_ADDRESSES.NAME_NFT,
    };
  }
}

export async function getOnchainUserDomains(wallet: string): Promise<Array<{
  id: number;
  normalized_name: string;
  label: string;
  owner_wallet: string;
  status: string;
  expires_at: string;
  resolver_data?: string;
}>> {
  if (!wallet || !isAddress(wallet.trim())) {
    return [];
  }
  const cleanWallet = getAddress(wallet.trim());

  try {
    const bal = await botchainPublicClient.readContract({
      address: CONTRACT_ADDRESSES.NAME_NFT,
      abi: parseAbi(["function balanceOf(address) view returns (uint256)"]),
      functionName: "balanceOf",
      args: [cleanWallet],
    });

    const domains = [];
    for (let i = BigInt(0); i < bal; i += BigInt(1)) {
      try {
        const tid = await botchainPublicClient.readContract({
          address: CONTRACT_ADDRESSES.NAME_NFT,
          abi: parseAbi(["function tokenOfOwnerByIndex(address, uint256) view returns (uint256)"]),
          functionName: "tokenOfOwnerByIndex",
          args: [cleanWallet, i],
        });
        const label = await botchainPublicClient.readContract({
          address: CONTRACT_ADDRESSES.NAME_NFT,
          abi: parseAbi(["function labelOf(uint256) view returns (string)"]),
          functionName: "labelOf",
          args: [tid],
        });
        const rec = await botchainPublicClient.readContract({
          address: CONTRACT_ADDRESSES.NAME_NFT,
          abi: parseAbi(["function recordOf(string) view returns (address, uint64, string)"]),
          functionName: "recordOf",
          args: [label],
        });

        const expiresAtIso = new Date(Number(rec[1]) * 1000).toISOString();
        domains.push({
          id: Number(tid % BigInt(1000000)),
          normalized_name: `${label}.bcl`,
          label,
          owner_wallet: wallet.toLowerCase(),
          status: "active",
          expires_at: expiresAtIso,
          resolver_data: rec[2] || "",
        });
      } catch (err) {
        console.error("Error reading onchain domain token:", err);
      }
    }
    return domains;
  } catch (err) {
    console.error("Error in getOnchainUserDomains:", err);
    return [];
  }
}

