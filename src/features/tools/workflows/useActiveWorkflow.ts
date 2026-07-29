"use client";

import { useEffect, useState } from "react";

export function useActiveWorkflowId() {
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  useEffect(() => {
    setWorkflowId(new URLSearchParams(window.location.search).get("workflow"));
  }, []);

  return workflowId;
}
