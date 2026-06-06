import Image from "next/image";
import { Badge } from "@/components/ui";
import { PasswordFaq } from "./PasswordFaq";
import { PasswordHeroIllustration } from "./PasswordHeroIllustration";

const howToCards = [
  {
    title: "Choose a format",
    text: "Use a random password for autofill, or switch to passphrase when you need something easier to type.",
    icon: "01",
  },
  {
    title: "Adjust the options",
    text: "Increase length, include character types, and exclude confusing characters only when readability matters.",
    icon: "02",
  },
  {
    title: "Copy and save safely",
    text: "Paste it into the account form and save it in a password manager before closing the page.",
    icon: "03",
  },
];

const bestPractices = [
  ["Unique everywhere", "Use a different password for every account so one leak cannot unlock everything."],
  ["Longer is stronger", "Length usually gives the biggest security boost. Prefer 16+ random characters."],
  ["Passphrases for typing", "A few random words are easier to enter on TVs, routers, and shared devices."],
  ["Use a manager", "Let a password manager store and autofill the secrets you should not memorize."],
  ["Turn on 2FA", "Add a second factor to important accounts, especially email and financial services."],
  ["Do not share secrets", "Avoid sending passwords through screenshots, chat apps, documents, or email."],
];

const weakPatterns = ["123456", "password", "qwerty", "name + birthday", "phone number", "reused password"];

function SectionIntro({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-primary)]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base sm:leading-7">{text}</p>
    </div>
  );
}

export function PasswordSecuritySections() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:p-7">
        <SectionIntro
          eyebrow="Simple workflow"
          title="How to use this password generator"
          text="The tool is designed for quick generation, but the safest flow is still deliberate: choose, check, copy, and store."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {howToCards.map((card) => (
            <article key={card.title} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-5 shadow-[var(--shadow-xs)]">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] font-mono text-sm font-black text-[var(--color-primary)]">
                {card.icon}
              </span>
              <h3 className="mt-4 text-lg font-black text-[var(--color-text-primary)]">{card.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-primary)]">Best practices</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-3xl">
              Password security best practices
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base sm:leading-7">
              A strong password is only one part of account safety. The bigger win is using unique secrets, saving them safely, and adding extra protection where it matters.
            </p>
            <div className="mt-5 max-w-sm rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
              <Image
                src="/assets/tools/password-generator/browser-shield.png"
                width={706}
                height={706}
                alt="Illustration of devices protected by a shield"
                className="mx-auto h-auto max-h-56 w-full object-contain"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {bestPractices.map(([title, text], index) => (
              <article key={title} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 shadow-[var(--shadow-xs)]">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] font-mono text-[11px] font-black text-[var(--color-accent)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-black text-[var(--color-text-primary)]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="soft">Best for managers</Badge>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Random password</span>
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Dense, random, and hard to guess</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
            Random passwords pack a lot of entropy into a short string. They are best for accounts that your password manager will save and autofill.
          </p>
          <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-code-bg)] p-4 font-mono text-lg font-black text-[var(--color-code-text)] shadow-[var(--shadow-xs)]">
            V7m!Q9r#L2p@K8s$
          </div>
          <p className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">Example only. Generate your own and do not reuse this sample.</p>
        </article>

        <article className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="accent">Best for typing</Badge>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">Memorable passphrase</span>
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)]">Longer, readable, and easier to enter</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
            Passphrases are better when a person must type the secret manually, such as Wi‑Fi, TV apps, router panels, or recovery flows.
          </p>
          <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4 font-mono text-lg font-black text-[var(--color-text-primary)] shadow-[var(--shadow-xs)]">
            river-orbit-castle-signal
          </div>
          <p className="mt-2 text-xs leading-5 text-[var(--color-text-tertiary)]">Example only. Generate a fresh passphrase for real use.</p>
        </article>
      </section>

      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]">
        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:items-center">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-primary)]">Privacy by design</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-3xl">
              Generated locally in your browser
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base sm:leading-7">
              Darma uses browser crypto APIs to generate secrets on the device you are using. The generated value is not uploaded, stored by Darma, logged, or placed in the page URL.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {["Crypto API randomness", "No server upload", "No password storage", "Copy only when ready"].map((item) => (
                <div key={item} className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)]">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <PasswordHeroIllustration compact />
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] p-5 shadow-[var(--shadow-card)] sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="max-w-sm rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-4">
            <Image
              src="/assets/tools/password-generator/password-warning.png"
              width={450}
              height={639}
              alt="Illustration of password fields with a warning sign"
              className="mx-auto h-auto max-h-80 w-full object-contain"
            />
          </div>
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-danger-text)]">Weak patterns</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-3xl">Avoid weak password patterns</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base sm:leading-7">
              These examples are intentionally weak. They are common, predictable, or tied to personal information, so attackers try them early.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {weakPatterns.map((pattern) => (
                <code key={pattern} className="rounded-[var(--radius-full)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-3 py-1.5 font-mono text-xs font-bold text-[var(--color-danger-text)]">
                  {pattern}
                </code>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PasswordFaq />
    </div>
  );
}
