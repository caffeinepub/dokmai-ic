import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  MessageSquare,
  Search,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useLayoutContext } from "../../contexts/LayoutContext";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import {
  useIsAdmin,
  useSystemAnnouncement,
  useUserFeedbackWithReplies,
  useUserProfile,
} from "../../hooks/useQueries";
import type { FeedbackForUser } from "../../types";

const EMAIL_STORAGE_KEY = "dokmai-user-email";
const READ_FEEDBACK_IDS_KEY = "dokmai_notif_read_feedback_ids";
const READ_ANNOUNCEMENT_KEY = "dokmai_notif_announcement_read";

function formatTimestamp(ts: bigint): string {
  const ms = Number(ts / BigInt(1_000_000));
  const date = new Date(ms);
  const now = Date.now();
  const diff = now - ms;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000).toString()}m ago`;
  if (diff < 86_400_000)
    return `${Math.floor(diff / 3_600_000).toString()}h ago`;
  return date.toLocaleDateString();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function getReadFeedbackIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_FEEDBACK_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function setReadFeedbackIds(ids: Set<string>): void {
  localStorage.setItem(READ_FEEDBACK_IDS_KEY, JSON.stringify([...ids]));
}

export default function Header() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { identity, clear } = useInternetIdentity();
  const { data: profile } = useUserProfile();
  const { data: isAdmin } = useIsAdmin();
  const { breakpoint, mobileOpen, setMobileOpen } = useLayoutContext();
  const [searchVal, setSearchVal] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const [userEmail, setUserEmail] = useState("");

  // Notification data with polling
  const { data: feedbackList = [] } = useUserFeedbackWithReplies() as {
    data: FeedbackForUser[];
  };
  const { data: announcement = null } = useSystemAnnouncement() as {
    data: string | null;
  };

  // Derived unread state
  const [readFeedbackIds, setReadFeedbackIdsState] = useState<Set<string>>(() =>
    getReadFeedbackIds(),
  );

  const unreadFeedback = feedbackList.filter((fb) => {
    const hasReply =
      fb.adminReply && fb.adminReply.length > 0 && fb.adminReply[0] !== "";
    if (!hasReply) return false;
    return !readFeedbackIds.has(fb.id.toString());
  });

  const isAnnouncementUnread =
    !!announcement &&
    localStorage.getItem(READ_ANNOUNCEMENT_KEY) !== announcement;
  const unreadCount = unreadFeedback.length + (isAnnouncementUnread ? 1 : 0);

  const isMobile = breakpoint === "mobile";

  useEffect(() => {
    const stored = localStorage.getItem(EMAIL_STORAGE_KEY) ?? "";
    setUserEmail(stored);
  }, []);

  useEffect(() => {
    if (dropdownOpen) {
      const stored = localStorage.getItem(EMAIL_STORAGE_KEY) ?? "";
      setUserEmail(stored);
    }
  }, [dropdownOpen]);

  const principalShort = identity?.getPrincipal().toText().slice(0, 8) ?? "";
  const displayName = profile?.name || principalShort || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const principalFull = identity?.getPrincipal().toText() ?? "";

  // Close avatar dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close bell dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markFeedbackRead = useCallback((id: bigint) => {
    setReadFeedbackIdsState((prev) => {
      const next = new Set(prev);
      next.add(id.toString());
      setReadFeedbackIds(next);
      return next;
    });
  }, []);

  const markAnnouncementRead = useCallback(() => {
    if (announcement) {
      localStorage.setItem(READ_ANNOUNCEMENT_KEY, announcement);
    }
  }, [announcement]);

  const markAllRead = useCallback(() => {
    const allIds = new Set(feedbackList.map((fb) => fb.id.toString()));
    setReadFeedbackIds(allIds);
    setReadFeedbackIdsState(allIds);
    if (announcement) {
      localStorage.setItem(READ_ANNOUNCEMENT_KEY, announcement);
    }
    setBellOpen(false);
  }, [feedbackList, announcement]);

  return (
    <header
      className="flex items-center justify-between px-3 sm:px-4 py-3 border-b gap-2 sm:gap-3"
      style={{
        background: "rgba(10, 26, 49, 0.95)",
        borderColor: "#1A3354",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left: hamburger (mobile) + welcome */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "#9BB0C9" }}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            data-ocid="header.hamburger.button"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        <div className="min-w-0 flex-1">
          <h1
            className="text-sm sm:text-base font-semibold truncate"
            style={{ color: "#EAF2FF" }}
          >
            {t.dashWelcome},&nbsp;
            <span data-ocid="n6n14q" className="gradient-text">
              {displayName}
            </span>
            !
          </h1>
          <p
            data-ocid="9aqdj8"
            className="text-xs truncate hidden sm:block"
            style={{ color: "#9BB0C9" }}
          >
            Dokmai IC — Secure Identity Vault
          </p>
        </div>
      </div>

      {/* Right: search + bell + avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Search — hidden on mobile */}
        <div className="relative hidden sm:block">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#9BB0C9" }}
          />
          <Input
            data-ocid="header.search_input"
            placeholder={t.search}
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="pl-8 h-8 text-sm w-36 md:w-48"
            style={{
              background: "rgba(13, 31, 58, 0.8)",
              border: "1px solid #1A3354",
              color: "#EAF2FF",
            }}
          />
        </div>

        {/* Bell notification */}
        <div className="relative" ref={bellRef}>
          <button
            type="button"
            className="relative p-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: "#9BB0C9" }}
            aria-label="Notifications"
            data-ocid="header.bell.button"
            onClick={() => setBellOpen((v) => !v)}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{
                  background: "#ef4444",
                  boxShadow: "0 0 6px rgba(239,68,68,0.6)",
                }}
              />
            )}
          </button>

          {bellOpen && (
            <div
              className="absolute right-0 mt-2 w-[min(320px,90vw)] rounded-xl border shadow-2xl z-50 overflow-hidden"
              style={{
                background: "rgba(10, 26, 49, 0.98)",
                borderColor: "#1A3354",
                backdropFilter: "blur(16px)",
              }}
              data-ocid="header.notif.dropdown"
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: "#1A3354" }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: "#EAF2FF" }}
                >
                  Notifications
                  {unreadCount > 0 && (
                    <span
                      className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={{
                        background: "rgba(239,68,68,0.2)",
                        color: "#ef4444",
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs transition-colors hover:opacity-80"
                    style={{ color: "#22D3EE" }}
                    data-ocid="header.notif.markall"
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notification list */}
              <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                {/* Announcement */}
                {announcement && isAnnouncementUnread && (
                  <button
                    type="button"
                    className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 border-b"
                    style={{ borderColor: "#1A3354" }}
                    data-ocid="header.notif.announcement"
                    onClick={() => {
                      markAnnouncementRead();
                      setBellOpen(false);
                    }}
                  >
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                      style={{ background: "rgba(168,85,247,0.15)" }}
                    >
                      <Megaphone size={15} style={{ color: "#A855F7" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-xs font-semibold"
                        style={{ color: "#EAF2FF" }}
                      >
                        System Announcement
                      </p>
                      <p
                        className="text-xs mt-0.5 leading-relaxed"
                        style={{ color: "#9BB0C9" }}
                      >
                        {announcement}
                      </p>
                    </div>
                  </button>
                )}

                {/* Feedback replies */}
                {unreadFeedback.map((fb) => {
                  const replyText = fb.adminReply[0] ?? "";
                  const ts =
                    fb.adminReplyTimestamp.length > 0
                      ? fb.adminReplyTimestamp[0]
                      : null;
                  return (
                    <button
                      key={fb.id.toString()}
                      type="button"
                      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 border-b"
                      style={{ borderColor: "#1A3354" }}
                      data-ocid={`header.notif.feedback.${fb.id}`}
                      onClick={() => {
                        markFeedbackRead(fb.id);
                        setBellOpen(false);
                        navigate({ to: "/feedback" });
                      }}
                    >
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                        style={{ background: "rgba(34,211,238,0.1)" }}
                      >
                        <MessageSquare size={15} style={{ color: "#22D3EE" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-semibold"
                          style={{ color: "#EAF2FF" }}
                        >
                          Admin replied to your feedback
                        </p>
                        <p
                          className="text-xs mt-0.5 leading-relaxed"
                          style={{ color: "#9BB0C9" }}
                        >
                          {truncate(replyText, 80)}
                        </p>
                        {ts && (
                          <p
                            className="text-xs mt-1"
                            style={{ color: "#4A6680" }}
                          >
                            {formatTimestamp(ts)}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}

                {/* Empty state */}
                {unreadCount === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                      style={{ background: "rgba(155,176,201,0.1)" }}
                    >
                      <Bell size={18} style={{ color: "#4A6680" }} />
                    </div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#9BB0C9" }}
                    >
                      No new notifications
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#4A6680" }}>
                      You're all caught up
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="flex items-center gap-1 sm:gap-1.5 rounded-lg px-1 py-1 transition-colors hover:bg-white/5"
            onClick={() => setDropdownOpen((v) => !v)}
            aria-label="User menu"
          >
            <Avatar className="w-8 h-8">
              <AvatarFallback
                style={{
                  background: "linear-gradient(135deg, #22D3EE, #A855F7)",
                  color: "#071427",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <ChevronDown
              size={12}
              style={{ color: "#9BB0C9" }}
              className={`transition-transform hidden sm:block ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-[min(256px,90vw)] rounded-xl border shadow-2xl py-1 z-50"
              style={{
                background: "rgba(10, 26, 49, 0.98)",
                borderColor: "#1A3354",
                backdropFilter: "blur(16px)",
              }}
            >
              {/* User info */}
              <div
                className="px-4 py-3 border-b"
                style={{ borderColor: "#1A3354" }}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback
                      style={{
                        background: "linear-gradient(135deg, #22D3EE, #A855F7)",
                        color: "#071427",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "#EAF2FF" }}
                    >
                      {displayName}
                    </p>
                    {userEmail ? (
                      <p
                        className="text-xs truncate flex items-center gap-1"
                        style={{ color: "#22D3EE" }}
                      >
                        <Mail size={10} />
                        {userEmail}
                      </p>
                    ) : (
                      <p
                        className="text-xs truncate"
                        style={{ color: "#9BB0C9" }}
                      >
                        {principalFull || "—"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Status badge */}
              <div
                className="px-4 py-2.5 border-b flex items-center gap-2"
                style={{ borderColor: "#1A3354" }}
              >
                {isAdmin ? (
                  <>
                    <ShieldCheck size={14} style={{ color: "#A855F7" }} />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "#A855F7" }}
                    >
                      Admin
                    </span>
                    <span
                      className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: "rgba(168,85,247,0.15)",
                        color: "#A855F7",
                        border: "1px solid rgba(168,85,247,0.3)",
                      }}
                    >
                      Administrator
                    </span>
                  </>
                ) : (
                  <>
                    <User size={14} style={{ color: "#22D3EE" }} />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "#22D3EE" }}
                    >
                      User
                    </span>
                    <span
                      className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: "rgba(34,211,238,0.15)",
                        color: "#22D3EE",
                        border: "1px solid rgba(34,211,238,0.3)",
                      }}
                    >
                      Standard
                    </span>
                  </>
                )}
              </div>

              {/* Logout */}
              <div className="px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    clear();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5 min-h-[44px]"
                  style={{ color: "#ef4444" }}
                >
                  <LogOut size={14} />
                  <span>{t.settingsLogout}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
