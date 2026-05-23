export type ToolEventAction =
  | "tool_viewed"
  | "tool_copied_output"
  | "tool_downloaded_output"
  | "tool_reset"
  | "tool_randomized"
  | "tool_error_shown";

export type ToolEvent = {
  toolId: string;
  action: ToolEventAction;
  timestamp?: string;
  metadata?: {
    outputType?: "css" | "json" | "xml" | "image" | "text" | "html";
    errorCode?: string;
  };
};

export function trackToolEvent(event: ToolEvent): void {
  if (process.env.NODE_ENV !== "production") return;
  void event;
  // Future analytics adapter goes here. Never pass user input or generated output content.
}
