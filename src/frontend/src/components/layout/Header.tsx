import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Bell,
  ChevronDown,
  LogOut,
  Mail,
  Menu,
  Search,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useLayoutContext } from "../../contexts/LayoutContext";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useIsAdmin, useUserProfile } from "../../hooks/useQueries";

const EMAIL_STORAGE_KEY = "dokmai-user-email";

export default function Header() {
  const { t } = useLanguage();
  const { identity, clear } = useInternetIdentity();
  const { data: profile } = useUserProfile();
  const { data: isAdmin } = useIsAdmin();
  const { breakpoint, mobileOpen, setMobileOpen } = useLayoutContext();
  const [searchVal, setSearchVal] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userEmail, setUserEmail] = useState("");

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

  return (
    <header
      className="flex items-center justify-between px-4 py-3 border-b gap-3"
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
      <div className="flex items-center gap-3 min-w-0">
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

        <div className="min-w-0">
          <h1
            className="text-base font-semibold truncate"
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
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search — hidden on very small screens */}
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
            className="pl-8 h-8 text-sm w-40 md:w-48"
            style={{
              background: "rgba(13, 31, 58, 0.8)",
              border: "1px solid #1A3354",
              color: "#EAF2FF",
            }}
          />
        </div>

        <button
          type="button"
          className="relative p-2 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: "#9BB0C9" }}
          aria-label="Notifications"
          data-ocid="header.bell.button"
        >
          <Bell size={18} />
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{
              background: "#ef4444",
              boxShadow: "0 0 6px rgba(239,68,68,0.6)",
            }}
          />
        </button>

        {/* Avatar with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg px-1 py-1 transition-colors hover:bg-white/5"
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
              className="absolute right-0 mt-2 w-64 rounded-xl border shadow-2xl py-1 z-50"
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
                  <Avatar className="w-10 h-10">
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
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
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
