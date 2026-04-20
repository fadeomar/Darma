import { ReactNode } from "react";

export default function SurfaceCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
