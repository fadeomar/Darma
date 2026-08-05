import type { SVGProps } from "react";

export type DarmaSymbolName =
  | "build"
  | "learn"
  | "compare"
  | "play"
  | "secure"
  | "accessible"
  | "performance"
  | "source"
  | "search"
  | "route"
  | "puzzle"
  | "speed"
  | "strategy"
  | "color"
  | "resource";

type DarmaSymbolProps = SVGProps<SVGSVGElement> & {
  name: DarmaSymbolName;
  title?: string;
};

export function DarmaSymbol({ name, title, ...props }: DarmaSymbolProps) {
  const labelled = Boolean(title);

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-label={labelled ? title : undefined}
      focusable="false"
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <SymbolPaths name={name} />
    </svg>
  );
}

function SymbolPaths({ name }: { name: DarmaSymbolName }) {
  const stroke = "currentColor";
  const common = {
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "build":
      return <><path d="M7 10.5 16 5l9 5.5v11L16 27l-9-5.5v-11Z" {...common}/><path d="m7.5 10.8 8.5 5.1 8.5-5.1M16 16v10.2M11.4 8.1 20.6 14" {...common}/></>;
    case "learn":
      return <><path d="M6.5 8.5c3.6-1.1 6.8-.4 9.5 1.6v15c-2.7-2-5.9-2.7-9.5-1.6v-15Z" {...common}/><path d="M25.5 8.5c-3.6-1.1-6.8-.4-9.5 1.6v15c2.7-2 5.9-2.7 9.5-1.6v-15ZM10 13h3M10 17h3M19 13h3M19 17h3" {...common}/></>;
    case "compare":
      return <><path d="M6 10h14M16.5 6.5 20 10l-3.5 3.5M26 22H12M15.5 18.5 12 22l3.5 3.5" {...common}/><circle cx="7" cy="22" r="2" {...common}/><circle cx="25" cy="10" r="2" {...common}/></>;
    case "play":
      return <><path d="M11 7.5h10l5 6v8.5a3 3 0 0 1-5.2 2l-2.2-2.5h-5.2L11.2 24A3 3 0 0 1 6 22v-8.5l5-6Z" {...common}/><path d="M11 15v5M8.5 17.5h5M21 15.5h.1M23.5 18h.1" {...common}/></>;
    case "secure":
      return <><path d="M16 4.8 25 8v7.3c0 5.4-3.6 9.3-9 11.9-5.4-2.6-9-6.5-9-11.9V8l9-3.2Z" {...common}/><path d="m11.8 16.2 2.7 2.7 5.8-6" {...common}/></>;
    case "accessible":
      return <><circle cx="16" cy="6.5" r="2.5" {...common}/><path d="M7 11.2c5.9 1.8 12.1 1.8 18 0M16 12.8v6.1M12.5 26l3.5-7.1 3.5 7.1M10 15.5l-2.5 5M22 15.5l2.5 5" {...common}/></>;
    case "performance":
      return <><path d="M6.2 23.5a11 11 0 1 1 19.6 0" {...common}/><path d="M16 16 22.5 11M9.5 21.5h13" {...common}/><circle cx="16" cy="16" r="2" {...common}/></>;
    case "source":
      return <><path d="M9 5.5h10l4 4v17H9v-21Z" {...common}/><path d="M19 5.5v4h4M12.5 15h7M12.5 19h7M12.5 23h4" {...common}/><path d="M6 9.5v17h11" {...common}/></>;
    case "search":
      return <><circle cx="14" cy="14" r="7.5" {...common}/><path d="m19.5 19.5 6.5 6.5M10.5 14h7M14 10.5v7" {...common}/></>;
    case "route":
      return <><circle cx="7" cy="24" r="2.5" {...common}/><circle cx="25" cy="8" r="2.5" {...common}/><path d="M9.5 24h4c7 0 2-16 9-16M9 9h7M12.5 5.5 16 9l-3.5 3.5" {...common}/></>;
    case "puzzle":
      return <><path d="M7 7h7a3 3 0 1 1 4 0h7v7a3 3 0 1 0 0 4v7h-7a3 3 0 1 1-4 0H7v-7a3 3 0 1 0 0-4V7Z" {...common}/></>;
    case "speed":
      return <><path d="M5 22a12 12 0 0 1 22 0M16 18l7-7M8 22h16" {...common}/><path d="M8.5 15.5 6.5 14M12 10.5 11 8M20 10.5l1-2" {...common}/></>;
    case "strategy":
      return <><path d="M8 25V7h16v18H8Z" {...common}/><path d="M8 13h16M14 7v18M20 13v12" {...common}/><circle cx="11" cy="10" r="1.3" fill="currentColor"/><circle cx="17" cy="17" r="1.3" fill="currentColor"/><circle cx="22" cy="22" r="1.3" fill="currentColor"/></>;
    case "color":
      return <><path d="M16 5.5c-6.1 0-11 4.4-11 9.9 0 4.8 3.8 8.7 8.5 8.7H15c1.4 0 2.2-1.5 1.5-2.7-.8-1.3.2-2.9 1.7-2.9H21c3.3 0 6-2.7 6-6 0-4-4.9-7-11-7Z" {...common}/><circle cx="10" cy="13" r="1.4" fill="currentColor"/><circle cx="15" cy="10" r="1.4" fill="currentColor"/><circle cx="20.5" cy="12" r="1.4" fill="currentColor"/></>;
    case "resource":
      return <><path d="M7 8.5 16 5l9 3.5V24l-9 3-9-3V8.5Z" {...common}/><path d="m7 8.5 9 3.5 9-3.5M16 12v15M10.5 17h3M18.5 17h3M10.5 21h3M18.5 21h3" {...common}/></>;
    default:
      return null;
  }
}
