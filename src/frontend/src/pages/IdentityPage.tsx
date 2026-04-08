import { Key, Link2, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function IdentityPage() {
  const { t } = useLanguage();
  const { identity } = useInternetIdentity();
  const principal = identity?.getPrincipal().toText() ?? "";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#EAF2FF" }}>
          {t.navIdentity}
        </h1>
        <p className="text-sm" style={{ color: "#9BB0C9" }}>
          Your Internet Computer identity
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-gradient-border p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(34,211,238,0.12)",
                border: "1px solid rgba(34,211,238,0.2)",
              }}
            >
              <Key size={16} style={{ color: "#22D3EE" }} />
            </div>
            <h3 className="font-semibold" style={{ color: "#EAF2FF" }}>
              Principal ID
            </h3>
          </div>
          <div className="mono-id">{principal || "Not authenticated"}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-gradient-border p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(168,85,247,0.12)",
                border: "1px solid rgba(168,85,247,0.2)",
              }}
            >
              <ShieldCheck size={16} style={{ color: "#A855F7" }} />
            </div>
            <h3 className="font-semibold" style={{ color: "#EAF2FF" }}>
              Authentication Status
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: identity ? "#22c55e" : "#ef4444",
                boxShadow: identity ? "0 0 8px #22c55e" : undefined,
              }}
            />
            <span
              className="text-sm"
              style={{ color: identity ? "#22c55e" : "#ef4444" }}
            >
              {identity
                ? "Authenticated via Internet Identity"
                : "Not authenticated"}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card-gradient-border p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(234,179,8,0.1)",
                border: "1px solid rgba(234,179,8,0.2)",
              }}
            >
              <Link2 size={16} style={{ color: "#eab308" }} />
            </div>
            <h3 className="font-semibold" style={{ color: "#EAF2FF" }}>
              Manage Internet Identity
            </h3>
          </div>
          <p className="text-sm mb-3" style={{ color: "#9BB0C9" }}>
            Manage your devices, recovery phrases, and linked accounts on the
            official Internet Identity dashboard.
          </p>
          <a
            href="https://identity.ic0.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              background: "rgba(234,179,8,0.1)",
              border: "1px solid rgba(234,179,8,0.3)",
              color: "#eab308",
            }}
            data-ocid="identity.manage_ii.link"
          >
            <Link2 size={14} />
            {t.settingsManageII}
          </a>
        </motion.div>
      </div>
    </div>
  );
}
