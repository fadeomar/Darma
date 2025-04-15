import React from "react";

type ResetButtonProps = {
  onClick: () => void;
  className?: string;
};

const ResetButton: React.FC<ResetButtonProps> = ({
  onClick,
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      className={`h-[32px] flex items-center px-1 py-1 ml-1 text-xs text-[var(--textColor)] border-[3px] bg-[var(--baseColor)] border-[var(--textColor)] ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 384 512"
        className="w-4 h-4"
      >
        <path
          fill="currentColor"
          d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
        />
      </svg>
      Reset
    </button>
  );
};

export default ResetButton;
