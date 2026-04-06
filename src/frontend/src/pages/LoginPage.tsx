import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Globe, Loader2, Lock, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import dokmaiLogo from "/assets/generated/dokmai-logo-v2-transparent.dim_512x512.png";
import { CosmicNetworkGraphic } from "../components/CosmicNetworkGraphic";
import {
  LANGUAGE_OPTIONS,
  type LangCode,
  type Translations,
  useLanguage,
} from "../contexts/LanguageContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const ACCESS_FEATURES = [
  {
    icon: Lock,
    label: "Password Vault",
    desc: "Encrypted credentials, auto-fill & generator",
  },
  {
    icon: FileText,
    label: "Secure Notes & Files",
    desc: "Private notes and file storage on-chain",
  },
  {
    icon: Shield,
    label: "Internet Identity Auth",
    desc: "Sovereign identity — no passwords needed",
  },
  {
    icon: Globe,
    label: "Multi-language Support",
    desc: "EN · TH · NL · PL · ZH",
  },
];

// ── Language Selector (inline inside card) ────────────────────────────────────
function LanguageSelector({
  lang,
  setLang,
}: {
  lang: LangCode;
  setLang: (v: LangCode) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Globe size={13} className="text-black/30" />
      <Select value={lang} onValueChange={(v) => setLang(v as LangCode)}>
        <SelectTrigger
          data-ocid="login.language.select"
          className="w-36 h-7 text-xs border-black/10 bg-black/5 text-black/50 hover:bg-black/8 focus:ring-0 focus:ring-offset-0"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white border-black/10">
          {LANGUAGE_OPTIONS.map((opt) => (
            <SelectItem
              key={opt.code}
              value={opt.code}
              className="text-xs text-black/80 focus:bg-black/5 focus:text-black"
            >
              {opt.flag} {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Login Card ────────────────────────────────────────────────────────────────
function LoginCard({
  isProcessing,
  handleLogin,
  t,
  lang,
  setLang,
}: {
  isProcessing: boolean;
  handleLogin: () => void;
  t: Translations;
  lang: LangCode;
  setLang: (v: LangCode) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-2xl p-8 w-full max-w-md"
      style={{
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.08), 0 32px 80px rgba(0,0,0,0.9)",
      }}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
          <img
            src={dokmaiLogo}
            alt="Dokmai IC Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-black/40">
            Get Access
          </p>
          <p className="text-base font-bold text-black leading-tight">
            Dokmai IC
          </p>
        </div>
      </div>

      {/* Access features */}
      <div className="space-y-3 mb-6">
        {ACCESS_FEATURES.map((feat) => (
          <div key={feat.label} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-black flex items-center justify-center flex-shrink-0 mt-0.5">
              <feat.icon size={13} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-black">{feat.label}</p>
              <p className="text-[11px] text-black/40 leading-tight">
                {feat.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-black/8 mb-6" />

      {/* Login Button */}
      <Button
        data-ocid="login.primary_button"
        onClick={handleLogin}
        disabled={isProcessing}
        className="w-full h-12 rounded-full text-sm font-semibold bg-black text-white hover:bg-zinc-900 active:bg-zinc-800 transition-colors"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t.loading}
          </>
        ) : (
          t.loginWith
        )}
      </Button>

      {/* Footer + Language Selector */}
      <div className="mt-5 pt-4 border-t border-black/8 space-y-3">
        <p className="text-center text-[10px] text-black/35">
          Powered by Internet Computer
        </p>
        <LanguageSelector lang={lang} setLang={setLang} />
      </div>
    </motion.div>
  );
}

// ── Headline ──────────────────────────────────────────────────────────────────
function Headline({
  t,
  textAlign = "left",
}: {
  t: Translations;
  textAlign?: "left" | "center";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className={`mb-10 max-w-lg ${
        textAlign === "center" ? "text-center" : "text-left"
      }`}
    >
      <h1
        className="text-4xl sm:text-5xl font-bold text-white leading-[1.1] tracking-tight"
        style={{ fontFamily: "GeneralSans, system-ui, sans-serif" }}
      >
        Your Vault.
        <br />
        Your Identity.
        <br />
        <span className="text-white/50">Your Control.</span>
      </h1>
      <p className="mt-4 text-sm text-white/40 leading-relaxed">{t.tagline}</p>
    </motion.div>
  );
}

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();
  const { t, lang, setLang } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    try {
      login();
    } catch {
      toast.error(t.error);
      setIsLoading(false);
    }
  };

  const isProcessing = isLoggingIn || isLoading;

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: "#000000" }}
    >
      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* MOBILE LAYOUT (< md): full-screen graphic bg + centered overlay     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="md:hidden relative min-h-screen flex flex-col items-center justify-center px-4 py-16">
        {/* Background graphic */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
          className="absolute inset-0 z-0"
          aria-hidden="true"
        >
          <CosmicNetworkGraphic />
        </motion.div>

        {/* Dark overlay */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 70% at center, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.90) 100%)",
          }}
          aria-hidden="true"
        />

        {/* Centered content */}
        <div className="relative z-10 flex flex-col items-center w-full">
          <Headline t={t} textAlign="center" />
          <LoginCard
            isProcessing={isProcessing}
            handleLogin={handleLogin}
            t={t}
            lang={lang}
            setLang={setLang}
          />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* DESKTOP LAYOUT (md+): two-column — left: headline+card, right: graphic */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:grid md:grid-cols-2 min-h-screen">
        {/* Left column — headline + login card (language selector inside card) */}
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-20 xl:px-28 py-16">
          <Headline t={t} textAlign="left" />
          <LoginCard
            isProcessing={isProcessing}
            handleLogin={handleLogin}
            t={t}
            lang={lang}
            setLang={setLang}
          />
        </div>

        {/* Right column — CosmicNetworkGraphic (fills full column height) */}
        <div className="relative overflow-hidden">
          {/* Graphic */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.8, ease: "easeOut" }}
            className="absolute inset-0"
            aria-hidden="true"
          >
            <CosmicNetworkGraphic />
          </motion.div>

          {/* Left-edge fade so graphic blends into the black left column */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 18%, rgba(0,0,0,0) 40%)",
            }}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}
