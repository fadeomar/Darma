"use client";

import dynamic from "next/dynamic";

const BeamCalculatorClient = dynamic(() => import("./BeamCalculatorClient"), {
  ssr: false,
  loading: () => <div className="beam-loading">Loading beam editor...</div>,
});

export default function BeamCalculatorShell() {
  return <BeamCalculatorClient />;
}
