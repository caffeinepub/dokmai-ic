import { Settings2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";

export default function MaintenancePage() {
  useEffect(() => {
    document.title = "Dokmai IC \u2014 System Maintenance";
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#071427" }}
    >
      {/* Animated background rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border"
            style={{
              width: `${i * 180}px`,
              height: `${i * 180}px`,
              borderColor: `rgba(34,211,238,${0.06 - i * 0.01})`,
              animation: `pulse ${2 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Glow blob */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: "500px",
          height: "500px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle at center, rgba(34,211,238,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center gap-8 px-6 text-center max-w-md"
        data-ocid="maintenance.panel"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative"
        >
          <div
            className="absolute inset-0 rounded-2xl blur-xl"
            style={{
              background: "rgba(34,211,238,0.15)",
              transform: "scale(1.4)",
            }}
          />
          <img
            src="/assets/generated/dokmai-logo-transparent.dim_120x120.png"
            alt="Dokmai IC"
            className="w-16 h-16 relative z-10"
            style={{ filter: "drop-shadow(0 0 12px rgba(34,211,238,0.4))" }}
          />
        </motion.div>

        {/* Icon + badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex flex-col items-center gap-3"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: "rgba(234,179,8,0.1)",
              border: "1px solid rgba(234,179,8,0.25)",
              boxShadow: "0 0 24px rgba(234,179,8,0.08)",
            }}
          >
            <Settings2
              size={28}
              className="animate-spin"
              style={{ color: "#eab308", animationDuration: "4s" }}
            />
          </div>

          <span
            className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide"
            style={{
              background: "rgba(234,179,8,0.08)",
              color: "#eab308",
              border: "1px solid rgba(234,179,8,0.2)",
            }}
          >
            MAINTENANCE
          </span>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col gap-3"
        >
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "#EAF2FF" }}
          >
            System Maintenance
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "#9BB0C9" }}>
            Dokmai IC is currently undergoing scheduled maintenance. Please
            check back shortly.
          </p>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="w-full h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)",
          }}
        />

        {/* Admin note */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex items-start gap-3 p-4 rounded-xl w-full"
          style={{
            background: "rgba(34,211,238,0.04)",
            border: "1px solid rgba(34,211,238,0.12)",
          }}
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{
              background: "rgba(34,211,238,0.1)",
              border: "1px solid rgba(34,211,238,0.2)",
            }}
          >
            <span
              style={{ color: "#22D3EE", fontSize: "10px", fontWeight: 700 }}
            >
              i
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "#9BB0C9" }}>
            If you are an administrator, please{" "}
            <span style={{ color: "#22D3EE" }}>log in</span> to disable
            maintenance mode.
          </p>
        </motion.div>

        {/* Footer branding */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="text-xs"
          style={{ color: "rgba(155,176,201,0.5)" }}
        >
          Dokmai IC &mdash; Secure Vault on Internet Computer
        </motion.p>
      </motion.div>
    </div>
  );
}
