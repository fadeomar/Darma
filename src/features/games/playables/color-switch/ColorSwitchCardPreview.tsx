import { cn } from "@/lib/cn";

type ColorSwitchCardPreviewProps = {
  className?: string;
};

export function ColorSwitchCardPreview({
  className,
}: ColorSwitchCardPreviewProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative overflow-hidden bg-[radial-gradient(circle_at_70%_18%,rgba(56,189,248,0.45),transparent_28%),linear-gradient(135deg,#111827,#312e81_55%,#701a75)]",
        className,
      )}
    >
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:100%_18px]" />
      <div className="absolute left-[18%] top-[58%] h-8 w-8 rounded-full bg-[radial-gradient(circle_at_35%_32%,#ffffff,#ef4444_48%,#7f1d1d)] shadow-[0_0_22px_rgba(239,68,68,0.75)]" />
      <div
        className="absolute left-[54%] top-[18%] h-28 w-28 rounded-full border-[14px] border-transparent"
        style={{
          borderTopColor: "#facc15",
          borderRightColor: "#ef4444",
          borderBottomColor: "#38bdf8",
          borderLeftColor: "#facc15",
        }}
      />
      <div
        className="absolute left-[60%] top-[28%] h-16 w-16 rounded-full border-[10px] border-transparent"
        style={{
          borderTopColor: "#ef4444",
          borderRightColor: "#facc15",
          borderBottomColor: "#38bdf8",
          borderLeftColor: "#38bdf8",
        }}
      />
      <div className="absolute bottom-3 left-4 right-4 rounded-2xl border border-white/15 bg-white/12 p-2 shadow-2xl backdrop-blur-sm">
        <div className="mb-1 h-2 w-24 rounded-full bg-white/70" />
        <div className="grid grid-cols-3 gap-1.5">
          <div className="h-3 rounded-full bg-[#ef4444]" />
          <div className="h-3 rounded-full bg-[#38bdf8]" />
          <div className="h-3 rounded-full bg-[#facc15]" />
        </div>
      </div>
    </div>
  );
}
