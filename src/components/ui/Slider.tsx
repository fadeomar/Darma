import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const Slider = forwardRef<HTMLInputElement, SliderProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="range"
    className={cn("h-10 w-full accent-[var(--color-accent)]", className)}
    {...props}
  />
));

Slider.displayName = "Slider";
