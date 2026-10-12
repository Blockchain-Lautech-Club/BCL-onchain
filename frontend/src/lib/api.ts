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
  verification_type: "onchain_tx" | "nft_ownership" | "social_api" | "manual" | "instant";
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
  milestone_name?: string;
  description?: string;
  metadata_uri?: string;
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

export interface CommunityEvent {
  id: number;
  title: string;
  description: string;
  event_type: string;
  mode: string;
  location_url?: string | null;
  event_date: string;
  xp_reward: number;
  registered_count: number;
  is_live: boolean;
  status: "upcoming" | "live" | "concluded" | "cancelled";
  is_rsvpd?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityEventCreate {
  title: string;
  description?: string;
  event_type?: string;
  mode?: string;
  location_url?: string;
  event_date: string;
  xp_reward?: number;
  is_live?: boolean;
  status?: string;
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

const DEFAULT_FALLBACK_EVENTS: CommunityEvent[] = [
  {
    id: 1,
    title: "BCL Friday Tech Space: Navigating Web3 Careers",
    description: "Join our weekly live audio space on X with leading builders, founders, and devs across Ethereum, Base, and L2 ecosystems.",
    event_type: "X Space",
    mode: "Online · X Spaces",
    location_url: "https://x.com/i/spaces",
    event_date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    xp_reward: 100,
    registered_count: 610,
    is_live: true,
    status: "live",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Foundry Masterclass: Gas Optimization",
    description: "Live code-along with Senior EVM Auditor. Deep dive into storage packing, batching patterns, and Yul assembly for gas efficiency.",
    event_type: "Workshop",
    mode: "Online · Discord Stage",
    location_url: "https://discord.gg/blockchain-lautech",
    event_date: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    xp_reward: 150,
    registered_count: 56,
    is_live: false,
    status: "upcoming",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: "Confluence Hackathon Showcase & Demo Day",
    description: "Final project demos from all competing teams at the BCL Confluence Hackathon. Campus Auditorium + live global streaming.",
    event_type: "Hackathon",
    mode: "Hybrid · Auditorium & Stream",
    location_url: "https://youtube.com",
    event_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    xp_reward: 300,
    registered_count: 240,
    is_live: false,
    status: "upcoming",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    title: "Product Design & UX Sprint for Web3 Apps",
    description: "Interactive session on wallet connection flows, transaction signing heuristics, and onboarding UX for non-technical users.",
    event_type: "Workshop",
    mode: "Online · Google Meet",
    location_url: "https://meet.google.com",
    event_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    xp_reward: 120,
    registered_count: 85,
    is_live: false,
    status: "upcoming",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getLocalEvents(): CommunityEvent[] {
  if (typeof window === "undefined") return DEFAULT_FALLBACK_EVENTS;
  try {
    const raw = localStorage.getItem("bcl_community_events");
    if (!raw) {
      localStorage.setItem("bcl_community_events", JSON.stringify(DEFAULT_FALLBACK_EVENTS));
      return DEFAULT_FALLBACK_EVENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_FALLBACK_EVENTS;
  } catch {
    return DEFAULT_FALLBACK_EVENTS;
  }
}

function saveLocalEvents(events: CommunityEvent[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("bcl_community_events", JSON.stringify(events));
  } catch {}
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

  async getPlatformStats(): Promise<{
    total_users: number;
    total_points_awarded: number;
    total_tasks_completed: number;
    total_active_tasks: number;
    total_domains_registered: number;
  }> {
    try {
      return await request("/platform/stats");
    } catch {
      try {
        const [board, tasks] = await Promise.all([
          request<LeaderboardEntry[]>("/leaderboard?limit=200").catch(() => []),
          request<Task[]>("/tasks").catch(() => []),
        ]);
        const totalPoints = board.reduce((sum, u) => sum + (u.total_points || 0), 0);
        return {
          total_users: board.length,
          total_points_awarded: totalPoints,
          total_tasks_completed: 0,
          total_active_tasks: tasks.length,
          total_domains_registered: board.filter(u => !!u.username).length,
        };
      } catch {
        return { total_users: 0, total_points_awarded: 0, total_tasks_completed: 0, total_active_tasks: 0, total_domains_registered: 0 };
      }
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

  async deleteMilestone(tokenId: number): Promise<{ ok: boolean; deleted: number }> {
    return request<{ ok: boolean; deleted: number }>(`/milestones/${tokenId}`, {
      method: "DELETE",
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

  // ── Community Events ──
  async getEvents(wallet?: string): Promise<CommunityEvent[]> {
    const q = wallet ? `?wallet=${encodeURIComponent(wallet)}` : "";
    try {
      const res = await request<CommunityEvent[]>(`/events${q}`);
      if (Array.isArray(res) && res.length > 0) {
        saveLocalEvents(res);
        return res;
      }
      return getLocalEvents();
    } catch {
      // Graceful fallback if backend endpoint has not finished deploying or returns 404
      return getLocalEvents();
    }
  },

  async rsvpEvent(eventId: number): Promise<{ ok: boolean; event_id: number; registered_count: number; already_registered: boolean }> {
    try {
      return await request(`/events/${eventId}/rsvp`, {
        method: "POST",
      });
    } catch {
      const current = getLocalEvents();
      let count = 0;
      const updated = current.map((e) => {
        if (e.id === eventId) {
          count = (e.registered_count || 0) + 1;
          return { ...e, is_rsvpd: true, registered_count: count };
        }
        return e;
      });
      saveLocalEvents(updated);
      return { ok: true, event_id: eventId, registered_count: count, already_registered: false };
    }
  },

  async createAdminEvent(event: CommunityEventCreate): Promise<CommunityEvent> {
    try {
      const created = await request<CommunityEvent>("/admin/events", {
        method: "POST",
        body: JSON.stringify(event),
      });
      const current = getLocalEvents();
      saveLocalEvents([created, ...current]);
      return created;
    } catch {
      const current = getLocalEvents();
      const newEv: CommunityEvent = {
        id: Date.now(),
        title: event.title,
        description: event.description || "",
        event_type: event.event_type || "Workshop",
        mode: event.mode || "Online · X Spaces",
        location_url: event.location_url || null,
        event_date: event.event_date,
        xp_reward: event.xp_reward ?? 100,
        registered_count: 0,
        is_live: Boolean(event.is_live),
        status: (event.status as "upcoming" | "live" | "concluded" | "cancelled") || (event.is_live ? "live" : "upcoming"),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveLocalEvents([newEv, ...current]);
      return newEv;
    }
  },

  async updateAdminEvent(eventId: number, event: Partial<CommunityEventCreate>): Promise<CommunityEvent> {
    try {
      const updated = await request<CommunityEvent>(`/admin/events/${eventId}`, {
        method: "PATCH",
        body: JSON.stringify(event),
      });
      const current = getLocalEvents().map((e) => (e.id === eventId ? updated : e));
      saveLocalEvents(current);
      return updated;
    } catch {
      const current = getLocalEvents();
      let updatedEv: CommunityEvent | null = null;
      const updated = current.map((e) => {
        if (e.id === eventId) {
          updatedEv = {
            ...e,
            ...event,
            status: (event.status as "upcoming" | "live" | "concluded" | "cancelled") || e.status,
            updated_at: new Date().toISOString(),
          };
          return updatedEv;
        }
        return e;
      });
      saveLocalEvents(updated);
      return updatedEv || (current[0] as CommunityEvent);
    }
  },

  async deleteAdminEvent(eventId: number): Promise<{ ok: boolean; deleted: number }> {
    try {
      const res = await request<{ ok: boolean; deleted: number }>(`/admin/events/${eventId}`, {
        method: "DELETE",
      });
      const current = getLocalEvents().filter((e) => e.id !== eventId);
      saveLocalEvents(current);
      return res;
    } catch {
      const current = getLocalEvents().filter((e) => e.id !== eventId);
      saveLocalEvents(current);
      return { ok: true, deleted: eventId };
    }
  },
};