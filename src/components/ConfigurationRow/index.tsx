import React, { ChangeEvent } from "react";
import { camelize } from "@/utils";
import { Input, Slider } from "@/components/ui";

interface ConfigurationRowProps {
  label: string;
  type: string;
  value: number;
  min: string | number;
  max: string | number;
  step?: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const ConfigurationRow: React.FC<ConfigurationRowProps> = ({
  label,
  type,
  value,
  min,
  max,
  step = "1",
  onChange,
}) => {
  const id = camelize(label);

  return (
    <div className="grid gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-default)] bg-[var(--color-surface-base)] p-3 shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]"
        >
          {label}
        </label>
        <span className="font-mono text-[10px] font-bold text-[var(--color-text-tertiary)]">
          {value}
        </span>
      </div>

      {type === "range" ? (
        <Slider
          name={id}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          id={id}
        />
      ) : type === "color" ? (
        <input
          type="color"
          name={id}
          value={String(value)}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          id={id}
          className="h-[38px] w-full cursor-pointer rounded-[var(--radius-sm)] border border-[var(--color-border-default)] bg-[var(--color-control-bg)] p-1"
        />
      ) : (
        <Input
          type={type}
          name={id}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          id={id}
        />
      )}
    </div>
  );
};

export default ConfigurationRow;
