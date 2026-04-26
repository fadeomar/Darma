import type {
  PasswordConfig,
  StrengthResult,
  StrengthLevel,
  AnnotatedChar,
  CharType,
} from "./types";

// ─── Character sets ───────────────────────────────────────────────────────────

const LOWER_ALL   = "abcdefghijklmnopqrstuvwxyz";
const UPPER_ALL   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS_ALL  = "0123456789";
const SYMBOLS_ALL = "!@#$%^&*()-_=+[]{}|;:,.<>?/~";

// Characters that look alike — excluded when excludeSimilar is on
const SIMILAR = new Set(["l","1","I","O","0","o","S","5","Z","2","G","6","B","8"]);

// Defined as a string to sidestep quote-escaping issues in tooling
// Covers: { } [ ] ( ) / \ ' " ` , ; : . < >
const AMBIGUOUS_CHARS = "{}[]()/" + "\\" + "'\"`,.;:<>";
const AMBIGUOUS_SYMBOLS = new Set(AMBIGUOUS_CHARS.split(""));

function filterSet(
  chars: string,
  excludeSimilar: boolean,
  isSymbol = false,
  excludeAmbiguous = false,
): string {
  return chars
    .split("")
    .filter((c) => {
      if (excludeSimilar && SIMILAR.has(c)) return false;
      if (isSymbol && excludeAmbiguous && AMBIGUOUS_SYMBOLS.has(c)) return false;
      return true;
    })
    .join("");
}

// ─── Password generation ──────────────────────────────────────────────────────

function randIndex(max: number): number {
  if (!Number.isInteger(max) || max <= 0) {
    throw new Error("randIndex max must be a positive integer");
  }
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.getRandomValues) {
    throw new Error("Secure random source is unavailable in this environment");
  }
  // Rejection sampling avoids modulo bias for non-power-of-two max values.
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    cryptoObj.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}

function pickRandom(chars: string): string {
  return chars[randIndex(chars.length)];
}

export function generatePassword(config: PasswordConfig): string {
  const { length, uppercase, lowercase, numbers, symbols, excludeSimilar, excludeAmbiguous, seedText } = config;

  const lower  = lowercase ? filterSet(LOWER_ALL,   excludeSimilar) : "";
  const upper  = uppercase ? filterSet(UPPER_ALL,   excludeSimilar) : "";
  const digits = numbers   ? filterSet(DIGITS_ALL,  excludeSimilar) : "";
  const syms   = symbols   ? filterSet(SYMBOLS_ALL, excludeSimilar, true, excludeAmbiguous) : "";

  const pool = lower + upper + digits + syms;

  // Seed chars — stripped of spaces, truncated so at least 4 random chars still fit
  const seedChars = seedText
    ? seedText.replace(/\s/g, "").split("").slice(0, Math.max(0, length - 4))
    : [];

  if (!pool && seedChars.length === 0) return "";
  if (!pool) return shuffle([...seedChars]).join("").slice(0, length);

  // Guarantee at least one from each enabled set — skip if seed already provides that type
  const hasLower  = seedChars.some((c) => /[a-z]/.test(c));
  const hasUpper  = seedChars.some((c) => /[A-Z]/.test(c));
  const hasDigit  = seedChars.some((c) => /[0-9]/.test(c));
  const hasSymbol = seedChars.some((c) => !/[a-zA-Z0-9]/.test(c));

  const guaranteed: string[] = [];
  if (lower  && !hasLower)  guaranteed.push(pickRandom(lower));
  if (upper  && !hasUpper)  guaranteed.push(pickRandom(upper));
  if (digits && !hasDigit)  guaranteed.push(pickRandom(digits));
  if (syms   && !hasSymbol) guaranteed.push(pickRandom(syms));

  const taken = seedChars.length + guaranteed.length;
  const remaining = Math.max(0, length - taken);
  const extra = Array.from({ length: remaining }, () => pickRandom(pool));

  const combined = [...seedChars, ...guaranteed, ...extra];
  return shuffle(combined).slice(0, length).join("");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randIndex(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Passphrase word list (~250 memorable, concrete words) ───────────────────

const WORDLIST = [
  "apple","atlas","autumn","azure","badge","bamboo","barrel","beach","beacon",
  "birch","bison","blade","blaze","bliss","bloom","blossom","bluff","border",
  "branch","brass","brave","breeze","brick","bridge","brook","burden","cabin",
  "canvas","carbon","castle","cedar","chalk","chrome","circus","citrus","cliff",
  "cloud","clover","cobalt","coral","cotton","crane","creek","crown","crush",
  "crystal","current","curve","dagger","dawn","delta","desert","dew","diamond",
  "drift","drum","dune","eagle","earth","echo","elder","elm","ember","epoch",
  "falcon","fern","ferry","field","filter","flame","flash","flint","float",
  "flower","flute","forest","forge","fossil","fox","frost","gale","garnet",
  "ghost","glade","glass","globe","gloss","glove","grain","grand","granite",
  "gravel","grove","guide","gulf","harbor","hawk","hazel","helix","helm",
  "hero","hill","hive","hollow","honey","horizon","horse","hound","humble",
  "hunter","husk","ice","ignite","image","impact","inlet","iris","iron","island",
  "jade","jasper","jet","journal","jumper","jungle","kelp","keystone","kindle",
  "knot","lace","lagoon","lance","lantern","latch","launch","leaf","ledge",
  "legend","lemon","level","light","lime","linden","lion","lotus","lunar",
  "magnet","maple","marble","marsh","mast","meadow","meteor","mist","moose",
  "mosaic","moss","mount","mystic","nebula","needle","noble","north","notion",
  "oak","ocean","olive","onyx","orbit","otter","oyster","paddle","palm","panel",
  "pebble","peak","pepper","petal","pilot","pine","pixel","plain","planet",
  "plum","polar","pond","poppy","prism","pulse","quartz","quest","quick",
  "quiet","radar","rain","raven","reach","reef","relay","ridge","river","robin",
  "rocket","rocky","root","rose","rowan","ruby","rustic","sage","sail","salmon",
  "salt","sand","sapphire","scout","seal","seed","shade","shadow","shaft",
  "shell","shield","shore","signal","silk","silver","sketch","sky","slate",
  "sleet","slope","snow","solar","spark","spire","splash","spring","sprout",
  "squall","stable","star","steel","stem","stone","storm","stout","stream",
  "summit","sunset","swift","sword","terra","thorn","thunder","tide","timber",
  "topaz","torch","tower","track","trail","tundra","turquoise","valley","vapor",
  "vessel","violet","vista","volt","wake","walnut","wave","wax","wheat","willow",
  "wind","winter","wolf","wooden","zenith","zephyr","zinc",
];

const PASSPHRASE_SYMBOLS = "!@#$%&*?".split("");

export function generatePassphrase(config: PasswordConfig): string {
  const { wordCount, separator, capitalizeWords, includeNumber, includeSymbol, seedText } = config;

  const sep =
    separator === "random"
      ? ["-", "_", ".", " "][randIndex(4)]
      : separator;

  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    let word = WORDLIST[randIndex(WORDLIST.length)];
    if (capitalizeWords) word = word.charAt(0).toUpperCase() + word.slice(1);
    words.push(word);
  }

  if (includeNumber) {
    const num = String(randIndex(90) + 10);
    words.splice(randIndex(words.length + 1), 0, num);
  }

  if (includeSymbol) {
    const sym = PASSPHRASE_SYMBOLS[randIndex(PASSPHRASE_SYMBOLS.length)];
    words.splice(randIndex(words.length + 1), 0, sym);
  }

  // Weave seed text in as an extra word segment if provided
  if (seedText && seedText.trim()) {
    const seed = seedText.trim();
    words.splice(randIndex(words.length + 1), 0, seed);
  }

  return words.join(sep);
}

// ─── Strength ─────────────────────────────────────────────────────────────────

function calcEntropy(config: PasswordConfig): number {
  if (config.mode === "passphrase") {
    const effectiveCount = config.includeNumber ? config.wordCount + 1 : config.wordCount;
    return Math.round(effectiveCount * Math.log2(WORDLIST.length));
  }

  let pool = 0;
  if (config.lowercase) pool += filterSet(LOWER_ALL,   config.excludeSimilar).length;
  if (config.uppercase) pool += filterSet(UPPER_ALL,   config.excludeSimilar).length;
  if (config.numbers)   pool += filterSet(DIGITS_ALL,  config.excludeSimilar).length;
  if (config.symbols)   pool += filterSet(SYMBOLS_ALL, config.excludeSimilar, true, config.excludeAmbiguous).length;

  if (pool === 0) return 0;
  return Math.round(config.length * Math.log2(pool));
}

function formatCrackTime(seconds: number): string {
  if (seconds < 1)         return "instantly";
  if (seconds < 60)        return `${Math.round(seconds)}s`;
  if (seconds < 3600)      return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400)     return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 2592000)   return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000)  return `${Math.round(seconds / 2592000)} months`;
  const years = seconds / 31536000;
  if (years < 1000)        return `${Math.round(years)} years`;
  if (years < 1e6)         return `${Math.round(years / 100)} centuries`;
  if (years < 1e9)         return `${Math.round(years / 1e6)}M years`;
  return "longer than the universe";
}

const STRENGTH_MAP: Record<StrengthLevel, { label: string; score: number; color: string }> = {
  "very-weak":   { label: "Very weak",  score: 12,  color: "bg-red-500" },
  "weak":        { label: "Weak",        score: 30,  color: "bg-orange-400" },
  "fair":        { label: "Fair",        score: 55,  color: "bg-yellow-400" },
  "strong":      { label: "Strong",      score: 78,  color: "bg-emerald-400" },
  "very-strong": { label: "Very strong", score: 100, color: "bg-emerald-600" },
};

function entropyToLevel(bits: number): StrengthLevel {
  if (bits < 28) return "very-weak";
  if (bits < 40) return "weak";
  if (bits < 60) return "fair";
  if (bits < 80) return "strong";
  return "very-strong";
}

export function calculateStrength(password: string, config: PasswordConfig): StrengthResult {
  if (!password) {
    return { entropy: 0, level: "very-weak", label: "\u2014", crackTime: "\u2014", score: 0, color: "bg-slate-200" };
  }

  const entropy = calcEntropy(config);
  const level = entropyToLevel(entropy);
  const { label, score, color } = STRENGTH_MAP[level];
  const secondsToCrack = Math.pow(2, entropy) / 1e10;

  return { entropy, level, label, crackTime: formatCrackTime(secondsToCrack), score, color };
}

// ─── Character annotation (for colour-coded display) ─────────────────────────

export function annotatePassword(password: string): AnnotatedChar[] {
  return password.split("").map((char) => {
    let type: CharType = "lower";
    if (/[A-Z]/.test(char))      type = "upper";
    else if (/[0-9]/.test(char)) type = "digit";
    else if (!/[a-z]/.test(char)) type = "symbol";
    return { char, type };
  });
}
