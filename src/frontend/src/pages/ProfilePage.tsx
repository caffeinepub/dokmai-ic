import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, User } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type LangCode, useLanguage } from "../contexts/LanguageContext";
import { useUpdateUserProfile, useUserProfile } from "../hooks/useQueries";
import { Language } from "../types";

const EMAIL_STORAGE_KEY = "dokmai-user-email";

export default function ProfilePage() {
  const { lang } = useLanguage();
  const { data: profile } = useUserProfile();
  const { mutate: updateProfile, isPending: isSaving } = useUpdateUserProfile();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(
    () => localStorage.getItem(EMAIL_STORAGE_KEY) ?? "",
  );

  // Pre-populate display name when profile loads
  useEffect(() => {
    if (profile?.name) {
      setDisplayName(profile.name);
    }
  }, [profile?.name]);

  const handleSave = () => {
    const langMap: Record<LangCode, Language> = {
      en: Language.en,
      nl: Language.nl,
      pl: Language.pl,
      th: Language.th,
      zh: Language.zh,
    };

    // Save email to localStorage
    localStorage.setItem(EMAIL_STORAGE_KEY, email.trim());

    // Save display name to backend
    updateProfile(
      {
        name: displayName.trim() || (profile?.name ?? ""),
        language: langMap[lang],
      },
      {
        onSuccess: () => toast.success("Profile saved!"),
        onError: (e) => toast.error(`Error: ${e.message}`),
      },
    );
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#EAF2FF" }}>
          Profile
        </h1>
        <p className="text-sm" style={{ color: "#9BB0C9" }}>
          Manage your display name and contact information
        </p>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card-gradient-border p-5"
      >
        <h3 className="font-semibold mb-4 text-sm" style={{ color: "#22D3EE" }}>
          Personal Information
        </h3>

        <div className="flex flex-col gap-4">
          {/* Display Name */}
          <div>
            <Label
              htmlFor="profile-name"
              className="text-xs mb-1.5 flex items-center gap-1.5"
              style={{ color: "#9BB0C9" }}
            >
              <User size={12} />
              Display Name
            </Label>
            <Input
              id="profile-name"
              data-ocid="profile.name.input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              style={{
                background: "#071427",
                border: "1px solid #1A3354",
                color: "#EAF2FF",
              }}
            />
            <p className="text-xs mt-1" style={{ color: "#9BB0C9" }}>
              Shown in the sidebar and avatar area.
            </p>
          </div>

          {/* Email Address */}
          <div>
            <Label
              htmlFor="profile-email"
              className="text-xs mb-1.5 flex items-center gap-1.5"
              style={{ color: "#9BB0C9" }}
            >
              <Mail size={12} />
              Email Address
            </Label>
            <Input
              id="profile-email"
              data-ocid="profile.email.input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              style={{
                background: "#071427",
                border: "1px solid #1A3354",
                color: "#EAF2FF",
              }}
            />
            <p className="text-xs mt-1" style={{ color: "#9BB0C9" }}>
              Stored locally on this device. Shown in the avatar dropdown menu.
            </p>
          </div>
        </div>
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-end"
      >
        <Button
          data-ocid="profile.save.primary_button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-full font-semibold text-sm px-6"
          style={{ background: "#22D3EE", color: "#071427" }}
        >
          {isSaving ? (
            <Loader2 size={14} className="animate-spin mr-1.5" />
          ) : null}
          Save Profile
        </Button>
      </motion.div>
    </div>
  );
}
