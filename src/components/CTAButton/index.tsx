import Link from "next/link";
import "./style.css";

interface FancyCTAButtonProps {
  href: string;
  label: string;
}

export default function FancyCTAButton({ href, label }: FancyCTAButtonProps) {
  return (
    <Link href={href}>
      <button
        className="fancy-cta-button relative px-6 py-3 text-lg font-semibold text-textColor rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300"
        aria-label={`Navigate to ${label} page`}
      >
        {label}
      </button>
    </Link>
  );
}
