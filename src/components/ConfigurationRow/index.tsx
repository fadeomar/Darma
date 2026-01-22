import React, { ChangeEvent } from "react";
import { camelize } from "@/utils";
import "./style.css";
interface ConfigurationRowProps {
  label: string;
  type: string; // Could be more specific like 'range' | 'text' if you want to restrict it
  value: number;
  min: string | number; // Allowing string or number since HTML inputs accept both
  max: string | number;
  step?: string | number; // Optional, defaults to "1"
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
  return (
    <div className="row">
      <label htmlFor={camelize(label)} className="opacity-60">
        {label}{" "}
      </label>
      <input
        type={type}
        name={camelize(label)}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        id={camelize(label)}
      />
    </div>
  );
};

export default ConfigurationRow;
