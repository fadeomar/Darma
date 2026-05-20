import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getToolRegistry } from "@/features/tools";
import ToolContentCard from "@/features/tools/ui/ToolContentCard";
import ToolPageShell from "@/features/tools/ui/ToolPageShell";
import FakeScreenClient from "./FakeScreenClient";

export const metadata: Metadata = {
  title: "Fake Screen Tool | Darma Tools",
  description: "Create safe fullscreen color screens, fake update screens, prank/error screens, DVD screensavers, and animated canvas backgrounds from one clean Darma tool.",
  keywords: ["fake screen", "fullscreen screen", "color screen", "fake update screen", "blue screen simulator", "dvd screensaver", "canvas background", "screen tools"],
};

const categoryDescriptions = [
  ["Color screens", "Solid colors, dead pixel testing, screen cleaning, and soft light."],
  ["Fake updates", "Windows-style, Mac-style, Ubuntu-style, Chrome OS-style, Android, and terminal update scenes."],
  ["Prank/error screens", "Blue errors, classic crashes, no signal, radar, broken glass, and hacker-style visuals."],
  ["Screensavers", "DVD bounce, flip clock, quote screen, no-signal bars, matrix rain, and floating text."],
  ["Canvas backgrounds", "Ten animated canvas examples including circles, starfield, network, waves, aurora, and confetti."],
];

export default function FakeScreenPage() {
  const tool = getToolRegistry().getById("fake-screen");
  if (!tool) notFound();

  return (
    <ToolPageShell
      tool={tool}
      intro={<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{categoryDescriptions.map(([title, description]) => <div key={title} className="rounded-3xl border border-black/10 bg-white/70 p-4"><h2 className="text-sm font-black text-slate-900">{title}</h2><p className="mt-2 text-xs leading-5 text-slate-600">{description}</p></div>)}</div>}
    >
      <ToolContentCard title="Fake Screen generator" description="Pick a category, preview the screen first, use the small action bar for fullscreen/share/reset, then fine-tune examples and controls below the preview.">
        <Suspense fallback={<div className="rounded-[28px] border border-black/10 bg-white p-8 text-sm font-bold text-slate-600">Loading Fake Screen...</div>}><FakeScreenClient /></Suspense>
      </ToolContentCard>
      <ToolContentCard title="About this tool">
        <div className="space-y-5 text-sm leading-7 text-slate-700 dark:text-slate-300"><p>Fake Screen is now one focused Darma tool instead of many small pages. The main flow is simpler: choose a category, see the large preview, then use the small action bar for fullscreen, share link, and reset.</p><p>The fake update examples use CSS-only, Darma-built approximations of familiar update layouts. They include Windows 11/10/XP-inspired layouts, Mac-style, Ubuntu-style, Chrome OS-style, Android-style, and terminal update screens. The spinner and progress behavior were improved to feel more natural while keeping the feature safe and browser-only.</p><p>The new Canvas backgrounds category adds ten animated examples, including the interactive circle idea, starfield, particle network, waves, aurora, fireflies, bubbles, snowfall, plasma, and confetti. These are useful as fullscreen backgrounds for demos, classrooms, video scenes, and ambient displays.</p><h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Responsible use</h3><p>Use prank-style screens only for harmless jokes, videos, demos, and creative scenes. Fullscreen always requires a click and can be exited with Esc. The tool does not open popups, block shortcuts, or modify the user device.</p><h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Related Darma tools</h3><div className="flex flex-wrap gap-2 text-sm font-bold"><Link href="/tools/color-shades" className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-slate-700 hover:bg-slate-50">Color Shades Generator</Link><Link href="/tools/animated-background-generator" className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-slate-700 hover:bg-slate-50">Animated Background Generator</Link><Link href="/tools/qr-code" className="rounded-2xl border border-black/10 bg-white/70 px-4 py-2 text-slate-700 hover:bg-slate-50">QR Code Generator</Link></div></div>
      </ToolContentCard>
    </ToolPageShell>
  );
}
