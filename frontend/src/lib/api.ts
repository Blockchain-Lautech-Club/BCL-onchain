/**
 * BCL Onchain API Client
 * Typed API client for FastAPI backend endpoints.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://bcl-onchain-backend.vercel.app";

export interface User {
  id: number;
  wallet_address: string;
  username?: string;
  avatar_url?: string | null;
  level: number;
  total_points: number;
  status: string;
  is_admin?: boolean;
  bcl_domain?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  category: string;
  image_url?: string | null;
  points: number;
  verification_type: "onchain_tx" | "nft_ownership" | "social_api" | "manual";
  requirements?: Record<string, unknown>;
  repeatable: boolean;
  status: "draft" | "published" | "archived";
  deadline?: string | null;
  my_state?: "not_started" | "submitted" | "under_review" | "verified" | "rejected" | "expired" | null;
}

export interface TaskSubmission {
  id: number;
  task_id: number;
  task_title?: string;
  user_id?: number;
  wallet?: string;
  username?: string;
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
  token_id?: string;
  owner_wallet: string;
  expires_at: string;
  resolver_data?: string;
  cost_bcl_wei?: string;
  registration_tx?: string;
  status: string;
}

export interface LeaderboardEntry {
  rank: number;
  wallet_address: string;
  username?: string;
  avatar_url?: string | null;
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
  daily_claimed?: boolean;
  quiz_claimed?: boolean;
  today?: string;
  active_dates?: string[];
}

export interface QuizOption {
  id: number;
  text: string;
}

export interface DailyQuiz {
  id: number;
  quiz_date: string;
  title: string;
  topic: string;
  description: string;
  question: string;
  options: QuizOption[];
  points: number;
  is_active: boolean;
  correct_index?: number;
  explanation?: string;
  created_at?: string;
}

export interface DailyQuizCreate {
  quiz_date: string;
  title: string;
  topic: string;
  description: string;
  question: string;
  options: QuizOption[];
  correct_index: number;
  explanation: string;
  points: number;
  is_active: boolean;
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

// ── Extended profile fields saved by the UI ──────────────────────────────────
export interface ProfileData {
  id: number;
  wallet_address: string;
  username?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  // Extended identity fields
  avatar_emoji?: string | null;
  role?: string | null;
  location?: string | null;
  twitter?: string | null;
  github?: string | null;
  website?: string | null;
  skills?: string[] | null;
  // Points / level
  total_points: number;
  level: number;
  is_admin: boolean;
  next_level?: number | null;
  next_level_threshold?: number | null;
  points_to_next?: number | null;
}

// Payload accepted by PATCH /me
export interface UpdateProfilePayload {
  username?: string;
  bio?: string;
  avatar_url?: string;
  avatar_emoji?: string;
  role?: string;
  location?: string;
  twitter?: string;
  github?: string;
  website?: string;
  skills?: string[];
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const token = typeof window !== "undefined" ? localStorage.getItem("bcl_auth_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    let errorMsg = data?.error?.message || data?.message;
    if (!errorMsg && data?.detail) {
      if (Array.isArray(data.detail)) {
        errorMsg = data.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(", ");
      } else if (typeof data.detail === "string") {
        errorMsg = data.detail;
      }
    }
    if (!errorMsg) {
      errorMsg = `Request failed with status ${res.status}`;
    }
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
    const res = await request<{ wallet_address: string; is_admin: boolean; token: string }>("/auth/verify", {
      method: "POST",
      body: JSON.stringify({ address, signature }),
    });
    if (typeof window !== "undefined") {
      if (res?.token) {
        localStorage.setItem("bcl_auth_token", res.token);
      }
      if (res?.wallet_address) {
        localStorage.setItem("bcl_wallet_address", res.wallet_address.toLowerCase());
      }
    }
    return res;
  },

  async logout(): Promise<{ ok: boolean }> {
    if (typeof window !== "undefined") {
      localStorage.removeItem("bcl_auth_token");
      localStorage.removeItem("bcl_wallet_address");
    }
    return request("/auth/logout", { method: "POST" });
  },

  async getMe(): Promise<{ id: number; wallet_address: string; is_admin: boolean }> {
    return request("/auth/me");
  },

  async claimDaily(): Promise<{ ok: boolean; points_delta: number; total_points: number; level: number }> {
    return request("/me/claim-daily", { method: "POST" });
  },

  async getDailyQuiz(): Promise<DailyQuiz> {
    return request<DailyQuiz>("/daily-quiz");
  },

  async claimDailyQuiz(answerIndex?: number, quizId?: number): Promise<{ ok: boolean; points_delta: number; total_points: number; level: number }> {
    return request("/me/daily-quiz", {
      method: "POST",
      body: JSON.stringify({ answer_index: answerIndex, quiz_id: quizId }),
    });
  },

  // ── User Stats & Dashboard ──
  async getMyStats(): Promise<UserStats> {
    return request<UserStats>("/me/stats");
  },

  async getProfile(): Promise<ProfileData> {
    return request<ProfileData>("/me");
  },

  async getUserProfile(wallet: string): Promise<ProfileData> {
    const norm = wallet.toLowerCase();
    try {
      return await request<ProfileData>(`/users/${norm}/profile`);
    } catch {
      // Fallback: check leaderboard to see if user has an existing record
      const lb = await api.getLeaderboard(100).catch(() => []);
      const entry = lb.find(e => e.wallet_address.toLowerCase() === norm);
      if (entry) {
        return {
          id: 0,
          wallet_address: norm,
          username: entry.username || null,
          bio: null,
          avatar_url: null,
          total_points: entry.total_points,
          level: entry.level,
          is_admin: false,
          next_level: entry.level + 1,
          next_level_threshold: 100,
          points_to_next: Math.max(0, 100 - entry.total_points),
        };
      }
      throw new Error("User profile not found");
    }
  },

  async getUserStats(wallet: string): Promise<UserStats> {
    const norm = wallet.toLowerCase();
    try {
      return await request<UserStats>(`/users/${norm}/stats`);
    } catch {
      const prof = await api.getUserProfile(norm).catch(() => null);
      const points = prof?.total_points || 0;
      return {
        level: prof?.level || 0,
        total_points: points,
        points_to_next_level: Math.max(0, 100 - points),
        next_level_threshold: 100,
        completed_tasks_count: 0,
        active_names_count: 0,
        streak_days: 0,
      };
    }
  },

  async getUserNFTs(wallet: string): Promise<NFTMintRecord[]> {
    return request<NFTMintRecord[]>(`/users/${wallet.toLowerCase()}/nfts`).catch(() => []);
  },

  async getUserPoints(wallet: string): Promise<PointsLedgerItem[]> {
    return request<PointsLedgerItem[]>(`/users/${wallet.toLowerCase()}/points`).catch(() => []);
  },

  async getUserDomains(wallet: string): Promise<DomainRecord[]> {
    return request<DomainRecord[]>(`/users/${wallet.toLowerCase()}/domains`).catch(() => []);
  },

  async updateProfile(body: UpdateProfilePayload): Promise<ProfileData> {
    return request("/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  async getMyPoints(): Promise<PointsLedgerItem[]> {
    return request<PointsLedgerItem[]>("/me/points");
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
    tx_hash?: string;
    transaction_hash?: string;
    name?: string;
    normalized_name?: string;
    message?: string;
  }> {
    return request("/names/register", {
      method: "POST",
      body: JSON.stringify({ label: name, num_years: years, name, years }),
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
    return request(`/leaderboard?limit=${limit}`);
  },

  async getPlatformStats(): Promise<{ total_users: number; total_points_awarded: number; total_tasks_completed: number; total_domains_registered: number }> {
    try {
      const [board, tasks] = await Promise.all([
        request<LeaderboardEntry[]>("/leaderboard?limit=200").catch(() => []),
        request<Task[]>("/tasks").catch(() => []),
      ]);
      const totalPoints = board.reduce((sum, u) => sum + (u.total_points || 0), 0);
      return {
        total_users: board.length,
        total_points_awarded: totalPoints,
        total_tasks_completed: tasks.length * 4,
        total_domains_registered: board.filter(u => !!u.username).length,
      };
    } catch {
      return { total_users: 0, total_points_awarded: 0, total_tasks_completed: 0, total_domains_registered: 0 };
    }
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

  async deleteAdminTask(taskId: number): Promise<{ ok: boolean; deleted_id: number; title: string }> {
    return request(`/admin/tasks/${taskId}`, { method: "DELETE" });
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

  async getAdminQuizzes(): Promise<DailyQuiz[]> {
    return request<DailyQuiz[]>("/admin/quizzes");
  },

  async createAdminQuiz(quiz: DailyQuizCreate): Promise<DailyQuiz> {
    return request<DailyQuiz>("/admin/quizzes", {
      method: "POST",
      body: JSON.stringify(quiz),
    });
  },

  async updateAdminQuiz(quizId: number, quiz: Partial<DailyQuizCreate>): Promise<DailyQuiz> {
    return request<DailyQuiz>(`/admin/quizzes/${quizId}`, {
      method: "PATCH",
      body: JSON.stringify(quiz),
    });
  },

  async deleteAdminQuiz(quizId: number): Promise<{ ok: boolean; deleted: number }> {
    return request<{ ok: boolean; deleted: number }>(`/admin/quizzes/${quizId}`, {
      method: "DELETE",
    });
  },
};