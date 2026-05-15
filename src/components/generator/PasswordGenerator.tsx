"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCcw, Copy, Check, Sliders } from "lucide-react";
import { toast } from "sonner";
import { useCopyWithClear } from "@/hooks/useCopyWithClear";

// zxcvbn for strength scoring
import zxcvbn from "zxcvbn";

const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const AMBIGUOUS = "0O1lI";

const WORDLIST = [
  "apple", "brave", "cloud", "dance", "eagle", "flame", "green", "heart",
  "ivory", "jewel", "kite", "lemon", "mouse", "night", "ocean", "pearl",
  "quest", "river", "stone", "tiger", "ultra", "vault", "water", "xenon",
  "yacht", "zebra", "amber", "bolt", "cedar", "drift", "ember", "frost",
  "grove", "halo", "iris", "jade", "karma", "lunar", "maple", "nova",
  "orbit", "prism", "quartz", "ridge", "solar", "thorn", "umbra", "venom",
  "wind", "xenith", "yonder", "zenith", "crisp", "dawn", "dusk", "echo",
];

interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
  passphrase: boolean;
  wordCount: number;
  wordSeparator: string;
}

function generateSecurePassword(opts: GeneratorOptions): string {
  if (opts.passphrase) {
    const words: string[] = [];
    const array = new Uint32Array(opts.wordCount);
    crypto.getRandomValues(array);
    for (let i = 0; i < opts.wordCount; i++) {
      words.push(WORDLIST[array[i] % WORDLIST.length]);
    }
    return words.join(opts.wordSeparator);
  }

  let charset = "";
  if (opts.lowercase) charset += LOWERCASE;
  if (opts.uppercase) charset += UPPERCASE;
  if (opts.numbers) charset += NUMBERS;
  if (opts.symbols) charset += SYMBOLS;

  if (opts.excludeAmbiguous) {
    for (const c of AMBIGUOUS) {
      charset = charset.replace(c, "");
    }
  }

  if (!charset) charset = LOWERCASE + UPPERCASE + NUMBERS;

  const array = new Uint32Array(opts.length);
  crypto.getRandomValues(array);

  let password = "";
  for (let i = 0; i < opts.length; i++) {
    password += charset[array[i] % charset.length];
  }

  const requiredChars: string[] = [];
  if (opts.lowercase) requiredChars.push(LOWERCASE[crypto.getRandomValues(new Uint32Array(1))[0] % LOWERCASE.length]);
  if (opts.uppercase) requiredChars.push(UPPERCASE[crypto.getRandomValues(new Uint32Array(1))[0] % UPPERCASE.length]);
  if (opts.numbers) requiredChars.push(NUMBERS[crypto.getRandomValues(new Uint32Array(1))[0] % NUMBERS.length]);
  if (opts.symbols) requiredChars.push(SYMBOLS[crypto.getRandomValues(new Uint32Array(1))[0] % SYMBOLS.length]);

  const passwordArr = password.split("");
  const positions = new Uint32Array(requiredChars.length);
  crypto.getRandomValues(positions);
  requiredChars.forEach((c, i) => {
    passwordArr[positions[i] % opts.length] = c;
  });

  return passwordArr.join("");
}

const strengthLabels = ["Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
const strengthColors = ["#ef4444", "#f97316", "#eab308", "#10b981", "#3b82f6"];

const C = {
  bgCard: "#111120",
  fg: "#f0eeff",
  fgMuted: "#9c99bc",
  border: "#282840",
  primary: "#7c3aed",
  primaryHover: "#6d28d9",
  primaryBg: "rgba(124,58,237,0.1)",
  mutedBg: "rgba(255,255,255,0.06)",
};

export function PasswordGenerator() {
  const [options, setOptions] = useState<GeneratorOptions>({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
    passphrase: false,
    wordCount: 5,
    wordSeparator: "-",
  });

  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState<ReturnType<typeof zxcvbn> | null>(null);
  const { copy, isCopied } = useCopyWithClear({ clearAfterMs: 30_000 });

  const generate = useCallback(() => {
    const pwd = generateSecurePassword(options);
    setPassword(pwd);
    setStrength(zxcvbn(pwd));
  }, [options]);

  useEffect(() => {
    generate();
  }, [generate]);

  const toggle = (key: keyof GeneratorOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key as keyof GeneratorOptions] }));
  };

  const score = strength?.score ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Password display */}
      <div style={{ borderRadius: 16, backgroundColor: C.bgCard, border: `1px solid ${C.border}`, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div
            id="generated-password"
            style={{
              flex: 1, minWidth: 0, fontFamily: "monospace", fontSize: 18, color: C.fg,
              backgroundColor: C.mutedBg, borderRadius: 8, padding: "12px 16px",
              overflowX: "auto", whiteSpace: "nowrap", userSelect: "all"
            }}
          >
            {password}
          </div>
        </div>

        {/* Strength bar */}
        {strength && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: C.fgMuted }}>Strength</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: strengthColors[score] }}>
                {strengthLabels[score]}
              </span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  style={{
                    height: 6, flex: 1, borderRadius: 999, transition: "background-color 0.3s",
                    backgroundColor: i <= score ? strengthColors[score] : C.border
                  }}
                />
              ))}
            </div>
            {strength.feedback.suggestions.length > 0 && (
              <p style={{ fontSize: 12, color: C.fgMuted, marginTop: 8 }}>
                💡 {strength.feedback.suggestions[0]}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            id="copy-password-btn"
            onClick={() => copy(password, "Password")}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "10px 0", borderRadius: 8, border: `1px solid ${C.border}`, backgroundColor: "transparent",
              color: C.fg, fontSize: 14, fontWeight: 500, cursor: "pointer", transition: "background-color 0.15s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.mutedBg}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            {isCopied ? (
              <><Check size={16} color="#10b981" /> Copied!</>
            ) : (
              <><Copy size={16} /> Copy</>
            )}
          </button>
          <button
            id="regenerate-btn"
            onClick={generate}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "10px 0", borderRadius: 8, backgroundColor: C.primary, color: "#fff",
              fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", transition: "opacity 0.15s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >
            <RefreshCcw size={16} />
            Regenerate
          </button>
        </div>
      </div>

      {/* Options */}
      <div style={{ borderRadius: 16, backgroundColor: C.bgCard, border: `1px solid ${C.border}`, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <Sliders size={16} color={C.primary} />
          <h3 style={{ fontWeight: 600, color: C.fg }}>Options</h3>
        </div>

        {/* Passphrase toggle */}
        <ToggleOption
          id="opt-passphrase"
          label="Memorable passphrase"
          description="e.g. apple-brave-cloud-dance"
          checked={options.passphrase}
          onChange={() => toggle("passphrase")}
        />

        {options.passphrase ? (
          <>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.fg, marginBottom: 8 }}>
                Word count: {options.wordCount}
              </label>
              <input
                id="word-count-slider"
                type="range"
                min={3}
                max={10}
                value={options.wordCount}
                onChange={(e) => setOptions((o) => ({ ...o, wordCount: parseInt(e.target.value) }))}
                style={{ width: "100%", accentColor: C.primary }}
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.fg, marginBottom: 8 }}>Separator</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["-", "_", ".", " ", ""].map((sep) => (
                  <button
                    key={sep}
                    onClick={() => setOptions((o) => ({ ...o, wordSeparator: sep }))}
                    style={{
                      padding: "6px 12px", borderRadius: 8, fontSize: 14, cursor: "pointer", transition: "all 0.15s",
                      border: `1px solid ${options.wordSeparator === sep ? C.primary : C.border}`,
                      backgroundColor: options.wordSeparator === sep ? C.primaryBg : "transparent",
                      color: options.wordSeparator === sep ? C.primary : C.fgMuted
                    }}
                  >
                    {sep === "" ? "none" : sep === " " ? "space" : sep}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.fg, marginBottom: 8 }}>
                Length: {options.length}
              </label>
              <input
                id="length-slider"
                type="range"
                min={8}
                max={128}
                value={options.length}
                onChange={(e) => setOptions((o) => ({ ...o, length: parseInt(e.target.value) }))}
                style={{ width: "100%", accentColor: C.primary }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.fgMuted, marginTop: 4 }}>
                <span>8</span>
                <span>128</span>
              </div>
            </div>

            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <ToggleOption id="opt-uppercase" label="Uppercase letters (A-Z)" checked={options.uppercase} onChange={() => toggle("uppercase")} />
              <ToggleOption id="opt-lowercase" label="Lowercase letters (a-z)" checked={options.lowercase} onChange={() => toggle("lowercase")} />
              <ToggleOption id="opt-numbers" label="Numbers (0-9)" checked={options.numbers} onChange={() => toggle("numbers")} />
              <ToggleOption id="opt-symbols" label="Symbols (!@#$%^&*)" checked={options.symbols} onChange={() => toggle("symbols")} />
              <ToggleOption id="opt-ambiguous" label="Exclude ambiguous characters (0, O, l, I)" checked={options.excludeAmbiguous} onChange={() => toggle("excludeAmbiguous")} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ToggleOption({
  id, label, description, checked, onChange,
}: {
  id: string; label: string; description?: string; checked: boolean; onChange: () => void;
}) {
  return (
    <label htmlFor={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 500, color: C.fg, transition: "color 0.15s" }}>
          {label}
        </p>
        {description && <p style={{ fontSize: 12, color: C.fgMuted }}>{description}</p>}
      </div>
      <div
        style={{
          position: "relative", width: 44, height: 24, borderRadius: 999, transition: "background-color 0.2s",
          backgroundColor: checked ? C.primary : C.border
        }}
        onClick={onChange}
      >
        <div
          id={id}
          style={{
            position: "absolute", top: 2, left: 2, width: 20, height: 20, borderRadius: "50%",
            backgroundColor: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", transition: "transform 0.2s",
            transform: checked ? "translateX(20px)" : "translateX(0)"
          }}
        />
      </div>
    </label>
  );
}
