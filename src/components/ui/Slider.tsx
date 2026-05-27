import { forwardRef, type CSSProperties, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type SliderProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

function getSliderPercent({ min, max, value, defaultValue }: Pick<SliderProps, "min" | "max" | "value" | "defaultValue">) {
  const minValue = Number(min ?? 0);
  const maxValue = Number(max ?? 100);
  const currentValue = Number(value ?? defaultValue ?? minValue);

  if (!Number.isFinite(minValue) || !Number.isFinite(maxValue) || !Number.isFinite(currentValue) || maxValue <= minValue) {
    return 0;
  }

  return Math.min(100, Math.max(0, ((currentValue - minValue) / (maxValue - minValue)) * 100));
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className, min, max, value, defaultValue, style, disabled, ...props }, ref) => {
    const percent = getSliderPercent({ min, max, value, defaultValue });
    const sliderStyle = {
      background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${percent}%, var(--color-control-track) ${percent}%, var(--color-control-track) 100%)`,
      ...style,
    } satisfies CSSProperties;

    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        style={sliderStyle}
        className={cn(
          "darma-slider h-6 w-full cursor-pointer rounded-[var(--radius-full)] outline-none transition disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);

Slider.displayName = "Slider";
