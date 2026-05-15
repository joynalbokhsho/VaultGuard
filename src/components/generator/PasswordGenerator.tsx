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

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ... (keep constants)

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
    <div className="flex flex-col gap-6">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="relative group">
            <div className="font-mono text-xl md:text-2xl break-all p-6 rounded-xl bg-muted/30 border border-border/50 min-h-[4rem] flex items-center justify-center text-center selection:bg-primary/20 selection:text-primary transition-all group-hover:border-primary/20">
              {password}
            </div>
          </div>

          {strength && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Strength</span>
                <Badge variant={score >= 3 ? "default" : score >= 2 ? "secondary" : "destructive"} className="font-bold">
                  {strengthLabels[score]}
                </Badge>
              </div>
              <Progress 
                value={(score + 1) * 20} 
                className={cn(
                  "h-1.5",
                  score <= 1 ? "[&>[data-slot=progress-indicator]]:bg-destructive" : 
                  score === 2 ? "[&>[data-slot=progress-indicator]]:bg-orange-500" : 
                  "[&>[data-slot=progress-indicator]]:bg-green-500"
                )} 
              />
              {strength.feedback.suggestions.length > 0 && (
                <p className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                  <span className="text-primary opacity-70">💡</span> {strength.feedback.suggestions[0]}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-8">
            <Button
              variant="outline"
              size="lg"
              className="h-12 font-semibold transition-all hover:bg-muted/50"
              onClick={() => copy(password, "Password")}
            >
              {isCopied ? (
                <><Check className="w-4 h-4 mr-2 text-green-500" /> Copied!</>
              ) : (
                <><Copy className="w-4 h-4 mr-2" /> Copy</>
              )}
            </Button>
            <Button
              size="lg"
              className="h-12 font-bold shadow-lg shadow-primary/20"
              onClick={generate}
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            <CardTitle className="text-lg">Generator Options</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/30">
            <div className="space-y-0.5">
              <Label htmlFor="opt-passphrase" className="text-base font-semibold">Memorable passphrase</Label>
              <p className="text-xs text-muted-foreground">e.g. apple-brave-cloud-dance</p>
            </div>
            <Switch
              id="opt-passphrase"
              checked={options.passphrase}
              onCheckedChange={() => toggle("passphrase")}
            />
          </div>

          {options.passphrase ? (
            <div className="space-y-6 px-1">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Word count</Label>
                  <Badge variant="outline" className="font-mono text-sm">{options.wordCount}</Badge>
                </div>
                <Slider
                  min={3}
                  max={10}
                  step={1}
                  value={[options.wordCount]}
                  onValueChange={([val]) => setOptions((o) => ({ ...o, wordCount: val }))}
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium">Separator</Label>
                <div className="flex flex-wrap gap-2">
                  {["-", "_", ".", " ", ""].map((sep) => (
                    <Button
                      key={sep}
                      variant={options.wordSeparator === sep ? "default" : "outline"}
                      size="sm"
                      className="h-8 font-mono"
                      onClick={() => setOptions((o) => ({ ...o, wordSeparator: sep }))}
                    >
                      {sep === "" ? "none" : sep === " " ? "space" : sep}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 px-1">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Password Length</Label>
                  <Badge variant="outline" className="font-mono text-sm">{options.length}</Badge>
                </div>
                <Slider
                  min={8}
                  max={128}
                  step={1}
                  value={[options.length]}
                  onValueChange={([val]) => setOptions((o) => ({ ...o, length: val }))}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 pt-2">
                <OptionItem 
                  label="Uppercase (A-Z)" 
                  checked={options.uppercase} 
                  onCheckedChange={() => toggle("uppercase")} 
                />
                <OptionItem 
                  label="Lowercase (a-z)" 
                  checked={options.lowercase} 
                  onCheckedChange={() => toggle("lowercase")} 
                />
                <OptionItem 
                  label="Numbers (0-9)" 
                  checked={options.numbers} 
                  onCheckedChange={() => toggle("numbers")} 
                />
                <OptionItem 
                  label="Symbols (!@#$%^&*)" 
                  checked={options.symbols} 
                  onCheckedChange={() => toggle("symbols")} 
                />
                <OptionItem 
                  label="Exclude Ambiguous" 
                  desc="(0, O, l, I)"
                  checked={options.excludeAmbiguous} 
                  onCheckedChange={() => toggle("excludeAmbiguous")} 
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OptionItem({ label, desc, checked, onCheckedChange }: { label: string; desc?: string; checked: boolean; onCheckedChange: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label className="text-sm font-medium cursor-pointer" onClick={onCheckedChange}>{label}</Label>
        {desc && <p className="text-[10px] text-muted-foreground font-mono">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

