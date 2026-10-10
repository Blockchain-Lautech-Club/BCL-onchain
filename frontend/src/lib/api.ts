/**
 * BCL Onchain API Client
 * Typed API client for FastAPI backend endpoints.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
  id: number;
  wallet_address: string;
  username?: string;
  level: number;
  total_points: number;
  status: string;
  is_admin?: boolean;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  points: number;
  verification_type: "onchain_tx" | "nft_ownership" | "social_api" | "manual";
  verification_config?: Record<string, unknown>;
  repeatable: boolean;
  status: "draft" | "published" | "archived";
  deadline?: string;
  user_state?: "not_started" | "submitted" | "under_review" | "verified" | "rejected" | "expired";
}

export interface TaskSubmission {
  id: number;
  task_id: number;
  user_id: number;
  wallet: string;
  evidence: Record<string, unknown>;
  status: "submitted" | "under_review" | "verified" | "rejected";
  reason?: string;
  tx_hash?: string;
  created_at: string;
}

export interface Milestone {
  id: number;
  milestone_type: "level" | "task" | "streak" | "community";
  type_ref_id: number;
  token_id: number;
  name: string;
  description: string;
  metadata_uri: string;
  points_threshold?: number;
  registered_on_chain: boolean;
}

export interface NFTMintRecord {
  id: number;
  wallet: string;
  token_id: number;
  milestone_type: string;
  status: "queued" | "pending" | "whitelisted" | "confirmed" | "failed";
  transaction_hash?: string;
  failure_reason?: string;
  created_at: string;
}

export interface DomainRecord {
  id: number;
  label: string;
  normalized_name: string;
  token_id: string;
  owner_wallet: string;
  expires_at: string;
  resolver_data: string;
  cost_bcl_wei: string;
  registration_tx?: string;
  status: string;
}

export interface LeaderboardEntry {
  rank: number;
  wallet_address: string;
  username?: string;
  total_points: number;
  level: number;
  bcl_domain?: string;
}

export interface UserStats {
  level: number;
  total_points: number;
  points_to_next_level: number;
  next_level_threshold: number;
  completed_tasks_count: number;
  active_names_count: number;
  streak_days: number;
}

export interface NotificationItem {
  id: number;
  kind: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface PointsLedgerItem {
  id: number;
  points_delta: number;
  reason: string;
  source_task_id?: number | null;
  created_at: string;
}

export interface ProfileData {
  id: number;
  wallet_address: string;
  username?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  total_points: number;
  level: number;
  is_admin: boolean;
  next_level?: number | null;
  next_level_threshold?: number | null;
  points_to_next?: number | null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: "include", // send httpOnly session cookie
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const errorMsg = data?.error?.message || data?.detail || `Request failed with status ${res.status}`;
    const error = new Error(errorMsg) as Error & { code?: string; status?: number };
    error.code = data?.error?.code;
    error.status = res.status;
    throw error;
  }

  return data as T;
}

export const api = {
  // ── Auth ──
  async getNonce(address: string): Promise<{ nonce: string; message: string }> {
    return request("/auth/nonce", {
      method: "POST",
      body: JSON.stringify({ address }),
    });
  },

  async verifyLogin(address: string, signature: string): Promise<{ wallet_address: string; is_admin: boolean; token: string }> {
    return request("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ address, signature }),
    });
  },

  async logout(): Promise<{ ok: boolean }> {
    return request("/auth/logout", { method: "POST" });
  },

  async getMe(): Promise<{ id: number; wallet_address: string; is_admin: boolean }> {
    return request("/auth/me");
  },

  // ── User Stats & Dashboard ──
  async getMyStats(): Promise<UserStats> {
    return request("/me/stats");
  },

  async getProfile(): Promise<ProfileData> {
    return request("/me");
  },

  async updateProfile(body: { username?: string; bio?: string; avatar_url?: string }): Promise<ProfileData> {
    return request("/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  async getMyPoints(): Promise<PointsLedgerItem[]> {
    return request("/me/points");
  },

  async getNotifications(): Promise<NotificationItem[]> {
    return request("/me/notifications");
  },

  async markNotificationsRead(): Promise<{ updated: number }> {
    return request("/me/notifications/read", { method: "POST" });
  },

  async getMySubmissions(): Promise<TaskSubmission[]> {
    return request("/me/submissions");
  },

  async getMyNFTs(): Promise<NFTMintRecord[]> {
    return request("/me/nfts");
  },

  async getMyNames(): Promise<DomainRecord[]> {
    return request("/me/names");
  },

  // ── Tasks ──
  async getTasks(): Promise<Task[]> {
    return request("/tasks");
  },

  async getTask(id: number): Promise<Task> {
    return request(`/tasks/${id}`);
  },

  async submitTask(taskId: number, evidence: Record<string, unknown>): Promise<TaskSubmission> {
    return request(`/tasks/${taskId}/submit`, {
      method: "POST",
      body: JSON.stringify({ evidence }),
    });
  },

  // ── Names / Domains ──
  async checkNameAvailability(name: string): Promise<{ name: string; available: boolean; price_per_year_bcl_wei: string }> {
    return request(`/names/availability?name=${encodeURIComponent(name)}`);
  },

  async getNameQuote(name: string, years: number): Promise<{
    name: string;
    num_years: number;
    total_cost_bcl_wei: string;
    contract_address: string;
    function: string;
    args: unknown[];
    chain_id: number;
  }> {
    return request(`/names/quote?name=${encodeURIComponent(name)}&years=${years}`);
  },

  async getBclBalance(wallet: string): Promise<{
    wallet: string;
    balance_wei: string;
    allowance_wei: string;
    name_nft_address: string;
  }> {
    return request(`/names/balance?wallet=${encodeURIComponent(wallet)}`);
  },

  async registerName(name: string, years: number): Promise<{
    status: string;
    tx_hash: string;
    name: string;
    message: string;
  }> {
    return request("/names/register", {
      method: "POST",
      body: JSON.stringify({ name, years }),
    });
  },

  async renewName(name: string, years: number): Promise<{
    job_id: number;
    status: string;
    transaction_hash?: string;
  }> {
    return request("/names/renew", {
      method: "POST",
      body: JSON.stringify({ label: name, num_years: years }),
    });
  },

  async setResolverData(name: string, data: string): Promise<{
    status: string;
    tx_hash?: string;
  }> {
    return request("/names/resolver", {
      method: "POST",
      body: JSON.stringify({ label: name, data }),
    });
  },

  async transferName(name: string, newOwner: string): Promise<{
    status: string;
    transaction_hash?: string;
  }> {
    return request("/names/transfer", {
      method: "POST",
      body: JSON.stringify({ label: name, new_owner: newOwner }),
    });
  },

  async resolveName(name: string): Promise<DomainRecord> {
    return request(`/names/resolve/${encodeURIComponent(name)}`);
  },

  // ── Milestones & Rewards ──
  async getMilestones(type?: string): Promise<Milestone[]> {
    const q = type ? `?type=${type}` : "";
    return request(`/milestones${q}`);
  },

  async getClaimableRewards(): Promise<{ token_id: number; milestone: Milestone }[]> {
    return request("/rewards/claimable");
  },

  // ── Public / Leaderboard ──
  async getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
    return request(`/public/leaderboard?limit=${limit}`);
  },

  async getPlatformStats(): Promise<{ total_users: number; total_points_awarded: number; total_tasks_completed: number; total_domains_registered: number }> {
    return request("/public/stats");
  },

  // ── Admin ──
  async getAdminTasks(): Promise<Task[]> {
    return request("/admin/tasks");
  },

  async createAdminTask(task: Partial<Task> & { publish?: boolean }): Promise<Task> {
    return request("/admin/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
  },

  async updateAdminTask(taskId: number, task: Partial<Task>): Promise<Task> {
    return request(`/admin/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(task),
    });
  },

  async publishAdminTask(taskId: number): Promise<Task> {
    return request(`/admin/tasks/${taskId}/publish`, { method: "POST" });
  },

  async archiveAdminTask(taskId: number): Promise<Task> {
    return request(`/admin/tasks/${taskId}/archive`, { method: "POST" });
  },

  async getAdminSubmissions(status = "under_review"): Promise<TaskSubmission[]> {
    return request(`/admin/submissions?status=${status}`);
  },

  async reviewSubmission(submissionId: number, approve: boolean, reason?: string): Promise<TaskSubmission> {
    return request(`/admin/submissions/${submissionId}/review`, {
      method: "POST",
      body: JSON.stringify({ approve, reason }),
    });
  },

  async getAdminLevels(): Promise<{ level: number; threshold: number }[]> {
    return request("/admin/levels");
  },

  async updateAdminLevels(levels: { level: number; threshold: number }[]): Promise<{ updated: number }> {
    return request("/admin/levels", {
      method: "PUT",
      body: JSON.stringify({ levels }),
    });
  },

  async recalculateLevels(): Promise<{ changed: number }> {
    return request("/admin/levels/recalculate", { method: "POST" });
  },

  async getAdminUsers(query?: string): Promise<User[]> {
    const q = query ? `?q=${encodeURIComponent(query)}` : "";
    return request(`/admin/users${q}`);
  },

  async adjustUserPoints(userId: number, delta: number, reason: string): Promise<{ ledger_id: number }> {
    return request("/admin/points/adjust", {
      method: "POST",
      body: JSON.stringify({ user_id: userId, delta, reason }),
    });
  },

  async getAdminMints(status?: string): Promise<NFTMintRecord[]> {
    const q = status ? `?status=${status}` : "";
    return request(`/admin/mints${q}`);
  },

  async retryFailedMint(mintId: number): Promise<{ id: number; status: string }> {
    return request(`/admin/mints/${mintId}/retry`, { method: "POST" });
  },

  async getAdminAuditLogs(limit = 100): Promise<Array<{ id: number; actor: string; action: string; target: string; meta: Record<string, unknown>; created_at: string }>> {
    return request(`/admin/audit-logs?limit=${limit}`);
  },

  async setUserRole(userId: number, role: "admin", grant: boolean): Promise<{ user_id: number; role: string; granted: boolean }> {
    return request(`/admin/users/${userId}/role`, {
      method: "POST",
      body: JSON.stringify({ role, grant }),
    });
  },

  async suspendUser(userId: number, suspend: boolean): Promise<{ user_id: number; status: string }> {
    return request(`/admin/users/${userId}/suspend?suspend=${suspend}`, {
      method: "POST",
    });
  },

  async createMilestone(body: {
    milestone_type: "level" | "task" | "streak" | "community";
    type_ref_id: number;
    name: string;
    description?: string;
    metadata_uri?: string;
    points_threshold?: number;
  }): Promise<Milestone> {
    return request("/milestones", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  async awardMilestone(tokenId: number, wallet: string): Promise<{ status: string }> {
    return request(`/milestones/${tokenId}/award`, {
      method: "POST",
      body: JSON.stringify({ wallet }),
    });
  },
};
