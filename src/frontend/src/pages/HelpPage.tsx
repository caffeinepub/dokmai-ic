import {
  BookOpen,
  ExternalLink,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

const FAQ = [
  {
    q: "How is my data stored?",
    a: "All your passwords and notes are encrypted and stored on the Internet Computer blockchain — completely decentralized and secure.",
  },
  {
    q: "What is Internet Identity?",
    a: "Internet Identity is a secure authentication system for the Internet Computer. It uses device-based authentication without passwords.",
  },
  {
    q: "Can I recover my data if I lose access?",
    a: "Your data is tied to your Internet Identity. Set up multiple recovery devices in your II settings to ensure you don't lose access.",
  },
  {
    q: "Is Dokmai IC open source?",
    a: "Dokmai IC is built on the Internet Computer using Motoko smart contracts. The canister code is publicly verifiable on-chain.",
  },
];

const QUICK_LINKS = [
  {
    icon: BookOpen,
    label: "Documentation",
    color: "#22D3EE",
    href: "https://internetcomputer.org/docs",
  },
  {
    icon: MessageSquare,
    label: "Feedback",
    color: "#A855F7",
    href: "/feedback",
  },
  {
    icon: ExternalLink,
    label: "IC Dashboard",
    color: "#eab308",
    href: "https://dashboard.internetcomputer.org",
  },
];

export default function HelpPage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#EAF2FF" }}>
          {t.navHelp}
        </h1>
        <p className="text-sm" style={{ color: "#9BB0C9" }}>
          Resources and support for Dokmai IC
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {QUICK_LINKS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.a
              key={item.label}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={
                item.href.startsWith("http") ? "noopener noreferrer" : undefined
              }
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card-gradient-border p-4 flex flex-col items-center gap-2 text-center hover:scale-[1.02] transition-transform"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `${item.color}15`,
                  border: `1px solid ${item.color}30`,
                }}
              >
                <Icon size={18} style={{ color: item.color }} />
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: "#EAF2FF" }}
              >
                {item.label}
              </span>
            </motion.a>
          );
        })}
      </div>

      {/* FAQ */}
      <div>
        <h3 className="font-semibold mb-3" style={{ color: "#EAF2FF" }}>
          FAQ
        </h3>
        <div className="flex flex-col gap-3">
          {FAQ.map((item, i) => (
            <motion.div
              key={item.q}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="card-gradient-border p-4"
            >
              <div className="flex items-start gap-2">
                <HelpCircle
                  size={15}
                  className="flex-shrink-0 mt-0.5"
                  style={{ color: "#22D3EE" }}
                />
                <div>
                  <p
                    className="text-sm font-semibold mb-1"
                    style={{ color: "#EAF2FF" }}
                  >
                    {item.q}
                  </p>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "#9BB0C9" }}
                  >
                    {item.a}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
