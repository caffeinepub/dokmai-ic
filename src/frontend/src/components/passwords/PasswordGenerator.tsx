import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Check, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useCallback, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";

const AMBIGUOUS_CHARS = /[0Ol1I|`'"]/g;

function generatePassword(
  length: number,
  opts: {
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    symbols: boolean;
    noAmbiguous: boolean;
  },
): string {
  let upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let lower = "abcdefghijklmnopqrstuvwxyz";
  let nums = "0123456789";
  let syms = "!@#$%^&*()-_=+[]{}|;:,.<>?";

  if (opts.noAmbiguous) {
    upper = upper.replace(AMBIGUOUS_CHARS, "");
    lower = lower.replace(AMBIGUOUS_CHARS, "");
    nums = nums.replace(AMBIGUOUS_CHARS, "");
    syms = syms.replace(AMBIGUOUS_CHARS, "");
  }

  let chars = "";
  if (opts.uppercase) chars += upper;
  if (opts.lowercase) chars += lower;
  if (opts.numbers) chars += nums;
  if (opts.symbols) chars += syms;
  if (!chars) chars = lower + nums;

  let password = "";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

function getStrength(password: string): {
  level: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 1, label: "Weak", color: "#ef4444" };
  if (score <= 3) return { level: 2, label: "Fair", color: "#f97316" };
  if (score <= 4) return { level: 3, label: "Good", color: "#eab308" };
  return { level: 4, label: "Strong", color: "#22c55e" };
}

export default function PasswordGenerator({
  onUse,
}: { onUse?: (pwd: string) => void }) {
  const { t } = useLanguage();
  const [length, setLength] = useState(16);
  const [opts, setOpts] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false,
    noAmbiguous: false,
  });
  const [password, setPassword] = useState(() =>
    generatePassword(16, {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
      noAmbiguous: false,
    }),
  );
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const generate = useCallback(() => {
    setPassword(generatePassword(length, opts));
  }, [length, opts]);

  const copyPwd = useCallback(async () => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [password]);

  const strength = getStrength(password);

  return (
    <div
      className="flex flex-col gap-4 mt-2"
      data-ocid="passwords.generator.panel"
    >
      {/* Password display */}
      <div
        className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl font-mono text-sm"
        style={{
          background: "rgba(34,211,238,0.04)",
          border: "1px solid rgba(34,211,238,0.15)",
          color: "#22D3EE",
        }}
      >
        <span className="flex-1 break-all text-xs">
          {showPassword ? password : "•".repeat(Math.min(password.length, 24))}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="p-1 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: showPassword ? "#22D3EE" : "#9BB0C9" }}
            data-ocid="passwords.generator.show.button"
            aria-label={showPassword ? t.pwdHide : t.pwdShow}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            type="button"
            onClick={copyPwd}
            className="p-1 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: copied ? "#22c55e" : "#9BB0C9" }}
            data-ocid="passwords.generator.copy.button"
            aria-label={t.pwdCopy}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Strength bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: "#9BB0C9" }}>
            {t.pwdStrength}
          </span>
          <span
            className="text-xs font-semibold"
            style={{ color: strength.color }}
          >
            {strength.label}
          </span>
        </div>
        <div className="flex gap-1 h-1.5">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="flex-1 rounded-full transition-all duration-300"
              style={{
                background:
                  level <= strength.level ? strength.color : "#1A3354",
                boxShadow:
                  level <= strength.level
                    ? `0 0 6px ${strength.color}66`
                    : undefined,
              }}
            />
          ))}
        </div>
      </div>

      {/* Length */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="gen-length"
            className="text-xs"
            style={{ color: "#9BB0C9" }}
          >
            {t.pwdLength}
          </Label>
          <span
            className="text-sm font-bold font-mono"
            style={{ color: "#22D3EE" }}
          >
            {length}
          </span>
        </div>
        <Slider
          id="gen-length"
          data-ocid="passwords.generator.length.input"
          min={8}
          max={64}
          step={1}
          value={[length]}
          onValueChange={([val]) => {
            setLength(val);
            setPassword(generatePassword(val, opts));
          }}
        />
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { key: "uppercase", label: t.pwdUppercase },
            { key: "lowercase", label: t.pwdLowercase },
            { key: "numbers", label: t.pwdNumbers },
            { key: "symbols", label: t.pwdSymbols },
          ] as { key: keyof typeof opts; label: string }[]
        ).map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <Checkbox
              data-ocid={`passwords.generator.${key}.checkbox`}
              id={`gen-${key}`}
              checked={opts[key]}
              onCheckedChange={(checked) => {
                const newOpts = { ...opts, [key]: !!checked };
                setOpts(newOpts);
                setPassword(generatePassword(length, newOpts));
              }}
              style={{
                borderColor: opts[key] ? "#22D3EE" : "#1A3354",
                background: opts[key] ? "#22D3EE" : "transparent",
              }}
            />
            <Label
              htmlFor={`gen-${key}`}
              className="text-xs cursor-pointer"
              style={{ color: "#9BB0C9" }}
            >
              {label}
            </Label>
          </div>
        ))}
      </div>

      {/* Avoid Ambiguous Characters - full width row */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: "rgba(34,211,238,0.04)",
          border: "1px solid rgba(34,211,238,0.08)",
        }}
      >
        <Checkbox
          data-ocid="passwords.generator.noAmbiguous.checkbox"
          id="gen-noAmbiguous"
          checked={opts.noAmbiguous}
          onCheckedChange={(checked) => {
            const newOpts = { ...opts, noAmbiguous: !!checked };
            setOpts(newOpts);
            setPassword(generatePassword(length, newOpts));
          }}
          style={{
            borderColor: opts.noAmbiguous ? "#a78bfa" : "#1A3354",
            background: opts.noAmbiguous ? "#a78bfa" : "transparent",
          }}
        />
        <div className="flex flex-col gap-0.5">
          <Label
            htmlFor="gen-noAmbiguous"
            className="text-xs cursor-pointer font-medium"
            style={{ color: opts.noAmbiguous ? "#a78bfa" : "#9BB0C9" }}
          >
            {t.pwdNoAmbiguous}
          </Label>
          <span className="text-xs" style={{ color: "#4A6280" }}>
            {t.pwdNoAmbiguousHint}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          data-ocid="passwords.generator.generate.button"
          onClick={generate}
          variant="outline"
          className="flex-1 rounded-full text-sm h-9"
          style={{
            borderColor: "rgba(34,211,238,0.3)",
            color: "#22D3EE",
            background: "transparent",
          }}
        >
          <RefreshCw size={14} className="mr-1" />
          {t.pwdGenerate}
        </Button>
        {onUse && (
          <Button
            data-ocid="passwords.generator.use.button"
            onClick={() => onUse(password)}
            className="flex-1 rounded-full text-sm h-9 font-semibold"
            style={{ background: "#22D3EE", color: "#071427" }}
          >
            Use Password
          </Button>
        )}
      </div>
    </div>
  );
}
