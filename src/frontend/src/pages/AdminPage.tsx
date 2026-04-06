import type { Principal } from "@icp-sdk/core/principal";
import {
  Activity,
  AlertTriangle,
  Ban,
  Check,
  CheckCheck,
  Copy,
  FileText,
  Inbox,
  KeyRound,
  Loader2,
  MessageSquare,
  Reply,
  ShieldCheck,
  ShieldOff,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { LoginActivity, UserWithPrincipal } from "../backend.d";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { useLanguage } from "../contexts/LanguageContext";
import {
  useActiveUserCount,
  useAdminDeleteFeedback,
  useAdminDeleteUser,
  useAdminReplyFeedback,
  useAllFeedbackEntries,
  useAllUsersWithPrincipals,
  useBlockUser,
  useIsAdmin,
  useLoginActivityLog,
  useMarkFeedbackAsRead,
  useMarkFeedbackAsResolved,
  useSystemStats,
  useUnblockUser,
} from "../hooks/useQueries";
import type { FeedbackWithPrincipal } from "../hooks/useQueries";

const STAT_CONFIGS = [
  {
    labelKey: "adminActiveUsers" as const,
    valueKey: "active",
    icon: Users,
    color: "#22D3EE",
  },
  {
    labelKey: "adminUsers" as const,
    valueKey: "total",
    icon: User,
    color: "#A855F7",
  },
  {
    labelKey: "navAdmin" as const,
    valueKey: "role",
    icon: ShieldCheck,
    color: "#22c55e",
  },
];

function truncatePrincipal(principal: string): string {
  if (principal.length <= 20) return principal;
  return `${principal.slice(0, 12)}...${principal.slice(-6)}`;
}

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const LANG_GRADIENT: Record<string, string> = {
  en: "linear-gradient(135deg, #22D3EE, #0ea5e9)",
  th: "linear-gradient(135deg, #f59e0b, #d97706)",
  nl: "linear-gradient(135deg, #A855F7, #7c3aed)",
  pl: "linear-gradient(135deg, #ef4444, #dc2626)",
  zh: "linear-gradient(135deg, #22c55e, #16a34a)",
};

function UserRow({
  user,
  index,
  onDelete,
}: {
  user: UserWithPrincipal;
  index: number;
  onDelete: (user: UserWithPrincipal) => void;
}) {
  const { t } = useLanguage();
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  const [copied, setCopied] = useState(false);

  const principalStr = user.principal.toString();
  const truncated = truncatePrincipal(principalStr);
  const initials = getInitials(user.name);
  const langGradient =
    LANG_GRADIENT[user.language] || "linear-gradient(135deg, #22D3EE, #A855F7)";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(principalStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently ignore clipboard errors
    }
  };

  const handleToggleBlock = () => {
    if (user.isBlocked) {
      unblockMutation.mutate(user.principal);
    } else {
      blockMutation.mutate(user.principal);
    }
  };

  const isTogglePending = blockMutation.isPending || unblockMutation.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 px-4 rounded-xl"
      data-ocid={`admin.users.item.${index + 1}`}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid #1A3354",
      }}
    >
      {/* Avatar + name + language */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
          style={{
            background: langGradient,
            color: "#071427",
          }}
        >
          {initials}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium" style={{ color: "#EAF2FF" }}>
              {user.name || "Anonymous"}
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-xs font-mono"
              style={{
                background: `${langGradient.includes("EE") ? "rgba(34,211,238,0.12)" : "rgba(168,85,247,0.12)"}`,
                color: "#9BB0C9",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {user.language}
            </span>
          </div>
          {/* Principal ID row */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="text-xs font-mono truncate"
              style={{ color: "#4a6a8a" }}
              title={principalStr}
            >
              {truncated}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex-shrink-0 p-0.5 rounded transition-colors hover:bg-white/5"
              title={t.adminPrincipalId}
              data-ocid={`admin.users.item.${index + 1}`}
              style={{ color: copied ? "#22c55e" : "#22D3EE" }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Check size={12} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Copy size={12} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
          {/* Stats */}
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs" style={{ color: "#4a6a8a" }}>
              {String(user.passwordCount)} {t.adminPasswords}
            </span>
            <span className="text-xs" style={{ color: "#4a6a8a" }}>
              {String(user.noteCount)} {t.adminNotes}
            </span>
          </div>
        </div>
      </div>

      {/* Status + Actions */}
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
        {/* Status badge */}
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            background: user.isBlocked
              ? "rgba(239,68,68,0.12)"
              : "rgba(34,211,238,0.12)",
            color: user.isBlocked ? "#ef4444" : "#22D3EE",
            border: `1px solid ${user.isBlocked ? "rgba(239,68,68,0.25)" : "rgba(34,211,238,0.25)"}`,
          }}
        >
          {user.isBlocked ? t.adminUserBlocked : t.adminUserActive}
        </span>

        {/* Block / Unblock */}
        <button
          type="button"
          onClick={handleToggleBlock}
          disabled={isTogglePending}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
          data-ocid={`admin.users.item.${index + 1}`}
          style={{
            background: user.isBlocked
              ? "rgba(34,197,94,0.1)"
              : "rgba(245,158,11,0.1)",
            color: user.isBlocked ? "#22c55e" : "#f59e0b",
            border: `1px solid ${user.isBlocked ? "rgba(34,197,94,0.25)" : "rgba(245,158,11,0.25)"}`,
          }}
        >
          {isTogglePending ? (
            <Loader2 size={11} className="animate-spin" />
          ) : user.isBlocked ? (
            <ShieldOff size={11} />
          ) : (
            <Ban size={11} />
          )}
          {user.isBlocked ? t.adminUnblockUser : t.adminBlockUser}
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={() => onDelete(user)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
          data-ocid={`admin.users.delete_button.${index + 1}`}
          style={{
            background: "rgba(239,68,68,0.1)",
            color: "#ef4444",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
        >
          <Trash2 size={11} />
          {t.adminDeleteUser}
        </button>
      </div>
    </motion.div>
  );
}

function UserManagementSection() {
  const { t } = useLanguage();
  const { data: users = [], isLoading } = useAllUsersWithPrincipals();
  const deleteUserMutation = useAdminDeleteUser();
  const [deleteTarget, setDeleteTarget] = useState<UserWithPrincipal | null>(
    null,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDeleteRequest = (user: UserWithPrincipal) => {
    setDeleteTarget(user);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUserMutation.mutateAsync(deleteTarget.principal);
    } finally {
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="card-gradient-border p-5" data-ocid="admin.users.card">
        {/* Section header */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(168,85,247,0.12)",
              border: "1px solid rgba(168,85,247,0.2)",
            }}
          >
            <Users size={14} style={{ color: "#A855F7" }} />
          </div>
          <h3 className="font-semibold" style={{ color: "#EAF2FF" }}>
            {t.adminUserManagement}
          </h3>
          {users.length > 0 && (
            <span
              className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: "rgba(168,85,247,0.1)",
                color: "#A855F7",
                border: "1px solid rgba(168,85,247,0.2)",
              }}
            >
              {users.length}
            </span>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div
            className="flex items-center gap-2 py-6"
            data-ocid="admin.users.loading_state"
          >
            <Loader2
              className="animate-spin"
              size={16}
              style={{ color: "#A855F7" }}
            />
            <span className="text-sm" style={{ color: "#9BB0C9" }}>
              {t.loading}
            </span>
          </div>
        ) : users.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-10 gap-3"
            data-ocid="admin.users.empty_state"
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(168,85,247,0.06)",
                border: "1px solid rgba(168,85,247,0.12)",
              }}
            >
              <Users size={20} style={{ color: "#9BB0C9" }} />
            </div>
            <p className="text-sm" style={{ color: "#9BB0C9" }}>
              {t.noData}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((user, i) => (
              <UserRow
                key={user.principal.toString()}
                user={user}
                index={i}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          data-ocid="admin.users.dialog"
          style={{
            background: "#0a1628",
            border: "1px solid #1A3354",
            color: "#EAF2FF",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#EAF2FF" }}>
              {t.adminConfirmDelete}
            </DialogTitle>
            <DialogDescription style={{ color: "#9BB0C9" }}>
              {t.adminConfirmDeleteDesc}
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div
              className="px-3 py-2 rounded-lg text-xs font-mono"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.15)",
                color: "#ef4444",
              }}
            >
              {truncatePrincipal(deleteTarget.principal.toString())}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={deleteUserMutation.isPending}
              data-ocid="admin.users.cancel_button"
              style={{
                borderColor: "#1A3354",
                color: "#9BB0C9",
                background: "transparent",
              }}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleteUserMutation.isPending}
              data-ocid="admin.users.confirm_button"
              style={{
                background: deleteUserMutation.isPending
                  ? "rgba(239,68,68,0.4)"
                  : "rgba(239,68,68,0.85)",
                color: "#fff",
                border: "1px solid rgba(239,68,68,0.5)",
              }}
            >
              {deleteUserMutation.isPending ? (
                <Loader2 className="animate-spin mr-2" size={14} />
              ) : (
                <Trash2 size={14} className="mr-2" />
              )}
              {deleteUserMutation.isPending ? t.loading : t.adminDeleteUser}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type FeedbackFilter = "all" | "unread" | "read" | "resolved";

function FeedbackStatusBadge({ fb }: { fb: FeedbackWithPrincipal }) {
  if ("unread" in fb.status) {
    return (
      <span
        className="px-2 py-0.5 rounded-full text-xs font-medium"
        style={{
          background: "rgba(245,158,11,0.12)",
          color: "#f59e0b",
          border: "1px solid rgba(245,158,11,0.25)",
        }}
      >
        Unread
      </span>
    );
  }
  if ("resolved" in fb.status) {
    return (
      <span
        className="px-2 py-0.5 rounded-full text-xs font-medium"
        style={{
          background: "rgba(34,197,94,0.12)",
          color: "#22c55e",
          border: "1px solid rgba(34,197,94,0.25)",
        }}
      >
        Resolved
      </span>
    );
  }
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: "rgba(34,211,238,0.12)",
        color: "#22D3EE",
        border: "1px solid rgba(34,211,238,0.25)",
      }}
    >
      Read
    </span>
  );
}

function FeedbackItem({
  fb,
  index,
  onDeleteRequest,
}: {
  fb: FeedbackWithPrincipal;
  index: number;
  onDeleteRequest: (fb: FeedbackWithPrincipal) => void;
}) {
  const markReadMutation = useMarkFeedbackAsRead();
  const markResolvedMutation = useMarkFeedbackAsResolved();
  const replyMutation = useAdminReplyFeedback();

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  const principalStr = fb.principal.toString();
  const truncated = truncatePrincipal(principalStr);
  const timestamp = new Date(Number(fb.timestamp) / 1_000_000).toLocaleString();

  const isUnread = "unread" in fb.status;
  const isResolved = "resolved" in fb.status;
  const hasReply = fb.adminReply !== null;

  const replyTimestamp = fb.adminReplyTimestamp
    ? new Date(Number(fb.adminReplyTimestamp) / 1_000_000).toLocaleString()
    : null;

  const handleMarkRead = () => {
    markReadMutation.mutate({ user: fb.principal, feedbackId: fb.id });
  };

  const handleMarkResolved = () => {
    markResolvedMutation.mutate({ user: fb.principal, feedbackId: fb.id });
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    replyMutation.mutate(
      { user: fb.principal, feedbackId: fb.id, reply: replyText },
      {
        onSuccess: () => {
          toast.success("Reply sent successfully");
          setReplyOpen(false);
          setReplyText("");
        },
        onError: (e) => toast.error(`Failed to send reply: ${e.message}`),
      },
    );
  };

  return (
    <motion.div
      key={fb.id.toString()}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="flex flex-col gap-2 py-3 px-3 rounded-xl"
      data-ocid={`admin.feedback.item.${index + 1}`}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid #1A3354",
      }}
    >
      {/* Header row: avatar + meta + status badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(34,211,238,0.3), rgba(34,211,238,0.1))",
              border: "1px solid rgba(34,211,238,0.3)",
              color: "#22D3EE",
            }}
          >
            <MessageSquare size={12} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs" style={{ color: "#9BB0C9" }}>
              From:{" "}
              <span
                className="font-mono"
                style={{ color: "#22D3EE" }}
                title={principalStr}
              >
                {truncated}
              </span>
            </span>
            <span className="text-xs" style={{ color: "#4a6a8a" }}>
              {timestamp}
            </span>
          </div>
        </div>
        <FeedbackStatusBadge fb={fb} />
      </div>

      {/* Message */}
      <p className="text-sm leading-relaxed pl-9" style={{ color: "#EAF2FF" }}>
        {fb.message}
      </p>

      {/* Existing admin reply display */}
      {hasReply && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="ml-9 mt-1 rounded-lg px-3 py-2.5 flex flex-col gap-1"
          style={{
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={11} style={{ color: "#22c55e" }} />
            <span
              className="text-xs font-semibold"
              style={{ color: "#22c55e" }}
            >
              Admin Reply
            </span>
            {replyTimestamp && (
              <span className="text-xs ml-auto" style={{ color: "#4a6a8a" }}>
                {replyTimestamp}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#b8e6c8" }}>
            {fb.adminReply}
          </p>
        </motion.div>
      )}

      {/* Reply input area */}
      <AnimatePresence>
        {replyOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="ml-9 mt-1 rounded-lg p-3 flex flex-col gap-2"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid #1A3354",
              }}
            >
              <Textarea
                data-ocid={`admin.feedback.item.${index + 1}`}
                placeholder="Type your reply to this user..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={3}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid #1A3354",
                  color: "#EAF2FF",
                  resize: "none",
                  fontSize: "13px",
                }}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyOpen(false);
                    setReplyText("");
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                  data-ocid="admin.feedback.cancel_button"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    color: "#9BB0C9",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={replyMutation.isPending || !replyText.trim()}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                  data-ocid="admin.feedback.confirm_button"
                  style={{
                    background: "rgba(34,197,94,0.15)",
                    color: "#22c55e",
                    border: "1px solid rgba(34,197,94,0.3)",
                  }}
                >
                  {replyMutation.isPending ? (
                    <Loader2 size={10} className="animate-spin" />
                  ) : (
                    <Reply size={10} />
                  )}
                  {replyMutation.isPending ? "Sending..." : "Send Reply"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pl-9 flex-wrap">
        {/* Reply button */}
        <button
          type="button"
          onClick={() => setReplyOpen((prev) => !prev)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
          data-ocid={`admin.feedback.item.${index + 1}`}
          style={{
            background: replyOpen
              ? "rgba(34,197,94,0.15)"
              : "rgba(34,197,94,0.08)",
            color: "#22c55e",
            border: `1px solid ${
              replyOpen ? "rgba(34,197,94,0.35)" : "rgba(34,197,94,0.2)"
            }`,
          }}
        >
          <Reply size={10} />
          {hasReply ? "Edit Reply" : "Reply"}
        </button>

        {isUnread && (
          <button
            type="button"
            onClick={handleMarkRead}
            disabled={markReadMutation.isPending}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
            data-ocid={`admin.feedback.item.${index + 1}`}
            style={{
              background: "rgba(34,211,238,0.08)",
              color: "#22D3EE",
              border: "1px solid rgba(34,211,238,0.2)",
            }}
          >
            {markReadMutation.isPending ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <Check size={10} />
            )}
            Mark as Read
          </button>
        )}

        {!isResolved && (
          <button
            type="button"
            onClick={handleMarkResolved}
            disabled={markResolvedMutation.isPending}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
            data-ocid={`admin.feedback.item.${index + 1}`}
            style={{
              background: "rgba(34,197,94,0.08)",
              color: "#22c55e",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            {markResolvedMutation.isPending ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <CheckCheck size={10} />
            )}
            Mark as Resolved
          </button>
        )}

        <button
          type="button"
          onClick={() => onDeleteRequest(fb)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
          data-ocid={`admin.feedback.delete_button.${index + 1}`}
          style={{
            background: "rgba(239,68,68,0.08)",
            color: "#ef4444",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <Trash2 size={10} />
          Delete
        </button>
      </div>
    </motion.div>
  );
}

function FeedbackSection() {
  const { t } = useLanguage();
  const { data: feedbackList = [], isLoading } = useAllFeedbackEntries();
  const deleteFeedbackMutation = useAdminDeleteFeedback();
  const [activeFilter, setActiveFilter] = useState<FeedbackFilter>("all");
  const [deleteTarget, setDeleteTarget] =
    useState<FeedbackWithPrincipal | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const unreadCount = feedbackList.filter((fb) => "unread" in fb.status).length;

  const filteredFeedback = feedbackList.filter((fb) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return "unread" in fb.status;
    if (activeFilter === "read") return "read" in fb.status;
    if (activeFilter === "resolved") return "resolved" in fb.status;
    return true;
  });

  const handleDeleteRequest = (fb: FeedbackWithPrincipal) => {
    setDeleteTarget(fb);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFeedbackMutation.mutateAsync({
        user: deleteTarget.principal,
        feedbackId: deleteTarget.id,
      });
    } finally {
      setConfirmOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmOpen(false);
    setDeleteTarget(null);
  };

  const FILTERS: { key: FeedbackFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "read", label: "Read" },
    { key: "resolved", label: "Resolved" },
  ];

  return (
    <>
      <div className="card-gradient-border p-5" data-ocid="admin.feedback.card">
        {/* Section header */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(34,211,238,0.12)",
              border: "1px solid rgba(34,211,238,0.2)",
            }}
          >
            <MessageSquare size={14} style={{ color: "#22D3EE" }} />
          </div>
          <h3 className="font-semibold" style={{ color: "#EAF2FF" }}>
            {t.adminFeedback}
          </h3>
          {feedbackList.length > 0 && (
            <span
              className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: "rgba(34,211,238,0.1)",
                color: "#22D3EE",
                border: "1px solid rgba(34,211,238,0.2)",
              }}
            >
              {feedbackList.length}
            </span>
          )}
        </div>

        {/* Filter tabs */}
        {!isLoading && feedbackList.length > 0 && (
          <div
            className="flex items-center gap-1.5 mb-4 flex-wrap"
            data-ocid="admin.feedback.tab"
          >
            {FILTERS.map((f) => {
              const isActive = activeFilter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActiveFilter(f.key)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all"
                  data-ocid={"admin.feedback.tab"}
                  style={{
                    background: isActive
                      ? "rgba(34,211,238,0.15)"
                      : "rgba(255,255,255,0.03)",
                    color: isActive ? "#22D3EE" : "#9BB0C9",
                    border: `1px solid ${
                      isActive
                        ? "rgba(34,211,238,0.35)"
                        : "rgba(255,255,255,0.08)"
                    }`,
                  }}
                >
                  {f.label}
                  {f.key === "unread" && unreadCount > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-xs leading-none"
                      style={{
                        background: isActive
                          ? "rgba(245,158,11,0.35)"
                          : "rgba(245,158,11,0.2)",
                        color: "#f59e0b",
                        fontSize: "10px",
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div
            className="flex items-center gap-2 py-4"
            data-ocid="admin.feedback.loading_state"
          >
            <Loader2
              className="animate-spin"
              size={16}
              style={{ color: "#22D3EE" }}
            />
            <span className="text-sm" style={{ color: "#9BB0C9" }}>
              {t.loading}
            </span>
          </div>
        ) : feedbackList.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-8 gap-3"
            data-ocid="admin.feedback.empty_state"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(34,211,238,0.06)",
                border: "1px solid rgba(34,211,238,0.12)",
              }}
            >
              <MessageSquare size={18} style={{ color: "#9BB0C9" }} />
            </div>
            <p className="text-sm" style={{ color: "#9BB0C9" }}>
              {t.adminFeedbackEmpty}
            </p>
          </div>
        ) : filteredFeedback.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-6 gap-2"
            data-ocid="admin.feedback.empty_state"
          >
            <p className="text-sm" style={{ color: "#9BB0C9" }}>
              No feedback in this category.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="flex flex-col gap-2">
              {filteredFeedback.map((fb, i) => (
                <FeedbackItem
                  key={fb.id.toString()}
                  fb={fb}
                  index={i}
                  onDeleteRequest={handleDeleteRequest}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          data-ocid="admin.feedback.dialog"
          style={{
            background: "#0a1628",
            border: "1px solid #1A3354",
            color: "#EAF2FF",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#EAF2FF" }}>
              Delete Feedback
            </DialogTitle>
            <DialogDescription style={{ color: "#9BB0C9" }}>
              Are you sure you want to delete this feedback? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && (
            <div
              className="px-3 py-2 rounded-lg text-xs font-mono"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.15)",
                color: "#ef4444",
              }}
            >
              From: {truncatePrincipal(deleteTarget.principal.toString())}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelDelete}
              disabled={deleteFeedbackMutation.isPending}
              data-ocid="admin.feedback.cancel_button"
              style={{
                borderColor: "#1A3354",
                color: "#9BB0C9",
                background: "transparent",
              }}
            >
              {t.cancel}
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleteFeedbackMutation.isPending}
              data-ocid="admin.feedback.confirm_button"
              style={{
                background: deleteFeedbackMutation.isPending
                  ? "rgba(239,68,68,0.4)"
                  : "rgba(239,68,68,0.85)",
                color: "#fff",
                border: "1px solid rgba(239,68,68,0.5)",
              }}
            >
              {deleteFeedbackMutation.isPending ? (
                <Loader2 className="animate-spin mr-2" size={14} />
              ) : (
                <Trash2 size={14} className="mr-2" />
              )}
              {deleteFeedbackMutation.isPending ? t.loading : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const MONITORING_STAT_CONFIGS = [
  {
    key: "totalUsers" as keyof import("../backend.d").SystemStats,
    label: "Total Users",
    icon: Users,
    color: "#22D3EE",
  },
  {
    key: "blockedUsers" as keyof import("../backend.d").SystemStats,
    label: "Blocked Users",
    icon: Ban,
    color: "#ef4444",
  },
  {
    key: "unreadFeedback" as keyof import("../backend.d").SystemStats,
    label: "Unread Feedback",
    icon: MessageSquare,
    color: "#f59e0b",
  },
  {
    key: "totalPasswords" as keyof import("../backend.d").SystemStats,
    label: "Total Passwords",
    icon: KeyRound,
    color: "#A855F7",
  },
  {
    key: "totalNotes" as keyof import("../backend.d").SystemStats,
    label: "Total Notes",
    icon: FileText,
    color: "#22c55e",
  },
  {
    key: "totalFeedback" as keyof import("../backend.d").SystemStats,
    label: "Total Feedback",
    icon: Inbox,
    color: "#64748b",
  },
];

function ActivityRow({
  entry,
  index,
}: {
  entry: LoginActivity;
  index: number;
}) {
  const [copied, setCopied] = useState(false);
  const principalStr = entry.principal.toString();
  const truncated = truncatePrincipal(principalStr);
  const lastLogin = new Date(
    Number(entry.lastLoginTimestamp) / 1_000_000,
  ).toLocaleString();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(principalStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently ignore clipboard errors
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className="flex flex-col sm:flex-row sm:items-center gap-2 py-2.5 px-3 rounded-lg"
      data-ocid={`admin.monitoring.activity_row.${index + 1}`}
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(26,51,84,0.8)",
      }}
    >
      {/* Principal + copy */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(34,211,238,0.1)",
            border: "1px solid rgba(34,211,238,0.2)",
          }}
        >
          <Activity size={12} style={{ color: "#22D3EE" }} />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-mono"
              style={{ color: "#22D3EE" }}
              title={principalStr}
            >
              {truncated}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex-shrink-0 p-0.5 rounded transition-colors hover:bg-white/5"
              title="Copy Principal ID"
              style={{ color: copied ? "#22c55e" : "#4a6a8a" }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                  <motion.span
                    key="check"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Check size={11} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Copy size={11} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
          <span className="text-xs" style={{ color: "#4a6a8a" }}>
            Last login: {lastLogin}
          </span>
        </div>
      </div>

      {/* Login count badge */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span
          className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
          style={{
            background: "rgba(168,85,247,0.12)",
            color: "#A855F7",
            border: "1px solid rgba(168,85,247,0.25)",
          }}
        >
          {String(entry.loginCount)} logins
        </span>
      </div>
    </motion.div>
  );
}

function SystemMonitoringSection() {
  const { data: stats, isLoading: statsLoading } = useSystemStats();
  const { data: activityLog = [], isLoading: activityLoading } =
    useLoginActivityLog();

  // Sort activity by last login timestamp descending (most recent first)
  const sortedActivity = [...activityLog].sort(
    (a, b) => Number(b.lastLoginTimestamp) - Number(a.lastLoginTimestamp),
  );

  return (
    <div
      className="card-gradient-border p-5 flex flex-col gap-6"
      data-ocid="admin.monitoring.panel"
    >
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: "rgba(34,211,238,0.12)",
            border: "1px solid rgba(34,211,238,0.2)",
          }}
        >
          <Activity size={14} style={{ color: "#22D3EE" }} />
        </div>
        <h3 className="font-semibold" style={{ color: "#EAF2FF" }}>
          System Monitoring
        </h3>
        <span
          className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            background: "rgba(34,211,238,0.08)",
            color: "#22D3EE",
            border: "1px solid rgba(34,211,238,0.18)",
          }}
        >
          Overview
        </span>
      </div>

      {/* Part A: 6 stat overview cards */}
      {statsLoading ? (
        <div
          className="flex items-center gap-2 py-4"
          data-ocid="admin.monitoring.loading_state"
        >
          <Loader2
            className="animate-spin"
            size={16}
            style={{ color: "#22D3EE" }}
          />
          <span className="text-sm" style={{ color: "#9BB0C9" }}>
            Loading system stats...
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {MONITORING_STAT_CONFIGS.map((cfg, i) => {
            const Icon = cfg.icon;
            const value = stats ? String(stats[cfg.key]) : "0";
            return (
              <motion.div
                key={cfg.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.3 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                data-ocid={`admin.monitoring.overview_card.${i + 1}`}
                style={{
                  background: `${cfg.color}08`,
                  border: `1px solid ${cfg.color}20`,
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${cfg.color}14`,
                    border: `1px solid ${cfg.color}28`,
                  }}
                >
                  <Icon size={16} style={{ color: cfg.color }} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-xl font-bold leading-tight"
                    style={{ color: cfg.color }}
                  >
                    {value}
                  </span>
                  <span
                    className="text-xs leading-tight truncate"
                    style={{ color: "#9BB0C9" }}
                  >
                    {cfg.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Divider */}
      <div
        className="w-full h-px"
        style={{ background: "rgba(26,51,84,0.8)" }}
      />

      {/* Part B: Login Activity Log */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(168,85,247,0.12)",
              border: "1px solid rgba(168,85,247,0.2)",
            }}
          >
            <Activity size={12} style={{ color: "#A855F7" }} />
          </div>
          <h4 className="text-sm font-semibold" style={{ color: "#EAF2FF" }}>
            Login Activity
          </h4>
          {activityLog.length > 0 && (
            <span
              className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: "rgba(168,85,247,0.1)",
                color: "#A855F7",
                border: "1px solid rgba(168,85,247,0.2)",
              }}
            >
              {activityLog.length}
            </span>
          )}
        </div>

        {activityLoading ? (
          <div
            className="flex items-center gap-2 py-4"
            data-ocid="admin.monitoring.loading_state"
          >
            <Loader2
              className="animate-spin"
              size={14}
              style={{ color: "#A855F7" }}
            />
            <span className="text-sm" style={{ color: "#9BB0C9" }}>
              Loading activity log...
            </span>
          </div>
        ) : sortedActivity.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-8 gap-3"
            data-ocid="admin.monitoring.empty_state"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(168,85,247,0.06)",
                border: "1px solid rgba(168,85,247,0.12)",
              }}
            >
              <Activity size={18} style={{ color: "#9BB0C9" }} />
            </div>
            <p className="text-sm" style={{ color: "#9BB0C9" }}>
              No login activity recorded yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {sortedActivity.map((entry, i) => (
              <ActivityRow
                key={entry.principal.toString()}
                entry={entry}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { t } = useLanguage();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const { data: activeCount } = useActiveUserCount();
  const { data: usersWithPrincipals = [] } = useAllUsersWithPrincipals();

  if (checkingAdmin) {
    return (
      <div
        className="flex items-center gap-2 py-16"
        data-ocid="admin.loading_state"
      >
        <Loader2
          className="animate-spin"
          size={18}
          style={{ color: "#22D3EE" }}
        />
        <span style={{ color: "#9BB0C9" }}>{t.loading}</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div
        className="flex flex-col items-center justify-center py-24 gap-4"
        data-ocid="admin.error_state"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <AlertTriangle size={28} style={{ color: "#ef4444" }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "#EAF2FF" }}>
          Access Denied
        </h2>
        <p className="text-sm" style={{ color: "#9BB0C9" }}>
          Admin privileges required.
        </p>
      </div>
    );
  }

  const statValues = {
    active: activeCount?.toString() ?? "0",
    total: usersWithPrincipals.length.toString(),
    role: "Admin",
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#EAF2FF" }}>
          {t.adminTitle}
        </h1>
        <p className="text-sm" style={{ color: "#9BB0C9" }}>
          System administration panel
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {STAT_CONFIGS.map((stat, i) => {
          const Icon = stat.icon;
          const value = statValues[stat.valueKey as keyof typeof statValues];
          const label = t[stat.labelKey];
          return (
            <motion.div
              key={stat.valueKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card-gradient-border p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${stat.color}18`,
                    border: `1px solid ${stat.color}30`,
                  }}
                >
                  <Icon size={16} style={{ color: stat.color }} />
                </div>
                <div>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: stat.color }}
                  >
                    {value}
                  </p>
                  <p className="text-xs" style={{ color: "#9BB0C9" }}>
                    {label}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* System Monitoring */}
      <SystemMonitoringSection />

      {/* User Management */}
      <UserManagementSection />

      {/* User Feedback */}
      <FeedbackSection />
    </div>
  );
}
