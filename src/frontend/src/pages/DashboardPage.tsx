import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  KeyRound,
  Lightbulb,
  Lock,
  Megaphone,
  ShieldCheck,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  usePasswordEntries,
  useSecureNotes,
  useSystemAnnouncement,
} from "../hooks/useQueries";

function BentoCard({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`card-glow card-gradient-border p-4 sm:p-5 flex flex-col ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function StatBadge({
  value,
  label,
  color,
}: { value: number | string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl sm:text-3xl font-bold" style={{ color }}>
        {value}
      </span>
      <span className="text-xs" style={{ color: "#9BB0C9" }}>
        {label}
      </span>
    </div>
  );
}

const SECURITY_TIPS = [
  { icon: Lock, tip: "Use unique passwords for every account.", ok: true },
  { icon: KeyRound, tip: "Enable 2FA on critical accounts.", ok: true },
  {
    icon: AlertTriangle,
    tip: "Never share passwords via email or chat.",
    ok: false,
  },
  {
    icon: ShieldCheck,
    tip: "Regularly audit your stored credentials.",
    ok: true,
  },
  { icon: CheckCircle2, tip: "Store recovery phrases in the vault.", ok: true },
];

const RECENT_ACTIVITIES = [
  { label: "Logged in via Internet Identity", time: "Just now" },
  { label: "Vault accessed securely", time: "2 min ago" },
  { label: "Password copied", time: "5 min ago" },
  { label: "New note created", time: "1 hr ago" },
];

function AnnouncementBanner() {
  const { data: announcement } = useSystemAnnouncement();
  const [dismissed, setDismissed] = useState(false);

  if (!announcement || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
        animate={{ opacity: 1, y: 0, scaleY: 1 }}
        exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
        transition={{ duration: 0.25 }}
        className="flex items-start gap-3 px-4 py-3 rounded-xl"
        data-ocid="dashboard.announcement.panel"
        style={{
          background: "rgba(234,179,8,0.08)",
          border: "1px solid rgba(234,179,8,0.25)",
        }}
      >
        <Megaphone
          size={16}
          style={{ color: "#eab308", flexShrink: 0, marginTop: 1 }}
        />
        <p
          className="text-sm flex-1 leading-relaxed"
          style={{ color: "#fde68a" }}
        >
          {announcement}
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          data-ocid="dashboard.announcement.close_button"
          className="flex-shrink-0 p-0.5 rounded-md transition-colors hover:bg-yellow-500/10"
          style={{ color: "#eab308" }}
          aria-label="Dismiss announcement"
        >
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const { identity } = useInternetIdentity();
  const { data: passwords = [] } = usePasswordEntries();
  const { data: notes = [] } = useSecureNotes();

  const principalShort = identity?.getPrincipal().toText().slice(0, 12) ?? "";

  const vaultScore = useMemo(() => {
    const total = passwords.length + notes.length;
    if (total === 0) return 0;
    const capped = Math.min(total, 20);
    return Math.round((capped / 20) * 100);
  }, [passwords.length, notes.length]);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <AnnouncementBanner />

      {/* Responsive Bento Grid:
          mobile: 1 column
          sm (640px+): 2 columns equal
          md (768px+): 2fr 1fr asymmetric */}
      <div
        className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2"
        style={
          {
            // On md+ override to 2fr 1fr layout
          }
        }
      >
        {/* Row 1 col 1: Security Overview — spans full width on sm */}
        <motion.div
          className="sm:col-span-1 md:col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ gridColumn: "1 / -1" }}
        >
          {/* We use a nested grid for the 2fr/1fr split at md+ */}
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 sm:gap-5">
            {/* Security Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <BentoCard>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "rgba(34,211,238,0.12)",
                      border: "1px solid rgba(34,211,238,0.2)",
                    }}
                  >
                    <ShieldCheck size={18} style={{ color: "#22D3EE" }} />
                  </div>
                  <div className="min-w-0">
                    <h2
                      className="font-semibold text-base"
                      style={{ color: "#EAF2FF" }}
                    >
                      {t.dashSecurityOverview}
                    </h2>
                    <p className="text-xs" style={{ color: "#9BB0C9" }}>
                      Internet Computer · Encrypted on-chain
                    </p>
                  </div>
                  <div className="ml-auto flex-shrink-0">
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: "rgba(34,211,238,0.12)",
                        color: "#22D3EE",
                        border: "1px solid rgba(34,211,238,0.2)",
                      }}
                    >
                      ● Online
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 sm:gap-8 mt-2">
                  <StatBadge
                    value={passwords.length}
                    label={t.dashTotalPasswords}
                    color="#22D3EE"
                  />
                  <StatBadge
                    value={notes.length}
                    label={t.dashTotalNotes}
                    color="#A855F7"
                  />
                  <div className="flex flex-col flex-1 gap-1.5 min-w-[120px]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#9BB0C9" }}>
                        {t.dashStrength}
                      </span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "#22D3EE" }}
                      >
                        {vaultScore}%
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: "#1A3354" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${vaultScore}%`,
                          background:
                            "linear-gradient(90deg, #22D3EE, #A855F7)",
                          boxShadow: "0 0 8px rgba(34,211,238,0.4)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  className="mt-4 pt-4 border-t"
                  style={{ borderColor: "#1A3354" }}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp size={13} style={{ color: "#22D3EE" }} />
                    <span className="text-xs" style={{ color: "#9BB0C9" }}>
                      Principal:{" "}
                      <span
                        className="font-mono text-[11px]"
                        style={{ color: "#22D3EE" }}
                      >
                        {principalShort}...
                      </span>
                    </span>
                  </div>
                </div>
              </BentoCard>
            </motion.div>

            {/* Active Sessions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <BentoCard>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "rgba(168,85,247,0.12)",
                      border: "1px solid rgba(168,85,247,0.2)",
                    }}
                  >
                    <Activity size={16} style={{ color: "#A855F7" }} />
                  </div>
                  <h3
                    className="font-semibold text-sm"
                    style={{ color: "#EAF2FF" }}
                  >
                    {t.dashActiveSessions}
                  </h3>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  {["Internet Identity", "Vault Session", "IC Agent"].map(
                    (session, i) => (
                      <div
                        key={session}
                        className="flex items-center justify-between py-1.5 px-2 rounded-lg"
                        style={{
                          background: "rgba(34,211,238,0.04)",
                          border: "1px solid rgba(34,211,238,0.08)",
                        }}
                      >
                        <span className="text-xs" style={{ color: "#EAF2FF" }}>
                          {session}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            background:
                              i === 0
                                ? "#22c55e"
                                : i === 1
                                  ? "#22D3EE"
                                  : "#A855F7",
                            boxShadow: `0 0 6px ${i === 0 ? "#22c55e" : i === 1 ? "#22D3EE" : "#A855F7"}`,
                          }}
                        />
                      </div>
                    ),
                  )}
                </div>
              </BentoCard>
            </motion.div>
          </div>
        </motion.div>

        {/* Row 2: Quick Passwords + Quick Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <BentoCard>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(34,211,238,0.12)",
                  border: "1px solid rgba(34,211,238,0.2)",
                }}
              >
                <KeyRound size={16} style={{ color: "#22D3EE" }} />
              </div>
              <h3
                className="font-semibold text-sm"
                style={{ color: "#EAF2FF" }}
              >
                {t.dashQuickPasswords}
              </h3>
              <span
                className="ml-auto text-xl font-bold"
                style={{ color: "#22D3EE" }}
              >
                {passwords.length}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {passwords.slice(0, 3).map((p) => (
                <div
                  key={p.title}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid #1A3354",
                  }}
                >
                  <span
                    className="text-xs font-medium truncate min-w-0"
                    style={{ color: "#EAF2FF" }}
                  >
                    {p.title}
                  </span>
                  <span
                    className="text-xs ml-2 flex-shrink-0 truncate max-w-[100px]"
                    style={{ color: "#9BB0C9" }}
                  >
                    {p.username}
                  </span>
                </div>
              ))}
              {passwords.length === 0 && (
                <p className="text-xs py-2" style={{ color: "#9BB0C9" }}>
                  {t.noData}
                </p>
              )}
            </div>
          </BentoCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <BentoCard>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(168,85,247,0.12)",
                  border: "1px solid rgba(168,85,247,0.2)",
                }}
              >
                <FileText size={16} style={{ color: "#A855F7" }} />
              </div>
              <h3
                className="font-semibold text-sm"
                style={{ color: "#EAF2FF" }}
              >
                {t.dashQuickNotes}
              </h3>
              <span
                className="ml-auto text-xl font-bold"
                style={{ color: "#A855F7" }}
              >
                {notes.length}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {notes.slice(0, 3).map((n) => (
                <div
                  key={n.title}
                  className="flex items-center py-1.5 px-2 rounded-lg"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid #1A3354",
                  }}
                >
                  <span
                    className="text-xs font-medium truncate"
                    style={{ color: "#EAF2FF" }}
                  >
                    {n.title}
                  </span>
                </div>
              ))}
              {notes.length === 0 && (
                <p className="text-xs py-2" style={{ color: "#9BB0C9" }}>
                  {t.noData}
                </p>
              )}
            </div>
          </BentoCard>
        </motion.div>

        {/* Row 3: Recent Activity + Security Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <BentoCard>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(34,211,238,0.08)",
                  border: "1px solid rgba(34,211,238,0.15)",
                }}
              >
                <Activity size={16} style={{ color: "#22D3EE" }} />
              </div>
              <h3
                className="font-semibold text-sm"
                style={{ color: "#EAF2FF" }}
              >
                {t.dashRecentActivity}
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              {RECENT_ACTIVITIES.map((activity) => (
                <div
                  key={activity.label}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        background: activity.label.includes("Login")
                          ? "#22D3EE"
                          : "#A855F7",
                      }}
                    />
                    <span
                      className="text-xs truncate"
                      style={{ color: "#EAF2FF" }}
                    >
                      {activity.label}
                    </span>
                  </div>
                  <span
                    className="text-xs flex-shrink-0"
                    style={{ color: "#9BB0C9" }}
                  >
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </BentoCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <BentoCard>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(234,179,8,0.12)",
                  border: "1px solid rgba(234,179,8,0.2)",
                }}
              >
                <Lightbulb size={16} style={{ color: "#eab308" }} />
              </div>
              <h3
                className="font-semibold text-sm"
                style={{ color: "#EAF2FF" }}
              >
                {t.dashSecurityTips}
              </h3>
            </div>
            <div className="flex flex-col gap-2">
              {SECURITY_TIPS.map((tip) => {
                const Icon = tip.icon;
                return (
                  <div key={tip.tip} className="flex items-start gap-2">
                    <Icon
                      size={13}
                      style={{
                        color: tip.ok ? "#22c55e" : "#f97316",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    />
                    <span className="text-xs" style={{ color: "#9BB0C9" }}>
                      {tip.tip}
                    </span>
                  </div>
                );
              })}
            </div>
          </BentoCard>
        </motion.div>
      </div>
    </div>
  );
}
