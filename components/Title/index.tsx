import React, { CSSProperties } from "react";

type TVariant = "h1" | "h2" | "h3" | "h4" | "overline" | "subtitle";
type TElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";

interface TitleProps {
  variant: TVariant;
  label: string;
  as?: TElement;
  className?: string;
  style?: CSSProperties;
}

const Title: React.FC<TitleProps> = ({
  variant,
  label,
  as: Component = "p",
  className = "",
  style,
  ...props
}) => {
  // Base styles using Tailwind classes and CSS variables
  const baseStyles = [
    "text-center",
    "mb-4",
    "font-bold",
    "uppercase",
    "border-2",
    "border-solid",
    "rounded-[10px]",
    "px-2",
    "py-1",
    "shadow-[2px_2px_var(--textColor)]",
    "text-[var(--textColor)]",
    "border-[var(--textColor)]",
  ].join(" ");

  // Variant-specific styles
  const variantStyles: Record<TVariant, string> = {
    h1: "text-4xl md:text-5xl",
    h2: "text-3xl md:text-4xl",
    h3: "text-xl md:text-2xl", // Original section title size
    h4: "text-lg md:text-xl",
    overline: "text-sm tracking-widest",
    subtitle: "text-base font-normal normal-case",
  };

  // Gradient background style
  const gradientStyle: CSSProperties = {
    background: `linear-gradient(
      var(--angle, 45deg),
      var(--firstGradientColor, #000),
      var(--secondGradientColor, #fff)
    )`,
    ...style,
  };

  return (
    <Component
      {...props}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      style={gradientStyle}
    >
      {label}
    </Component>
  );
};

export default Title;
