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
  DailyQuiz,
  DailyQuizCreate,
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
  Terminal,
  Trash2,
  Edit3,
  Calendar,
  Sparkles,
  UserIcon,
  BadgeCheck,
} from "lucide-react";
import toast from "react-hot-toast";

type TabType = "submissions" | "manage_tasks" | "daily_quiz" | "users" | "milestones" | "mints" | "audit";

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
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [togglingTaskId, setTogglingTaskId] = useState<number | null>(null);

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

  // Daily Quiz state
  const [quizzes, setQuizzes] = useState<DailyQuiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizForm, setQuizForm] = useState<DailyQuizCreate>({
    quiz_date: "",
    title: "",
    topic: "Smart Contract Security",
    description: "",
    question: "",
    options: [
      { id: 0, text: "" },
      { id: 1, text: "" },
      { id: 2, text: "" },
      { id: 3, text: "" },
    ],
    correct_index: 0,
    explanation: "",
    points: 50,
    is_active: true,
  });

  useEffect(() => {
    // Set date client-side
    setQuizForm((prev) => ({
      ...prev,
      quiz_date: prev.quiz_date || new Date().toISOString().slice(0, 10),
    }));
  }, []);

  useEffect(() => {
    if (activeTab === "submissions") loadSubmissions();
    if (activeTab === "manage_tasks") loadTasks();
    if (activeTab === "daily_quiz") loadQuizzes();
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

  async function loadQuizzes() {
    try {
      setLoadingQuizzes(true);
      const data = await api.getAdminQuizzes();
      setQuizzes(data || []);
    } catch (err) {
      console.error("Failed to load quizzes:", err);
      toast.error("Failed to load daily quizzes");
      setQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  }

  function openCreateQuiz() {
    setEditingQuizId(null);
    setQuizForm({
      quiz_date: new Date().toISOString().slice(0, 10),
      title: "",
      topic: "Smart Contract Security",
      description: "",
      question: "",
      options: [
        { id: 0, text: "" },
        { id: 1, text: "" },
        { id: 2, text: "" },
        { id: 3, text: "" },
      ],
      correct_index: 0,
      explanation: "",
      points: 50,
      is_active: true,
    });
    setShowQuizModal(true);
  }

  function openEditQuiz(q: DailyQuiz) {
    setEditingQuizId(q.id);
    setQuizForm({
      quiz_date: q.quiz_date,
      title: q.title,
      topic: q.topic || "Web3 Security",
      description: q.description || "",
      question: q.question,
      options: q.options && q.options.length === 4 ? q.options : [
        { id: 0, text: "" },
        { id: 1, text: "" },
        { id: 2, text: "" },
        { id: 3, text: "" },
      ],
      correct_index: q.correct_index ?? 0,
      explanation: q.explanation || "",
      points: q.points || 50,
      is_active: q.is_active,
    });
    setShowQuizModal(true);
  }

  function loadSampleQuiz(sampleType: "security" | "gas" | "eip712" | "l2") {
    const samples = {
      security: {
        title: "Smart Contract Reentrancy Basics: Detection & Prevention",
        topic: "Smart Contract Security",
        description: "Test your understanding of Checks-Effects-Interactions pattern, mutex guards, and fallback vulnerability surfaces.",
        question: "Which design pattern or guard is considered the canonical standard in Solidity to safely prevent recursive external reentrancy exploits?",
        options: [
          { id: 0, text: "Checks-Effects-Interactions (CEI) pattern + OpenZeppelin ReentrancyGuard" },
          { id: 1, text: "Using tx.origin == msg.sender verification" },
          { id: 2, text: "Transferring ETH before deducting user internal balance" },
          { id: 3, text: "Using call() with unlimited gas forwarded to arbitrary addresses" },
        ],
        correct_index: 0,
        explanation: "The CEI pattern ensures state variables are updated prior to any external contract call, eliminating reentrancy.",
      },
      gas: {
        title: "EVM Gas Optimization: Storage vs Memory vs Calldata",
        topic: "EVM Optimization",
        description: "Master gas reduction techniques for high-performance Solidity smart contracts.",
        question: "When passing an unmodifiable dynamic array into an external function, which data location provides the lowest gas consumption?",
        options: [
          { id: 0, text: "calldata — read-only directly from transaction input data without copying" },
          { id: 1, text: "memory — allocates temporary RAM space in EVM execution" },
          { id: 2, text: "storage — persists the array in contract state slots" },
          { id: 3, text: "stack — stores the entire array in the 1024-deep EVM stack" },
        ],
        correct_index: 0,
        explanation: "calldata avoids EVM memory allocation and copying overhead by reading function arguments directly from the immutable transaction payload.",
      },
      eip712: {
        title: "EIP-712 Typed Structured Data Signing & Gasless Permits",
        topic: "Signatures & Cryptography",
        description: "Explore cryptographic message signing, domain separators, and off-chain authorization workflows.",
        question: "Why was EIP-712 introduced as a replacement for raw eth_sign hex strings in modern Web3 dApps?",
        options: [
          { id: 0, text: "To present human-readable structured data in wallet prompts and prevent blind signing attacks" },
          { id: 1, text: "To reduce transaction fees on Ethereum Mainnet" },
          { id: 2, text: "To replace ECDSA signatures with RSA encryption" },
          { id: 3, text: "To allow smart contracts to sign transactions without private keys" },
        ],
        correct_index: 0,
        explanation: "EIP-712 standardizes typed structured hashing, allowing users to verify all fields and domain parameters before signing.",
      },
      l2: {
        title: "Layer 2 Scaling: Optimistic Rollups vs ZK-Rollups",
        topic: "Layer 2 Architecture",
        description: "Compare fraud proofs, validity proofs, finality guarantees, and data availability on Base & Ethereum.",
        question: "What is the primary difference in finality between an Optimistic Rollup (like Base) and a Zero-Knowledge Rollup?",
        options: [
          { id: 0, text: "Optimistic rollups require a 7-day challenge window for fraud proofs, while ZK rollups achieve mathematical finality upon validity proof verification" },
          { id: 1, text: "Optimistic rollups are always cheaper than ZK rollups for every transaction type" },
          { id: 2, text: "ZK rollups do not post any data back to Ethereum L1" },
          { id: 3, text: "Optimistic rollups cannot execute Solidity smart contracts" },
        ],
        correct_index: 0,
        explanation: "Optimistic rollups rely on dispute periods while ZK rollups verify validity proofs on Ethereum L1 directly.",
      },
    };

    const s = samples[sampleType];
    setQuizForm((prev) => ({
      ...prev,
      title: s.title,
      topic: s.topic,
      description: s.description,
      question: s.question,
      options: s.options,
      correct_index: s.correct_index,
      explanation: s.explanation,
    }));
    toast.success(`Loaded ${s.topic} template!`);
  }

  async function handleSaveQuiz() {
    if (!quizForm.title.trim() || !quizForm.question.trim()) {
      toast.error("Title and question are required");
      return;
    }
    if (quizForm.options.some((o) => !o.text.trim())) {
      toast.error("All 4 options (A, B, C, D) must have text");
      return;
    }
    setIsSubmittingQuiz(true);
    try {
      if (editingQuizId) {
        await api.updateAdminQuiz(editingQuizId, quizForm);
        toast.success("Daily Quiz updated successfully! ✨");
      } else {
        await api.createAdminQuiz(quizForm);
        toast.success("Daily Quiz published successfully! 🎉");
      }
      setShowQuizModal(false);
      setEditingQuizId(null);
      await loadQuizzes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save quiz";
      toast.error(msg);
    } finally {
      setIsSubmittingQuiz(false);
    }
  }

  async function handleDeleteQuiz(id: number) {
    if (!confirm("Are you sure you want to delete this quiz?")) return;
    try {
      await api.deleteAdminQuiz(id);
      toast.success("Quiz deleted");
      await loadQuizzes();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleToggleQuizActive(quiz: DailyQuiz) {
    try {
      await api.updateAdminQuiz(quiz.id, { is_active: !quiz.is_active });
      toast.success(quiz.is_active ? "Quiz deactivated" : "Quiz set to active!");
      await loadQuizzes();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed");
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

  const handleDeleteTask = async (taskId: number, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete quest #${taskId} ("${title}")? This action cannot be undone.`)) {
      return;
    }
    try {
      setDeletingTaskId(taskId);
      await api.deleteAdminTask(taskId);
      toast.success(`Quest #${taskId} deleted successfully`);
      await loadTasks();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete quest");
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleArchiveTask = async (taskId: number) => {
    try {
      setTogglingTaskId(taskId);
      await api.archiveAdminTask(taskId);
      toast.success(`Quest #${taskId} archived`);
      await loadTasks();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to archive quest");
    } finally {
      setTogglingTaskId(null);
    }
  };

  const handlePublishTask = async (taskId: number) => {
    try {
      setTogglingTaskId(taskId);
      await api.publishAdminTask(taskId);
      toast.success(`Quest #${taskId} published`);
      await loadTasks();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to publish quest");
    } finally {
      setTogglingTaskId(null);
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
            { id: "daily_quiz", label: "Daily Quiz", icon: Terminal },
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-ink text-sm">Submission #{sub.id}</span>
                        <span className="text-ink-4">•</span>
                        <span className="text-xs text-ink-3">
                          {sub.task_title ? `${sub.task_title} (Quest #${sub.task_id})` : `Quest ID #${sub.task_id}`}
                        </span>
                        <span className="text-ink-4">•</span>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/25 text-accent-fg font-mono text-xs font-semibold">
                          <UserIcon className="w-3 h-3 shrink-0" />
                          <span>
                            {sub.username ? `${sub.username}.bcl` : sub.wallet ? `${sub.wallet.slice(0, 6)}…${sub.wallet.slice(-4)}` : `User #${sub.user_id ?? "Unknown"}`}
                          </span>
                        </div>
                      </div>
                      <div className="bg-page p-3 rounded-lg border border-ink/[0.06] space-y-2 text-xs font-sans">
                        {/* Submitter Info Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-ink/[0.06]">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-ink-4 font-semibold text-[11px] uppercase tracking-wider">Submitter:</span>
                            {sub.username && (
                              <span className="font-bold text-ink flex items-center gap-1 bg-surface px-2 py-0.5 rounded border border-ink/5 text-xs">
                                <span>{sub.username}.bcl</span>
                                <BadgeCheck className="w-3.5 h-3.5 text-accent-fg shrink-0" />
                              </span>
                            )}
                            {sub.wallet ? (
                              <span className="font-mono text-ink-2 text-xs select-all bg-surface px-2 py-0.5 rounded border border-ink/5">
                                {sub.wallet}
                              </span>
                            ) : sub.user_id ? (
                              <span className="font-mono text-ink-3 text-xs">User ID: #{sub.user_id}</span>
                            ) : null}
                          </div>
                          {sub.wallet && (
                            <a
                              href={getExplorerUrl(sub.wallet, "address")}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent-fg hover:underline inline-flex items-center gap-1 text-[11px] font-mono shrink-0"
                              title="View submitter on Botchain explorer"
                            >
                              <span>View Wallet</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          )}
                        </div>

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
                            <span className="text-ink-4 mr-1.5 font-medium">Proof:</span>
                            <span className="font-mono">{textProof}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-ink-4 flex items-center justify-between">
                          <span>Received: {new Date(sub.created_at).toLocaleString()}</span>
                          {sub.user_id && <span className="font-mono text-ink-5">UID: #{sub.user_id}</span>}
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
              {tasks.map((task) => {
                const isPublished = task.status === "published";
                const isArchived = task.status === "archived";
                return (
                  <div key={task.id} className="surface-card rounded-2xl p-4 border border-ink/[0.06] flex flex-col justify-between gap-3 shadow-sm">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-ink-3 uppercase font-mono font-bold">
                            #{task.id} • {task.verification_type}
                          </span>
                          <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border ${
                            isPublished
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : isArchived
                              ? "bg-ink/5 text-ink-4 border-ink/10"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          }`}>
                            {task.status || "active"}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-accent-fg font-mono">+{task.points} PTS</span>
                      </div>
                      <h4 className="text-sm font-bold font-heading text-ink">{task.title}</h4>
                      <p className="text-xs text-ink-3 line-clamp-2">{task.description}</p>
                    </div>

                    {/* Quest actions */}
                    <div className="pt-2 border-t border-ink/[0.04] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {isPublished ? (
                          <button
                            onClick={() => handleArchiveTask(task.id)}
                            disabled={togglingTaskId === task.id}
                            className="text-[11px] font-semibold text-ink-3 hover:text-ink bg-ink/5 hover:bg-ink/10 px-2.5 py-1 rounded-lg transition cursor-pointer disabled:opacity-50"
                          >
                            {togglingTaskId === task.id ? "Archiving..." : "Archive"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePublishTask(task.id)}
                            disabled={togglingTaskId === task.id}
                            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg transition cursor-pointer disabled:opacity-50"
                          >
                            {togglingTaskId === task.id ? "Publishing..." : "Publish"}
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteTask(task.id, task.title)}
                        disabled={deletingTaskId === task.id}
                        className="flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400 hover:text-red-700 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg transition cursor-pointer disabled:opacity-50"
                        title="Permanently delete quest"
                      >
                        {deletingTaskId === task.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        <span>Delete Quest</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: DAILY QUIZ ── */}
      {activeTab === "daily_quiz" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink/[0.06] pb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink">Admin Daily Web3 Micro-Quizzes</span>
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-500">
                {quizzes.length} Quizzes Configured
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadQuizzes}
                disabled={loadingQuizzes}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink/[0.08] hover:bg-ink/[0.04] text-ink-3 hover:text-ink cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${loadingQuizzes ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={openCreateQuiz}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white font-bold cursor-pointer shadow-md shadow-amber-500/20"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Create / Set Daily Quiz</span>
              </button>
            </div>
          </div>

          {/* Create / Edit Quiz Modal */}
          {showQuizModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
              <div className="relative w-full max-w-2xl rounded-2xl bg-surface border border-ink/10 p-6 md:p-8 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between border-b border-ink/[0.08] pb-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-mono text-[10px] font-bold uppercase">
                      Admin Quiz Management
                    </span>
                    <h3 className="text-xl font-heading font-bold text-ink">
                      {editingQuizId ? "Edit Daily Micro-Quiz" : "Create & Schedule Daily Quiz"}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowQuizModal(false)}
                    className="w-8 h-8 rounded-full bg-ink/5 hover:bg-ink/10 flex items-center justify-center text-ink-4 hover:text-ink"
                  >
                    ✕
                  </button>
                </div>

                {/* Quick Templates Bar */}
                <div className="bg-ink/[0.02] border border-ink/[0.08] rounded-xl p-3 space-y-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-ink-4 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Quick Templates (One-Click Prefill)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => loadSampleQuiz("security")}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-ink/10 hover:border-amber-500/40 text-[11px] font-semibold text-ink"
                    >
                      🛡️ Reentrancy Security
                    </button>
                    <button
                      type="button"
                      onClick={() => loadSampleQuiz("gas")}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-ink/10 hover:border-amber-500/40 text-[11px] font-semibold text-ink"
                    >
                      ⚡ EVM Gas
                    </button>
                    <button
                      type="button"
                      onClick={() => loadSampleQuiz("eip712")}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-ink/10 hover:border-amber-500/40 text-[11px] font-semibold text-ink"
                    >
                      ✍️ EIP-712 Signatures
                    </button>
                    <button
                      type="button"
                      onClick={() => loadSampleQuiz("l2")}
                      className="px-2.5 py-1 rounded-lg bg-surface border border-ink/10 hover:border-amber-500/40 text-[11px] font-semibold text-ink"
                    >
                      ⛓️ L2 Rollups
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase font-bold text-ink-4 block mb-1">
                      Active Date (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      value={quizForm.quiz_date}
                      onChange={(e) => setQuizForm({ ...quizForm, quiz_date: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-ink/10 bg-surface text-ink"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase font-bold text-ink-4 block mb-1">
                      Category / Topic
                    </label>
                    <input
                      type="text"
                      value={quizForm.topic}
                      onChange={(e) => setQuizForm({ ...quizForm, topic: e.target.value })}
                      placeholder="e.g. Smart Contract Security"
                      className="w-full text-xs p-2.5 rounded-lg border border-ink/10 bg-surface text-ink"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase font-bold text-ink-4 block mb-1">
                      Reward Points (XP)
                    </label>
                    <input
                      type="number"
                      value={quizForm.points}
                      onChange={(e) => setQuizForm({ ...quizForm, points: Number(e.target.value) || 50 })}
                      className="w-full text-xs p-2.5 rounded-lg border border-ink/10 bg-surface text-ink"
                      min={10}
                      max={500}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase font-bold text-ink-4 block mb-1">
                    Quiz Title
                  </label>
                  <input
                    type="text"
                    value={quizForm.title}
                    onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                    placeholder="e.g. Smart Contract Reentrancy Basics: Detection & Prevention"
                    className="w-full text-xs p-2.5 rounded-lg border border-ink/10 bg-surface text-ink font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase font-bold text-ink-4 block mb-1">
                    Description / Banner Subtitle
                  </label>
                  <input
                    type="text"
                    value={quizForm.description}
                    onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                    placeholder="Brief 1-line overview of the challenge"
                    className="w-full text-xs p-2.5 rounded-lg border border-ink/10 bg-surface text-ink"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase font-bold text-ink-4 block mb-1">
                    Full Question Prompt
                  </label>
                  <textarea
                    rows={3}
                    value={quizForm.question}
                    onChange={(e) => setQuizForm({ ...quizForm, question: e.target.value })}
                    placeholder="Enter the question to test developers and community citizens..."
                    className="w-full text-xs p-2.5 rounded-lg border border-ink/10 bg-surface text-ink"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono uppercase font-bold text-ink-4">
                      4 Options & Select Correct Answer
                    </label>
                    <span className="text-[10px] text-amber-500 font-bold">
                      Click letter to mark as correct answer
                    </span>
                  </div>
                  {quizForm.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuizForm({ ...quizForm, correct_index: idx })}
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition ${
                          quizForm.correct_index === idx
                            ? "bg-accent text-surface font-extrabold shadow-sm"
                            : "bg-ink/5 text-ink-4 hover:bg-ink/10"
                        }`}
                        title="Mark as correct answer"
                      >
                        {String.fromCharCode(65 + idx)}
                      </button>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...quizForm.options];
                          updated[idx] = { ...updated[idx], text: e.target.value };
                          setQuizForm({ ...quizForm, options: updated });
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                        className={`flex-1 text-xs p-2.5 rounded-lg border bg-surface text-ink ${
                          quizForm.correct_index === idx ? "border-accent ring-1 ring-accent" : "border-ink/10"
                        }`}
                        required
                      />
                      {quizForm.correct_index === idx && (
                        <span className="text-[10px] font-bold text-accent-fg bg-accent/10 px-2 py-1 rounded shrink-0">
                          Correct ✓
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase font-bold text-ink-4 block mb-1">
                    Explanation / Learning Feedback
                  </label>
                  <textarea
                    rows={2}
                    value={quizForm.explanation}
                    onChange={(e) => setQuizForm({ ...quizForm, explanation: e.target.value })}
                    placeholder="Explanation shown when users answer the quiz..."
                    className="w-full text-xs p-2.5 rounded-lg border border-ink/10 bg-surface text-ink"
                  />
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-ink/[0.08]">
                  <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={quizForm.is_active}
                      onChange={(e) => setQuizForm({ ...quizForm, is_active: e.target.checked })}
                      className="rounded accent-amber-500"
                    />
                    <span className="font-semibold">Publish as Active Quiz</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowQuizModal(false)}
                      className="px-4 py-2 rounded-lg border border-ink/10 text-xs font-bold text-ink-3 hover:text-ink cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveQuiz}
                      disabled={isSubmittingQuiz}
                      className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingQuiz ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>{editingQuizId ? "Save Changes" : "Publish Daily Quiz"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* List of quizzes */}
          {loadingQuizzes ? (
            <div className="py-12 text-center text-ink-4">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-500" />
            </div>
          ) : quizzes.length === 0 ? (
            <div className="surface-card rounded-2xl p-10 border border-ink/[0.06] text-center space-y-3">
              <Terminal className="h-8 w-8 text-amber-500 mx-auto" />
              <h3 className="font-heading font-bold text-ink">No Quizzes Configured Yet</h3>
              <p className="text-xs text-ink-3 max-w-sm mx-auto">
                Set today's Web3 daily micro-quiz with custom questions, options, and XP rewards.
              </p>
              <button
                onClick={openCreateQuiz}
                className="btn-green px-5 py-2 rounded-full text-xs font-bold mt-2"
              >
                Create First Daily Quiz
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((q) => (
                <div key={q.id} className="surface-card rounded-2xl p-5 border border-ink/[0.06] flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-ink-4 uppercase">
                          {q.quiz_date}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ink/5 text-ink-3">
                          {q.topic}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          q.is_active ? "bg-accent/20 text-accent-fg" : "bg-ink/5 text-ink-4"
                        }`}>
                          {q.is_active ? "ACTIVE" : "INACTIVE"}
                        </span>
                        <span className="text-xs font-bold text-amber-500">+{q.points} XP</span>
                      </div>
                    </div>

                    <h4 className="text-base font-bold font-heading text-ink">{q.title}</h4>
                    <p className="text-xs text-ink-3 line-clamp-2">{q.question}</p>

                    <div className="space-y-1 pt-1">
                      {q.options?.map((opt, i) => (
                        <div
                          key={i}
                          className={`text-[11px] p-2 rounded-lg border ${
                            q.correct_index === i
                              ? "border-accent/40 bg-accent/5 font-semibold text-ink"
                              : "border-ink/5 text-ink-4"
                          }`}
                        >
                          <span className="font-mono mr-1.5 text-ink-4">{String.fromCharCode(65 + i)}.</span>
                          {opt.text}
                          {q.correct_index === i && (
                            <span className="ml-1.5 text-accent-fg font-bold">✓ (Correct)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-ink/[0.06] pt-3 text-xs">
                    <button
                      onClick={() => handleToggleQuizActive(q)}
                      className="text-xs font-semibold text-ink-3 hover:text-ink cursor-pointer"
                    >
                      {q.is_active ? "Deactivate" : "Set Active"}
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditQuiz(q)}
                        className="p-1.5 rounded-lg border border-ink/10 hover:bg-ink/5 text-ink cursor-pointer"
                        title="Edit Quiz"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(q.id)}
                        className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-500 cursor-pointer"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
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