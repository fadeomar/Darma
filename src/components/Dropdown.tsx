/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Select, { ActionMeta, MultiValue, SingleValue } from "react-select";

export interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: MultiValue<DropdownOption> | SingleValue<DropdownOption>;
  onChange: (
    newValue: MultiValue<DropdownOption> | SingleValue<DropdownOption>,
    actionMeta: ActionMeta<DropdownOption>,
  ) => void;
  placeholder?: string;
  isMulti?: boolean;
  isDisabled?: boolean;
}

const customStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    minHeight: 38,
    border: `1px solid ${state.isFocused ? "var(--color-primary)" : "var(--color-border-default)"}`,
    borderRadius: "var(--radius-sm)",
    background: "var(--color-control-bg)",
    color: "var(--color-text-primary)",
    boxShadow: state.isFocused ? "var(--focus-ring)" : "var(--shadow-xs)",
    transition: "border-color var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)",
    ":hover": {
      borderColor: "var(--color-border-strong)",
    },
  }),
  valueContainer: (provided: any) => ({
    ...provided,
    padding: "2px 10px",
  }),
  input: (provided: any) => ({
    ...provided,
    color: "var(--color-text-primary)",
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: "var(--color-text-primary)",
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: "var(--color-text-tertiary)",
  }),
  menu: (provided: any) => ({
    ...provided,
    zIndex: 60,
    overflow: "hidden",
    border: "1px solid var(--color-border-default)",
    borderRadius: "var(--radius-md)",
    background: "var(--color-surface-raised)",
    boxShadow: "var(--shadow-md)",
  }),
  menuList: (provided: any) => ({
    ...provided,
    padding: 6,
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    borderRadius: "var(--radius-sm)",
    backgroundColor: state.isSelected
      ? "var(--color-primary-soft)"
      : state.isFocused
        ? "var(--color-control-hover)"
        : "transparent",
    color: state.isSelected ? "var(--color-primary)" : "var(--color-text-primary)",
    fontWeight: state.isSelected ? 700 : 500,
    cursor: "pointer",
    ":active": {
      backgroundColor: "var(--color-control-active)",
    },
  }),
  multiValue: (provided: any) => ({
    ...provided,
    border: "1px solid var(--color-primary-border)",
    borderRadius: "var(--radius-full)",
    backgroundColor: "var(--color-primary-soft)",
  }),
  multiValueLabel: (provided: any) => ({
    ...provided,
    paddingLeft: 8,
    color: "var(--color-primary)",
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  }),
  multiValueRemove: (provided: any) => ({
    ...provided,
    color: "var(--color-primary)",
    borderRadius: "var(--radius-full)",
    ":hover": {
      backgroundColor: "var(--color-primary-border)",
      color: "var(--color-primary)",
    },
  }),
  indicatorSeparator: (provided: any) => ({
    ...provided,
    backgroundColor: "var(--color-border-default)",
  }),
  dropdownIndicator: (provided: any) => ({
    ...provided,
    color: "var(--color-text-tertiary)",
    ":hover": {
      color: "var(--color-text-primary)",
    },
  }),
};

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select...",
  isMulti = true,
  isDisabled = false,
}) => {
  return (
    <Select
      styles={customStyles}
      isMulti={isMulti}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      className="w-full"
      classNamePrefix="react-select"
    />
  );
};

export default Dropdown;
