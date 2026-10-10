"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  api,
  Task,
  TaskSubmission,
  NFTMintRecord,
  User as UserType,
  Milestone,
} from "@/lib/api";
import { getExplorerUrl } from "@/lib/contracts";
import {
  Shield,
  Loader2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  PlusCircle,
  ListOrdered,
  History,
  Zap,
  Users,
  Award,
  Search,
  Lock,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

type TabType = "submissions" | "manage_tasks" | "users" | "milestones" | "mints" | "audit";

interface AuditLog {
  id: number;
  actor: string;
  action: string;
  target: string;
  meta: Record<string, unknown>;
  created_at: string;
}

export default function AdminPage() {
  const { isAdmin, walletAddress, connectWallet } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("submissions");

  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    image_url: "",
    points: 100,
    verification_type: "onchain_tx" as Task["verification_type"],
    repeatable: false,
    publish: true,
  });
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const [adminUsers, setAdminUsers] = useState<UserType[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [adjustPointsModal, setAdjustPointsModal] = useState<{ userId: number; wallet: string } | null>(null);
  const [pointsDelta, setPointsDelta] = useState(100);
  const [pointsReason, setPointsReason] = useState("");
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [showCreateMilestoneModal, setShowCreateMilestoneModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    milestone_type: "task" as "level" | "task" | "streak" | "community",
    type_ref_id: 1,
    name: "",
    description: "",
    metadata_uri: "",
    points_threshold: 100,
  });
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
  const [awardMilestoneModal, setAwardMilestoneModal] = useState<Milestone | null>(null);
  const [awardWallet, setAwardWallet] = useState("");
  const [isAwardingMilestone, setIsAwardingMilestone] = useState(false);

  const [mints, setMints] = useState<NFTMintRecord[]>([]);
  const [loadingMints, setLoadingMints] = useState(false);
  const [retryingMintId, setRetryingMintId] = useState<number | null>(null);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    if (activeTab === "submissions") loadSubmissions();
    if (activeTab === "manage_tasks") loadTasks();
    if (activeTab === "users") loadUsers();
    if (activeTab === "milestones") loadMilestones();
    if (activeTab === "mints") loadMints();
    if (activeTab === "audit") loadAuditLogs();
  }, [activeTab]);

  async function loadSubmissions() {
    try {
      setLoadingSubs(true);
      const data = await api.getAdminSubmissions("under_review");
      setSubmissions(data || []);
    } catch (err) {
      console.error("Failed to load submissions:", err);
      setSubmissions([]);
    } finally {
      setLoadingSubs(false);
    }
  }

  async function loadTasks() {
    try {
      setLoadingTasks(true);
      const data = await api.getAdminTasks();
      setTasks(data || []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
      setTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  }

  async function loadUsers(q?: string) {
    try {
      setLoadingUsers(true);
      const data = await api.getAdminUsers(q !== undefined ? q : userSearchQuery);
      setAdminUsers(data || []);
    } catch (err) {
      console.error("Failed to load users:", err);
      setAdminUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadMilestones() {
    try {
      setLoadingMilestones(true);
      const data = await api.getMilestones();
      setMilestones(data || []);
    } catch (err) {
      console.error("Failed to load milestones:", err);
      setMilestones([]);
    } finally {
      setLoadingMilestones(false);
    }
  }

  async function loadMints() {
    try {
      setLoadingMints(true);
      const data = await api.getAdminMints();
      setMints(data || []);
    } catch (err) {
      console.error("Failed to load mints:", err);
      setMints([]);
    } finally {
      setLoadingMints(false);
    }
  }

  async function loadAuditLogs() {
    try {
      setLoadingAudit(true);
      const data = await api.getAdminAuditLogs(50);
      setAuditLogs(data || []);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setAuditLogs([]);
    } finally {
      setLoadingAudit(false);
    }
  }

  const handleReview = async (id: number, approve: boolean) => {
    try {
      setReviewingId(id);
      await api.reviewSubmission(id, approve, approve ? "Verified by admin" : "Proof insufficient");
      toast.success(approve ? "Approved! Points and milestone badge awarded." : "Submission rejected.");
      await loadSubmissions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Review action failed");
    } finally {
      setReviewingId(null);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingTask(true);
      await api.createAdminTask({ ...newTask, image_url: newTask.image_url.trim() || undefined });
      toast.success("New quest published!");
      setNewTask({
        title: "",
        description: "",
        image_url: "",
        points: 100,
        verification_type: "onchain_tx",
        repeatable: false,
        publish: true,
      });
      setShowCreateModal(false);
      await loadTasks();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create quest");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleAdjustPointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustPointsModal) return;
    if (!pointsReason.trim()) {
      toast.error("Please provide a reason for the audit trail");
      return;
    }
    try {
      setIsAdjustingPoints(true);
      await api.adjustUserPoints(adjustPointsModal.userId, pointsDelta, pointsReason.trim());
      toast.success(`Adjusted points by ${pointsDelta > 0 ? "+" : ""}${pointsDelta} PTS`);
      setAdjustPointsModal(null);
      setPointsReason("");
      await loadUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to adjust points");
    } finally {
      setIsAdjustingPoints(false);
    }
  };

  const handleToggleAdminRole = async (user: UserType) => {
    const willGrant = !user.is_admin;
    try {
      await api.setUserRole(user.id, "admin", willGrant);
      toast.success(willGrant ? "Granted Admin role" : "Revoked Admin role");
      await loadUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Role change failed");
    }
  };

  const handleToggleSuspend = async (user: UserType) => {
    const willSuspend = user.status !== "suspended";
    try {
      await api.suspendUser(user.id, willSuspend);
      toast.success(willSuspend ? "User suspended" : "User unsuspended");
      await loadUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Suspension action failed");
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingMilestone(true);
      await api.createMilestone(newMilestone);
      toast.success("Milestone registered!");
      setShowCreateMilestoneModal(false);
      await loadMilestones();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to register milestone");
    } finally {
      setIsCreatingMilestone(false);
    }
  };

  const handleAwardMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!awardMilestoneModal || !awardWallet.trim()) return;
    try {
      setIsAwardingMilestone(true);
      await api.awardMilestone(awardMilestoneModal.token_id, awardWallet.trim());
      toast.success(`Milestone #${awardMilestoneModal.token_id} awarded to ${awardWallet.slice(0, 8)}...`);
      setAwardMilestoneModal(null);
      setAwardWallet("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Award action failed");
    } finally {
      setIsAwardingMilestone(false);
    }
  };

  const handleRetryMint = async (id: number) => {
    try {
      setRetryingMintId(id);
      await api.retryFailedMint(id);
      toast.success("Badge delivery re-queued");
      await loadMints();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetryingMintId(null);
    }
  };

  if (!walletAddress) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-24 text-center">
        <div className="surface-card rounded-2xl p-7 space-y-4 border border-ink/[0.08] shadow-2xl">
          <div className="h-12 w-12 rounded-xl bg-brand/10 border border-brand/30 text-brand mx-auto flex items-center justify-center">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold font-heading text-ink">Admin Console</h2>
          <p className="text-xs text-ink-3 leading-relaxed font-sans">
            Manage quest verification, milestone registration, badge delivery, and user roles on Botchain.
          </p>
          <div className="pt-2">
            <button
              onClick={connectWallet}
              className="w-full rounded-xl bg-brand hover:bg-brand-hi text-white font-bold py-2.5 text-xs transition cursor-pointer shadow-lg shadow-brand/25"
            >
              Connect Administrator Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="w-full max-w-lg mx-auto px-4 py-24 text-center">
        <div className="surface-card rounded-2xl p-7 space-y-4 border border-red-500/20 bg-[#0c101a] shadow-2xl">
          <div className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold font-heading text-white">Access Denied</h2>
          <div className="text-xs text-zinc-400 space-y-2 font-sans">
            <p>
              Connected Wallet:{" "}
              <span className="font-mono text-zinc-200">
                {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
              </span>
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This account is not authorized to manage the club administration console on Botchain.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={connectWallet}
              className="w-full rounded-xl border border-white/10 hover:bg-white/[0.04] text-zinc-300 font-semibold py-2.5 text-xs transition cursor-pointer"
            >
              Switch to Authorized Admin Wallet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/[0.08] pb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand/10 border border-brand/30 text-brand flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-heading text-ink tracking-tight">Club Admin Dashboard</h1>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold tracking-wider">
                ADMIN AUTHORIZED
              </span>
            </div>
            <p className="text-xs text-ink-3 mt-0.5">
              Connected Admin: <span className="font-mono">{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</span>
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-surface border border-ink/[0.08] p-1 rounded-xl text-xs overflow-x-auto">
          {[
            { id: "submissions", label: "Review Queue", icon: ListOrdered },
            { id: "manage_tasks", label: "Quests", icon: PlusCircle },
            { id: "users", label: "Users & Moderation", icon: Users },
            { id: "milestones", label: "Milestones", icon: Award },
            { id: "mints", label: "Badge Deliveries", icon: Zap },
            { id: "audit", label: "Activity Logs", icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-brand text-white font-bold shadow-md shadow-brand/30"
                    : "text-ink-3 hover:text-ink-2"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB 1: REVIEW QUEUE ── */}
      {activeTab === "submissions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3 text-xs">
            <span className="text-ink-3">
              Pending Submissions: <strong className="text-ink">{submissions.length}</strong>
            </span>
            <button
              onClick={loadSubmissions}
              className="text-brand hover:text-brand-hi font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>REFRESH QUEUE</span>
            </button>
          </div>

          {loadingSubs ? (
            <div className="surface-card rounded-2xl p-16 text-center text-ink-4 text-xs">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-brand" />
              <span>Querying pending submissions...</span>
            </div>
          ) : submissions.length === 0 ? (
            <div className="surface-card rounded-2xl p-16 text-center text-ink-3 text-xs space-y-1">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-700 dark:text-emerald-400 opacity-60 mb-2" />
              <div className="text-ink font-bold text-sm">Review Queue Empty</div>
              <p className="text-ink-4">All submissions have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => {
                const evidenceObj = sub.evidence as Record<string, unknown> | undefined;
                const txHash = sub.tx_hash || (evidenceObj?.tx_hash as string);
                const textProof = (evidenceObj?.text as string) || (evidenceObj?.url as string);
                return (
                  <div
                    key={sub.id}
                    className="surface-card rounded-2xl p-5 border border-ink/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink text-sm">Submission #{sub.id}</span>
                        <span className="text-ink-4">•</span>
                        <span className="text-xs text-ink-3">Quest ID #{sub.task_id}</span>
                        <span className="text-ink-4">•</span>
                        <span className="text-ink-2 truncate font-mono text-[11px]">{sub.wallet}</span>
                      </div>
                      <div className="bg-page p-3 rounded-lg border border-ink/[0.06] space-y-1.5 text-xs font-sans">
                        {txHash && (
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs">
                            <span className="text-ink-4 font-sans">Tx:</span>
                            <a
                              href={getExplorerUrl(txHash, "tx")}
                              target="_blank"
                              rel="noreferrer"
                              className="underline hover:text-emerald-300 flex items-center gap-1 truncate font-mono"
                            >
                              <span>{txHash}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          </div>
                        )}
                        {textProof && (
                          <div className="text-ink-2 break-words">
                            <span className="text-ink-4 mr-1.5">Proof:</span>
                            {textProof}
                          </div>
                        )}
                        <div className="text-[10px] text-ink-4">
                          Received: {new Date(sub.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleReview(sub.id, true)}
                        disabled={reviewingId === sub.id}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2 text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {reviewingId === sub.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        <span>APPROVE</span>
                      </button>
                      <button
                        onClick={() => handleReview(sub.id, false)}
                        disabled={reviewingId === sub.id}
                        className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-500/20 font-bold px-4 py-2 text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>REJECT</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: MANAGE QUESTS ── */}
      {activeTab === "manage_tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3">
            <span className="text-xs text-ink-3">
              Active Quests: <strong className="text-ink">{tasks.length}</strong>
            </span>
            <button
              onClick={() => setShowCreateModal(!showCreateModal)}
              className="flex items-center gap-1.5 rounded-xl bg-brand hover:bg-brand-hi text-white font-bold px-4 py-2 text-xs transition cursor-pointer shadow-md shadow-brand/20"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>{showCreateModal ? "CLOSE FORM" : "CREATE NEW QUEST"}</span>
            </button>
          </div>

          {showCreateModal && (
            <div className="surface-card rounded-2xl p-6 border border-brand/30 bg-surface space-y-4 animate-in fade-in">
              <h3 className="text-sm font-bold font-heading text-ink">Create New Builder Quest</h3>
              <form onSubmit={handleCreateTask} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-[11px] text-ink-3 uppercase mb-1">Quest Title</label>
                  <input
                    type="text"
                    required
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="e.g. Deploy Counter Contract on Testnet"
                    className="w-full bg-page border border-ink/[0.1] rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-ink-3 uppercase mb-1">Description &amp; Criteria</label>
                  <textarea
                    rows={3}
                    required
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Instructions, contract parameters, or GitHub requirements..."
                    className="w-full bg-page border border-ink/[0.1] rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-ink-3 uppercase mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    value={newTask.image_url}
                    onChange={(e) => setNewTask({ ...newTask, image_url: e.target.value })}
                    placeholder="https://… or /quests/cover.svg (blank = category default)"
                    className="w-full bg-page border border-ink/[0.1] rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                  />
                  {newTask.image_url.trim() && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={newTask.image_url.trim()}
                      alt="Cover preview"
                      className="mt-2 h-24 w-full rounded-lg object-cover border border-ink/[0.08]"
                    />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-ink-3 uppercase mb-1">Points Value</label>
                    <input
                      type="number"
                      required
                      min={10}
                      max={5000}
                      value={newTask.points}
                      onChange={(e) => setNewTask({ ...newTask, points: Number(e.target.value) })}
                      className="w-full bg-page border border-ink/[0.1] rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-ink-3 uppercase mb-1">Verification Method</label>
                    <select
                      value={newTask.verification_type}
                      onChange={(e) =>
                        setNewTask({ ...newTask, verification_type: e.target.value as Task["verification_type"] })
                      }
                      className="w-full bg-page border border-ink/[0.1] rounded-lg px-3 py-2 text-xs text-ink focus:outline-none"
                    >
                      <option value="onchain_tx">On-Chain Tx Hash</option>
                      <option value="nft_ownership">NFT Ownership</option>
                      <option value="manual">Manual Evidence (GitHub / PR)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-ink/[0.06]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg text-ink-3 hover:text-ink"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTask}
                    className="px-5 py-2 rounded-lg bg-brand hover:bg-brand-hi text-white font-bold transition disabled:opacity-40"
                  >
                    {isCreatingTask ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "PUBLISH QUEST"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loadingTasks ? (
            <div className="py-12 text-center text-ink-4">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-brand" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <div key={task.id} className="surface-card rounded-2xl p-4 border border-ink/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-ink-3 uppercase font-mono">
                      #{task.id} • {task.verification_type}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">+{task.points} PTS</span>
                  </div>
                  <h4 className="text-sm font-bold font-heading text-ink">{task.title}</h4>
                  <p className="text-xs text-ink-3 line-clamp-2">{task.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: USERS & MODERATION ── */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink/[0.06] pb-3 text-xs">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  loadUsers(e.target.value);
                }}
                placeholder="Search wallet or username..."
                className="w-full bg-page border border-ink/[0.1] rounded-xl pl-9 pr-3 py-2 text-xs text-ink placeholder:text-ink-4 focus:outline-none focus:border-brand"
              />
              <Search className="h-3.5 w-3.5 text-ink-4 absolute left-3 top-2.5" />
            </div>
            <button
              onClick={() => loadUsers()}
              className="text-brand hover:text-brand-hi font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
            >
              <RefreshCw className="h-3 w-3" />
              <span>REFRESH USERS</span>
            </button>
          </div>

          {loadingUsers ? (
            <div className="py-12 text-center text-ink-4">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-brand" />
            </div>
          ) : adminUsers.length === 0 ? (
            <div className="py-12 text-center text-ink-4">No matching user accounts found.</div>
          ) : (
            <div className="overflow-x-auto surface-card rounded-2xl border border-ink/[0.08]">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase text-ink-4 border-b border-ink/[0.06] bg-surface">
                  <tr>
                    <th className="py-3 px-4">Wallet</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4">Points</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/[0.04]">
                  {adminUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-ink/[0.02]">
                      <td className="py-3 px-4 font-mono text-ink-2">
                        {u.wallet_address.slice(0, 8)}...{u.wallet_address.slice(-6)}
                      </td>
                      <td className="py-3 px-4 text-ink font-medium">
                        {u.username ? `@${u.username}` : "—"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-ink-2">LVL {u.level}</td>
                      <td className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">
                        {u.total_points.toLocaleString()} PTS
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${
                            u.status === "active"
                              ? "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                              : "text-red-700 dark:text-red-400 bg-red-500/10 border border-red-500/20"
                          }`}
                        >
                          {u.status || "active"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setAdjustPointsModal({ userId: u.id, wallet: u.wallet_address })}
                            className="text-brand hover:underline font-bold text-[11px] cursor-pointer"
                          >
                            Points +/-
                          </button>
                          <span className="text-ink-5">|</span>
                          <button
                            onClick={() => handleToggleAdminRole(u)}
                            className="text-purple-700 dark:text-purple-400 hover:underline font-bold text-[11px] cursor-pointer"
                          >
                            {u.is_admin ? "Revoke Admin" : "Make Admin"}
                          </button>
                          <span className="text-ink-5">|</span>
                          <button
                            onClick={() => handleToggleSuspend(u)}
                            className="text-red-700 dark:text-red-400 hover:underline font-bold text-[11px] cursor-pointer"
                          >
                            {u.status === "suspended" ? "Unsuspend" : "Suspend"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: MILESTONES ── */}
      {activeTab === "milestones" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3 text-xs">
            <span className="text-ink-3">
              Registered Milestones: <strong className="text-ink">{milestones.length}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateMilestoneModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-brand hover:bg-brand-hi text-white font-bold px-3.5 py-1.5 text-xs transition cursor-pointer"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>NEW MILESTONE</span>
              </button>
              <button
                onClick={loadMilestones}
                className="text-brand hover:text-brand-hi font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>REFRESH</span>
              </button>
            </div>
          </div>

          {loadingMilestones ? (
            <div className="py-12 text-center text-ink-4">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-brand" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {milestones.map((m) => (
                <div key={m.id} className="surface-card rounded-2xl p-4 border border-ink/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-purple-700 dark:text-purple-400 uppercase font-bold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                      {m.milestone_type} • ID #{m.token_id}
                    </span>
                    <button
                      onClick={() => setAwardMilestoneModal(m)}
                      className="text-xs text-brand hover:underline font-bold cursor-pointer"
                    >
                      Award to Wallet →
                    </button>
                  </div>
                  <h4 className="text-sm font-bold font-heading text-ink">{m.name}</h4>
                  <p className="text-xs text-ink-3">{m.description || "No description provided."}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: BADGE DELIVERIES ── */}
      {activeTab === "mints" && (
        <div className="surface-card rounded-2xl overflow-hidden text-xs border border-ink/[0.08]">
          <div className="p-4 border-b border-ink/[0.06] flex items-center justify-between">
            <span className="text-ink font-bold">On-Chain Badge Delivery Queue</span>
            <button
              onClick={loadMints}
              className="text-brand hover:text-brand-hi font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>REFRESH</span>
            </button>
          </div>

          {loadingMints ? (
            <div className="py-12 text-center text-ink-4">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-brand" />
            </div>
          ) : mints.length === 0 ? (
            <div className="py-12 text-center text-ink-4">No badge delivery jobs recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] uppercase text-ink-4 border-b border-ink/[0.06] bg-surface">
                  <tr>
                    <th className="py-3 px-4">Job ID</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Badge ID</th>
                    <th className="py-3 px-4">Milestone</th>
                    <th className="py-3 px-4">Transaction</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/[0.04]">
                  {mints.map((m) => (
                    <tr key={m.id} className="hover:bg-ink/[0.02]">
                      <td className="py-3 px-4 text-ink-3">#{m.id}</td>
                      <td className="py-3 px-4 text-ink font-mono">{m.wallet.slice(0, 8)}...</td>
                      <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-bold">#{m.token_id}</td>
                      <td className="py-3 px-4 uppercase text-ink-2">{m.milestone_type}</td>
                      <td className="py-3 px-4 text-ink-3 max-w-[140px] truncate">
                        {m.transaction_hash ? (
                          <a
                            href={getExplorerUrl(m.transaction_hash, "tx")}
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand underline flex items-center gap-1"
                          >
                            <span>{m.transaction_hash.slice(0, 10)}...</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          "Pending"
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold ${
                            m.status === "confirmed"
                              ? "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                              : m.status === "failed"
                              ? "text-red-700 dark:text-red-400 bg-red-500/10 border border-red-500/20"
                              : "text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20"
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {m.status === "failed" && (
                          <button
                            onClick={() => handleRetryMint(m.id)}
                            disabled={retryingMintId === m.id}
                            className="text-brand hover:underline font-bold cursor-pointer disabled:opacity-40"
                          >
                            {retryingMintId === m.id ? "Retrying..." : "Retry Job"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 6: AUDIT LOGS ── */}
      {activeTab === "audit" && (
        <div className="surface-card rounded-2xl overflow-hidden text-xs border border-ink/[0.08]">
          <div className="p-4 border-b border-ink/[0.06] flex items-center justify-between">
            <span className="text-ink font-bold">Admin Activity Log</span>
            <button
              onClick={loadAuditLogs}
              className="text-brand hover:text-brand-hi font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>REFRESH</span>
            </button>
          </div>

          {loadingAudit ? (
            <div className="py-12 text-center text-ink-4">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-brand" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center text-ink-4">No activity logs recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[10px] uppercase text-ink-4 border-b border-ink/[0.06] bg-surface">
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/[0.04]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-ink/[0.02]">
                      <td className="py-3 px-4 text-ink-4">{new Date(log.created_at).toLocaleTimeString()}</td>
                      <td className="py-3 px-4 text-ink font-mono">{log.actor}</td>
                      <td className="py-3 px-4 text-brand font-bold uppercase">{log.action}</td>
                      <td className="py-3 px-4 text-ink-2 font-mono">{log.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ADJUST POINTS MODAL ── */}
      {adjustPointsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-ink/[0.1] bg-surface p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3">
              <h3 className="text-sm font-bold font-heading text-ink">Adjust User Points</h3>
              <button onClick={() => setAdjustPointsModal(null)} className="text-ink-3 hover:text-ink cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAdjustPointsSubmit} className="space-y-3 text-xs font-sans">
              <div>
                <span className="text-[11px] text-ink-4 block mb-1">Target Wallet</span>
                <span className="font-mono text-ink-2 block truncate">{adjustPointsModal.wallet}</span>
              </div>
              <div>
                <label className="block text-[11px] text-ink-3 uppercase font-medium mb-1">Points Delta (+ or -)</label>
                <input
                  type="number"
                  required
                  value={pointsDelta}
                  onChange={(e) => setPointsDelta(Number(e.target.value))}
                  placeholder="e.g. 100 or -50"
                  className="w-full bg-page border border-ink/[0.1] rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="block text-[11px] text-ink-3 uppercase font-medium mb-1">Audit Reason</label>
                <input
                  type="text"
                  required
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  placeholder="e.g. Hackathon winner bonus"
                  className="w-full bg-page border border-ink/[0.1] rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/[0.06]">
                <button type="button" onClick={() => setAdjustPointsModal(null)} className="px-3.5 py-1.5 text-ink-3 hover:text-ink">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjustingPoints}
                  className="px-4 py-1.5 rounded-lg bg-brand hover:bg-brand-hi text-white font-bold transition disabled:opacity-50"
                >
                  {isAdjustingPoints && <Loader2 className="h-3 w-3 animate-spin inline mr-1" />}
                  Apply Delta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE MILESTONE MODAL ── */}
      {showCreateMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-ink/[0.1] bg-surface p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3">
              <h3 className="text-sm font-bold font-heading text-ink">Register New Milestone</h3>
              <button onClick={() => setShowCreateMilestoneModal(false)} className="text-ink-3 hover:text-ink cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateMilestone} className="space-y-3 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-ink-3 uppercase mb-1">Type</label>
                  <select
                    value={newMilestone.milestone_type}
                    onChange={(e) =>
                      setNewMilestone({ ...newMilestone, milestone_type: e.target.value as "level" | "task" | "streak" | "community" })
                    }
                    className="w-full bg-page border border-ink/[0.1] rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                  >
                    <option value="task">Task Milestone</option>
                    <option value="level">Level Milestone</option>
                    <option value="streak">Streak Milestone</option>
                    <option value="community">Community Milestone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-ink-3 uppercase mb-1">Type Ref ID</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newMilestone.type_ref_id}
                    onChange={(e) => setNewMilestone({ ...newMilestone, type_ref_id: Number(e.target.value) })}
                    className="w-full bg-page border border-ink/[0.1] rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-ink-3 uppercase mb-1">Milestone Name</label>
                <input
                  type="text"
                  required
                  value={newMilestone.name}
                  onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                  placeholder="e.g. Master Solidity Deployer"
                  className="w-full bg-page border border-ink/[0.1] rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-ink-3 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                  placeholder="Description of the achievement..."
                  className="w-full bg-page border border-ink/[0.1] rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-ink-3 uppercase mb-1">Metadata URI (IPFS / Arweave)</label>
                <input
                  type="text"
                  value={newMilestone.metadata_uri}
                  onChange={(e) => setNewMilestone({ ...newMilestone, metadata_uri: e.target.value })}
                  placeholder="ipfs://bafy..."
                  className="w-full bg-page border border-ink/[0.1] rounded-xl px-3 py-2 text-xs text-ink focus:outline-none font-mono"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/[0.06]">
                <button type="button" onClick={() => setShowCreateMilestoneModal(false)} className="px-3.5 py-1.5 text-ink-3 hover:text-ink">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingMilestone}
                  className="px-4 py-1.5 rounded-lg bg-brand hover:bg-brand-hi text-white font-bold transition disabled:opacity-50"
                >
                  {isCreatingMilestone && <Loader2 className="h-3 w-3 animate-spin inline mr-1" />}
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── AWARD MILESTONE MODAL ── */}
      {awardMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-ink/[0.1] bg-surface p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink/[0.06] pb-3">
              <h3 className="text-sm font-bold font-heading text-ink">Award {awardMilestoneModal.name}</h3>
              <button onClick={() => setAwardMilestoneModal(null)} className="text-ink-3 hover:text-ink cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleAwardMilestoneSubmit} className="space-y-3 text-xs font-sans">
              <div>
                <span className="text-[11px] text-ink-4 block mb-1">Badge Token ID</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 block font-bold">
                  #{awardMilestoneModal.token_id}
                </span>
              </div>
              <div>
                <label className="block text-[11px] text-ink-3 uppercase font-medium mb-1">Recipient Wallet</label>
                <input
                  type="text"
                  required
                  value={awardWallet}
                  onChange={(e) => setAwardWallet(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-page border border-ink/[0.1] rounded-xl px-3 py-2 text-xs text-ink focus:outline-none font-mono"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-ink/[0.06]">
                <button type="button" onClick={() => setAwardMilestoneModal(null)} className="px-3.5 py-1.5 text-ink-3 hover:text-ink">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAwardingMilestone}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition disabled:opacity-50"
                >
                  {isAwardingMilestone && <Loader2 className="h-3 w-3 animate-spin inline mr-1" />}
                  Confirm Award
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}