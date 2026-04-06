import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Bell, Search } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import { useUserProfile } from "../../hooks/useQueries";

export default function Header() {
  const { t } = useLanguage();
  const { identity } = useInternetIdentity();
  const { data: profile } = useUserProfile();
  const [searchVal, setSearchVal] = useState("");

  const principalShort = identity?.getPrincipal().toText().slice(0, 8) ?? "";
  const displayName = profile?.name || principalShort || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{
        background: "rgba(10, 26, 49, 0.95)",
        borderColor: "#1A3354",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <div>
        <h1 className="text-lg font-semibold" style={{ color: "#EAF2FF" }}>
          {t.dashWelcome},&nbsp;
          <span className="gradient-text">{displayName}</span>!
        </h1>
        <p className="text-xs" style={{ color: "#9BB0C9" }}>
          Dokmai IC — Secure Identity Vault
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
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
            className="pl-8 h-8 text-sm w-48"
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

        <Avatar className="w-8 h-8 cursor-pointer">
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
      </div>
    </header>
  );
}
